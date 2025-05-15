const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const { logger } = require("../../utils/logger");

module.exports = {
    // Add a new description
    addDescription: async (req, res) => {
        try {
            const { content } = req.body;

            if (!content) {
                return apiResponse.BAD_REQUEST({
                    res,
                    message: 'Description content is required.',
                });
            }

            // Check if a description already exists
            const existingDescription = await DB.DESCRIPTION.findOne();
            if (existingDescription) {
                return apiResponse.BAD_REQUEST({
                    res,
                    message: 'A description already exists. Please update instead.',
                });
            }

            // Create and save the new description
            const newDescription = await DB.DESCRIPTION.create({ content });

            return apiResponse.OK({
                res,
                message: 'Description added successfully.',
                data: newDescription,
            });
        } catch (error) {
            logger.error("Error adding description:", error);

            return apiResponse.SERVER_ERROR({
                res,
                message: 'Server error while adding description.',
            });
        }
    },

    // Update an existing description
    updateDescription: async (req, res) => {
        try {
            const { content } = req.body;

            if (!content) {
                return apiResponse.BAD_REQUEST({
                    res,
                    message: 'Updated description content is required.',
                });
            }

            // Update the description or create it if it doesn't exist
            const updatedDescription = await DB.DESCRIPTION.findOneAndUpdate(
                {}, // Match any document since there's only one
                { content, updatedAt: Date.now() },
                { new: true, upsert: true } // Upsert ensures one document always exists
            );

            return apiResponse.OK({
                res,
                message: 'Description updated successfully.',
                data: updatedDescription,
            });
        } catch (error) {
            logger.error("Error updating description:", error);

            return apiResponse.SERVER_ERROR({
                res,
                message: 'Server error while updating description.',
            });
        }
    },

    // Get the existing description
    getDescription: async (req, res) => {
        try {
            // Fetch the description
            const description = await DB.DESCRIPTION.findOne();

            if (!description) {
                return apiResponse.NOT_FOUND({
                    res,
                    message: 'No description found.',
                });
            }

            return apiResponse.OK({
                res,
                message: 'Description retrieved successfully.',
                data: description,
            });
        } catch (error) {
            logger.error("Error retrieving description:", error);

            return apiResponse.SERVER_ERROR({
                res,
                message: 'Server error while retrieving description.',
            });
        }
    },
};
