const { Schema, model, default: mongoose } = require("mongoose");

const timeRangeSchema = new Schema({
    start: { type: String, required: true }, // Format: "07:00"
    end: { type: String, required: true }    // Format: "19:00"
}, { _id: false });

const businessHoursSchema = new Schema({
    monday: [timeRangeSchema],
    tuesday: [timeRangeSchema],
    wednesday: [timeRangeSchema],
    thursday: [timeRangeSchema],
    friday: [timeRangeSchema],
    saturday: [timeRangeSchema],
    sunday: [timeRangeSchema],
}, { _id: false });


let dahLocationSchema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        maxParkingTime: { type: Number },
        maxParkingSlots: { type: Number },
        locationStatus: { type: String, enum: ["available", "not available"], default: "available" },
        totalIncomeCurrentMonth: { type: Number, default: 0 },
        totalSalesQuarter: { type: Number, default: 0 },
        totalIncomePerYear: { type: Number, default: 0 },
        pincode: { type: Number, unique: true, default: 0 },
        hourlyRate: { type: Number, default: 0 },
        GrtVehicleRate: { type: Number, default: 0 },  //greater than 5 meter vehicle rate
        ExtendVehicleTime: { type: Number, default: 0 }, //extend vehicle time

        // New fields
        businessHours: { type: businessHoursSchema, default: {} },
        businessHoursMaxParkingTime: { type: Number, default: 120 }, // in minutes
        offHoursMaxParkingTime: { type: Number, default: 45 },       // in minutes
        publicHolidays: [{ type: Date }], // Dates considered as holidays

        enabled: { type: Boolean, default: false },

    },
    { timestamps: true, versionKey: false }
);

let dahLocationModel = model("dahLocation", dahLocationSchema, "dahLocation");

module.exports = dahLocationModel;
