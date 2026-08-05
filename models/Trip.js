const { DataTypes} = require('sequelize')
const db = require('../db/index')

const Trip = db.define('Trip', {
    destination: {type: DataTypes.STRING, allowNull: false }, 
    date_Range:{type: DataTypes.RANGE(DataTypes.DATEONLY), allowNull: false},
    budget:{type: DataTypes.RANGE(DataTypes.DECIMAL), allowNull: false},
})