const Track = require('../models/Track');

// @desc    Get all tracks with filtering, sorting, and pagination
// @route   GET /api/v1/tracks
// @access  Public
const getTracks = async (req, res) => {
  try {
    const { decade, genre, year, sort, search, page = 1, limit = 20 } = req.query;
    
    // Build query object
    let query = {};

    // Filter by decade (e.g., "1930s", "1940s", "1950s")
    if (decade) {
      const decadeStart = parseInt(decade.substring(0, 4));
      const decadeEnd = decadeStart + 9;
      query.releaseYear = { $gte: decadeStart, $lte: decadeEnd };
    }

    // Filter by specific year
    if (year) {
      query.releaseYear = parseInt(year);
    }

    // Filter by genre
    if (genre) {
      query.genre = genre;
    }

    // Search by title or artist name
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Find artists matching the search
      const Artist = require('../models/Artist');
      const artists = await Artist.find({ name: searchRegex }).select('_id');
      const artistIds = artists.map(a => a._id);
      
      query.$or = [
        { title: searchRegex },
        { artist: { $in: artistIds } }
      ];
    }

    // Sorting options
    let sortOptions = {};
    if (sort) {
      switch (sort) {
        case 'newest':
          sortOptions = { releaseYear: -1 };
          break;
        case 'oldest':
          sortOptions = { releaseYear: 1 };
          break;
        case 'popular':
          sortOptions = { playCount: -1 };
          break;
        case 'title':
          sortOptions = { title: 1 };
          break;
        default:
          sortOptions = { createdAt: -1 };
      }
    } else {
      sortOptions = { releaseYear: -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Track.countDocuments(query);

    const tracks = await Track.find(query)
      .populate('artist', 'name imageUrl bio')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: tracks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: tracks
    });
  } catch (error) {
    console.error('Get tracks error:', error);
    res.status(500).json({ message: 'Server error fetching tracks' });
  }
};

// @desc    Get single track by ID
// @route   GET /api/v1/tracks/:id
// @access  Public
const getTrackById = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id)
      .populate('artist', 'name bio imageUrl activeDecades country birthDate deathDate')
      .populate('composers');

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    // Increment play count
    track.playCount += 1;
    await track.save();

    res.json({
      success: true,
      data: track
    });
  } catch (error) {
    console.error('Get track error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Track not found' });
    }
    res.status(500).json({ message: 'Server error fetching track' });
  }
};

// @desc    Create a new track (Admin only)
// @route   POST /api/v1/tracks
// @access  Private/Admin
const createTrack = async (req, res) => {
  try {
    const {
      title,
      artist,
      releaseYear,
      genre,
      audioUrl,
      coverArtUrl,
      historicalTrivia,
      duration,
      album,
      recordLabel,
      composers,
      featuredMusicians
    } = req.body;

    // Validation
    if (!title || !artist || !releaseYear || !genre || !audioUrl || !duration) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const track = await Track.create({
      title,
      artist,
      releaseYear,
      genre,
      audioUrl,
      coverArtUrl,
      historicalTrivia,
      duration,
      album,
      recordLabel,
      composers,
      featuredMusicians
    });

    res.status(201).json({
      success: true,
      data: track
    });
  } catch (error) {
    console.error('Create track error:', error);
    res.status(500).json({ message: 'Server error creating track' });
  }
};

// @desc    Update a track (Admin only)
// @route   PUT /api/v1/tracks/:id
// @access  Private/Admin
const updateTrack = async (req, res) => {
  try {
    let track = await Track.findById(req.params.id);

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    track = await Track.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: track
    });
  } catch (error) {
    console.error('Update track error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Track not found' });
    }
    res.status(500).json({ message: 'Server error updating track' });
  }
};

// @desc    Delete a track (Admin only)
// @route   DELETE /api/v1/tracks/:id
// @access  Private/Admin
const deleteTrack = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    await track.deleteOne();

    res.json({
      success: true,
      message: 'Track removed'
    });
  } catch (error) {
    console.error('Delete track error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Track not found' });
    }
    res.status(500).json({ message: 'Server error deleting track' });
  }
};

// @desc    Get random tracks for discovery
// @route   GET /api/v1/tracks/random
// @access  Public
const getRandomTracks = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const tracks = await Track.aggregate([
      { $sample: { size: parseInt(limit) } },
      {
        $lookup: {
          from: 'artists',
          localField: 'artist',
          foreignField: '_id',
          as: 'artist'
        }
      },
      { $unwind: '$artist' },
      {
        $project: {
          _id: 1,
          title: 1,
          releaseYear: 1,
          genre: 1,
          audioUrl: 1,
          coverArtUrl: 1,
          duration: 1,
          historicalTrivia: 1,
          'artist.name': 1,
          'artist.imageUrl': 1
        }
      }
    ]);

    res.json({
      success: true,
      count: tracks.length,
      data: tracks
    });
  } catch (error) {
    console.error('Get random tracks error:', error);
    res.status(500).json({ message: 'Server error fetching random tracks' });
  }
};

module.exports = {
  getTracks,
  getTrackById,
  createTrack,
  updateTrack,
  deleteTrack,
  getRandomTracks
};
