const { Schema, model } = require("mongoose");


let ProjectSchema = new Schema(
    {
        projectname:{type: String,},

    },
    { timestamps: true, versionKey: false, }
);


let projectModel = model("project",  ProjectSchema, "project");


module.exports =projectModel;
