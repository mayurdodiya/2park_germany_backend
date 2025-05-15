const { Schema, model, default: mongoose } = require("mongoose");

let dahDeviceSchema = new Schema(
    {
      deviceId: { type: String,
        required: true,
        unique: true,
      },
      
      locationId: { type: mongoose.Schema.Types.ObjectId, ref: "dahLocation" },
    
    },
    { timestamps: true, versionKey: false }
);

let dahDeviceModel = model("dahDevice", dahDeviceSchema, "dahDevice");

module.exports = dahDeviceModel;
