const { DataTypes } = require("sequelize");
const db = require("../db/index");

const Trip = db.define("Trip", {
  destination: { type: DataTypes.STRING, allowNull: false },
  date_Range: { type: DataTypes.RANGE(DataTypes.DATEONLY), allowNull: false },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isValidRange(value) {
        if (!value || value < 0) {
          throw new Error("Budget can't be negative");
        }
      },
    },
  },
});

module.exports = Trip;
