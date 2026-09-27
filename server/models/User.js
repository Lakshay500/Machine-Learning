const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: {
    type: String,
    required: true
  },
  savedPlaylists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist'
  }],
  favoriteTracks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track'
  }],
  followedArtists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist'
  }],
  followedDecades: [{
    type: String,
    enum: ['1930s', '1940s', '1950s']
  }],
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('passwordHash')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Remove passwordHash from JSON responses
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
