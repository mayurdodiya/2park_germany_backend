const DB = require("../../models");
const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");

module.exports = {

    createProject: async (req, res) => {
        if (await DB.PROJECT.findOne({ projectname: req.body.projectname }).lean()) return apiResponse.DUPLICATE_VALUE({ res, message: messages.DUPLICATE_KEY });

        return apiResponse.OK({ res, message: messages.SUCCESS, data: await DB.PROJECT.create(req.body) });
    },
    getProject: async (req, res) => {
        let { page, limit, sortBy, sortOrder, search, ...query } = req.query;
        search ? query.$or = [{ projectname: { $regex: search, $options: "i" }}] : "";
        console.log(query);
        const data = await DB.PROJECT.
        find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({createdAt: -1 })
        .lean();
        
        return apiResponse.OK({ res, message: messages.SUCCESS,data: { data, count: await DB.PROJECT.countDocuments(query) } });
 
    },
    updateProject: async (req, res) => {
        const project = await DB.PROJECT.findOne({ _id: req.query.id});
        if (!project) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
        let data = await DB.PROJECT.findOneAndUpdate({ _id: req.query.id}, req.body, { new: true });
        return apiResponse.OK({ res, message: messages.SUCCESS, data });
    },
    DeleteProject: async (req, res) => {
        const project = await DB.PROJECT.findOne({ _id: req.query.id });
        if(!project) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.PROJECT.findOneAndDelete({ _id: req.query.id });
        return apiResponse.OK({ res, message: messages.SUCCESS });
    }
    

};
