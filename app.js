require("dotenv").config();
require("express-async-errors");

const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const http = require("http");
const apiResponse = require("./utils/api.response");
const errorHandler = require("./middleware/error.handler");
require('./seeder')
const { STRAPER: { VALIDATOR, APIS } } = require("./controllers")


const app = express();
app.use(cors({ origin: "*" }));

app.use(logger("dev"));
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// const dahuaRoutes = require("./routes/dahua.routes");
app.use("/api/v1", require("./routes/index"));
app.use("/NotificationInfo", require("./routes/dahua.routes"));
app.get("/api/v1/statusupdate", VALIDATOR.statusupdate, APIS.statusupdate);

app.use((req, res) => apiResponse.NOT_FOUND({ res, message: "Oops! Looks like you're lost." }));


app.use(errorHandler);
module.exports = app;
