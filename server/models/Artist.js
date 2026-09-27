const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 2000
  },
  imageUrl: {
    type: String
  },
  activeDecades: [{
    type: String,
    enum: ['1930s', '1940s', '1950s']
  }],
  birthDate: {
    type: Date
  },
  deathDate: {
    type: Date
  },
  country: {
    type: String
  },
  genres: [{
    type: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Artist', artistSchema);
