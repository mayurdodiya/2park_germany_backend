const { Schema, model, default: mongoose } = require("mongoose");

const ParkingRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    availableSpots: { type: Number, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("parkingRequest", ParkingRequestSchema);
