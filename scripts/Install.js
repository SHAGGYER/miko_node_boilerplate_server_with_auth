const path = require("path");
const mongoose = require("mongoose");
const { config } = require("dotenv");
const Admin = require("../models/Admin");
const AppSettings = require("../models/AppSettings");
const yargs = require("yargs");

config({
  path: path.join(__dirname, "..", ".env"),
});

const usage = "\nInstalls app";
const options = yargs
  .usage(usage)
  .option("a", {
    alias: "appName",
    describe: "App's Name",
    type: "string",
    demandOption: true,
  })
  .option("n", {
    alias: "name",
    describe: "Admin's name",
    type: "string",
    demandOption: true,
  })
  .option("e", {
    alias: "email",
    describe: "Admin's Email",
    type: "string",
    demandOption: true,
  })
  .option("p", {
    alias: "password",
    describe: "Admin's password Password",
    type: "string",
    demandOption: true,
  })
  .help(true).argv;

const { e, _, p, n, appName, ...user } = options;

const run = async () => {
  mongoose.connect(process.env.MONGODB_URI, () =>
    console.log("Connected to MongoDB")
  );

  const newUser = new Admin({
    ...user,
  });
  await newUser.save();

  const settings = new AppSettings({ appName, appEnv: process.env.APP_ENV });
  await settings.save();

  console.log(`Installed app`);
  process.exit(0);
};

run();
