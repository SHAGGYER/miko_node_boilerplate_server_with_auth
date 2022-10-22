const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema(
  {
    title: String,
    stripeId: String,
    price: Number,
    interval: String,
    disabled: Boolean,
    tags: [String],
    amountShops: Number,
  },
  {
    timestamps: true,
  }
);

const Plan = mongoose.model(
  "Plan",
  PlanSchema,
  "plans"
);
module.exports = Plan;
