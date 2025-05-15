const apiResponse = require("../utils/api.response");
const messages = require("../json/message.json");
const { MulterError } = require("multer");
const { JsonWebTokenError, NotBeforeError, TokenExpiredError } = require("jsonwebtoken")
const { logger } = require("../utils/logger");


module.exports = async (error, req, res, next) => {

    logger.warn(` ERROR AT PATH ${req.path}`);


    if (error instanceof MulterError) return apiResponse.BAD_REQUEST({ res, message: messages.INVALID_FILE, data: { context: error.code } });
    if (error instanceof JsonWebTokenError) return apiResponse.UNAUTHORIZED({ res, message: messages.INVALID_TOKEN, data: { context: error.message } });
    if (error instanceof NotBeforeError) return apiResponse.UNAUTHORIZED({ res, message: messages.INVALID_TOKEN, data: { context: error.message } });
    if (error instanceof TokenExpiredError) return apiResponse.UNAUTHORIZED({ res, message: messages.INVALID_TOKEN, data: { context: error.message } });


    logger.error(`STACK_ERROR: ${error}`)
    return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR, data: { context: error.message } });

};