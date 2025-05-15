const { Schema, model, mongo, default: mongoose } = require("mongoose");


let vattenfallSchema = new Schema(
    {

        name: { type: String },
        strabe: { type: String },
        // location: { type: mongoose.Schema.Types.ObjectId, ref: "postalCode" },
        location: { type: String },
        telephon: { type: String },
        email: { type: String },
        pLZ: { type: String },
        nachname: { type: String },
        contractions: { type: String },
        notizen: { type: String },
        userId: { type: String },
        firma: { type: String },
        status: { type: String, default: null },
        assignUid: [{
          type: mongoose.Schema.Types.ObjectId, ref: "user"
        }],
        benutzerId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        benutzername: { type: String },
        comment: { type: String },
        reason: { type: String },
        leadNotes: { type: String, default: null },
        wiedervorlage: { type: Date },
        notification: { type: Boolean, default: false },
        isUserCreate: { type: Boolean, default: false }
    },
    { timestamps: true, versionKey: false, }
);


let vattenfallModel = model("vattenfall", vattenfallSchema, "vattenfall");


module.exports = vattenfallModel;
