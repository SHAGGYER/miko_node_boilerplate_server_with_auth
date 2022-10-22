const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    name: String,
    minutes: Number,
    price: Number,
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop"
    },
    position: Number
  },
  {
    timestamps: true,
  }
);

const Service = mongoose.model(
  "Service",
  ServiceSchema,
  "services"
);
module.exports = Service;
