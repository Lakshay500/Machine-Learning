/**
 * API smoke test for The Golden Age Archive.
 * Boots an in-memory MongoDB (mongodb-memory-server) + the Express app via supertest,
 * exercising auth, admin guards, tracks/artists/playlists CRUD, favorites, and schema rules.
 * Usage: npm run smoke   (no local MongoDB required)
 */
process.env.NODE_ENV = 'test';
process.env.SKIP_DB_CONNECT = '1';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-test-secret';

const assert = require('assert');
const mongoose = require('mongoose');
const request = require('supertest');

let passed = 0;
const ok = (name, cond) => {
  assert.ok(cond, `FAILED: ${name}`);
  passed++;
  console.log(`  ✓ ${name}`);
};

(async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri('golden-age-smoke'));

  const app = require('../server');
  const api = request(app);

  console.log('\n— Health & root —');
  let r = await api.get('/api/health');
  ok('GET /api/health -> 200 ok', r.status === 200 && r.body.status === 'ok');
  r = await api.get('/');
  ok('GET / -> service info', r.status === 200 && /Golden Age/i.test(r.body.name));

  console.log('\n— Auth —');
  const creds = { username: 'jazzcat', email: 'jazzcat@test.com', password: 'secretswing' };
  r = await api.post('/api/v1/auth/register').send(creds);
  ok('POST /auth/register -> 201 + token', r.status === 201 && r.body.token);
  const userToken = r.body.token;
  r = await api.post('/api/v1/auth/login').send({ email: creds.email, password: creds.password });
  ok('POST /auth/login -> token', r.status === 200 && r.body.token);
  r = await api.post('/api/v1/auth/login').send({ email: creds.email, password: 'wrong' });
  ok('POST /auth/login bad password -> 401', r.status === 401);
  r = await api.get('/api/v1/auth/me').set('Authorization', `Bearer ${userToken}`);
  ok('GET /auth/me with token -> username', r.status === 200 && r.body.username === 'jazzcat');

  console.log('\n— Admin guard —');
  r = await api.post('/api/v1/tracks').set('Authorization', `Bearer ${userToken}`).send({ title: 'x' });
  ok('non-admin POST /tracks -> 403', r.status === 403);
  r = await api.post('/api/v1/tracks').send({ title: 'x' });
  ok('anonymous POST /tracks -> 401', r.status === 401);

  // Seed an admin directly to test the admin path end-to-end
  const User = require('../server/models/User');
  const adminDoc = await User.create({ username: 'archivist', email: 'admin@test.com', passwordHash: 'adminpass', isAdmin: true });
  ok('password hashed on save', adminDoc.passwordHash !== 'adminpass');
  r = await api.post('/api/v1/auth/login').send({ email: 'admin@test.com', password: 'adminpass' });
  ok('admin login works', r.status === 200 && !!r.body.token);
  const adminToken = r.body.token;

  console.log('\n— Artists & Tracks (admin CRUD) —');
  r = await api.post('/api/v1/artists').set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'Duke Ellington', bio: 'Test bio', activeDecades: ['1930s', '1940s'] });
  ok('admin POST /artists -> created', [200, 201].includes(r.status) && (r.body.data || r.body)._id);
  const artistId = (r.body.data || r.body)._id;

  const trackBody = { title: "It Don't Mean a Thing", artist: artistId, releaseYear: 1932, genre: 'Swing', audioUrl: 'https://example.com/a.mp3', duration: 178, historicalTrivia: 'Depression-era swing classic.' };
  r = await api.post('/api/v1/tracks').set('Authorization', `Bearer ${adminToken}`).send(trackBody);
  ok('admin POST /tracks -> 201', r.status === 201 && r.body.data._id);
  const trackId = r.body.data._id;

  r = await api.get('/api/v1/tracks?decade=1930s');
  ok('GET /tracks?decade=1930s filters', r.status === 200 && r.body.data.length === 1 && r.body.data[0].releaseYear === 1932);
  r = await api.get('/api/v1/tracks?genre=Bebop');
  ok('GET /tracks?genre=Bebop excludes', r.status === 200 && r.body.data.length === 0);
  r = await api.get(`/api/v1/tracks/${trackId}`);
  ok('GET /tracks/:id populates artist', r.status === 200 && r.body.data.artist.name === 'Duke Ellington');
  const pc = r.body.data.playCount;
  r = await api.get(`/api/v1/tracks/${trackId}`);
  ok('playCount increments', r.body.data.playCount === pc + 1);
  r = await api.get('/api/v1/artists');
  ok('GET /artists lists', r.status === 200 && (r.body.data || r.body.artists || []).length >= 1);
  r = await api.get(`/api/v1/artists/${artistId}`);
  ok('GET /artists/:id with discography', r.status === 200);

  console.log('\n— Playlists & Favorites —');
  r = await api.post('/api/v1/playlists').set('Authorization', `Bearer ${userToken}`).send({ title: 'My Mixtape', description: 'test' });
  ok('POST /playlists creates mixtape', r.status === 201 && r.body.data._id);
  const plId = r.body.data._id;
  r = await api.put(`/api/v1/playlists/${plId}/add`).set('Authorization', `Bearer ${userToken}`).send({ trackId });
  ok('PUT /playlists/:id/add', r.status === 200);
  r = await api.get('/api/v1/playlists');
  ok('GET /playlists public list', r.status === 200);
  r = await api.post('/api/v1/users/favorites').set('Authorization', `Bearer ${userToken}`).send({ trackId });
  ok('POST /users/favorites toggles on', r.status === 200 && r.body.favorited === true);
  r = await api.get('/api/v1/users/profile').set('Authorization', `Bearer ${userToken}`);
  ok('profile shows favorite', Array.isArray(r.body.favoriteTracks) && r.body.favoriteTracks.length === 1);
  r = await api.post('/api/v1/users/favorites').set('Authorization', `Bearer ${userToken}`).send({ trackId });
  ok('favorites toggle off', r.status === 200 && r.body.favorited === false);

  console.log('\n— Schema rules —');
  const Track = require('../server/models/Track');
  let threw = false;
  try { await Track.create({ ...trackBody, releaseYear: 1920 }); } catch (_) { threw = true; }
  ok('releaseYear min:1930 enforced', threw);

  console.log(`\nAll ${passed} smoke assertions passed ✅`);
  await mongoose.connection.close();
  await mongod.stop();
  process.exit(0);
})().catch(err => { console.error('\nSMOKE TEST FAILED:', err.message || err); process.exit(1); });
