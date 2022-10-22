const path = require("path");
const mongoose = require("mongoose");
const {config} = require("dotenv");
const plans = require("../data/plans.json")
const Plan = require("../models/Plan");

config({
  path: path.join(__dirname, "..", ".env"),
});

const run = async () => {
  mongoose.connect(process.env.MONGODB_URI, () =>
    console.log("Connected to MongoDB")
  );

  await Plan.insertMany(plans);

  console.log(`Inserted ${plans.length} plans`);
  process.exit(0);
};

run();
