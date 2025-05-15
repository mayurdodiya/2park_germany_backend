const { hash } = require("bcryptjs");
const { Schema, model, default: mongoose } = require("mongoose");
const message = require("../json/message.json");
const { logger } = require("../utils/logger");


const userSchema = new Schema(
    {

        email: { type: String },
        name: { type: String, },
        vorname: { type: String },
        nachname: { type: String },
        password: { type: String, required: true, },
        roleId: { type: Schema.Types.ObjectId, ref: "role", required: true, },
        photo: { type: String },
        isActive: { type: Boolean, default: true, },
        projectName:{ type: String},
        userId: { type: String },
        uniqueTrackingId: { type: String },
        userLead: { type: Number },
        gender: { type: String },
        birthday: { type: String },
        phone: { type: String },
        streetHouseNumber: { type: String },
        postalCode: { type: String }, //postalCode passing
        location: { type: String },
        iban: { type: String },
        creditInstitution: { type: String },
        accountOwner: { type: String },
        signature: { type: String },
        profileImage: { type: String },
        // socketId: { type: String, default: null },
        patners: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
        compensation_Lead: { type: Number },
        compensation_Team: { type: String },
        PLZ: [{ type: mongoose.Schema.Types.ObjectId, ref: "postalCode" }], //city passing 
        PVVertrieb: { type: Boolean, default: false },
        steuernummer: { type: String, default: null },
        vattenfallPatners: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
        vattenfallPatnersFlag: { type: Boolean, default: false },
        parkingLocation: [{ type: mongoose.Schema.Types.ObjectId, ref: "dahLocation" }],
        parkingplot: [{ type: mongoose.Schema.Types.ObjectId, ref: "dahLocation" }],  //this is for the super admin  
    },
    { timestamps: true, versionKey: false, }
);


userSchema.pre("save", async function (next) {
    try {

        const user = this;
        console.log("user.isModified(password)", user.isModified("password"), "user.isNew", user.isNew);

        if (user.isModified("password") || user.isNew) {

            this.password = await hash(user.password, 10);
            next();

        } else {
            next();
        }

    } catch (error) {

        logger.error(`PRE SAVE ERROR: ${error}`);
        return Promise.reject(message.INTERNAL_SERVER_ERROR);

    }
});


userSchema.set("toJSON", {
    transform: function (doc, ret, opt) {
        delete ret["password"];
        return ret;
    },
});


let userModel = model("user", userSchema, "user");
module.exports = userModel;
