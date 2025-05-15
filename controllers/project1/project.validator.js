const Joi = require("joi");
const { USER_TYPE } = require("../../json/enums.json");
const validator = require("../../middleware/validator");


module.exports = {

    createProject: validator({
        
        body: Joi.object({
            projectname: Joi.string().required(),
        }),
    }),
    DeleteProject: validator({
        query: Joi.object({
            id: Joi.string().required(),
        }),
    }),
    updateProject: validator({
        body: Joi.object({
            projectname: Joi.string(),
          
        }),
        query: Joi.object({
            id: Joi.string().required(),
        }),
    }),

    


};
