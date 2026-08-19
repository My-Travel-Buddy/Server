const db = require('../db');

const Trip = require('./Trip');
const Checklist = require('./checklist');
const User = require('./User');
const Activity = require('./Activity');

// ---------- Trip <-> User ----------

Trip.belongsToMany(User, {
  through: 'User_Trip'
});

User.belongsToMany(Trip, {
  through: 'User_Trip'
});

// ---------- Trip <-> Activity ----------

Trip.hasMany(Activity, {
  foreignKey: 'TripId'
});

Activity.belongsTo(Trip, {
  foreignKey: 'TripId'
});

// ---------- Trip <-> Checklist ----------

Trip.hasMany(Checklist, {
  foreignKey: 'TripId'
});

Checklist.belongsTo(Trip, {
  foreignKey: 'TripId'
});

// ---------- User <-> Checklist ----------

User.hasMany(Checklist, {
  foreignKey: 'UserId'
});

Checklist.belongsTo(User, {
  foreignKey: 'UserId'
});

// ---------- User_Trip ----------

const User_Trip = db.models.User_Trip;

module.exports = {
  db,
  Trip,
  User,
  Checklist,
  Activity,
  User_Trip
};