const { hash } = require("bcryptjs");
const { Schema, model, default: mongoose } = require("mongoose");
const message = require("../json/message.json");
const { logger } = require("../utils/logger");

const assignleadSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "vattenfall" },
    uid: { type: Schema.Types.ObjectId, ref: "user" },
    status: { type: String, default: "pending" },
    conform: { type: Boolean, default: false },
    reject: { type: Boolean, default: false }
  },
  { timestamps: true, versionKey: false }
);

let assignleadModel = model("assignlead", assignleadSchema, "assignlead");
module.exports = assignleadModel;
