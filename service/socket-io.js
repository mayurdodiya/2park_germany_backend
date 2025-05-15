const utils = require("../utils/utils");
const ObjectId = require("mongodb").ObjectId;
const DB = require("../models");
const messages = require("../json/message.json");
const enums = require("../json/enums.json");
const moment = require("moment");



const setSocket = (io) => {
  global.io = io
    io.use(async (socket, next) => {
        try {
            let authorization = socket.handshake.headers["authorization"];
            if (authorization) {
                authorization = authorization.replace("Bearer ", "");

                let _user = await utils.decodeToken(authorization);

                if (!_user) {
                    next(null, false);
                }

                _user = await DB.USER.findOneAndUpdate({ _id: _user?._id, isActive: true }, { socketId: socket.id });

                if (!_user) return next(new Error(messages.INVALID_TOKEN));

                socket.authUser = _user;

                return next();
            }
        } catch (error) {
            console.log(error, ">>>>>>>>>>>>>")
        }
    });

    io.on("connection", async (socket) => {
        console.log("io-connection successfully🚀",socket.id)
        try {

            // socket.on("self-join", async (data) => {
            //   console.log("self-join", socket.authUser._id.toString());
            //   const findNoti = await DB.NOTIFICATION.countDocuments({ receiver: { $in: socket.authUser._id }, read: { $ne: socket.authUser._id } })

            //   socket.emit("notification", {
            //     success: true,
            //     message: "Notification receive",
            //     data: findNoti
            //   })
            //   socket.join(socket.authUser._id.toString());
            // });

            //* new
            socket.join(socket?.authUser?._id.toString());
            
            //* check-notification
            socket.on("check-notification", async () => {
              let unreadNotification = await DB.NOTIFICATION.countDocuments({ receiver: { $in: socket.authUser._id }, view: { $ne: socket.authUser._id } });
              console.log("check-notification", unreadNotification);
              socket.emit("check-notification", {
                success: true,
                message: "New notification",
                data: unreadNotification
              });
            });

            //* update-view-notification
            socket.on("update-notification", async () => {
              await DB.NOTIFICATION.updateMany({ receiver: { $in: socket.authUser._id }, view: { $ne: socket.authUser._id } }, { $push: { view: socket.authUser._id } });
              
              // await DB.NOTIFICATION.updateMany({ receiver: { $in: socket.authUser._id }, read: { $ne: socket.authUser._id } }, { $push: { read: socket.authUser._id } });

              let unreadNotification = await DB.NOTIFICATION.countDocuments({ receiver: { $in: socket.authUser._id }, view: { $ne: socket.authUser._id } });
              console.log("update-notification", unreadNotification);
              socket.emit("update-notification", {
                success: true,
                message: "Notification read",
                data: unreadNotification
              });
            });

            //* update-read-notification
            socket.on("update-read-notification", async (data) => {
              // await DB.NOTIFICATION.updateMany({ receiver: { $in: socket.authUser._id }, view: { $ne: socket.authUser._id } }, { $push: { view: socket.authUser._id } });
              
              let readNotification = await DB.NOTIFICATION.findOneAndUpdate({ _id: data.id, receiver: { $in: socket.authUser._id }, read: { $ne: socket.authUser._id } }, { $push: { read: socket.authUser._id } }, { new: true });

              const findUserNoti = await DB.NOTIFICATION.aggregate([
                {
                    $match: { _id: readNotification?._id }
                },
               
                {
                    $addFields: {
                        isRead: { $cond: { if: { $in: [socket.authUser._id, "$read"] }, then: true, else: false } },
                        isViewed: { $cond: { if: { $in: [socket.authUser._id, "$view"] }, then: true, else: false } },
                        isPinned: { $cond: { if: { $in: [socket.authUser._id, "$pin"] }, then: true, else: false } }
                    }
                },
            ])

              let unreadNotification = await DB.NOTIFICATION.countDocuments({ receiver: { $in: socket.authUser._id }, read: { $ne: socket.authUser._id } });
              let obj = {
                unreadNotification: unreadNotification,
                read: findUserNoti
              }
              console.log("update-read-notification", unreadNotification);
              socket.emit("update-read-notification", {
                success: true,
                message: "Notification read",
                data: obj
              });
            });

            //* check-new-lead
            socket.on("check-new-lead", async () => {
              let unreadNewLead = await DB.ASSIGNLEAD.countDocuments({ uid: { $in: socket.authUser._id }, status: "pending", conform: false, reject: false });
              console.log("check-new-lead", unreadNewLead);
              socket.emit("check-new-lead", {
                success: true,
                message: "New lead add",
                data: unreadNewLead
              });
            });

            

            //* delete notification
            // socket.on("delete-notification", async ({ notificationId }) => {
            //   await DB.NOTIFICATION.findOneAndUpdate({ _id: notificationId, receiver: { $in: socket.authUser._id }, view: { $ne: socket.authUser._id } },{ $pull: { view: socket.authUser._id, read: socket.authUser._id } });
            //   let unreadNotification = await DB.NOTIFICATION.countDocuments({ receiver: { $in: socket.authUser._id }, view: { $ne: socket.authUser._id }, read: { $ne: socket.authUser._id } });
            //   console.log("delete-notification", unreadNotification);
            //   socket.emit("delete-notification", { 
            //     success: true,
            //     message: "Delete notification",
            //     data: unreadNotification
            //   });
            // });

        } catch (error) {
            console.log("error : ", error);
            socket.emit("server-data", {
                success: false,
                message: "Something went wrong",
            });
        }
    })

    io.on("error", (err) => {
        console.log("socket err", err);
    });
}


module.exports = setSocket;