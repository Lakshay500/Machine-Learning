const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tracks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track'
  }],
  description: {
    type: String,
    maxlength: 500
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  coverImage: {
    type: String
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for querying public playlists
playlistSchema.index({ isPublic: 1, createdAt: -1 });
playlistSchema.index({ creator: 1 });

module.exports = mongoose.model('Playlist', playlistSchema);
