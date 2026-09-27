const Artist = require('../models/Artist');

// @desc    Get all artists
// @route   GET /api/v1/artists
// @access  Public
const getArtists = async (req, res) => {
  try {
    const { decade, genre, search, page = 1, limit = 20 } = req.query;
    
    let query = {};

    // Filter by decade
    if (decade) {
      query.activeDecades = decade;
    }

    // Filter by genre
    if (genre) {
      query.genres = genre;
    }

    // Search by name
    if (search) {
      query.name = new RegExp(search, 'i');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Artist.countDocuments(query);

    const artists = await Artist.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: artists.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: artists
    });
  } catch (error) {
    console.error('Get artists error:', error);
    res.status(500).json({ message: 'Server error fetching artists' });
  }
};

// @desc    Get single artist by ID with discography
// @route   GET /api/v1/artists/:id
// @access  Public
const getArtistById = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);

    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    // Get artist's tracks
    const Track = require('../models/Track');
    const tracks = await Track.find({ artist: artist._id })
      .sort({ releaseYear: 1 })
      .select('title releaseYear genre duration coverArtUrl audioUrl');

    res.json({
      success: true,
      data: {
        ...artist.toObject(),
        discography: tracks
      }
    });
  } catch (error) {
    console.error('Get artist error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(500).json({ message: 'Server error fetching artist' });
  }
};

// @desc    Create a new artist (Admin only)
// @route   POST /api/v1/artists
// @access  Private/Admin
const createArtist = async (req, res) => {
  try {
    const { name, bio, imageUrl, activeDecades, birthDate, deathDate, country, genres } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide artist name' });
    }

    const artist = await Artist.create({
      name,
      bio,
      imageUrl,
      activeDecades,
      birthDate,
      deathDate,
      country,
      genres
    });

    res.status(201).json({
      success: true,
      data: artist
    });
  } catch (error) {
    console.error('Create artist error:', error);
    res.status(500).json({ message: 'Server error creating artist' });
  }
};

// @desc    Update an artist (Admin only)
// @route   PUT /api/v1/artists/:id
// @access  Private/Admin
const updateArtist = async (req, res) => {
  try {
    let artist = await Artist.findById(req.params.id);

    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    artist = await Artist.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: artist
    });
  } catch (error) {
    console.error('Update artist error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(500).json({ message: 'Server error updating artist' });
  }
};

// @desc    Delete an artist (Admin only)
// @route   DELETE /api/v1/artists/:id
// @access  Private/Admin
const deleteArtist = async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);

    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    // Check if artist has tracks
    const Track = require('../models/Track');
    const trackCount = await Track.countDocuments({ artist: artist._id });

    if (trackCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete artist with ${trackCount} track(s). Please remove or reassign tracks first.` 
      });
    }

    await artist.deleteOne();

    res.json({
      success: true,
      message: 'Artist removed'
    });
  } catch (error) {
    console.error('Delete artist error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Artist not found' });
    }
    res.status(500).json({ message: 'Server error deleting artist' });
  }
};

module.exports = {
  getArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist
};
