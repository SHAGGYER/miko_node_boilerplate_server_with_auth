const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    shortId: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true
    },
    name: String,
    address: String,
    city: String,
    zip: String,
    phone: String,
    startTime: String,
    endTime: String,
    workFreeDays: [Number],
    longitude: Number,
    latitude: Number,
  },
  {
    timestamps: true,
  }
);

const Shop = mongoose.model(
  "Shop",
  ShopSchema,
  "shops"
);
module.exports = Shop;
