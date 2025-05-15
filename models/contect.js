const { Schema, model } = require("mongoose");


let contectSchema = new Schema(
    {

        description: { type: String, },
        crowd: { type: String },
        date: { type: Date },
        company_name: { type: String },
        contact_person: { type: String },
        email: { type: String },
        telephone: { type: Number },
        contectCategory: { type :String },
        isActive: { type: Boolean, default: true, },

    },
    { timestamps: true, versionKey: false, }
);


let contectModel = model("contect", contectSchema, "contect");


module.exports =contectModel;
