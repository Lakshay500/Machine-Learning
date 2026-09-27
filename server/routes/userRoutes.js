const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  toggleFavorite,
  getProfile,
  toggleFollowArtist
} = require('../controllers/userController');

router.get('/profile', protect, getProfile);
router.post('/favorites', protect, toggleFavorite);
router.post('/follow/:artistId', protect, toggleFollowArtist);

module.exports = router;
