const { Schema, model } = require("mongoose");

let descriptionSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
        }
    },
    { timestamps: true, versionKey: false }
);

let descriptionModel = model("description", descriptionSchema, "description");

module.exports = descriptionModel;
