const express = require('express');
const router = express.Router();
const {
  getArtists,
  getArtistById,
  createArtist,
  updateArtist,
  deleteArtist
} = require('../controllers/artistController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(getArtists)
  .post(protect, admin, createArtist);

router.route('/:id')
  .get(getArtistById)
  .put(protect, admin, updateArtist)
  .delete(protect, admin, deleteArtist);

module.exports = router;
