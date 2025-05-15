const { Schema, model } = require("mongoose");


let roleSchema = new Schema(
    {

        name: { type: String, },
        isActive: { type: Boolean, default: true, },

    },
    { timestamps: true, versionKey: false, }
);


let roleModel = model("role", roleSchema, "role");


module.exports = roleModel;
