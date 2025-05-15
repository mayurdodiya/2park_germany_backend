const { Schema, model, default: mongoose } = require("mongoose");

let dahAuthPlateSchema = new Schema(
    {
      plateNumber: { type: String, required: true},
      locationId: { type: mongoose.Schema.Types.ObjectId, ref: "dahLocation" },
      name: { type: String, default: "" },
      nachname: { type: String, default: "" },
      strabe: { type: String, default: "" },
      houseNumber: { type: String, default: "" },
      postCode: { type: String, default: "" },
      ort: { type: String, default: "" },
      price_per_day: { type: Number, default: 0 },
      price_per_hour: { type: Number, default: 0 },
      fromTime: { type: Date, default: Date.now },
      toTime: { type: Date, default: Date.now },
      
      
    },
    { timestamps: true, versionKey: false }
);

dahAuthPlateSchema.index({ plateNumber: 1, locationId: 1 }, { unique: true });  // Ensure uniqueness across both fields
let dahAuthPlateModel = model("dahAuthPlate", dahAuthPlateSchema, "dahAuthPlate");

module.exports = dahAuthPlateModel;
