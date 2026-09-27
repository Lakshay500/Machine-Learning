const Playlist = require('../models/Playlist');

// @desc    Get all public playlists
// @route   GET /api/v1/playlists
// @access  Public
const getPlaylists = async (req, res) => {
  try {
    const { creator, genre, decade, search, page = 1, limit = 20 } = req.query;
    
    let query = { isPublic: true };

    // Filter by creator
    if (creator) {
      query.creator = creator;
    }

    // Search by title or description
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Playlist.countDocuments(query);

    const playlists = await Playlist.find(query)
      .populate('creator', 'username imageUrl')
      .populate({
        path: 'tracks',
        populate: {
          path: 'artist',
          select: 'name'
        },
        select: 'title artist coverArtUrl duration releaseYear'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: playlists.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: playlists
    });
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ message: 'Server error fetching playlists' });
  }
};

// @desc    Get single playlist by ID
// @route   GET /api/v1/playlists/:id
// @access  Public
const getPlaylistById = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('creator', 'username imageUrl')
      .populate({
        path: 'tracks',
        populate: {
          path: 'artist',
          select: 'name imageUrl'
        }
      });

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check if playlist is public or user owns it
    if (!playlist.isPublic && (!req.user || playlist.creator._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this playlist' });
    }

    res.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    console.error('Get playlist error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.status(500).json({ message: 'Server error fetching playlist' });
  }
};

// @desc    Create a new playlist
// @route   POST /api/v1/playlists
// @access  Private
const createPlaylist = async (req, res) => {
  try {
    const { title, description, isPublic, coverImage, tags } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Please provide a playlist title' });
    }

    const playlist = await Playlist.create({
      title,
      description,
      isPublic: isPublic !== undefined ? isPublic : true,
      coverImage,
      tags,
      creator: req.user._id
    });

    // Add playlist to user's savedPlaylists
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, {
      $push: { savedPlaylists: playlist._id }
    });

    res.status(201).json({
      success: true,
      data: playlist
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ message: 'Server error creating playlist' });
  }
};

// @desc    Update a playlist
// @route   PUT /api/v1/playlists/:id
// @access  Private
const updatePlaylist = async (req, res) => {
  try {
    let playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check ownership
    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this playlist' });
    }

    const { title, description, isPublic, coverImage, tags } = req.body;

    playlist.title = title || playlist.title;
    playlist.description = description || playlist.description;
    playlist.isPublic = isPublic !== undefined ? isPublic : playlist.isPublic;
    playlist.coverImage = coverImage || playlist.coverImage;
    playlist.tags = tags || playlist.tags;

    playlist = await playlist.save();

    res.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    console.error('Update playlist error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.status(500).json({ message: 'Server error updating playlist' });
  }
};

// @desc    Add track to playlist
// @route   PUT /api/v1/playlists/:id/add
// @access  Private
const addTrackToPlaylist = async (req, res) => {
  try {
    const { trackId } = req.body;

    if (!trackId) {
      return res.status(400).json({ message: 'Please provide a track ID' });
    }

    let playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check ownership
    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this playlist' });
    }

    // Check if track already exists in playlist
    if (playlist.tracks.includes(trackId)) {
      return res.status(400).json({ message: 'Track already in playlist' });
    }

    // Verify track exists
    const Track = require('../models/Track');
    const track = await Track.findById(trackId);

    if (!track) {
      return res.status(404).json({ message: 'Track not found' });
    }

    playlist.tracks.push(trackId);
    playlist = await playlist.save();

    res.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    console.error('Add track error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid ID provided' });
    }
    res.status(500).json({ message: 'Server error adding track to playlist' });
  }
};

// @desc    Remove track from playlist
// @route   PUT /api/v1/playlists/:id/remove
// @access  Private
const removeTrackFromPlaylist = async (req, res) => {
  try {
    const { trackId } = req.body;

    if (!trackId) {
      return res.status(400).json({ message: 'Please provide a track ID' });
    }

    let playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check ownership
    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this playlist' });
    }

    playlist.tracks = playlist.tracks.filter(
      t => t.toString() !== trackId
    );

    playlist = await playlist.save();

    res.json({
      success: true,
      data: playlist
    });
  } catch (error) {
    console.error('Remove track error:', error);
    res.status(500).json({ message: 'Server error removing track from playlist' });
  }
};

// @desc    Delete a playlist
// @route   DELETE /api/v1/playlists/:id
// @access  Private
const deletePlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check ownership
    if (playlist.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this playlist' });
    }

    // Remove playlist from user's savedPlaylists
    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { savedPlaylists: playlist._id }
    });

    await playlist.deleteOne();

    res.json({
      success: true,
      message: 'Playlist removed'
    });
  } catch (error) {
    console.error('Delete playlist error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Playlist not found' });
    }
    res.status(500).json({ message: 'Server error deleting playlist' });
  }
};

// @desc    Get user's playlists
// @route   GET /api/v1/playlists/user/me
// @access  Private
const getMyPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ creator: req.user._id })
      .populate({
        path: 'tracks',
        select: 'title artist coverArtUrl duration'
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: playlists.length,
      data: playlists
    });
  } catch (error) {
    console.error('Get my playlists error:', error);
    res.status(500).json({ message: 'Server error fetching your playlists' });
  }
};

module.exports = {
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  deletePlaylist,
  getMyPlaylists
};
