const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const s3 = require("../../service/s3.upload");
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");
const { logger } = require("../../utils/logger");

const validCategories = ['Angebot & Vertrag', 'Logos, Hintergrunde', 'Unternehmenspräsentation', 'Vertriebsunterstutzung', 'Akademieunterlagen', '2Park Kundenvertrag'];

module.exports = {
    uploadDocument: async (req, res) => {
        try {
            const { category, name } = req.body;
            console.log('req.body', req.body);

            if (!validCategories.includes(category)) {
                return apiResponse.BAD_REQUEST({
                    res,
                    message: 'Invalid category.',
                });
            }

            if (!req.file) {
                return apiResponse.BAD_REQUEST({
                    res,
                    message: 'No file uploaded.'
                });
            }

            const Document = DB.DOCUMENT;  // Correctly access the Document model from DB

            const document = new Document({
                category,
                name,
                s3Url: req.file.location
            });

            await document.save();

            return apiResponse.OK({
                res,
                message: 'Document uploaded successfully.',
                data: {
                    name,
                    category,
                    s3Url: req.file.location
                }
            });
        } catch (error) {
            console.error(error);
            return apiResponse.CATCH_ERROR({
                res,
                message: 'Server error.'
            });
        }
    },

    // getDocumentsByCategory: async (req, res) => {
    //   try {
    //     const { category } = req.params;

    //     // Validate category
    //     if (!validCategories.includes(category)) {
    //       return apiResponse.BAD_REQUEST({
    //         res,
    //         message: 'Invalid category.',
    //       });
    //     }

    //     const Document = DB.DOCUMENT;  // Correctly access the Document model from DB

    //     console.log(`Querying for category: ${category}`);
    //     const documents = await Document.find({ category });
    //     console.log(`Documents found: ${documents.length}`);

    //     if (!documents.length) {
    //       return apiResponse.NOT_FOUND({
    //         res,
    //         message: 'No documents found for this category.'
    //       });
    //     }

    //     return apiResponse.OK({
    //       res,
    //       message: messages.SUCCESS,
    //       // data: {
    //       //     category: documents.category,
    //       //     s3Url: documents.s3Url,
    //       //     _id: documents._id,
    //       //     uploadedAt: documents.uploadedAt
    //       // },
    //       data: documents
    //     });
    //   } catch (error) {
    //     console.error("Error fetching documents by category:", error.message);
    //     logger.error("Error fetching documents by category:", error); // Log the complete error object for detailed analysis

    //     return apiResponse.SERVER_ERROR({
    //       res,
    //       message: 'Server error.'
    //     });
    //   }
    // },

    getDocumentsByCategory: async (req, res) => {
        try {
            const Document = DB.DOCUMENT; // Access the Video model from DB

            // Fetch all video documents
            const document = await Document.find({});
            if (!document.length) {
                return apiResponse.NOT_FOUND({
                    res,
                    message: "No documents found.",
                });
            }

            return apiResponse.OK({
                res,
                message: "Documents retrieved successfully.",
                data: document,
            });
        } catch (error) {
            console.error("Error fetching document:", error.message);
            logger.error("Error fetching document:", error);

            return apiResponse.SERVER_ERROR({
                res,
                message: "Server error while retrieving document.",
            });
        }
    },

};
