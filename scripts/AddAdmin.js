const path = require("path");
const mongoose = require("mongoose");
const { config } = require("dotenv");
const User = require("../models/User");
const yargs = require("yargs");

config({
  path: path.join(__dirname, "..", ".env"),
});

const usage = "\nAdds an admin";
const options = yargs
  .usage(usage)
  .option("n", {
    alias: "name",
    describe: "Name",
    type: "string",
    demandOption: true,
  })
  .option("e", {
    alias: "email",
    describe: "Email",
    type: "string",
    demandOption: true,
  })
  .option("p", {
    alias: "password",
    describe: "Password",
    type: "string",
    demandOption: true,
  })
  .help(true).argv;

const { e, _, p, n, ...user } = options;

const run = async () => {
  mongoose.connect(process.env.MONGODB_URI, () =>
    console.log("Connected to MongoDB")
  );

  const newUser = new User({
    ...user,
    role: "Coach",
  });

  await newUser.save();

  console.log(`Inserted coach`);
  process.exit(0);
};

run();
