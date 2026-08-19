const { DataTypes } = require('sequelize');

const db = require('../db');

const Checklist = db.define('checklist', {
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },

  UserId: {
    type: DataTypes.UUID,
    allowNull: false,
  },

  TripId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Checklist;