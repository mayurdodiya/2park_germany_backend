const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const { logger } = require("../../utils/logger");
const moment = require("moment");
const { PAYMENT_STATUS } = require("../../json/enums.json");
const paypalService = require("../../service/paypal.js");
const EMAIL = require("../../service/mail.service");
const commonServices = require("../../service/common.js");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const pdfServices = require("../../service/pdf.js");
const s3Services = require("../../service/s3.upload.js");

const PAYPAL_URL = process.env.PAYPAL_LIVE_URL;

module.exports = {
  getBookingLocationWithRate: async (req, res) => {
    try {
      let { pincode } = req.query;
      if (!pincode) {
        return apiResponse.BAD_REQUEST({ res, message: "Pincode is required" });
      }
      let location = await DB.DAHLOCATION.findOne({ pincode });
      if (!location || location.enabled) {
        return apiResponse.BAD_REQUEST({ res, message: "Dieser Standort ist derzeit nicht verfügbar." });
      }

      if (!location) {
        return apiResponse.NOT_FOUND({ res, message: "Die eingegebene PIN ist ungültig - die 5-stellige PIN ist rechts neben dem QR-Code zu finden" }); //Location not found for the given pincode
      }

      return apiResponse.OK({
        res,
        message: messages.SUCCESS,
        data: {
          locationId: location._id,
          hourlyRate: location.hourlyRate,
          GrtVehicleRate: location.GrtVehicleRate,
          location: location.name,
        },
      });
    } catch (error) {
      logger.error("Error in getBookingLocationWithRate", error);
      return apiResponse.CATCH_ERROR({ res, message: error.message });
    }
  },

  createBooking: async (req, res) => {
    try {
      let { plateNumber, locationId, vehicleSize, name, nachname, strabe, email, PLZ, Stadt, telephone, fromTime, toTime, totalDuration, totalFare } = req.body;
      const bookingId = req.query.bookingId;
      const formattedPlateNumber = plateNumber ? plateNumber.toUpperCase() : null;
      let savedBooking = {};

      if (!bookingId) {
        // Check for overlapping bookings
        const overlappingBooking = await DB.DAHBOOKEDPLATE.findOne({
          plateNumber: formattedPlateNumber,
          locationId,
          $or: [
            { fromTime: { $lt: toTime }, toTime: { $gt: fromTime } }, // Checks for time overlap
          ],
        });

        if (overlappingBooking) {
          return apiResponse.BAD_REQUEST({ res, message: "Für dieses Kennzeichen besteht bereits eine Buchung zu dieser Zei." }); //Booking already exists for this vehicle at this location during this time
        }

        let booking = new DB.DAHBOOKEDPLATE({
          plateNumber: formattedPlateNumber,
          locationId,
          vehicleSize,
          name,
          nachname,
          email,
          // PLZ,
          // Stadt,
          // strabe,
          telephone,
          fromTime,
          toTime,
          totalDuration,
          totalFare,
          extended: false,
          paymentStatus: PAYMENT_STATUS.PENDING,
          paymentId: null,
        });

        let bookingSave = await booking.save();
        savedBooking = bookingSave.toObject();
      } else {
        savedBooking = await DB.DAHBOOKEDPLATE.findById(bookingId).lean();
      }
      console.log(savedBooking, "------------------------------- savedBooking");
      // generate onetime paypal payment link
      if (Object.keys(savedBooking).length > 0) {
        const generatePaymentLink = await paypalService.paypalOneTimePayment({
          bookingId: savedBooking._id,
          plateNumber: savedBooking.plateNumber,
          telephone: savedBooking.telephone,
          email: savedBooking.email,
          totalFare: savedBooking.totalFare,
        });
        savedBooking = { ...savedBooking, paymentLink: generatePaymentLink ? generatePaymentLink : "" };
        console.log(generatePaymentLink, "------------------------------- generatePaymentLink");
      }
      return apiResponse.OK({ res, message: "Die Buchung wurde erfolgreich durchgeführt", data: { savedBooking } }); //Booking created successfully
    } catch (error) {
      logger.error("Error in createBooking", error);
      return apiResponse.CATCH_ERROR({ res, message: error.message });
    }
  },

  // capture payment manually ( order sent by paypal as token)
  capturePayment: async (req, res) => {
    try {
      const orderId = req.query.token; // get order id as token which is directly set in query by paypal
      const bookingId = req.query.bookingId;

      if (orderId) {
        const url = `${PAYPAL_URL}/v2/checkout/orders/${orderId}/capture`;
        const accessToken = await paypalService.generatePaypalAccessToken();
        const captureResponse = await axios({
          url: url,
          method: "post",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: {
            orderId: orderId,
            bookingId: bookingId,
          },
        });
        console.log(captureResponse.data, "------------------------- captureResponse capturePayment api");
        console.log(captureResponse?.data?.purchase_units[0], "------------------------- captureResponse?.data?.purchase_units[0] capturePayment api");
        console.log(captureResponse?.data?.purchase_units[0]?.payments, "------------------------- captureResponse?.data?.purchase_units[0] capturePayment api");

        await DB.PAYMENT.findOneAndUpdate(
          { bookingId: bookingId },
          {
            $set: {
              bookingId: bookingId,
              payer: captureResponse?.data?.payer ?? {},
              amount: captureResponse?.data?.purchase_units[0]?.payments?.captures[0].amount ?? {}, // get from capture response    ==> check pending
              paypalOrderId: orderId,
              paypalTransactionId: captureResponse?.id ?? "",
              paymentStatus: PAYMENT_STATUS.PENDING, // waiting for confirmation from webhook
            },
          },
          { upsert: true, new: true }
        );
        return apiResponse.OK({ res, message: "payment capturing in progress" });
      } else {
        logger.error("orderId not found");
        return apiResponse.BAD_REQUEST({ res, message: "orderId not found." }); // orderId not found
      }
    } catch (error) {
      console.log(error, "----------------------------");
      logger.error("Error in capturePayment", error);
      return apiResponse.CATCH_ERROR({ res, message: error.message });
    }
  },

  // paypal webhook
  webhook: async (req, res) => {
    try {
      const event = req.body;
      console.log(event.event_type, "----------------------------- event type");
      console.log(event, "-------------------------------------- event");

      if (event.event_type === "PAYMENT.CAPTURE.COMPLETED" || event.event_type === "PAYMENT.CAPTURE.PENDING") {
        let data = event?.resource?.custom_id;
        console.log(event?.resource, "------------------------- webhook metadata capture completed webhook");
        console.log(event?.resource?.purchase_units, "------------------------- purchase_units capture completed webhook");
        console.log(event?.resource?.payment_source, "--------------------------------- payment_source");

        console.log(event?.resource?.payer, "--------------------------------- payer");

        if (data) {
          data = JSON.parse(data);
          console.log(data, "------------------------- webhook metadata capture completed webhook");

          // get payer address from paypal
          // const findOrderId = await DB.PAYMENT.findOne({ bookingId: data.bookingId }).lean();
          // console.log(findOrderId, "------------------------- findOrderId capture completed webhook");
          // const orderId = findOrderId?.paypalOrderId;
          const orderId = event?.resource?.supplementary_data?.related_ids?.order_id;
          const address = await paypalService.payerData({ orderId: orderId });

          // save booking payment data in db
          const payment = await DB.PAYMENT.findOneAndUpdate(
            { bookingId: data.bookingId },
            {
              $set: {
                paypalOrderId: orderId || "",
                paymentStatus: PAYMENT_STATUS.PAID,
                seller_receivable_breakdown: event?.resource?.seller_receivable_breakdown ?? {},
                paypalTransactionId: event?.resource?.id ?? "",
                merchant: event?.resource?.payee ?? {},
              },
            },
            { new: true }
          );
          await DB.DAHBOOKEDPLATE.findOneAndUpdate(
            { _id: data.bookingId },
            {
              $set: {
                paymentStatus: PAYMENT_STATUS.PAID,
                paymentId: payment._id,
                PLZ: address?.postal_code ? parseInt(address?.postal_code) : 0,
                Stadt: address?.admin_area_2 ? address?.admin_area_2 : "",
                strabe: address?.address_line_1 ? address?.address_line_1 : "",
              },
            }
          );
          res.status(200).send("OK");

          // send confirmation mail and pdf
          if (data.bookingId) {
            const bookingData = await DB.DAHBOOKEDPLATE.findById(data.bookingId).populate("locationId", "name");

            if (bookingData) {
              // find latest invoice number and file name
              const [finalInvoiceNumber, pdfFileName] = await commonServices.latestInvoiceNumber(); // new

              // create pdf and save in local dir
              const pdfBuffer = await pdfServices.createBookingConfirmationPdf({
                name: bookingData?.name ?? "",
                surname: bookingData?.nachname ?? "",
                address: bookingData?.strabe ?? "",
                zip: bookingData?.PLZ ?? "",
                town: bookingData?.Stadt ?? "",
                invoiceNumber: finalInvoiceNumber ?? "-",
                currentDate: moment(new Date()).format("DD.MM.YYYY"),
                parkingLotName: bookingData?.locationId?.name,
                startTime: moment(bookingData?.fromTime).format("DD.MM.YYYY"),
                endTime: moment(bookingData?.toTime).format("DD.MM.YYYY"),
                netAmount: commonServices.formatGermanCurrency(bookingData?.totalFare - bookingData?.totalFare * 0.19),
                charge19: commonServices.formatGermanCurrency(bookingData?.totalFare * 0.19),
                totalAmountPaid: commonServices.formatGermanCurrency(bookingData?.totalFare),
                paymentMethod: "PayPal",
                pdfFileName: pdfFileName,
              });

              // send mail and store pdf in S3
              const [, s3Url] = await Promise.all([
                // send booking confirmation mail with generated pdf
                EMAIL.paymentConfirmationEmail({
                  receiverEmail: bookingData?.email,
                  subject: "2Park | Buchungsbestätigung",
                  name: bookingData?.name,
                  surname: bookingData?.nachname,
                  locationName: bookingData?.locationId?.name,
                  rentalStart: moment(bookingData?.fromTime)
                    .add(60 - moment(bookingData?.fromTime).seconds(), "seconds")
                    .format("DD.MM.YYYY HH:mm [Uhr]"),
                  rentalEnd: moment(bookingData?.toTime)
                    .add(60 - moment(bookingData?.toTime).seconds(), "seconds")
                    .format("DD.MM.YYYY HH:mm [Uhr]"),
                  licensePlate: bookingData?.plateNumber,
                  year: moment(bookingData?.toTime).format("YYYY"),
                  text: "2Park | Buchungsbestätigung",
                  pdfFileName: pdfFileName,
                  pdfBuffer: pdfBuffer,
                }),
                // store pdf in s3 bucket
                s3Services.uploadLocalPdfToS3({ pdfBuffer, pdfFileName }),
              ]);

              // save url in db
              await DB.DAHBOOKEDPLATE.findOneAndUpdate(
                { _id: data.bookingId },
                {
                  $set: {
                    invoiceUrl: s3Url ?? "",
                  },
                }
              );

              // remove file from root dir
              // commonServices.removeRootDirFile(pdfFileName);
            }
            logger.info("✅ mail and pdf successfully sent from webhook and stored in s3!");
          }
        }
      } else if (event.event_type === "CHECKOUT.ORDER.DECLINED" || event.event_type === "PAYMENT.ORDER.CANCELLED" || event.event_type === "PAYMENT.CAPTURE.DENIED" || event.event_type === "PAYMENT.CAPTURE.DECLINED") {
        let data = event?.resource?.custom_id;
        if (data) {
          data = JSON.parse(data);
          console.log(data, "------------------------- metadata failed webhook");

          const findOrderId = await DB.PAYMENT.findOne({ bookingId: data.bookingId }).lean();
          console.log(findOrderId, "------------------------- findOrderId failed webhook");

          let address = "";
          let orderId = "";
          if (findOrderId) {
            orderId = findOrderId?.paypalOrderId;
            address = await paypalService.payerData({ orderId: orderId });
          }
          console.log(address, "-------------------------------- address failed webhook");

          // save booking payment data in db
          const payment = await DB.PAYMENT.findOneAndUpdate(
            { bookingId: data.bookingId },
            {
              $set: {
                bookingId: data.bookingId,
                paypalOrderId: orderId,
                paymentStatus: PAYMENT_STATUS.FAILED,
                seller_receivable_breakdown: {},
                merchant: event?.resource?.payee ?? {},
                paypalTransactionId: event?.resource?.id ?? "",
              },
            },
            { upsert: true, new: true }
          );
          await DB.DAHBOOKEDPLATE.findOneAndUpdate(
            { _id: data.bookingId },
            {
              $set: {
                paymentStatus: PAYMENT_STATUS.FAILED,
                paymentId: payment._id,
                PLZ: address?.postal_code ? parseInt(address?.postal_code) : 0,
                Stadt: address?.admin_area_2 ?? "",
                strabe: address?.address_line_1 ?? "",
              },
            }
          );
          res.status(200).send("OK");
        }
      } else {
        logger.info("Unhandled Event :", event.event_type);
        res.status(200).send("OK");
      }
    } catch (error) {
      logger.error("Error in webhook", error);
      res.status(500).send("Something went wrong");
    }
  },

  // get booking by id
  getBooking: async (req, res) => {
    try {
      const bookingId = req.query.bookingId;
      if (!bookingId) {
        return apiResponse.BAD_REQUEST({ res, message: "bookingId is required" });
      }

      const booking = await DB.DAHBOOKEDPLATE.findById(bookingId);
      if (!booking) {
        return apiResponse.NOT_FOUND({ res, message: "Keine Buchungsdaten gefunden." }); // Booking data is not found
      }

      return apiResponse.OK({ res, message: "Buchungsdaten erfolgreich abgerufen.", data: booking }); // Booking data get successfully
    } catch (error) {
      logger.error("Error in getBooking", error);
      return apiResponse.CATCH_ERROR({ res, message: error.message });
    }
  },

  getAllBookings: async (req, res) => {
    try {
      let { page = 1, limit = 10 } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);
      const totalBookings = await DB.DAHBOOKEDPLATE.countDocuments();

      // Fetch all bookings and populate location details
      const bookings = await DB.DAHBOOKEDPLATE.find()
        .populate("locationId", "plateNumber name address PLZ Stadt telephone totalFare")
        .sort({ fromTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return apiResponse.OK({
        res,
        message: "All bookings fetched successfully",
        data: {
          bookings,
          currentPage: page,
          totalPages: Math.ceil(totalBookings / limit),
          totalBookings,
        },
      });
    } catch (error) {
      logger.error("Error in getAllBookings", error);
      return apiResponse.CATCH_ERROR({ res, message: error.message });
    }
  },

  //   extendBooking: async (req, res) => {
  //     try {
  //         console.log("req.body", req.body);
  //         let { plateNumber } = req.body;

  //         if (!plateNumber) {
  //             return apiResponse.BAD_REQUEST({ res, message: "Plate number is required" });
  //         }

  //         const formattedPlateNumber = plateNumber.toUpperCase();

  //         // Find the latest booking for this plate number
  //         let existingBooking = await DB.DAHBOOKEDPLATE.findOne({
  //             plateNumber: formattedPlateNumber
  //         }).sort({ toTime: -1 }); // Get the most recent booking

  //         // If no existing booking, check if there's an event for today
  //         if (!existingBooking) {
  //             let todayStart = new Date();
  //             todayStart.setHours(0, 0, 0, 0);

  //             let todayEnd = new Date();
  //             todayEnd.setHours(23, 59, 59, 999);

  //             let vehicleEvent = await DB.DAHEVENT.findOne({
  //                 plateNumber: formattedPlateNumber,
  //                 eventDate: { $gte: todayStart, $lt: todayEnd } // Event should be today
  //             });

  //             if (!vehicleEvent) {
  //                 return apiResponse.BAD_REQUEST({
  //                     res,
  //                     message: "Für dieses Kennzeichen wurde keine bestehende Buchung gefunden. Es können nur bestehende Buchungen verlängert werden, es sei denn, es liegt heute eine Veranstaltung vor."
  //                 });
  //             }   //No existing booking was found for this license plate. Only existing bookings can be extended, unless there is an event today.

  //             // If an event exists, use its `locationId`
  //             existingBooking = {
  //                 plateNumber: formattedPlateNumber,
  //                 locationId: vehicleEvent.locationId,
  //                 vehicleSize: vehicleEvent.vehicleSize || "<=5m", // Default if missing
  //                 name: vehicleEvent.name || "Unknown",
  //                 nachname: vehicleEvent.nachname || "Unknown",
  //                 strabe: vehicleEvent.strabe || "Unknown",
  //                 email: vehicleEvent.email || "Unknown",
  //                 telephone: vehicleEvent.telephone || "Unknown",
  //                 fromTime: todayStart,
  //                 toTime: todayEnd,
  //                 totalFare: 0 // Will calculate below
  //             };
  //         }

  //         // Check if an extension already exists for today
  //         let todayStart = new Date(existingBooking.toTime);
  //         todayStart.setHours(0, 0, 0, 0);
  //         let todayEnd = new Date(existingBooking.toTime);
  //         todayEnd.setHours(23, 59, 59, 999);

  //         const existingExtendedBooking = await DB.DAHEXTENDEDPLATE.findOne({
  //             plateNumber: formattedPlateNumber,
  //             fromTime: { $gte: todayStart, $lt: todayEnd }
  //         });

  //         if (existingExtendedBooking) {
  //             return apiResponse.BAD_REQUEST({
  //                 res,
  //                 message: "An extension for this plate number already exists on the same date."
  //             });
  //         }

  //         // // Fetch hourly rate from DAHLocation
  //         // let location = await DB.DAHLOCATION.findById(existingBooking.locationId);
  //         // if (!location || !location.hourlyRate) {
  //         //     return apiResponse.BAD_REQUEST({
  //         //         res,
  //         //         message: "Hourly rate not found for the location."
  //         //     });
  //         // }

  //         // let hourlyRate = location.hourlyRate; // Fetch hourly rate

  //         // Calculate new extended time (till midnight)
  //         let extendedToTime = new Date(existingBooking.toTime);
  //         extendedToTime.setUTCHours(23, 59, 59, 999);

  //          let totalHours = Math.ceil((extendedToTime - existingBooking.toTime) / (1000 * 60 * 60)); // Convert to hours
  //         // let totalFare = totalHours * hourlyRate; // Calculate fare

  //         // Mark existing booking as extended
  //         if (existingBooking._id) {
  //             await DB.DAHBOOKEDPLATE.updateOne(
  //                 { _id: existingBooking._id },
  //                 { $set: { extended: true } }
  //             );
  //         }

  //         // Create new entry in DAHEXTENDEDPLATE
  //         let extendedBooking = new DB.DAHEXTENDEDPLATE({
  //             plateNumber: formattedPlateNumber,
  //             locationId: existingBooking.locationId,
  //             vehicleSize: existingBooking.vehicleSize || "<=5m",
  //             name: existingBooking.name,
  //             nachname: existingBooking.nachname,
  //             strabe: existingBooking.strabe,
  //             email: existingBooking.email,
  //             telephone: existingBooking.telephone,
  //             fromTime: existingBooking.toTime,
  //             toTime: extendedToTime,
  //             totalDuration: totalHours,

  //         });

  //         await extendedBooking.save();

  //         return apiResponse.OK({
  //             res,
  //             message: "Booking extended successfully",
  //             data: { extendedBooking }
  //         });

  //     } catch (error) {
  //         console.error("Error in extendBooking", error);
  //         return apiResponse.CATCH_ERROR({ res, message: "Internal server error" });
  //     }
  // },

  extendBooking: async (req, res) => {
    try {
      console.log("req.body", req.body);
      let { plateNumber } = req.body;

      if (!plateNumber) {
        return apiResponse.BAD_REQUEST({ res, message: "Plate number is required" });
      }

      const formattedPlateNumber = plateNumber.toUpperCase();

      // Find the latest event for this plateNumber
      let vehicleEvent = await DB.DAHEVENT.findOne({
        plateNumber: formattedPlateNumber,
      }).sort({ entryTime: -1 }); // Get the latest entry

      if (!vehicleEvent) {
        return apiResponse.BAD_REQUEST({
          res,
          message: "Erfolg - Du bist für diesen Parkvorgang freigeschaltet.", //no event tfound for this plate number
        });
      }

      // Fetch location details to check ExtendVehicleTime
      let location = await DB.DAHLOCATION.findById(vehicleEvent.locationId);
      if (!location || location.ExtendVehicleTime === undefined) {
        return apiResponse.BAD_REQUEST({
          res,
          message: "ExtendVehicleTime not found for the location.",
        });
      }

      let extendMinutes = location.ExtendVehicleTime; // Time in minutes
      console.log("extendMinutes:", extendMinutes);

      // Set fromTime using moment (current API call time)
      let fromTime = moment().utc();

      // Set toTime based on extendMinutes
      let toTime;
      if (extendMinutes === 0 || extendMinutes === undefined) {
        // Extend to end of the day (UTC 23:59:59)
        toTime = moment().utc().endOf("day");
      } else {
        // Extend by given minutes
        toTime = moment(fromTime).add(extendMinutes, "minutes");
      }

      console.log("fromTime:", fromTime.toISOString());
      console.log("toTime:", toTime.toISOString());

      // Check if an extension already exists for this plate number
      const existingExtendedBooking = await DB.DAHEXTENDEDPLATE.findOne({
        plateNumber: formattedPlateNumber,
        fromTime: {
          $gte: moment().utc().startOf("day").toDate(),
          $lt: moment().utc().endOf("day").toDate(),
        },
      });

      if (existingExtendedBooking) {
        return apiResponse.BAD_REQUEST({
          res,
          message: "Eine Erweiterung für dieses Kennzeichen existiert bereits heute.", //extension for this plate number already exists today
        });
      }

      // Calculate total duration in hours
      let totalHours = (toTime - fromTime) / (1000 * 60 * 60); // Store float value
      console.log("totalHours", totalHours);

      // Create a new extended booking entry
      let extendedBooking = new DB.DAHEXTENDEDPLATE({
        plateNumber: formattedPlateNumber,
        locationId: vehicleEvent.locationId,
        vehicleSize: "<=5m",
        name: "Unknown",
        nachname: "Unknown",
        strabe: "Unknown",
        email: "Unknown",
        telephone: "Unknown",
        fromTime: fromTime.toDate(),
        toTime: toTime.toDate(),
        totalDuration: totalHours,
      });

      await extendedBooking.save();

      return apiResponse.OK({
        res,
        message: "Booking extended successfully",
        data: { extendedBooking, extendMinutes },
      });
    } catch (error) {
      console.error("Error in extendBooking", error);
      return apiResponse.CATCH_ERROR({ res, message: "Internal server error" });
    }
  },

  getExtendedBookings: async (req, res) => {
    try {
      let { page = 1, limit = 10 } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);
      const totalBookings = await DB.DAHEXTENDEDPLATE.countDocuments();

      // Fetch all bookings and populate location details
      const bookings = await DB.DAHEXTENDEDPLATE.find()
        .populate("locationId", "plateNumber fromTime toTime extendedOn")
        .sort({ extendedOn: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return apiResponse.OK({
        res,
        message: "All bookings fetched successfully",
        data: {
          bookings,
          currentPage: page,
          totalPages: Math.ceil(totalBookings / limit),
          totalBookings,
        },
      });
    } catch (error) {
      logger.error("Error in getAllBookings", error);
      return apiResponse.CATCH_ERROR({ res, message: "Internal server error" });
    }
  },

  // paypal old webhook
  webhookOLD: async (req, res) => {
    try {
      const event = req.body;

      if (event.event_type === "CHECKOUT.ORDER.APPROVED") {
        let data = event?.resource?.purchase_units[0]?.custom_id;
        const orderId = event?.resource?.id;

        if (data) {
          data = JSON.parse(data);

          await DB.PAYMENT.create({
            bookingId: data.bookingId,
            merchant: event?.resource?.purchase_units[0]?.payee ?? {},
            payer: event?.resource?.payer ?? {},
            amount: event?.resource?.purchase_units[0]?.amount ?? {},
            paypalOrderId: orderId,
            paymentStatus: PAYMENT_STATUS.PENDING, //  order created but payment capture pending
          });

          await paypalService.capturePayment({ orderId, bookingId: data.bookingId });
          res.status(200).send("OK");
        }
      } else if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        let data = event?.resource?.custom_id;

        if (data) {
          data = JSON.parse(data);
          const obj = {
            paypalOrderId: data.orderId,
            paymentStatus: PAYMENT_STATUS.PAID,
            seller_receivable_breakdown: event?.resource?.seller_receivable_breakdown ?? {},
            paypalTransactionId: event?.resource?.id ?? "",
          };

          // save booking payment data in db
          const payment = await DB.PAYMENT.findOneAndUpdate({ bookingId: data.bookingId }, { $set: { ...obj } }, { new: true });
          await DB.DAHBOOKEDPLATE.findOneAndUpdate({ _id: data.bookingId }, { $set: { paymentStatus: PAYMENT_STATUS.PAID, paymentId: payment._id } });
          res.status(200).send("OK");

          // send confirmation mail
          if (data.bookingId) {
            const bookingData = await DB.DAHBOOKEDPLATE.findById(data.bookingId);
            const getLocation = await DB.DAHLOCATION.findById(bookingData.locationId);

            if (bookingData) {
              const mailObj = {
                receiverEmail: bookingData.email,
                subject: "Buchungsbestätigung",
                name: bookingData.name,
                surname: bookingData.nachname,
                locationName: getLocation?.name,
                rentalStart: moment(bookingData.fromTime).format("YYYY-MM-DD HH:mm:ss"),
                rentalEnd: moment(bookingData.toTime).format("YYYY-MM-DD HH:mm:ss"),
                licensePlate: bookingData.plateNumber,
                year: moment(bookingData.toTime).format("YYYY"),
                text: "Buchungsbestätigung",
              };
              await EMAIL.commonEmail(mailObj);
            }
          }
        }
      } else if (event.event_type === "CHECKOUT.ORDER.DECLINED" || event.event_type === "PAYMENT.ORDER.CANCELLED" || event.event_type === "PAYMENT.CAPTURE.DENIED" || event.event_type === "PAYMENT.CAPTURE.DECLINED" || event.event_type === "PAYMENT.CAPTURE.PENDING") {
        let data = event?.resource?.custom_id;
        if (data) {
          data = JSON.parse(data);
          const obj = {
            paypalOrderId: data.orderId,
            paymentStatus: PAYMENT_STATUS.FAILED,
            paypalTransactionId: event?.resource?.id ?? "",
          };

          // save booking payment data in db
          const payment = await DB.PAYMENT.findOneAndUpdate({ bookingId: data.bookingId }, { $set: { ...obj } }, { new: true });
          await DB.DAHBOOKEDPLATE.findOneAndUpdate({ _id: data.bookingId }, { $set: { paymentStatus: PAYMENT_STATUS.FAILED, paymentId: payment._id } });
          res.status(200).send("OK");
        }
      } else {
        logger.info("Unhandled Event :", event.event_type);
        res.status(200).send("OK");
      }
    } catch (error) {
      logger.error("Error in webhook", error);
      res.status(500).send("Something went wrong");
    }
  },
};
