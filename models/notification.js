const { Schema, model, default: mongoose } = require("mongoose");


let notificationSchema = new Schema(
    {
        title: { type: String },
        description: { type: String },
        receiver: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
        read: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
        view: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
        pin: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
        isActive: { type: Boolean, default: true, },
    },
    { timestamps: true, versionKey: false, }
);


let notificationModel = model("notification", notificationSchema, "notification");


module.exports = notificationModel;
