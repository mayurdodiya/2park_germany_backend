const { Schema, model, default: mongoose } = require("mongoose");

let dahExtendedPlateSchema = new Schema(
    {
        plateNumber: { type: String, required: true },
        locationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "dahLocation",
            required: true
        },
        vehicleSize: {
            type: String,
            enum: ["<=5m", ">5m"],
            required: true
        },
        // Personal Details
        name: { type: String, required: true },
        nachname: { type: String, required: true },
        strabe: { type: String, required: true },
        email: { type: String, required: true },
        telephone: { type: String, default: null },
        // Booking Details
        fromTime: { type: Date, required: true },
        toTime: { type: Date, required: true },
        totalDuration: { type: Number, required: true },
        totalFare: { type: Number, required: false },
        extendedOn: { type: Date, default: Date.now },


    },
    { timestamps: true, versionKey: false }
);

let dahExtendedPlateModel = model("dahExtendedPlate", dahExtendedPlateSchema, "dahExtendedPlate");

module.exports = dahExtendedPlateModel;