const DB = require("../../models");
const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");

module.exports = {

    createRole: async (req, res) => {
        if (await DB.ROLE.findOne({ name: req.body.name }).lean()) return apiResponse.DUPLICATE_VALUE({ res, message: messages.DUPLICATE_KEY });

        return apiResponse.OK({ res, message: messages.SUCCESS, data: await DB.ROLE.create(req.body) });
    },

};
