const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const helper = require("../../utils/utils");
const EMAIL = require("../../service/mail.service")
const { USER_TYPE: { ADMIN } } = require("../../json/enums.json");
const { logger } = require("../../utils/logger");
const { isAfter } = require("validator");
const utils = require("../../utils/utils");
const ObjectId = require("mongodb").ObjectId;


module.exports = exports = {


    signIn: async (req, res) => {
        const user = await DB.USER.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${req.body.email}$`, 'i') } },
                { name: req.body.name }
            ]
        }).populate("roleId", "name").lean();

        if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
        if (user.isActive == false) return apiResponse.NOT_FOUND({ res, message: "Your account is currently deactivate" })

        const isPasswordMatch = await helper.comparePassword({ password: req.body.password, hash: user.password });
        if (!isPasswordMatch) return apiResponse.BAD_REQUEST({ res, message: messages.INVALID_PASSWORD });

        const token = helper.generateToken({ data: { _id: user._id, role: user.roleId.name } });

        // await EMAIL.sendEmail({
        //     to: user.email,
        //     name: user.name
        // })

        return apiResponse.OK({
            res,
            message: messages.SUCCESS,
            data: {
                email: user.email,
                name: user.name,
                role: user.roleId.name,
                projectName: user.projectName,
                patners: user.patners,
                _id: user._id,
                userId: user.userId,
                isActive: user.isActive,
                uniqueTrackingId: user.uniqueTrackingId,
                signature: user.signature,
                profileImage: user.profileImage,
                token,
            },
        });
    },
    userToken: async (req, res) => {
        try {
            const decoded = await utils.decodeToken(req.body.token);

            const findUser = await DB.USER.findOne({ _id: decoded._id }).populate("roleId");
            if (findUser) {
                let data = {
                    email: findUser.email,
                    name: findUser.name,
                    role: findUser.roleId.name,
                    projectName: findUser.projectName,
                    patners: findUser.patners,
                    _id: findUser._id,
                    userId: findUser.userId,
                    isActive: findUser.isActive,
                    signature: findUser.signature,
                    profileImage: findUser.profileImage,
                    uniqueTrackingId: findUser.uniqueTrackingId
                }
                return apiResponse.OK({ res, message: messages.SUCCESS, data: data })
            }
            return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND })
        } catch (error) {
            console.log(error, "--------------error-----------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR })
        }
    },

    adminSignin: async (req, res) => {
        const admin = await DB.USER.findOne({
            $or: [
                { email: { $regex: new RegExp(`^${req.body.email}$`, 'i') } },
                { name: req.body.name }
            ]
        }).populate("roleId", "name").populate("patners", "name").lean();

        if (!admin) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND })

        const isPasswordMatch = await helper.comparePassword({ password: req.body.password, hash: admin.password });
        if (!isPasswordMatch) return apiResponse.BAD_REQUEST({ res, message: messages.INVALID_PASSWORD });

        const role = await DB.ROLE.findOne({ _id: admin.roleId._id })
        if (role.name == "admin") {
            let otp = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);

            await DB.OTP.deleteMany({ email: req.body.email })

            await DB.OTP.create({ email: req.body.email, otp: otp })

            await EMAIL.sendEmail({
                 to: process.env.ADMIN_EMAIL,
                // to: "sicherheit@wepro-deutschland.de, admin@2-park.de",
                name: admin.name,
                subject: "TwoPark",
                otp: otp
            }).then((data) => {data}).catch((err) => console.log(err, "--------------err----------"))

            return apiResponse.OK({ res, message: "Please verify OTP in your email" });
        }
        // let otp = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000);

        // await DB.OTP.deleteMany({ email: req.body.email })

        // await DB.OTP.create({ email: req.body.email, otp: otp })

        // await EMAIL.sendEmail({
        //     to: admin.email,
        //     name: admin.name,
        //     subject: "Wepro",
        // 	otp: otp
        // })

        // return apiResponse.OK({ res, message: "Please verify OTP in your email" });
        if (role.name == "user") {
            const token = helper.generateToken({ data: { _id: admin._id, role: admin.roleId.name } });
            let data = {
                email: admin.email,
                name: admin.name,
                role: admin.roleId.name,
                projectName: admin.projectName,
                patners: admin.patners,
                _id: admin._id,
                userId: admin.userId,
                isActive: admin.isActive,
                signature: admin.signature,
                profileImage: admin.profileImage,
                token,
            }
            return apiResponse.OK({ res, message: messages.SUCCESS, data: data })
        }
    },


    signUp: async (req, res) => {
        try {
            if (await DB.USER.findOne({ email: req.body.email })) return apiResponse.BAD_REQUEST({ res, message: messages.EMAIL_ALREADY_EXISTS });
            if (await DB.USER.findOne({ name: req.body.name })) return apiResponse.BAD_REQUEST({ res, message: messages.NAME_ALREADY_EXISTS });

            let roleName = req.body.role === "super_admin" ? "super_admin" : "user";  //passing super_admin role for super admin
            const roleData = await DB.ROLE.findOne({ name: roleName }).lean();
            if (!roleData) return apiResponse.NOT_FOUND({ res, message: messages.INVALID_ROLE });

            const latestUser = await DB.USER.findOne({}, { userId: 1 }).sort({ userId: -1 });
            let userNumber = 1;

            if (latestUser.userId) {
                userNumber = parseInt(latestUser.userId) + 1;
            }
            const formattedUserId = userNumber.toString().padStart(6, '0');

            // const signatureImage = req.files['signature'][0].location;
            // const profileImage = req.files['profileImage'][0].location;

            // req.body.signature = signatureImage
            // req.body.profileImage = profileImage

            let signatureImage, profileImage;
            let vattenfallPatners;
            if (req.files) {
                if (req.files['signature'] && req.files['signature'][0]) {
                    signatureImage = req.files['signature'][0].location;
                    req.body.signature = signatureImage;
                }
                if (req.files['profileImage'] && req.files['profileImage'][0]) {
                    profileImage = req.files['profileImage'][0].location;
                    req.body.profileImage = profileImage;
                }
            }
            req.body.userId = formattedUserId;
            req.body.roleId = roleData._id;
            req.body.email = req.body.email.toLowerCase();
        
            console.log(req.body, "-----------------req.body----------------")

            await DB.USER.create(req.body);
            exports.signIn(req, res);
        } catch (error) {
            console.log(error, "--------error----------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR })
        }
    },


    forgot: async (req, res) => {

        const decoded = await utils.decodeToken(req.body.token);

        const isUserExists = await DB.USER.findOne({ _id: decoded._id, isActive: true }).populate("roleId", "name").lean();
        if (!isUserExists) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.USER.findOneAndUpdate({ _id: isUserExists._id }, { password: await helper.hashPassword({ password: req.body.password }) })
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },

    sendEmail: async (req, res) => {
        try {
            const isUserExists = await DB.USER.findOne({ email: req.body.email, isActive: true }).populate("roleId", "name").lean();
            if (!isUserExists) {
                return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
            }
            const token = helper.generateToken({ data: { _id: isUserExists._id, role: isUserExists.roleId.name } });
            if (isUserExists?.roleId?.name == "user" || isUserExists?.roleId?.name == "super_admin") {
                await EMAIL.forgetEmail({
                    to: isUserExists.email,
                    name: isUserExists.name,
                    subject: "Forgot password",
                    // link: `https://wepro-userpanel.netlify.app/auth/forgot-password?${token}`
                    link: `https://admin.wepro-deutschland.de/auth/forgot-password?${token}`
                })
                return apiResponse.OK({ res, message: "Email send succssecssfully" })
            }
            if (isUserExists.roleId.name == "admin") {
                return apiResponse.NOT_FOUND({ res, message: "Der Administrator kann das Passwort nicht ändern" })
            }
        } catch (error) {
            console.log(error, "--------------error---------->>")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR })
        }
    },


    verifyOtp: async (req, res) => {
        // if (Date.now() > await DB.OTP.findOne({ email: req.body.email, otp: req.body.otp }).expireAt) return apiResponse.BAD_REQUEST({ res, message: messages.OTP_EXPIRED });

        // const verify = await DB.OTP.findOneAndDelete({ email: req.body.email, otp: req.body.otp });
        // if (!verify) return apiResponse.BAD_REQUEST({ res, message: messages.INVALID_CREDS });

        // const user = await DB.USER.findOne({ email: req.body.email })
        // const token = helper.generateToken({ data: { _id: user._id, role: user.roleId.name } });
        const user = await DB.USER.findOne({ email: req.body.email }).populate("roleId", "name").lean();

        const getOtp = await DB.OTP.findOne({ email: req.body.email, otp: req.body.otp })
        if (!getOtp) {
            return apiResponse.BAD_REQUEST({ res, message: "invalid OTP" });
        }

        if (getOtp && getOtp.expireAt < Date.now()) {
            return apiResponse.BAD_REQUEST({ res, message: messages.OTP_EXPIRED });
        }
        const verify = await DB.OTP.findOneAndDelete({
            email: req.body.email,
            otp: req.body.otp,
        });
        if (!verify)
            return apiResponse.BAD_REQUEST({ res, message: messages.INVALID_CREDS });

        const token = helper.generateToken({ data: { _id: user._id, role: user.roleId.name } });

        return apiResponse.OK({
            res,
            message: messages.SUCCESS,
            data: {
                email: user.email,
                name: user.name,
                role: user.roleId.name,
                projectName: user.projectName,
                patners: user.patners,
                _id: user._id,
                userId: user.userId,
                isActive: user.isActive,
                token,
            },
        });
    },


    afterOtpVerify: async (req, res) => {
        const user = await DB.USER.findById(req.user._id);
        if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.USER.findByIdAndUpdate(req.user._id, { password: await helper.hashPassword({ password: req.body.password }) })
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },


    changePassword: async (req, res) => {
        const user = await DB.USER.findById(req.user._id);
        if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        if (!await helper.comparePassword({ password: req.body.oldPassword, hash: user.password })) return apiResponse.BAD_REQUEST({ res, message: messages.INVALID_PASSWORD });

        await DB.USER.findByIdAndUpdate(req.user._id, { password: await helper.hashPassword({ password: req.body.newPassword }) });
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },

    parkinglotownerupdate: async (req, res) => {
        try {
            console.log(req.body,"-----------------req.body----------------")
            const user = await DB.USER.findOne({ _id: req.query.id });
            if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

            let signatureImage, profileImage;
            if (req.files) {
                if (req.files['signature'] && req.files['signature'][0]) {
                    signatureImage = req.files['signature'][0].location;
                    req.body.signature = signatureImage;
                }
                if (req.files['profileImage'] && req.files['profileImage'][0]) {
                    profileImage = req.files['profileImage'][0].location;
                    req.body.profileImage = profileImage;
                }
            }
            // Validate and process `parkingplot`
        let validParkingplotIds = [];
        console.log("Received parkingplot:", req.body.parkingplot);

        if (req.body.parkingplot) {
            if (!Array.isArray(req.body.parkingplot)) {
                try {
                    req.body.parkingplot = JSON.parse(req.body.parkingplot); // Convert from string if needed
                } catch (error) {
                    return apiResponse.BAD_REQUEST({ res, message: "Invalid format for parkingplot" });
                }
            }

            validParkingplotIds = req.body.parkingplot.map(id => new ObjectId(id));

            // Ensure all provided IDs exist in `dahLocation`
            const locations = await DB.DAHLOCATION.find({ _id: { $in: validParkingplotIds } });

            if (locations.length !== validParkingplotIds.length) {
                return apiResponse.BAD_REQUEST({ res, message: "Some parkingplot locations are invalid" });
            }
        }

        let password
        if (req.body.password) {
            password = await DB.USER.findOneAndUpdate({ _id: user._id }, { $set: { password: await helper.hashPassword({ password: req.body.password }) } }, { new: true })
        }

        req.body.password = password?.password

        console.log("Valid parkingplot IDs:", validParkingplotIds);

        // Update user data
        const updatedUser = await DB.USER.findByIdAndUpdate(
            req.query.id,
            {
                $set: {
                    parkingplot: validParkingplotIds, 
                    name: req.body.name, 
                    vorname: req.body.vorname ,
                    nachname: req.body.nachname,
                    phone: req.body.phone,
                    password: req.body.password,
                }
            },
            { new: true }
        );

        return apiResponse.OK({ res, message: messages.SUCCESS, data: updatedUser });
        } catch (error) {
            console.log(error, "---------------error----------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR })
        }

    }, 


    update: async (req, res) => {
        try {
            console.log(req.body,"-----------------req.body----------------")
            const user = await DB.USER.findOne({ _id: req.query.id });
            if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

            // const signatureImage = req?.files['signature'][0].location;
            // const profileImage = req?.files['profileImage'][0].location;

            // req.body.signature = signatureImage
            // req.body.profileImage = profileImage
            let signatureImage, profileImage;
            if (req.files) {
                if (req.files['signature'] && req.files['signature'][0]) {
                    signatureImage = req.files['signature'][0].location;
                    req.body.signature = signatureImage;
                }
                if (req.files['profileImage'] && req.files['profileImage'][0]) {
                    profileImage = req.files['profileImage'][0].location;
                    req.body.profileImage = profileImage;
                }
            }
            let patners = [];
            let vattenfallPatners;
            if (req.body.patners == null || req.body.patners == "" || req.body.patners[0] === '') {
                patners = []
            } else {
                patners = req.body.patners
            }
            if (req.body.vattenfallPatners == null || req.body.vattenfallPatners == "" || req.body.vattenfallPatners[0] === '') {
                vattenfallPatners = []
            } else {
                vattenfallPatners = req.body.vattenfallPatners
            }
            // if (req.body.PLZ[0] === '') {
            //     req.body.PLZ = []
            // }
            if (!req.body.PLZ || !Array.isArray(req.body.PLZ) || req.body.PLZ[0] === '') {
                req.body.PLZ = [];
            } else {
                req.body.PLZ = req.body.PLZ.map(String); // Ensure all values are strings
            }
            req.body.patners = patners
            req.body.vattenfallPatners = vattenfallPatners
            let password
            if (req.body.password) {
                password = await DB.USER.findOneAndUpdate({ _id: user._id }, { $set: { password: await helper.hashPassword({ password: req.body.password }) } }, { new: true })
            }

            req.body.password = password?.password
            // if (await DB.USER.findOne({ _id: { $ne: user._id }, email: req.body.email }).lean()) return apiResponse.DUPLICATE_VALUE({ res, message: messages.EMAIL_ALREADY_EXISTS });
            let data = await DB.USER.findOneAndUpdate({ _id: req.query.id }, req.body, { new: true });
            return apiResponse.OK({ res, message: messages.SUCCESS, data });
        } catch (error) {
            console.log(error, "---------------error----------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR })
        }
    },

    updateUserLead: async (req, res) => {
        try {
            let { user } = req;
            let id = req?.query?.id;

            if (id != user._id) {
                const find = await DB.USER.findOne({ _id: id });
                if (!find) {
                    return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });
                }

                const update = await DB.USER.findOneAndUpdate({ _id: find?._id }, { userLead: req?.body?.userLead }, { new: true });

                return apiResponse.OK({ res, message: messages.SUCCESS, data: update });
            } else {
                return apiResponse.BAD_REQUEST({ res, message: "Not update user Lead" });
            }

        } catch (error) {
            console.log(error, "-----------------error----------");
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    getParkingLotOwner: async (req, res) => {
        try {
            let { page, limit, sortBy, sortOrder, status, isActive, search, ...query } = req.query;
    
            if (search) {
                const searchRegex = new RegExp(search, "i");
                query.$or = [
                    { userId: searchRegex },
                    { name: searchRegex },
                    { email: searchRegex }
                ];
            }
    
            query.roleId = { $eq: ObjectId("67a1bc8589023cfdc71818b9") };
        
            if (typeof isActive !== "undefined") {
                query.isActive = isActive === "true";
            }
    
            let option = [
                { $match: query },
                {
                    $lookup: {
                        from: "role",
                        localField: "roleId",
                        foreignField: "_id",
                        as: "role"
                    }
                },
                { $unwind: { path: "$role", preserveNullAndEmptyArrays: true } },
    
                
                {
                    $lookup: {
                        from: "dahLocation",
                        localField: "parkingplot",
                        foreignField: "_id",
                        as: "parkingplotDetails"
                    }
                },
    
                // Project fields

                {
                    $project: {
                        name: 1,
                        email: 1,
                        vorname: 1,
                        nachname: 1,    
                        phone: 1,
                        isActive: 1,
                        role: 1,
                        parkingplotDetails: {
                            _id: 1,
                            name: 1 // 🏆 Get location name from dahLocation
                        }
                    }
                },
    
                // Sorting
                { $sort: { [sortBy || "name"]: sortOrder === "desc" ? -1 : 1 } }
            ];
    
            if (page && limit) {
                option.push({ $skip: (page - 1) * parseInt(limit) });
                option.push({ $limit: parseInt(limit) });
            }
    
            const data = await DB.USER.aggregate(option);
            const count = await DB.USER.countDocuments(query);
    
            return apiResponse.OK({ res, message: messages.SUCCESS, data: { data, count } });
        } catch (error) {
            console.log(error, "---------------error----------");
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },



    getUser: async (req, res) => {
        let { page, limit, sortBy, sortOrder, status, isActive, startDate, endDate, projectName, search, ...query } = req.query;

        // query = req.user.roleId.name === ADMIN ? { ...query } : { _id: req.user._id };
        // search ? query.$or = [{ name: { $regex: search, $options: "i" }}, {email: { $regex: search, $options: "i" }, userId: { $regex: search, $options: "i" } }] : "";
        if (search) {
            const searchRegex = new RegExp(search, "i");
            query.$or = [
                { userId: searchRegex },
                { name: searchRegex },
                { email: searchRegex }
            ];
        }
        query.roleId = { $eq: ObjectId("67319fbe77598d2c6af9ffea") }
        if (typeof isActive !== 'undefined') {
            query.isActive = isActive === true;
        }

        if (projectName) {
            query.projectName = projectName
        }

        if (startDate && endDate) {
            const endDateObject = new Date(endDate);
            endDateObject.setDate(endDateObject.getDate() + 1);
            query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDateObject) };
        }

        if (status === 'null') {
            status = null;
        }

        const straperPipeline = [
            { $match: status ? { status: status } : {} }
        ];

        // const data = await DB.USER
        //     .find(query)
        //     .skip((page - 1) * limit)
        //     .limit(limit)
        //     .sort({ [sortBy]: sortOrder })
        //     .populate("roleId", "name")
        //     .populate("patners", "name")
        //     .lean();

        let option = [
            {
                $match: query
            },
            {
                $lookup: {
                    from: "straper",
                    let: { userId: "$_id" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$benutzerId", "$$userId"] } } },
                        ...straperPipeline
                    ],
                    as: "straper"
                }
            },
            {
                $lookup: {
                    from: "role",
                    localField: "roleId",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: { name: 1 },
                        },
                    ],
                    as: "roleId"
                }
            },
            {
                $unwind: {
                    path: "$roleId",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "user",
                    localField: "patners",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: { name: 1 },
                        },
                    ],
                    as: "patners"
                }
            },
            {
                $lookup: {
                    from: "user",
                    localField: "vattenfallPatners",
                    foreignField: "_id",
                    pipeline: [
                        {
                            $project: { name: 1 },
                        },
                    ],
                    as: "vattenfallPatners"
                }
            },
            {
                $lookup: {
                    from: "dahLocation",
                    localField: "parkingLocation",
                    foreignField: "_id",
                    as: "parkingLocation"
                }
            },
            {
                $lookup: {
                    from: "postalCode",
                    localField: "PLZ",
                    foreignField: "_id",
                    as: "PLZ"
                }
            },
            {
                $addFields: {
                    straperCount: { $size: "$straper" }
                }
            },
            {
                $project: { straper: 0 }
            },
            {
                $sort: { [sortBy]: sortOrder }
            },
        ];

        if (page) {
            option.push({ $skip: (page - 1) * limit });
        }

        if (limit) {    
            option.push({ $limit: limit });
        }

        const data = await DB.USER.aggregate(option);

        return apiResponse.OK({ res, message: messages.SUCCESS, data: { data, count: await DB.USER.countDocuments(query) } });
    },

    getUserPatners: async (req, res) => {
        try {
            let { user } = req;

            const findUser = await DB.USER.find({ patners: user._id });

            let data = [];
            for (let i = 0; i < findUser.length; i++) {
                const element = findUser[i];

                let obj = {
                    name: element.name,
                    _id: element._id
                };
                data.push(obj)

            }
            return apiResponse.OK({ res, message: messages.SUCCESS, data: data });

        } catch (error) {
            console.log(error, "--------------error-------------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    getVattUserPatners: async (req, res) => {
        try {
            let { user } = req;

            const findUser = await DB.USER.find({ vattenfallPatners: user._id });

            let data = [];
            for (let i = 0; i < findUser.length; i++) {
                const element = findUser[i];

                let obj = {
                    name: element.name,
                    _id: element._id
                };
                data.push(obj)

            }
            return apiResponse.OK({ res, message: messages.SUCCESS, data: data });

        } catch (error) {
            console.log(error, "--------------error-------------")
            return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
        }
    },

    deleteUser: async (req, res) => {
        const user = await DB.USER.findOne({ _id: req.query.id });
        if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.USER.findOneAndUpdate({ _id: req.query.id }, { $set: { isActive: false } }, { new: true });
        return apiResponse.OK({ res, message: messages.SUCCESS })
    },


    dashboardCounts: async (req, res) => {
        const data = {
            // contectCount: await DB.CONTECT.countDocuments({ isActive: true }),
            // inquiryCount: await DB.INQUIRY.countDocuments({ isActive: true }),
            // newsLaterCount: await DB.NEWSLATER.countDocuments({ isActive: true }),
            // staper2Count: await DB.STAPER2.countDocuments({ isActive: true }),
            // projectCount: await DB.PROJECT.countDocuments({ isActive: true }),
            // vattenfallPromoCount: await DB.VATTENFALL.countDocuments({ isActive: true, funnel_type: "vattenfallPromo" }),

            staperCount: await DB.STAPER.countDocuments({ isActive: true }),
            userCount: await DB.USER.countDocuments({ roleId: ObjectId("67319fbe77598d2c6af9ffea"), isActive: true }),
            vattenfallCount: await DB.VATTENFALL.countDocuments({ isActive: true, funnel_type: "vattenfall" }),
            vattenfallMesseCount: await DB.VATTENFALL.countDocuments({ isActive: true, funnel_type: "vattenfall-messe" }),
        }
        return apiResponse.OK({ res, message: messages.SUCCESS, data });
    },


    delete: async (req, res) => {
        const user = await DB.USER.findById(req.params._id);
        if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.USER.findByIdAndUpdate(req.params._id, { isActive: { $ne: user.isActive } }, { new: true });
        return apiResponse.OK({ res, message: messages.SUCCESS });
    },


    uploadImage: async (req, res) => {

        let { user } = req;
        let data = req.file;

        const update = await DB.USER.findOneAndUpdate({ _id: user._id }, { $set: { photo: "http://localhost:4001/uploads/" + data.filename } }, { new: true })
        // const update = await DB.USER.findOneAndUpdate({ _id: user._id }, { $set: { photo: data.path }}, {new: true})

        return apiResponse.OK({
            res,
            message: "image upload succsscefully",
            data: update
        })

    },

    reactivateUser: async (req, res) => {
        const user = await DB.USER.findOne({ _id: req.query.id });
        if (!user) return apiResponse.NOT_FOUND({ res, message: messages.NOT_FOUND });

        await DB.USER.findOneAndUpdate({ _id: req.query.id }, { $set: { isActive: true } }, { new: true });
        return apiResponse.OK({ res, message: "User active successfully" });
    },

    getUsersExclAdmin: async (req, res) => {
        try {
            const excludedRoleId = '67319fb677598d2c6af9ffe7';
            const usersQuery = DB.USER.find({ roleId: { $ne: excludedRoleId }, isActive: true }).select("name email userId").lean();
            
            const users = await usersQuery;
            const totalCount = await DB.USER.countDocuments({ roleId: { $ne: excludedRoleId }, isActive: true });
    
            if (users.length === 0) {
                return apiResponse.NOT_FOUND({ res, message: messages.NO_USERS_FOUND });
            }
    
            return apiResponse.OK({ res, data: { users, totalCount } });
        } catch (error) {
            return apiResponse.INTERNAL_SERVER_ERROR({ res, message: messages.SERVER_ERROR });
        }
    },


};
