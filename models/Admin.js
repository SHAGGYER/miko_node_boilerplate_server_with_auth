const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AdminSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
  },
  {
    timestamps: true,
  }
);

AdminSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) return next();
  if (!user.password) return next();

  user.password = await bcrypt.hash(user.password, 10);
  return next();
});

const Admin = mongoose.model("Admin", AdminSchema, "admins");
module.exports = Admin;
