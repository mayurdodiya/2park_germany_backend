const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const s3 = require("../../service/s3.upload");
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");
const { logger } = require("../../utils/logger");
const ObjectId = require("mongodb").ObjectId;
const mongoose = require("mongoose");



module.exports = {

    // getAllAuthPlates: async (req, res) => {
    //   try {
    //     const { page, limit, locationId } = req.query;

    //     let query = {};
    //     if (locationId) {
    //       query.locationId = locationId;
    //     }

    //     const authPlates = await DB.DAHAUTHPLATE.find(query)
    //       .skip((page - 1) * limit)
    //       .limit(Number(limit));

    //     if (!authPlates.length) {
    //       return apiResponse.NOT_FOUND({
    //         res,
    //         message: "No Authorised Plates found for the specified location.",
    //       });
    //     }

    //     return apiResponse.OK({
    //       res,
    //       message: "Authorised Plates retrieved successfully.",
    //       data: authPlates,
    //     });
    //   } catch (error) {
    //     console.error("Error fetching Authorised Plates:", error.message);
    //     logger.error("Error fetching Authorised Plates:", error);

    //     return apiResponse.CATCH_ERROR({
    //       res,
    //       message: "Server error while retrieving Authorised Plates.",
    //     });
    //   }
    // },

    // Create a AuthPlates
    // createAuthPlates: async (req, res) => {
    //   try {
    //     const newAuthPlates = new DB.DAHAUTHPLATE({
    //       plateNumber: req.body.plateNumber,
    //       locationId: req.body.locationId,
    //       // add other fields as necessary
    //     });
    //     const savedAuthPlates = await newAuthPlates.save();

    //     return apiResponse.OK({
    //       res,
    //       message: "AuthPlates created successfully.",
    //       data: savedAuthPlates,
    //     });
    //   } catch (error) {
    //     console.error("Error creating AuthPlates:", error.message);
    //     logger.error("Error creating AuthPlates:", error);

    //     return apiResponse.CATCH_ERROR({
    //       res,
    //       message: "Server error while creating AuthPlates.",
    //     });
    //   }
    // },




// getAllAuthPlates: async (req, res) => {
//     try {
//         const { page = 1, limit = 10, locationId, plateNumber, search, namesearch, fromTime, toTime } = req.query;
//         const isAdmin = req.user?.roleId?.name === "admin";
//         const isSuperAdmin = req.user?.roleId?.name === "super_admin";

//         console.log("isAdmin:", isAdmin);
//         console.log("req.user:", req.user);

//         let query = {};

//         // Admins can fetch plates for their assigned location only
//         if (isAdmin) {
//             query.locationId = new mongoose.Types.ObjectId(locationId);
//         }

//         // Super admin can fetch all locations or a specific one
//         if (isSuperAdmin) {
//             query.locationId = locationId
//                 ? new mongoose.Types.ObjectId(locationId)
//                 : { $in: req.user.parkingplot.map(id => new mongoose.Types.ObjectId(id)) };
//         }

//         // Filter by plateNumber if provided
//         if (plateNumber) {
//             query.plateNumber = plateNumber;
//         }

//         // Apply search filters
//         if (search) {
//             query.$or = [{ plateNumber: { $regex: search, $options: "i" } }];
//         }

//         if (namesearch) {
//             query.$or = [
//                 { name: { $regex: namesearch, $options: "i" } },
//                 { nachname: { $regex: namesearch, $options: "i" } },
//             ];
//         }

//         // Apply fromTime & toTime filters
//         if (fromTime || toTime) {
//             query.fromTime = {};
//             query.toTime = {};

//             if (fromTime) query.fromTime.$gte = new Date(fromTime);
//             if (toTime) query.toTime.$lte = new Date(toTime);

//             if (Object.keys(query.fromTime).length === 0) delete query.fromTime;
//             if (Object.keys(query.toTime).length === 0) delete query.toTime;
//         }

//         const now = new Date();
//         let activeQuery = { ...query, fromTime: { $lte: now }, toTime: { $gte: now } };
//         let inactiveQuery = {
//             ...query,
//             $or: [{ fromTime: { $gt: now } }, { toTime: { $lt: now } }]
//         };

//         // Get counts first for accurate results
//         const totalCount = await DB.DAHAUTHPLATE.countDocuments(query);
//         const activeCount = await DB.DAHAUTHPLATE.countDocuments(activeQuery);
//         const inactiveCount = await DB.DAHAUTHPLATE.countDocuments(inactiveQuery);

//         let authPlates = [];
//         let activePlates = [];
//         let inactivePlates = [];

//         if (isSuperAdmin) {
//             // Super Admin: Get unique plates
//             authPlates = await DB.DAHAUTHPLATE.aggregate([
//                 { $match: query },
//                 { $group: { _id: "$plateNumber", document: { $first: "$$ROOT" } } },
//                 { $replaceRoot: { newRoot: "$document" } },
//                 { $sort: { createdAt: -1 } },
//                 { $skip: (page - 1) * limit },
//                 { $limit: Number(limit) },
//             ]);

//             activePlates = await DB.DAHAUTHPLATE.aggregate([
//                 { $match: activeQuery },
//                 { $group: { _id: "$plateNumber", document: { $first: "$$ROOT" } } },
//                 { $replaceRoot: { newRoot: "$document" } },
//                 { $sort: { createdAt: -1 } },
//                 { $skip: (page - 1) * limit },
//                 { $limit: Number(limit) },
//             ]);

//             inactivePlates = await DB.DAHAUTHPLATE.aggregate([
//                 { $match: inactiveQuery },
//                 { $group: { _id: "$plateNumber", document: { $first: "$$ROOT" } } },
//                 { $replaceRoot: { newRoot: "$document" } },
//                 { $sort: { createdAt: -1 } },
//                 { $skip: (page - 1) * limit },
//                 { $limit: Number(limit) },
//             ]);
//         } else {
//             // Admins: Normal query
//             authPlates = await DB.DAHAUTHPLATE.find(query)
//                 .sort({ createdAt: -1 })
//                 .skip((page - 1) * limit)
//                 .limit(Number(limit));

//             activePlates = await DB.DAHAUTHPLATE.find(activeQuery)
//                 .sort({ createdAt: -1 })
//                 .skip((page - 1) * limit)
//                 .limit(Number(limit));

//             inactivePlates = await DB.DAHAUTHPLATE.find(inactiveQuery)
//                 .sort({ createdAt: -1 })
//                 .skip((page - 1) * limit)
//                 .limit(Number(limit));
//         }

//         if (!authPlates || authPlates.length === 0) {
//             return apiResponse.OK({
//                 res,
//                 message: "No Authorised Plates found.",
//             });
//         }

//         return apiResponse.OK({
//             res,
//             message: "Authorised Plates retrieved successfully.",
//             data: {
//                 totalCount,
//                 authPlates,
//                 active: { totalCount: activeCount, authPlates: activePlates },
//                 inactive: { totalCount: inactiveCount, authPlates: inactivePlates },
//             },
//         });
//     } catch (error) {
//         console.error("Error fetching Authorised Plates:", error.message);
//         logger.error("Error fetching Authorised Plates:", error);

//         return apiResponse.CATCH_ERROR({
//             res,
//             message: "Server error while retrieving Authorised Plates.",
//         });
//     }
// },

getAllAuthPlates: async (req, res) => {
    try {
        const {
            authPage = 1, authLimit = 10,
            activePage = 1, activeLimit = 10,
            inactivePage = 1, inactiveLimit = 10,
            locationId, plateNumber, search, namesearch, fromTime, toTime
        } = req.query;

        const isAdmin = req.user?.roleId?.name === "admin";
        const isSuperAdmin = req.user?.roleId?.name === "super_admin";

        console.log("isAdmin:", isAdmin);
        console.log("req.user:", req.user);

        let query = {};

        if (isAdmin) {
            query.locationId = new mongoose.Types.ObjectId(locationId);
        }

        if (isSuperAdmin) {
            query.locationId = locationId
                ? new mongoose.Types.ObjectId(locationId)
                : { $in: req.user.parkingplot.map(id => new mongoose.Types.ObjectId(id)) };
        }

        if (plateNumber) {
            query.plateNumber = plateNumber;
        }

        let searchConditions = [];
        if (search) {
            searchConditions.push({ plateNumber: { $regex: search, $options: "i" } });
        }
        if (namesearch) {
            searchConditions.push(
                { name: { $regex: namesearch, $options: "i" } },
                { nachname: { $regex: namesearch, $options: "i" } }
            );
        }
        if (searchConditions.length > 0) {
            query.$or = searchConditions;
        }


        if (fromTime || toTime) {
            query.fromTime = {};
            query.toTime = {};

            if (fromTime) query.fromTime.$gte = new Date(fromTime);
            if (toTime) query.toTime.$lte = new Date(toTime);

            if (Object.keys(query.fromTime).length === 0) delete query.fromTime;
            if (Object.keys(query.toTime).length === 0) delete query.toTime;
        }

        const now = new Date();
        let activeQuery = { ...query, fromTime: { $lte: now }, toTime: { $gte: now } };
        let inactiveQuery = {
            ...query,
            $or: [{ fromTime: { $gt: now } }, { toTime: { $lt: now } }]
        };

        if (searchConditions.length > 0) {
            inactiveQuery.$and = [{ $or: searchConditions }];
        }

        const totalCount = await DB.DAHAUTHPLATE.countDocuments(query);
        const activeCount = await DB.DAHAUTHPLATE.countDocuments(activeQuery);
        const inactiveCount = await DB.DAHAUTHPLATE.countDocuments(inactiveQuery);

        let authPlates = [];
        let activePlates = [];
        let inactivePlates = [];

        if (isSuperAdmin) {
            authPlates = await DB.DAHAUTHPLATE.aggregate([
                { $match: query },
                { $group: { _id: "$plateNumber", document: { $first: "$$ROOT" } } },
                { $replaceRoot: { newRoot: "$document" } },
                { $sort: { createdAt: -1 } },
                { $skip: (authPage - 1) * authLimit },
                { $limit: Number(authLimit) },
            ]);

            activePlates = await DB.DAHAUTHPLATE.aggregate([
                { $match: activeQuery },
                { $group: { _id: "$plateNumber", document: { $first: "$$ROOT" } } },
                { $replaceRoot: { newRoot: "$document" } },
                { $sort: { createdAt: -1 } },
                { $skip: (activePage - 1) * activeLimit },
                { $limit: Number(activeLimit) },
            ]);

            inactivePlates = await DB.DAHAUTHPLATE.aggregate([
                { $match: inactiveQuery },
                { $group: { _id: "$plateNumber", document: { $first: "$$ROOT" } } },
                { $replaceRoot: { newRoot: "$document" } },
                { $sort: { createdAt: -1 } },
                { $skip: (inactivePage - 1) * inactiveLimit },
                { $limit: Number(inactiveLimit) },
            ]);
        } else {
            authPlates = await DB.DAHAUTHPLATE.find(query)
                .sort({ createdAt: -1 })
                .skip((authPage - 1) * authLimit)
                .limit(Number(authLimit));

            activePlates = await DB.DAHAUTHPLATE.find(activeQuery)
                .sort({ createdAt: -1 })
                .skip((activePage - 1) * activeLimit)
                .limit(Number(activeLimit));

            inactivePlates = await DB.DAHAUTHPLATE.find(inactiveQuery)
                .sort({ createdAt: -1 })
                .skip((inactivePage - 1) * inactiveLimit)
                .limit(Number(inactiveLimit));
        }

        if (!authPlates || authPlates.length === 0) {
            return apiResponse.OK({
                res,
                message: "No Authorised Plates found.",
            });
        }

        return apiResponse.OK({
            res,
            message: "Authorised Plates retrieved successfully.",
            data: {
                totalCount,
                authPlates: {
                    totalCount,
                    page: authPage,
                    limit: authLimit,
                    data: authPlates
                },
                active: {
                    totalCount: activeCount,
                    page: activePage,
                    limit: activeLimit,
                    data: activePlates
                },
                inactive: {
                    totalCount: inactiveCount,
                    page: inactivePage,
                    limit: inactiveLimit,
                    data: inactivePlates
                },
            },
        });
    } catch (error) {
        console.error("Error fetching Authorised Plates:", error.message);
        logger.error("Error fetching Authorised Plates:", error);

        return apiResponse.CATCH_ERROR({
            res,
            message: "Server error while retrieving Authorised Plates.",
        });
    }
},



    // createAuthPlates: async (req, res) => {
    //     try {
    //         const isAdmin = req.user.roleId.name === "admin";
    //         const isSuperAdmin = req.user.roleId.name === "super_admin";

    //         // Determine locationId(s) based on the user's role
    //         const locations = isSuperAdmin ? req.user.parkingplot : [req.body.locationId];

    //         if (!locations || locations.length === 0) {
    //             return apiResponse.BAD_REQUEST({
    //                 res,
    //                 message: "Super Admin must have at least one assigned location.",
    //             });
    //         }

    //         // Validate required fields for super_admin
    //         if (isSuperAdmin) {
    //             const requiredFields = [
    //                 "plateNumber",
    //                 "name",
    //                 "nachname",
    //                 "strabe",
    //                 "houseNumber",
    //                 "postCode",
    //                 "ort",
    //                 // "price_per_day",
    //                 // "price_per_hour",
    //                 "fromTime",
    //                 "toTime",
    //             ];
    //             const missingFields = requiredFields.filter((field) => !req.body[field]);

    //             if (missingFields.length > 0) {
    //                 return apiResponse.BAD_REQUEST({
    //                     res,
    //                     message: `The following fields are required for super_admin: ${missingFields.join(", ")}`,
    //                 });
    //             }
    //         }

    //         let updateData = {
    //             plateNumber: req.body.plateNumber,
    //             locationId: locationId,
    //             fromTime: fromTime,
    //             toTime: toTime,
    //         };

    //         // Validate required fields for admin
    //         if (isAdmin) {
    //             const requiredFields = ["plateNumber", "locationId"];
    //             const missingFields = requiredFields.filter((field) => !req.body[field]);

    //             if (missingFields.length > 0) {
    //                 return apiResponse.BAD_REQUEST({
    //                     res,
    //                     message: `The following fields are required for admin: ${missingFields.join(", ")}`,
    //                 });
    //             }
    //         }

    //         const savedPlates = [];

    //         // Validate time inputs
    //         if (!req.body.fromTime || !req.body.toTime) {
    //             return apiResponse.BAD_REQUEST({
    //                 res,
    //                 message: "fromTime and toTime are required fields.",
    //             });
    //         }

    //         // Convert `fromTime` and `toTime` into Date objects
    //         const fromTime = new Date(req.body.fromTime);
    //         const toTime = new Date(req.body.toTime);

    //         // Loop through all locations (for Super Admin)
    //         for (const locationId of locations) {
    //             try {
    //                 const savedAuthPlates = await DB.DAHAUTHPLATE.findOneAndUpdate(
    //                     { plateNumber: req.body.plateNumber, locationId: locationId }, // Search query
    //                     {
    //                         $set: {
    //                             plateNumber: req.body.plateNumber,
    //                             locationId: locationId,
    //                             fromTime: fromTime,
    //                             toTime: toTime,
    //                             ...(isSuperAdmin || !isAdmin
    //                                 ? {
    //                                     name: req.body.name,
    //                                     nachname: req.body.nachname,
    //                                     strabe: req.body.strabe,
    //                                     houseNumber: req.body.houseNumber,
    //                                     postCode: req.body.postCode,
    //                                     ort: req.body.ort,
    //                                     price_per_day: req.body.price_per_day,
    //                                     price_per_hour: req.body.price_per_hour,
    //                                 }
    //                                 : {}),
    //                         },
    //                     },
    //                     { upsert: true, new: true } // If not found, create new
    //                 );

    //                 if (req.body.price_per_day !== undefined) {
    //                     updateData.price_per_day = req.body.price_per_day;
    //                 }
    //                 if (req.body.price_per_hour !== undefined) {
    //                     updateData.price_per_hour = req.body.price_per_hour;
    //                 }


    //                 savedPlates.push(savedAuthPlates);
    //                 console.log('savedAuthPlates', savedAuthPlates);
    //             } catch (error) {
    //                 console.error(`Error saving plateNumber ${req.body.plateNumber} at location ${locationId}:`, error);
    //                 continue; // Skip this location and move to the next
    //             }
    //         }
    //         for (const locationId of locations) {
    //             try {
    //                 const savedAuthPlates = await DB.DAHAUTHPLATE.findOneAndUpdate(
    //                     { plateNumber: req.body.plateNumber, locationId: locationId }, // Search plate + location
    //                     {
    //                         $set: {
    //                             plateNumber: req.body.plateNumber,
    //                             locationId: locationId,
    //                             fromTime: fromTime,
    //                             toTime: toTime,
    //                             ...(isSuperAdmin || !isAdmin
    //                                 ? {
    //                                     name: req.body.name,
    //                                     nachname: req.body.nachname,
    //                                     strabe: req.body.strabe,
    //                                     houseNumber: req.body.houseNumber,
    //                                     postCode: req.body.postCode,
    //                                     ort: req.body.ort,
    //                                     price_per_day: req.body.price_per_day,
    //                                     price_per_hour: req.body.price_per_hour,
    //                                 }
    //                                 : {}),
    //                         },
    //                     },
    //                     { upsert: true, new: true } // Upsert ensures update or insert
    //                 );

    //                 if (req.body.price_per_day !== undefined) {
    //                     updateData.price_per_day = req.body.price_per_day;
    //                 }
    //                 if (req.body.price_per_hour !== undefined) {
    //                     updateData.price_per_hour = req.body.price_per_hour;
    //                 }

    //                 savedPlates.push(savedAuthPlates);
    //                 console.log('savedAuthPlates', savedAuthPlates);
    //             } catch (error) {
    //                 console.error(`Error saving plateNumber ${req.body.plateNumber} at location ${locationId}:`, error);
    //                 continue; // Skip this location and move to the next
    //             }
    //         }


    //         // If no plates were successfully saved, return an error
    //         if (savedPlates.length === 0) {
    //             return apiResponse.BAD_REQUEST({
    //                 res,
    //                 message: "Failed to create AuthPlates. Possible duplicate entries.",
    //             });
    //         }

    //         // Return success response
    //         return apiResponse.OK({
    //             res,
    //             message: "AuthPlates created successfully for assigned locations.",
    //             data: savedPlates,
    //         });

    //     } catch (error) {
    //         console.error("Error creating AuthPlates:", error.message);
    //         logger.error("Error creating AuthPlates:", error);

    //         return apiResponse.CATCH_ERROR({
    //             res,
    //             message: "Server error while creating AuthPlates.",
    //         });
    //     }
    // },







    // Fetch a single AuthPlates by ID

    createAuthPlates: async (req, res) => {
        try {
            const isAdmin = req.user.roleId.name === "admin";
            const isSuperAdmin = req.user.roleId.name === "super_admin";

            // Determine locationId(s) based on the user's role
            const locations = isSuperAdmin ? req.user.parkingplot : [req.body.locationId];

            if (!locations || locations.length === 0) {
                return apiResponse.BAD_REQUEST({
                    res,
                    message: "Super Admin must have at least one assigned location.",
                });
            }

            // Validate required fields for super_admin
            if (isSuperAdmin) {
                const requiredFields = [
                    "plateNumber",
                    "name",
                    "nachname",
                    "fromTime",
                    "toTime",
                ];
                const missingFields = requiredFields.filter((field) => !req.body[field]);

                if (missingFields.length > 0) {
                    return apiResponse.BAD_REQUEST({
                        res,
                        message: `The following fields are required for super_admin: ${missingFields.join(", ")}`,
                    });
                }
            }

            // Validate required fields for admin
            if (isAdmin) {
                const requiredFields = ["plateNumber", "locationId"];
                const missingFields = requiredFields.filter((field) => !req.body[field]);

                if (missingFields.length > 0) {
                    return apiResponse.BAD_REQUEST({
                        res,
                        message: `The following fields are required for admin: ${missingFields.join(", ")}`,
                    });
                }
            }

            // Validate time inputs
            if (isSuperAdmin && (!req.body.fromTime || !req.body.toTime)) {
                return apiResponse.BAD_REQUEST({
                    res,
                    message: "fromTime and toTime are required fields.",
                });
            }
            let fromTime ;
            let toTime;
            // Convert `fromTime` and `toTime` into Date objects
            if(req.body.fromTime && req.body.toTime){
             fromTime = new Date(req.body.fromTime);
             toTime = new Date(req.body.toTime); 
        }

            const savedPlates = [];

            // Loop through all locations (for Super Admin)
            for (const locationId of locations) {
                try {
                    // Create the update object dynamically
                    let updateData = {
                        plateNumber: req.body.plateNumber,
                        locationId: locationId,
                        fromTime: fromTime,
                        toTime: toTime,
                    };

                    // Add extra fields only for super_admin
                    if (isSuperAdmin || !isAdmin) {
                        updateData = {
                            ...updateData,
                            name: req.body.name,
                            nachname: req.body.nachname,
                            strabe: req.body.strabe,
                            houseNumber: req.body.houseNumber,
                            postCode: req.body.postCode,
                            ort: req.body.ort
                        };

                        // Only add these fields if they exist in the request
                        if (req.body.price_per_day !== undefined) {
                            updateData.price_per_day = req.body.price_per_day;
                        }
                        if (req.body.price_per_hour !== undefined) {
                            updateData.price_per_hour = req.body.price_per_hour;
                        }
                    }

                    // Now use updateData in the query
                    const savedAuthPlates = await DB.DAHAUTHPLATE.findOneAndUpdate(
                        { plateNumber: req.body.plateNumber, locationId: locationId },
                        { $set: updateData },
                        { upsert: true, new: true }
                    );

                    savedPlates.push(savedAuthPlates);
                    console.log('savedAuthPlates', savedAuthPlates);
                } catch (error) {
                    console.error(`Error saving plateNumber ${req.body.plateNumber} at location ${locationId}:`, error);
                    continue; // Skip this location and move to the next
                }
            }

            // If no plates were successfully saved, return an error
            if (savedPlates.length === 0) {
                return apiResponse.BAD_REQUEST({
                    res,
                    message: "Failed to create AuthPlates. Possible duplicate entries.",
                });
            }

            // Return success response
            return apiResponse.OK({
                res,
                message: "AuthPlates created successfully for assigned locations.",
                data: savedPlates,
            });

        } catch (error) {
            console.error("Error creating AuthPlates:", error.message);
            logger.error("Error creating AuthPlates:", error);

            return apiResponse.CATCH_ERROR({
                res,
                message: "Server error while creating AuthPlates.",
            });
        }
    },




    getAuthPlatesById: async (req, res) => {
        try {
            const AuthPlates = await DB.DAHAUTHPLATE.findById(req.query.id);
            if (!AuthPlates) {
                return apiResponse.NOT_FOUND({
                    res,
                    message: "AuthPlates not found.",
                });
            }

            return apiResponse.OK({
                res,
                message: "AuthPlates retrieved successfully.",
                data: AuthPlates,
            });
        } catch (error) {
            console.error("Error fetching AuthPlates:", error.message);
            logger.error("Error fetching AuthPlates:", error);

            return apiResponse.CATCH_ERROR({
                res,
                message: "Server error while retrieving AuthPlates.",
            });
        }
    },

    // // Update a AuthPlates by ID
    // updateAuthPlates: async (req, res) => {
    //   try {
    //     const updatedAuthPlates = await DB.DAHAUTHPLATE.findByIdAndUpdate(
    //       req.query.id,
    //       {
    //         plateNumber: req.body.plateNumber,
    //         locationId: req.body.locationId,
    //         // update other fields as necessary
    //       },
    //       { new: true }
    //     );

    //     if (!updatedAuthPlates) {
    //       return apiResponse.NOT_FOUND({
    //         res,
    //         message: "AuthPlates not found.",
    //       });
    //     }

    //     return apiResponse.OK({
    //       res,
    //       message: "AuthPlates updated successfully.",
    //       data: updatedAuthPlates,
    //     });
    //   } catch (error) {
    //     console.error("Error updating AuthPlates:", error.message);
    //     logger.error("Error updating AuthPlates:", error);

    //     return apiResponse.CATCH_ERROR({
    //       res,
    //       message: "Server error while updating AuthPlates.",
    //     });
    //   }
    // },

    updateAuthPlates: async (req, res) => {
        try {
            const isAdmin = req.user.roleId.name === "admin";
            const isSuperAdmin = req.user.roleId.name === "super_admin";

            // Find the existing AuthPlate
            const existingAuthPlate = await DB.DAHAUTHPLATE.findById(req.query.id);

            if (!existingAuthPlate) {
                return apiResponse.NOT_FOUND({
                    res,
                    message: "AuthPlates not found.",
                });
            }

            // Determine locationId(s) based on the user's role
            let locations = isSuperAdmin ? req.user.parkingplot : [req.body.locationId];

            if (!locations || locations.length === 0) {
                return apiResponse.BAD_REQUEST({
                    res,
                    message: "Super Admin must have at least one assigned location.",
                });
            }

            // Convert `fromTime` and `toTime` into Date objects
            const fromTime = req.body.fromTime ? new Date(req.body.fromTime) : existingAuthPlate.fromTime;
            const toTime = req.body.toTime ? new Date(req.body.toTime) : existingAuthPlate.toTime;

            const updateData = {
                plateNumber: req.body.plateNumber || existingAuthPlate.plateNumber,
                fromTime: fromTime,
                toTime: toTime,
            };

            // Apply additional fields if super_admin
            if (isSuperAdmin || !isAdmin) {
                Object.assign(updateData, {
                    name: req.body.name || existingAuthPlate.name,
                    nachname: req.body.nachname || existingAuthPlate.nachname,
                    strabe: req.body.strabe || existingAuthPlate.strabe,
                    houseNumber: req.body.houseNumber || existingAuthPlate.houseNumber,
                    postCode: req.body.postCode || existingAuthPlate.postCode,
                    ort: req.body.ort || existingAuthPlate.ort,
                    price_per_day: req.body.price_per_day ?? existingAuthPlate.price_per_day,
                    price_per_hour: req.body.price_per_hour ?? existingAuthPlate.price_per_hour,
                });
            }

            const updatedPlates = [];

            for (const locationId of locations) {
                const updatedAuthPlate = await DB.DAHAUTHPLATE.findOneAndUpdate(
                    { _id: req.query.id, locationId: locationId },
                    updateData,
                    { new: true }
                );

                if (updatedAuthPlate) {
                    updatedPlates.push(updatedAuthPlate);
                }
            }

            if (updatedPlates.length === 0) {
                return apiResponse.NOT_FOUND({
                    res,
                    message: "AuthPlates update failed or location mismatch.",
                });
            }

            return apiResponse.OK({
                res,
                message: "AuthPlates updated successfully.",
                data: updatedPlates,
            });

        } catch (error) {
            console.error("Error updating AuthPlates:", error.message);
            logger.error("Error updating AuthPlates:", error);

            return apiResponse.CATCH_ERROR({
                res,
                message: "Server error while updating AuthPlates.",
            });
        }
    },


    // Delete a AuthPlates by ID
    // deleteAuthPlates: async (req, res) => {
    //     try {
    //         const deletedAuthPlates = await DB.DAHAUTHPLATE.findByIdAndDelete(req.query.id);
    //         if (!deletedAuthPlates) {
    //             return apiResponse.NOT_FOUND({
    //                 res,
    //                 message: "AuthPlates not found.",
    //             });
    //         }

    //         return apiResponse.OK({
    //             res,
    //             message: "AuthPlates deleted successfully.",
    //         });
    //     } catch (error) {
    //         console.error("Error deleting AuthPlates:", error.message);
    //         logger.error("Error deleting AuthPlates:", error);

    //         return apiResponse.CATCH_ERROR({
    //             res,
    //             message: "Server error while deleting AuthPlates.",
    //         });
    //     }
    // }

    deleteAuthPlates: async (req, res) => {
        try {
            const userRole = req.user?.roleId?.name;
            const authPlateId = req.query.id;

            console.log("User Role:", userRole);
            console.log("AuthPlate ID:", authPlateId);

            if (!authPlateId) {
                return apiResponse.BAD_REQUEST({
                    res,
                    message: "AuthPlates ID is required.",
                });
            }

            // Find the AuthPlate by ID
            const authPlate = await DB.DAHAUTHPLATE.findById(authPlateId);
            if (!authPlate) {
                return apiResponse.NOT_FOUND({
                    res,
                    message: "AuthPlates not found.",
                });
            }

            console.log("Found AuthPlate:", authPlate);

            // Admin can delete any record
            if (userRole === "admin") {
                await DB.DAHAUTHPLATE.findByIdAndDelete(authPlateId);
                return apiResponse.OK({
                    res,
                    message: "AuthPlates deleted successfully.",
                });
            }

            // Super Admin can only delete records within their assigned parking plots
            if (userRole === "super_admin") {
                const superAdminPlots = req.user?.parkingplot || []; // Ensure array exists

                console.log("Super Admin Parking Plots:", superAdminPlots);
                console.log("AuthPlate Location ID:", authPlate.locationId.toString());

                if (!superAdminPlots.map(id => id.toString()).includes(authPlate.locationId.toString())) {
                    console.log("403 Forbidden: Super Admin does not have access to this parking plot.");
                    return apiResponse.FORBIDDEN({
                        res,
                        message: "You do not have permission to delete this AuthPlate.",
                    });
                }

                await DB.DAHAUTHPLATE.findByIdAndDelete(authPlateId);
                return apiResponse.OK({
                    res,
                    message: "AuthPlates deleted successfully.",
                });
            }

            console.log("403 Forbidden: Unauthorized access.");
            return apiResponse.FORBIDDEN({
                res,
                message: "Unauthorized access.",
            });

        } catch (error) {
            console.error("Error deleting AuthPlates:", error.message);
            logger.error("Error deleting AuthPlates:", error);

            return apiResponse.CATCH_ERROR({
                res,
                message: "Server error while deleting AuthPlates.",
            });
        }
    }




};
