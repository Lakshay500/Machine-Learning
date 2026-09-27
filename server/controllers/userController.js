const User = require('../models/User');

// @desc    Toggle a track in the current user's favorites
// @route   POST /api/v1/users/favorites
// @access  Private
const toggleFavorite = async (req, res) => {
  try {
    const { trackId } = req.body;
    if (!trackId) return res.status(400).json({ message: 'trackId is required' });

    const user = await User.findById(req.user._id);
    const idx = user.favoriteTracks.findIndex(
      (t) => t.toString() === trackId.toString()
    );

    let favorited;
    if (idx >= 0) {
      user.favoriteTracks.splice(idx, 1);
      favorited = false;
    } else {
      user.favoriteTracks.push(trackId);
      favorited = true;
    }

    await user.save();
    res.json({ success: true, favorited, favoriteTracks: user.favoriteTracks });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get current user profile (favorites, playlists, follows)
// @route   GET /api/v1/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('savedPlaylists')
      .populate('favoriteTracks')
      .populate('followedArtists');
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle following an artist
// @route   POST /api/v1/users/follow/:artistId
// @access  Private
const toggleFollowArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    const user = await User.findById(req.user._id);
    const idx = user.followedArtists.findIndex(
      (a) => a.toString() === artistId.toString()
    );

    let following;
    if (idx >= 0) {
      user.followedArtists.splice(idx, 1);
      following = false;
    } else {
      user.followedArtists.push(artistId);
      following = true;
    }

    await user.save();
    res.json({ success: true, following, followedArtists: user.followedArtists });
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { toggleFavorite, getProfile, toggleFollowArtist };
