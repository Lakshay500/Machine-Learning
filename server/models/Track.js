const mongoose = require('mongoose');

const trackSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  releaseYear: {
    type: Number,
    required: true,
    min: 1930,
    max: 1959
  },
  genre: {
    type: String,
    required: true,
    enum: [
      'Big Band',
      'Swing',
      'Bebop',
      'Early Rock & Roll',
      'Doo-Wop',
      'Blues',
      'Country & Western',
      'Jazz',
      'Classical',
      'Folk',
      'Gospel'
    ]
  },
  audioUrl: {
    type: String,
    required: true
  },
  coverArtUrl: {
    type: String
  },
  historicalTrivia: {
    type: String,
    maxlength: 1000
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  playCount: {
    type: Number,
    default: 0
  },
  album: {
    type: String
  },
  recordLabel: {
    type: String
  },
  composers: [{
    type: String
  }],
  featuredMusicians: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for efficient querying by decade and genre
trackSchema.index({ releaseYear: 1, genre: 1 });
trackSchema.index({ artist: 1 });

module.exports = mongoose.model('Track', trackSchema);
