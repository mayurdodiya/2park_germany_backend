const express = require("express");
const router = express.Router();

const {
  DAHUA_BOOKED_PLATES: { APIS, VALIDATOR },
} = require("../controllers");

router.post("/createBooking", VALIDATOR.createBooking, APIS.createBooking);
router.post("/capturePayment", VALIDATOR.capturePayment, APIS.capturePayment);

router.post("/extendBooking", APIS.extendBooking);
router.get("/getBookingLocationWithRate", APIS.getBookingLocationWithRate);
router.get("/getAllBookings", APIS.getAllBookings);
router.get("/getBooking", VALIDATOR.getBooking, APIS.getBooking);
router.get("/getExtendedBookings", APIS.getExtendedBookings);
router.post("/webhook", APIS.webhook);

module.exports = router;

// webhook example
// https://ef0f-2405-201-200d-115e-ed9d-5ff6-b4f1-a328.ngrok-free.app/api/v1/dahuaBookingPlates/webhook
