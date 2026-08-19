const { DataTypes } = require('sequelize');

const db = require('../db');

const Checklist = db.define('Checklist', {
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
   tableName: "Checklists"
});

module.exports = Checklist;