const express = require('express');
const router = express.Router();
const {
  getPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  deletePlaylist,
  getMyPlaylists
} = require('../controllers/playlistController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(getPlaylists)
  .post(protect, createPlaylist);

router.get('/user/me', protect, getMyPlaylists);

router.route('/:id')
  .get(getPlaylistById)
  .put(protect, updatePlaylist)
  .delete(protect, deletePlaylist);

router.put('/:id/add', protect, addTrackToPlaylist);
router.put('/:id/remove', protect, removeTrackFromPlaylist);

module.exports = router;
