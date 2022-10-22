const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
      user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
      },
      amountPaid: Number,
    lines: Array,
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model(
  "Invoice",
  InvoiceSchema,
  "invoices"
);
module.exports = Invoice;
