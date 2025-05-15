const { Schema, model, default: mongoose } = require("mongoose");
const { PAYMENT_STATUS } = require("../json/enums.json");

let paymentSchema = new Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dahBookedPlate",
      // required: true,
    },
    merchant: {
      type: Object,
      default: {}
    },
    payer: {
      type: Object,
      default: {}
    },
    amount: {
      type: Object,
      default: {}
    },
    seller_receivable_breakdown: {  // add while payment completed
      type: Object,
      default: {}
    },
    paypalOrderId: {
      type: String,
    },
    paypalTransactionId: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PAID, PAYMENT_STATUS.FAILED],
      default: PAYMENT_STATUS.PENDING,
    },
  },
  { timestamps: true, versionKey: false }
);

let paymentModel = model("payment", paymentSchema, "payment");

module.exports = paymentModel;
