const { Schema, model } = require("mongoose");


let inquirySchema = new Schema(
    {

        region: { type: String },
        crowd: { type: String },
        date: { type: Date },
        email: { type: String },
        telephone: { type: Number },
        contact_person: { type: String },
        company_name: { type: String },
        inquiryCategory: { type: String },
        isActive: { type: Boolean, default: true, },

    },
    { timestamps: true, versionKey: false, }
);


let inquiryModel = model("inquiry", inquirySchema, "inquiry");


module.exports = inquiryModel;
