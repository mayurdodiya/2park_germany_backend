const { hash } = require("bcryptjs");
const { Schema, model, default: mongoose } = require("mongoose");
const message = require("../json/message.json");
const { logger } = require("../utils/logger");

const appointmentSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "vattenfall" },
    uid: { type: Schema.Types.ObjectId, ref: "user" },
    notes: { type: String },
    appointmentDate: { type: Date },
    appointmentEndTime: { type: Date }
  },
  { timestamps: true, versionKey: false }
);

let appointmentModel = model("appointment", appointmentSchema, "appointment");
module.exports = appointmentModel;
