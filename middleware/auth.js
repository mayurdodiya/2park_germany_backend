const DB = require("../models");
const { USER_TYPE } = require("../json/enums.json");
const apiResponse = require("../utils/api.response");
const message = require("../json/message.json");
const jwt = require("jsonwebtoken");
const { logger } = require("../utils/logger");


module.exports = {
    auth: ({ isTokenRequired = true, usersAllowed = [] } = {}) => {

        return async (req, res, next) => {

            const token = req.header("x-auth-token");
            if (isTokenRequired && !token) return apiResponse.BAD_REQUEST({ res, message: message.TOKEN_REQUIRED });
            if (!isTokenRequired && !token) return next();

            let user;
            try {

                let decoded = jwt.verify(token, process.env.JWT_SECRET);

                user = await DB.USER.findOne({ _id: decoded?._id, isActive: true }).populate("roleId").lean();
                if (!user) return apiResponse.UNAUTHORIZED({ res, message: message.INVALID_TOKEN });

            } catch (error) {

                logger.error(`AUTH ERROR: ${error}`);
                return apiResponse.UNAUTHORIZED({ res, message: message.INVALID_TOKEN });

            }


            req.user = user;
            if (usersAllowed.length) {

                if (req.user.roleId.name === USER_TYPE.ADMIN) return next();
                if (usersAllowed.includes("*")) return next();
                if (usersAllowed.includes(req.user.roleId.name)) return next();

                return apiResponse.UNAUTHORIZED({ res, message: message.UNAUTHORIZED });

            } else {

                if (req.user.roleId.name === USER_TYPE.ADMIN) return next();
                return apiResponse.UNAUTHORIZED({ res, message: message.UNAUTHORIZED });

            }
        };
    },
};
