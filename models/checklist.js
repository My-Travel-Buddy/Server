const { DataTypes } = require('sequelize');
const db = require('../db');

// db.define(tableName, columns)
// Sequelize adds id, createdAt and updatedAt columns for you automatically.
const Checklist = db.define('Checklist', {
  text: {
    type: DataTypes.TEXT, // TEXT = longer free-form text
    allowNull: false, // optional
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false, // a new task starts as "not done"
  },
});

module.exports = Checklist;