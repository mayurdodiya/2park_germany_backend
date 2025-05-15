const { Schema, model, mongo, default: mongoose } = require("mongoose");


let straperSchema = new Schema(
    {
      
      name: { type: String },
      strabe: { type: String },
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
      benutzerId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
      benutzername: { type: String },
      comment: { type: String },
      

        // power_consumption: { type: String },
        // photo: { type: String },
        // nr: { type: String },
        // rooftype: { type: String },
        // unterschrift: { type: String },
        // benutzerId: { type: String },
        // passwort: { type: String },
        // satteldach: { type: String },
        // schornstein: [{
        //     type: String
        //   }],
        // aktuellkeineAuto: { type: String },
        // housetype: { type: String },
        // roofFelt: { type: String },
        // projectName:{ type: String},
        // uniqueTrackingId: { type: String },
        // patners: [{
        //     type: mongoose.Schema.Types.ObjectId, ref: "user"
        //   }],
        // wf_leadid: { type: Number, default: null },
        // notes: { type: String, default: null },
        // isActive: { type: Boolean, default: true },
        // apiAdded: { type: Boolean, default: false },
        

    },
    { timestamps: true, versionKey: false, }
);


let straperModel = model("straper", straperSchema, "straper");


module.exports = straperModel;
