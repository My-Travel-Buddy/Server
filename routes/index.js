// routes/index.js — one place to collect all routers.
// Lets app.js grab them from here: const { taskRouter } = require('./routes')

const taskRouter = require('./task.routes');
const tripsRouter = require('./trips');
const checklistRouter = require('./checklist');
const activiyRouter = require('./activity');
// Add a new resource? Import its router above and add one line here.
module.exports = {
  taskRouter,
  tripsRouter,
  checklistRouter,
  activityRouter
};
