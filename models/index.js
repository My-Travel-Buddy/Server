// models/index.js — one place to collect all models and their relationships.
// Lets the rest of the app grab them from here: const { Task } = require('./models')

const db = require('../db');
const Trip = require('./Trip');
const Checklist = require("./Checklist")
const User =require("./User")
const Activity = require("./Activity")
// ---------- associations ----------
// When you add a second model, describe how the tables relate here. Example:
//   User.hasMany(Task)     // one user has many tasks
//   Task.belongsTo(User)   // each task belongs to one user (adds a userId column)

User.hasMany(Trip,{

})
Trip.belongsToMany(User,{
 through:"User_Trip"
})
Trip.hasMany(User,{
 
})

User.belongsToMany(Trip,{
  through:"User_Trip"
})


Trip.hasMany(Activity,{

})

Activity.belongsTo(Trip,{

})

Trip.hasMany(Checklist,{

})
Checklist.belongsTo(Trip,{

})

module.exports = {
  db, // exported too so seed.js can sync from one place
  Trip,
  User,
  Checklist,
  Activity
};
