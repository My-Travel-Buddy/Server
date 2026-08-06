// db/index.js — the one connection to Postgres, shared everywhere.
// Sequelize is an ORM: we write JavaScript and it writes the SQL for us.

const { Sequelize } = require('sequelize');

// Local dev connects to a database on your own machine.
// In production, your host gives you a DATABASE_URL — we read it from the
// environment so the secret never gets committed to git.
const LOCAL_DATABASE_NAME = 'travel_buddy'; // <-- your local db name (createdb capstone_dev)

const DB_CONNECTION_URL =
  process.env.DATABASE_URL ||
  `postgres://postgres:root@localhost:5432/${LOCAL_DATABASE_NAME}`;

const db = new Sequelize(DB_CONNECTION_URL, {
  dialect: 'postgres',
  logging: false, // set to console.log if you want to SEE the SQL Sequelize runs

  // Hosted Postgres needs SSL; local doesn't. So we only turn it on in
  // production (when DATABASE_URL is set). rejectUnauthorized:false accepts
  // the self-signed certificates that Render/Neon/Railway use.
  // dialectOptions: process.env.DATABASE_URL
  //   ? { ssl: { require: true, rejectUnauthorized: false } }
  //   : {},
});

module.exports = db;
