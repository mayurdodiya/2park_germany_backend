const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");
const { logger } = require("../../utils/logger");


module.exports = {
  /**
   * Upload a video by providing title and URL
   */
  // uploadVideo: async (req, res) => {
  //     try {
  //         const { title, videoUrl } = req.body;

  //         // Validate input
  //         if (!title || !videoUrl) {
  //             return apiResponse.BAD_REQUEST({
  //                 res,
  //                 message: "Title and video URL are required.",
  //             });
  //         }
  //         console.log('File uploaded:', req.file);

  //         if (!req.file) {
  //           return apiResponse.BAD_REQUEST({
  //               res,
  //               message: 'No file uploaded.'
  //           });
  //       }

  //         const Video = DB.VIDEO; // Access the Video model from DB

  //         // Create new video document
  //         const video = new Video({ title, videoUrl , thumbnail: req.file.location});
  //         await video.save();

  //         return apiResponse.OK({
  //             res,
  //             message: "Video uploaded successfully.",
  //             data: {
  //                 id: video._id,
  //                 title: video.title,
  //                 videoUrl: video.videoUrl,
  //                 thumbnail: req.file.location,
  //                 uploadedAt: video.createdAt,
  //             },
  //         });
  //     } catch (error) {
  //         console.error("Error uploading video:", error.message);
  //         logger.error("Error uploading video:", error);

  //         return apiResponse.SERVER_ERROR({
  //             res,
  //             message: "Server error while uploading video.",
  //         });
  //     }
  // },

  uploadVideo: async (req, res) => {
    try {
        const { title, videoUrl } = req.body;

        // Validate input
        if (!title || !videoUrl) {
            return apiResponse.BAD_REQUEST({
                res,
                message: "Title and video URL are required.",
            });
        }

        // Check if file is uploaded
        if (!req.file) {
            return apiResponse.BAD_REQUEST({
                res,
                message: 'No file uploaded.'
            });
        }

        // Validate file type (e.g., only accept image files)
        const acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!acceptedFileTypes.includes(req.file.mimetype)) {
            return apiResponse.BAD_REQUEST({
                res,
                message: 'Invalid file type. Only images are allowed.'
            });
        }

        // Access the Video model from DB
        const Video = DB.VIDEO;

        // Create new video document with thumbnail from req.file
        const video = new Video({
            title,
            videoUrl,
            thumbnail: req.file.location, // Use the thumbnail location from S3 or desired storage
        });

        // Save the video document to the database
        await video.save();

        return apiResponse.OK({
            res,
            message: "Video uploaded successfully.",
            data: {
                id: video._id,
                title: video.title,
                videoUrl: video.videoUrl,
                thumbnail: req.file.location,
                uploadedAt: video.createdAt,
            },
        });
    } catch (error) {
        console.error("Error uploading video:", error.message);
        logger.error("Error uploading video:", error);

        return apiResponse.SERVER_ERROR({
            res,
            message: "Server error while uploading video.",
            error: error.message // Include the error details for debugging
        });
    }
},


  /**
   * Retrieve all videos
   */
  getAllVideos: async (req, res) => {
    try {
      let id = req.query.id;
      let { page, limit, sortBy, sortOrder, search, ...query } = req.query;

      search
        ? (query.$or = [{ mainTitle: { $regex: search, $options: "i" } }])
        : "";

      if (id) {
        const findVideo = await DB.VIDEO.findOne({ _id: id });

        if (!findVideo) {
          return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
        }

        return apiResponse.OK({
          res,
          message: messages.SUCCESS,
          data: findVideo,
        });
      }

      const data = await DB.VIDEO.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .lean();

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: { count: await DB.VIDEO.countDocuments(query), data },
      });
    } catch (error) {
      console.log(error, "----------- Catch error ----------");
      return apiResponse.CATCH_ERROR({
        res,
        message: messages.INTERNAL_SERVER_ERROR,
      });
    }
  },
};