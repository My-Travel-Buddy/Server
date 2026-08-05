const { DataTypes } = require("sequelize");
const db = require("../db/index");

const Trip = db.define("Trip", {
  destination: { type: DataTypes.STRING, allowNull: false },
  date_Range: { type: DataTypes.RANGE(DataTypes.DATEONLY), allowNull: false },
  budget: {
    type: DataTypes.RANGE(DataTypes.DECIMAL(10, 2)),
    allowNull: false,
    validate: {
      isValidRange(value) {
        if (!value || !Array.isArray(value)) {
          throw new Error("Budget must be an Array of [min, max]");
        }
        const [min, max] = value;

        if (min !== null && min < 0)
          throw new Error("Minimum budget cannot be negative");
        if (max !== null && max < 0)
          throw new Error("Maximum budget cannot be negative");

        if (min !== null && max !== null && min > max) {
          throw new Error(
            "Minimum budget cannot be greater than maximum budget",
          );
        }
      },
    },
  },
});

module.exports = Trip
