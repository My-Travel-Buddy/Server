require("dotenv").config();

const { db, User, Trip, Activity, Checklist } = require("../models");

async function seed() {
  await db.sync({ force: true });

  console.log("Database synced!");

  // ---------------- USERS ----------------

  const user1 = await User.create({
    username: "yomara",
    email: "yomara@example.com",
    passwordHash: "password123",
    passportCountry: "Dominican Republic",
  });

  const user2 = await User.create({
    username: "john",
    email: "john@example.com",
    passwordHash: "password123",
    passportCountry: "United States",
  });

  // ---------------- TRIPS ----------------

  const trip1 = await Trip.create({
    destination: "Tokyo",
    date_Range: ["2027-01-10", "2027-01-20"],
    budget: [1000, 2500],
  });

  const trip2 = await Trip.create({
    destination: "Paris",
    date_Range: ["2027-05-01", "2027-05-10"],
    budget: [1500, 3000],
  });

  // ---------------- USER_TRIP ----------------

  await user1.addTrip(trip1);
  await user1.addTrip(trip2);
  await user2.addTrip(trip2);

  // ---------------- ACTIVITIES ----------------

  await Activity.bulkCreate([
    {
      title: "Visit Shibuya",
      category: "Sightseeing",
      dateTime: new Date("2027-01-11T10:00:00"),
      estimatedCost: 0,
      notes: "Take lots of pictures",
      TripId: trip1.id,
    },
    {
      title: "Eat Sushi",
      category: "Food",
      dateTime: new Date("2027-01-12T18:00:00"),
      estimatedCost: 45,
      notes: "Reservation required",
      TripId: trip1.id,
    },
    {
      title: "Eiffel Tower",
      category: "Sightseeing",
      dateTime: new Date("2027-05-02T14:00:00"),
      estimatedCost: 30,
      notes: "Buy tickets online",
      TripId: trip2.id,
    },
  ]);

  // ---------------- CHECKLIST ----------------

  await Checklist.bulkCreate([
    {
      text: "Pack passport",
      completed: true,
      UserId: user1.id,
      TripId: trip1.id,
    },
    {
      text: "Book hotel",
      completed: false,
      UserId: user1.id,
      TripId: trip1.id,
    },
    {
      text: "Exchange currency",
      completed: false,
      UserId: user1.id,
      TripId: trip2.id,
    },
    {
      text: "Download train tickets",
      completed: false,
      UserId: user2.id,
      TripId: trip2.id,
    },
  ]);

  console.log("Seed complete!");
}

seed()
  .catch(console.error)
  .finally(() => db.close());