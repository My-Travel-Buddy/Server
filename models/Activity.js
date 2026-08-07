// Defines the Activity table 
const { DataTypes } = require("sequelize");
const db = require("../db");

// Allowed activity categories.
const CATEGORY_VALUES = [
  "Food",
  "Sightseeing",
  "Culture",
  "Adventure",
  "Shopping",
  "Transportation",
  "Entertainment",
  "Other",
];

const Activity = db.define(
  "Activity",
  {
    // Activity name is required.
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Activity title is required",
        },
      },
    },

    // Category used to group activities.
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "Other",
      validate: {
        isIn: {
          args: [CATEGORY_VALUES],// Checks that the category is one of the allowed values.
          msg: "Invalid activity category",
        },
      },
    },

    // Optional scheduled date and time.
    dateTime: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          msg: "Activity date and time must be valid",
        },
      },
    },

    // Optional estimated cost.
    estimatedCost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: "Estimated cost cannot be negative",
        },
      },
    },

    // Optional activity notes.
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "Activities",
  },
);

// Makes the category list available to other files.
Activity.CATEGORY_VALUES = CATEGORY_VALUES;

module.exports = Activity;