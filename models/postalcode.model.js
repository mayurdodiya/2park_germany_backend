const { hash } = require("bcryptjs");
const { Schema, model, default: mongoose } = require("mongoose");
const message = require("../json/message.json");
const { logger } = require("../utils/logger");

const postalCodeSchema = new Schema(
  {
    cityName: { type: String },
    // PLZ: { type: String },
    // ORT: { type: String },
    // ZUSATZ: { type: String, default: '' },
    // BUNDESLAND: { type: String },
  },
  { timestamps: true, versionKey: false }
);

let postalCodeModel = model("postalCode", postalCodeSchema, "postalCode");
module.exports = postalCodeModel;