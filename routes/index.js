const app = require("express")();


app.get("/", (req, res) => res.send("Welcome to Xxxxx APIs!"));


app.use("/role", require("./role.routes"));
app.use("/user", require("./user.routes"));

app.use("/newsLater", require("./newsLater.routes"));
app.use("/inquiry", require("./inquiry.routes"));
// app.use("/contect", require("./contect.routes"));

// app.use("/straper2", require("./straper2.routes"));
app.use("/straper", require("./straper.routes"));
app.use("/project", require("./project.routes"));
app.use("/notification", require("./notification.routes"));
app.use("/dateSelect", require("./dateSelect.routes"));
app.use("/vattenfall", require("./vattenfall.routes"));
app.use("/document", require("./document.routes"));
app.use("/video", require("./video.routes"));
app.use("/description", require("./description.routes"));
app.use("/dahuadevice", require("./dahua_device.routes"));
app.use("/dahualocation", require("./dahua_location.routes"));
app.use("/dahuaAuthPlates", require("./dahua_auth_plates.routes"));
app.use("/dahuaBookingPlates", require("./dahua_booking_plate.routes"));
app.use("/dashboard", require("./dashboard.routes"))

module.exports = app;