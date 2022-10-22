const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    bookingId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    confirmed: Boolean,
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", BookingSchema, "bookings");
module.exports = Booking;
