const { Schema, model, default: mongoose } = require("mongoose");


let dateSelectSchema = new Schema(
    {
        isAvailable: { type: Boolean, default: false },
        isAvailableTravel: { type: Boolean, default: false },
        isNotAvailable: { type: Boolean, default: false },
        date: [{ type: Date }],
        uid: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        isActive: { type: Boolean, default: true, },
    },
    { timestamps: true, versionKey: false, }
);


let dateSelectModel = model("dateSelect", dateSelectSchema, "dateSelect");


module.exports = dateSelectModel;
