const mongoose = require("mongoose");

const StaffSchema = new mongoose.Schema(
  {
    shopId: mongoose.Types.ObjectId,
    name: String,
  },
  {
    timestamps: true,
  }
);

const Staff = mongoose.model("Staff", StaffSchema, "staff");
module.exports = Staff;
