/**
 * Seed script for The Golden Age Archive.
 * Usage: node scripts/seed.js        (uses MONGODB_URI from .env)
 *        npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../server/config/db');
const Artist = require('../server/models/Artist');
const Track = require('../server/models/Track');
const Playlist = require('../server/models/Playlist');
const User = require('../server/models/User');

// Placeholder public-domain audio (tones) so the player works out of the box.
const AUDIO = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
];

const artists = [
  { name: 'Duke Ellington', bio: 'Pianist, composer, and bandleader who redefined American music at the Cotton Club and beyond.', activeDecades: ['1930s', '1940s', '1950s'], country: 'USA', genres: ['Jazz', 'Big Band', 'Swing'] },
  { name: 'Billie Holiday', bio: 'One of the most influential jazz vocalists of all time, known for her distinctive phrasing and deeply emotional delivery.', activeDecades: ['1930s', '1940s', '1950s'], country: 'USA', genres: ['Jazz', 'Blues', 'Swing'] },
  { name: 'Benny Goodman', bio: 'The "King of Swing" whose 1938 Carnegie Hall concert brought jazz to the classical stage.', activeDecades: ['1930s', '1940s'], country: 'USA', genres: ['Swing', 'Big Band'] },
  { name: 'Glenn Miller', bio: 'Trombonist and bandleader whose orchestra was the most popular during the big band era; his recordings sustained morale through WWII.', activeDecades: ['1930s', '1940s'], country: 'USA', genres: ['Big Band', 'Swing'] },
  { name: 'Charlie Parker', bio: '"Bird" — the virtuoso alto saxophonist who co-invented bebop in Harlem clubs in the early 1940s.', activeDecades: ['1940s'], country: 'USA', genres: ['Bebop', 'Jazz'] },
  { name: 'Chuck Berry', bio: 'Guitarist and showman whose riffs and stories of car culture laid the foundation of rock and roll.', activeDecades: ['1950s'], country: 'USA', genres: ['Early Rock & Roll'] },
  { name: 'The Platters', bio: 'Vocal group that bridged doo-wop and pop with lush harmonies and chart-topping ballads.', activeDecades: ['1950s'], country: 'USA', genres: ['Doo-Wop'] },
  { name: 'Hank Williams', bio: 'Singer-songwriter who became the first true star of country music despite a tragically short career.', activeDecades: ['1940s', '1950s'], country: 'USA', genres: ['Country & Western'] },
  { name: 'Robert Johnson', bio: 'Delta blues legend whose 1936–37 recordings influenced generations of rock musicians.', activeDecades: ['1930s'], country: 'USA', genres: ['Blues'] }
];

const tracks = [
  { title: 'It Don\'t Mean a Thing (If It Ain\'t Got That Swing)', artist: 'Duke Ellington', releaseYear: 1932, genre: 'Swing', duration: 178, historicalTrivia: 'Recorded during the Great Depression, this tune coined the phrase that defined the Swing Era and gave struggling Americans a reason to dance.' },
  { title: 'Strange Fruit', artist: 'Billie Holiday', releaseYear: 1939, genre: 'Jazz', duration: 184, historicalTrivia: 'Holiday\'s haunting anti-lynching protest song was banned by many radio stations and became an early anthem of the civil rights movement.' },
  { title: 'Sing, Sing, Sing', artist: 'Benny Goodman', releaseYear: 1937, genre: 'Big Band', duration: 234, historicalTrivia: 'Gene Krupa\'s drum feature turned this into the definitive big band instrumental and a staple of the Savoy Ballroom.' },
  { title: 'In the Mood', artist: 'Glenn Miller', releaseYear: 1939, genre: 'Big Band', duration: 218, historicalTrivia: 'The most requested record among WWII troops; Miller himself disbanded his civilian orchestra to serve the war effort.' },
  { title: 'Boogie Woogie Bugle Boy', artist: 'The Andrews Sisters', releaseYear: 1941, genre: 'Swing', duration: 150, historicalTrivia: 'An Army induction notice inspired this hit, which became one of the defining songs of the home front during WWII.' },
  { title: 'Ko-Ko', artist: 'Charlie Parker', releaseYear: 1945, genre: 'Bebop', duration: 176, historicalTrivia: 'Recorded in a rented NYC apartment for a pittance, this session is widely considered the birth certificate of bebop.' },
  { title: 'Now\'s the Time', artist: 'Charlie Parker', releaseYear: 1944, genre: 'Bebop', duration: 192, historicalTrivia: 'A twelve-bar blues rebuilt with revolutionary harmony — the sound that split jazz into entertainment and art.' },
  { title: 'Maybellene', artist: 'Chuck Berry', releaseYear: 1955, genre: 'Early Rock & Roll', duration: 152, historicalTrivia: 'Berry\'s first single crossed over from R&B to the pop charts, helping launch rock and roll as the dominant music of the post-war boom.' },
  { title: 'Johnny B. Goode', artist: 'Chuck Berry', releaseYear: 1958, genre: 'Early Rock & Roll', duration: 161, historicalTrivia: 'Included on the Voyager Golden Record in 1977 — humanity\'s musical message to the stars.' },
  { title: 'Only You (And You Alone)', artist: 'The Platters', releaseYear: 1955, genre: 'Doo-Wop', duration: 176, historicalTrivia: 'A cornerstone of the doo-wop revival, proving vocal-group ballads could top both R&B and pop charts in the mid-50s.' },
  { title: 'The Great Pretender', artist: 'The Platters', releaseYear: 1955, genre: 'Doo-Wop', duration: 148, historicalTrivia: 'Written in under 30 minutes, it reached #1 on the R&B chart and #2 on the Billboard Hot 100.' },
  { title: 'Your Cheatin\' Heart', artist: 'Hank Williams', releaseYear: 1953, genre: 'Country & Western', duration: 150, historicalTrivia: 'Released weeks after Williams\' death at age 29; it topped the country charts for 37 non-consecutive weeks.' },
  { title: 'Cross Road Blues', artist: 'Robert Johnson', releaseYear: 1937, genre: 'Blues', duration: 156, historicalTrivia: 'Legend says Johnson sold his soul at a Mississippi crossroads; his recordings became the DNA of British blues-rock decades later.' }
];

const seed = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([Track.deleteMany({}), Artist.deleteMany({}), Playlist.deleteMany({})]);

  console.log('Seeding artists & tracks...');
  const artistDocs = await Artist.insertMany(artists);
  const artistByName = Object.fromEntries(artistDocs.map(a => [a.name, a._id]));

  // Ensure the Andrews Sisters exist (track-only artist above)
  const andrews = await Artist.create({
    name: 'The Andrews Sisters', bio: 'Close-harmony trio from Minnesota, the best-selling female group of the swing era.',
    activeDecades: ['1930s', '1940s'], country: 'USA', genres: ['Swing', 'Big Band']
  });
  artistByName['The Andrews Sisters'] = andrews._id;

  const trackDocs = await Track.insertMany(tracks.map((t, i) => ({
    ...t,
    artist: artistByName[t.artist],
    audioUrl: AUDIO[i % AUDIO.length]
  })));
  console.log(`  -> ${artistDocs.length + 1} artists, ${trackDocs.length} tracks`);

  // Demo admin user (promoted via isAdmin) — also serves as curator of the seeded playlists
  const adminEmail = 'admin@goldenage-archive.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({ username: 'archivist', email: adminEmail, passwordHash: 'archive1930', isAdmin: true });
    console.log('  -> admin user created: admin@goldenage-archive.com / archive1930');
  } else {
    admin.isAdmin = true;
    await admin.save();
    console.log('  -> existing admin user promoted');
  }

  // Curated public playlists
  const decadeIds = {};
  for (const d of ['1930s', '1940s', '1950s']) {
    decadeIds[d] = trackDocs.filter(t => Math.floor(t.releaseYear / 10) * 10 === parseInt(d)).map(t => t._id);
  }
  await Playlist.deleteMany({ creator: admin._id, title: /^Depression-Ease|^War-Time Wax|^Post-War Boom/ });
  await Playlist.insertMany([
    { title: 'Depression-Ease: The 30s', description: 'Swing, blues, and jump bands that kept America dancing through hard times.', tracks: decadeIds['1930s'], isPublic: true, creator: admin._id },
    { title: 'War-Time Wax: The 40s', description: 'Band broadcasts and bebop experiments from the WWII era.', tracks: decadeIds['1940s'], isPublic: true, creator: admin._id },
    { title: 'Post-War Boom: The 50s', description: 'Doo-wop, rock and roll, and honky-tonk from the prosperous 50s.', tracks: decadeIds['1950s'], isPublic: true, creator: admin._id }
  ]);
  console.log('  -> 3 curated playlists');

  console.log('Seed complete.');
  await mongoose.connection.close();
};

seed().catch(err => { console.error(err); process.exit(1); });
