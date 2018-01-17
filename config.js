'use strict';

require('dotenv').load();

const DATABASE_URL = process.env.DATABASE_URL;
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
const PORT = process.env.PORT;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY;

function setDbMode(mode='dev') {
  process.env.DB_MODE = mode;
}

module.exports = { DATABASE_URL, TEST_DATABASE_URL, PORT,
  CLIENT_ORIGIN, JWT_SECRET, JWT_EXPIRY, setDbMode };

