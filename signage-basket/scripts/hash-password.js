const crypto = require('crypto');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js "password"');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const key = crypto.scryptSync(password, salt, 64);
console.log(`${salt}:${key.toString('hex')}`);
