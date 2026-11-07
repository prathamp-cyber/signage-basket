/**
 * Signage Basket — MongoDB Atlas Connection & Indexes
 */
const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;
let indexesInitialized = false;

async function getDb() {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set in environment variables');
  }

  const dbName = process.env.MONGODB_DB || 'signage_basket';

  if (!cachedClient) {
    cachedClient = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000
    });
    await cachedClient.connect();
  }

  const db = cachedClient.db(dbName);
  cachedDb = db;

  if (!indexesInitialized) {
    try {
      await Promise.allSettled([
        db.collection('designs').createIndex({ slug: 1 }, { unique: true }),
        db.collection('designs').createIndex({ category: 1 }),
        db.collection('enquiries').createIndex({ createdAt: -1 }),
        db.collection('rate_limits').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
      ]);
      indexesInitialized = true;
    } catch (err) {
      console.warn('Index initialization notice:', err.message);
    }
  }

  return db;
}

async function col(name) {
  const db = await getDb();
  return db.collection(name);
}

module.exports = {
  getDb,
  col
};
