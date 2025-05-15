const { Schema, model, default: mongoose } = require("mongoose");
const { PAYMENT_STATUS } = require("../json/enums.json");

let dahBookedPlateSchema = new Schema(
  {
    plateNumber: { type: String, required: true },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dahLocation",
      required: true,
    },
    vehicleSize: {
      type: String,
      enum: ["<=5m", ">5m"],
      default: "<=5m",
      required: true,
    },
    // Personal Details
    name: { type: String, required: true },
    nachname: { type: String, required: true },
    strabe: { type: String, required: false, default: "" },
    email: { type: String, required: true },
    PLZ: { type: Number, default: 0 },
    Stadt: { type: String, default: "" },
    telephone: { type: String, default: null },

    // Booking Details
    fromTime: { type: Date, required: true },
    toTime: { type: Date, required: true },
    totalDuration: { type: Number, required: true },
    totalFare: { type: Number, required: true },
    extended: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PAID, PAYMENT_STATUS.FAILED],
      default: PAYMENT_STATUS.PENDING,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "payment",
      default: null,
    },
    invoiceUrl: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false }
);

let dahBookedPlateModel = model("dahBookedPlate", dahBookedPlateSchema, "dahBookedPlate");

module.exports = dahBookedPlateModel;
