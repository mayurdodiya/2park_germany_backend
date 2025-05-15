const { Schema, model } = require("mongoose");

let documentSchema = new Schema(
    {
        category: {
            type: String,
            required: true,
            enum: ['Angebot & Vertrag', 'Logos, Hintergrunde', 'Unternehmenspräsentation', 'Vertriebsunterstutzung', 'Akademieunterlagen', '2Park Kundenvertrag']
        },
        name: {
            type: String,
            required: true,
            trim: true  // To remove leading/trailing whitespaces
        },
        s3Url: {
            type: String,
            required: true
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true, versionKey: false }
);

let documentModel = model("document", documentSchema, "document");

module.exports = documentModel;
