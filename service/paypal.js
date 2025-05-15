const axios = require("axios");
const fs = require("fs");
const { logger } = require("../utils/logger");
const paypal = require("@paypal/paypal-server-sdk");

const PAYPAL_URL = process.env.PAYPAL_LIVE_URL;

// generate paypal access token
async function generatePaypalAccessToken() {
  const response = await axios({
    url: PAYPAL_URL + "/v1/oauth2/token",
    method: "post",
    data: "grant_type=client_credentials",
    auth: {
      username: process.env.PAYPAL_CLIENT_ID,
      password: process.env.PAYPAL_CLIENT_SECRET,
    },
  });

  return response.data.access_token;
}

module.exports = {
  // generate paypal access token
  generatePaypalAccessToken: async () => {
    const response = await axios({
      url: PAYPAL_URL + "/v1/oauth2/token",
      method: "post",
      data: "grant_type=client_credentials",
      auth: {
        username: process.env.PAYPAL_CLIENT_ID,
        password: process.env.PAYPAL_CLIENT_SECRET,
      },
    });
    return response.data.access_token;
  },

  // paypal one time payment
  paypalOneTimePayment: async ({ bookingId, plateNumber, telephone, email, totalFare }) => {
    try {
      console.log(process.env.PAYPAL_CLIENT_ID, "----------------------------- process.env.PAYPAL_CLIENT_ID");
      console.log(process.env.PAYPAL_CLIENT_SECRET, "----------------------------- process.env.PAYPAL_CLIENT_SECRET");
      const accessToken = await generatePaypalAccessToken();
      console.log(accessToken, "----------------------------- accessToken");

      const url = `${PAYPAL_URL}/v2/checkout/orders`;
      console.log(url, "----------------------------- url");
      const payload = {
        intent: "CAPTURE",
        purchase_units: [
          {
            items: [
              {
                name: "Parking Rent",
                description: "Parking booking for rent",
                quantity: 1,
                unit_amount: {
                  currency_code: "EUR",
                  value: totalFare,
                },
              },
            ],
            amount: {
              currency_code: "EUR",
              value: totalFare,
              breakdown: {
                item_total: {
                  currency_code: "EUR",
                  value: totalFare,
                },
              },
            },
            custom_id: JSON.stringify({
              bookingId: bookingId,
              plateNumber: plateNumber,
              telephone: telephone,
              email: email,
              totalFare: totalFare,
            }),
          },
        ],
        application_context: {
          cancel_url: process.env.CANCEL_URL, // redirect on cancel
          return_url: `${process.env.VERIFIYING_URL}?bookingId=${bookingId}`, // redirect after approval
          user_action: "PAY_NOW",
          brand_name: "2Park GmbH",
          landing_page: "BILLING",
          shipping_preference: "GET_FROM_FILE", // Force PayPal to collect address
          // shipping_preference: "NO_SHIPPING", // GET_FROM_FILE // SET_PROVIDED_ADDRESS
          // landing_page: "LOGIN",  //  check in docs "LOGIN" (default) or "BILLING" (shows credit card form)
        },
      };
      console.log(payload, "----------------------------- payload");
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log(response.data, "------------------------- paypalOneTimePayment paypal.js");
      const approvedLink = response?.data?.links.find((link) => link.rel === "approve").href;
      return approvedLink;
    } catch (error) {
      logger.error("Error in paypalOneTimePayment", error);
      throw error;
    }
  },

  // capture payment manually
  capturePayment: async (data) => {
    try {
      const url = `${PAYPAL_URL}/v2/checkout/orders/${data.orderId}/capture`;
      const accessToken = await generatePaypalAccessToken();
      const captureResponse = await axios({
        url: url,
        method: "post",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          orderId: data.orderId,
          bookingId: data.bookingId,
        },
      });
      return captureResponse;
    } catch (error) {
      throw error;
    }
  },

  // get orderdetail
  payerData: async (data) => {
    try {
      const orderId = data.orderId;
      console.log(orderId, "-------------------------------- orderId payerData function");

      const url = `${PAYPAL_URL}/v2/checkout/orders/${orderId}`;
      console.log(url, "-------------------------------- url payerData function");
      const accessToken = await generatePaypalAccessToken();
      const userData = await axios({
        url: url,
        method: "get",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log(userData.data, " -------------------------------- address final response payerData function");
      console.log(userData.data.purchase_units[0], " -------------------------------- purchase_units final response payerData function");
      console.log(userData.data.purchase_units[0]?.payments, " -------------------------------- payments purchase_units final response payerData function");
      console.log(userData.data.payment_source?.paypal, " -------------------------------- payments paypal purchase_units final response payerData function xyz");
      console.log(userData.data.payment_source?.paypal?.name, " -------------------------------- payments paypal purchase_units final response payerData function abc");
      console.log(userData.data.purchase_units[0]?.payments[0]?.seller_protection, " -------------------------------- payments purchase_units final response payerData function");
      console.log(userData.data.purchase_units[0].shipping.address, " -------------------------------- address final response payerData function");

      return userData.data.purchase_units[0].shipping.address;
    } catch (error) {
      console.log(error);
      throw error;
    }
  },
};
