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

  // Hosted Postgres (Render, Neon, Railway) requires SSL; a local database
  // does not. This keys off NODE_ENV rather than "is DATABASE_URL set",
  // because local dev sets DATABASE_URL too — keying off that would force
  // SSL locally and break the connection.
  dialectOptions:
    process.env.NODE_ENV === 'production'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
});

module.exports = db;
