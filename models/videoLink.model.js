const { Schema, model } = require("mongoose");

let videoSchema = new Schema(
  {

    title: {
      type: String,
      required: true,
      trim: true  // To remove leading/trailing whitespaces
    },
    videoUrl: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String,
      required: true
    },
    description: {
      type: String,
      trim: true,
      default: undefined  // Explicitly no default, making it optional
    },
    innertext: {
      type: String,
      trim: true,
      default: undefined  // Explicitly no default, making it optional
    },
    maintitle: {
      type: String,
      trim: true,
      default: undefined  // Explicitly no default, making it optional
    },
    subtitle: {
      type: String,
      trim: true,
      default: undefined  // Explicitly no default, making it optional
    },

  },
  { timestamps: true, versionKey: false }
);

let videoModel = model("video", videoSchema, "video");

module.exports = videoModel;
