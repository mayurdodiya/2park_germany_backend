const { Schema, model, default: mongoose } = require("mongoose");

let dahEventSchema = new Schema(
  {
    plateNumber: String,
    deviceId: String,
    direction: String,
    entryTime: {
      type: Date,
      default: null, // Can be null initially
      required: false, // Can be null for open sessions
    },
    exitTime: {
      type: Date,
      default: null, // Can be null initially
      required: false, // Can be null for open sessions
    },
    direction: {
      type: String,
      enum: ["Obverse", "Reverse"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true, // Entry is active until exit is recorded
    },
    isViolation: Boolean,
    totalParkingTime: { type: Number, default: null }, 
    violationDuration: { type: String, default: null }, 

    locationId: { type: mongoose.Schema.Types.ObjectId, ref: "dahLocation" },
    violationRemovalReason: { type: String, default: null },
    bookingId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "dahBookedPlate" ,
      required: false,
  },

  },
  { timestamps: true, versionKey: false }
);

let dahEventModel = model("dahEvent", dahEventSchema, "dahEvent");

module.exports = dahEventModel;
