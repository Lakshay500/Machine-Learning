const express = require('express');
const router = express.Router();
const {
  getTracks,
  getTrackById,
  createTrack,
  updateTrack,
  deleteTrack,
  getRandomTracks
} = require('../controllers/trackController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(getTracks)
  .post(protect, admin, createTrack);

router.get('/random', getRandomTracks);

router.route('/:id')
  .get(getTrackById)
  .put(protect, admin, updateTrack)
  .delete(protect, admin, deleteTrack);

module.exports = router;
