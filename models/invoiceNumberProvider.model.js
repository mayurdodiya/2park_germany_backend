const { Schema, model, default: mongoose } = require("mongoose");

const invoiceNumberProviderSchema = new Schema(
  {
    year: { type: Number },
    lastInvNumber: { type: Number },
    totalInvoice: { type: Number },
  },
  { timestamps: true, versionKey: false }
);

let invoiceNumberProviderModel = model("invoiceNumberProvider", invoiceNumberProviderSchema, "invoiceNumberProvider");
module.exports = invoiceNumberProviderModel;
