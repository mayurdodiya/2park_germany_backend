const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const EMAIL = require("../../service/mail.service")
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");
const { logger } = require("../../utils/logger");


module.exports = exports = {


    addInquiry: async (req, res) => {
        let { user } = req;

        const newsLater = await DB.INQUIRY.findOne({ email: req.body.email })
        if (newsLater) {
            return apiResponse.DUPLICATE_VALUE({
                res,
                message: messages.DUPLICATE_KEY
            })
        }

        const create = await DB.INQUIRY.create(req.body)
        return apiResponse.OK({
            res,
            message: messages.SUCCESS,
            data: create
        })
    },

    // getInquiry: async (req, res) => {
    //     let { page, limit, sortBy, sortOrder, search, ...query } = req.query;

    //     // query = req.user.roleId.name === ADMIN ? { ...query } : { _id: req.user._id };
    //     search ? query.$or = [{ email: { $regex: search, $options: "i" } }] : "";

    //     const data = await DB.INQUIRY
    //         .find(query)
    //         .skip((page - 1) * limit)
    //         .limit(limit)
    //         .sort({ [sortBy]: sortOrder })
    //         .lean();

    //     return apiResponse.OK({ res, message: messages.SUCCESS, data: { count: await DB.INQUIRY.countDocuments(query), data } });
    // },

    getInquiry: async (req, res) => {
        try {
            let { page = 1, limit = 10, sortBy = "createdAt", sortOrder = -1, search, ...query } = req.query;
    
            // Convert page and limit to numbers
            page = parseInt(page);
            limit = parseInt(limit);
    
            // Construct the search query
            if (search) {
                query.$or = [
                    { email: { $regex: search, $options: "i" } },
                    { contact_person: { $regex: search, $options: "i" } },
                    { company_name: { $regex: search, $options: "i" } },
                    { inquiryCategory: { $regex: search, $options: "i" } }
                ];
            }
    
            const data = await DB.INQUIRY
                .find(query)
                .skip((page - 1) * limit)
                .limit(limit)
                .sort({ [sortBy]: sortOrder })
                .lean();
    
            const count = await DB.INQUIRY.countDocuments(query);
    
            return apiResponse.OK({
                res,
                message: messages.SUCCESS,
                data: { count, data },
            });
        } catch (error) {
            return apiResponse.ERROR({
                res,
                message: messages.ERROR,
                error,
            });
        }
    },
    

    deleteInquiry: async (req, res) => {
        let { id } = req.query;

        const inquiry = await DB.INQUIRY.findOne({ _id: id })
        if (!inquiry) {
            return apiResponse.NOT_FOUND({
                res,
                message: messages.NOT_FOUND
            })
        }

        await DB.INQUIRY.findOneAndDelete({ _id: id })

        return apiResponse.OK({
            res,
            message: messages.SUCCESS
        })
    }
};
