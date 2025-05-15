const { Schema, model } = require("mongoose");


let straper2Schema = new Schema(
    {

        Telefon: { type: String },
        Vor_und_Nachname: { type: String },
        bothersOr: { type: String },
        capacity: { type: String },
        email: { type: String },
        important: [{ type: String }],
        innerFlow: { type: String },
        module: { type: String },
        offerFlow: { type: String },
        paytmentInAdvance: { type: String },
        period: { type: String },
        wallboxInclude: { type: String },
        Nr: { type: String },
        Ort: { type: String },
        PLZ: { type: String },
        Strabe: { type: String },
        Stromverbrauch: { type: String },
        roofType: { type: String },
        photo: [{ type: String }],
        isIncludeGermanGuarantee: { type: String },
        manufacuresModule: { type: String },
        manufacuresSpeicher: { type: String },
        manufacuresWallbox: { type: String },
        manufacuresWechselrichter: { type: String },
        plannedFacility: { type: String },
        termOftheGuarantee: { type: String },
        particularImportant: [{ type: String }],
        newOffer: { type: String },
        isActive: { type: Boolean, default: true }
    },
    { timestamps: true, versionKey: false, }
);


let straper2Model = model("straper2", straper2Schema, "straper2");


module.exports = straper2Model;




