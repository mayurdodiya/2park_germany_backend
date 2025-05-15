const { Schema, model } = require("mongoose");


let newsLaterSchema = new Schema(
    {

        email: { type: String },
        isActive: { type: Boolean, default: true, },

    },
    { timestamps: true, versionKey: false, }
);


let newsLaterModel = model("newsLater", newsLaterSchema, "newsLater");


module.exports = newsLaterModel;
