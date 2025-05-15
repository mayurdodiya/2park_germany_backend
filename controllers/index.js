const { DESCRIPTION } = require("../models/index.js");

module.exports = {
  ROLE: {
    APIS: require("./role/role.controller"),
    VALIDATOR: require("./role/role.validator"),
  },
  USER: {
    APIS: require("./user/user.controller"),
    VALIDATOR: require("./user/user.validator"),
  },
  NEWSLATER: {
    APIS: require("./news_later/newsLater.controller"),
    VALIDATOR: require("./news_later/newsLater.validator"),
  },
  INQUIRY: {
    APIS: require("./inquiry/inquiry.controller"),
    VALIDATOR: require("./inquiry/inquiry.validator"),
  },
  CONTECT: {
    APIS: require("./contect/contect.controller"),
    VALIDATOR: require("./contect/contect.validator"),
  },
  STRAPER: {
    APIS: require("./straper/straper.controller"),
    VALIDATOR: require("./straper/straper.validator"),
  },
  STRAPER2: {
    APIS: require("./straper2/straper2.controller"),
    VALIDATOR: require("./straper2/straper2.validator"),
  },
  PROJECT: {
    APIS: require("./project1/project.controller"),
    VALIDATOR: require("./project1/project.validator"),
  },
  NOTIFICATION: {
    APIS: require("./notification/notification.controller"),
    VALIDATOR: require("./notification/notification.validator"),
  },
  DATESELECT: {
    APIS: require("./dateSelect/dateSelect.controller"),
    VALIDATOR: require("./dateSelect/dateSelect.validator"),
  },
  VATTENFALL: {
    APIS: require("./vattenfall/vattenfall.controller"),
    VALIDATOR: require("./vattenfall/vattenfall.validator"),
  },
  DOCUMENT: {
    APIS: require("./document/document.controller"),
    VALIDATOR: require("./document/document.validator"),
  },
  VIDEO: {
    APIS: require("./video/video.controller.js"),
    // VALIDATOR: require("./document/document.validator")
  },

  DESCRIPTION: {
    APIS: require("./description/description.controller"),
    // VALIDATOR: require("./description/description.validator")
  },

  DAHUA: {
    APIS: require("./dahua/dahua.controller"),
  },

  DAHUA_LOCATION: {
    APIS: require("./dahua_location/dahua_location.controller.js"),
    VALIDATOR: require("./dahua_location/dahua_location.validator.js"),
  },

  DAHUA_DEVICE: {
    APIS: require("./dahua_device/dahua_device.controller.js"),
    VALIDATOR: require("./dahua_device/dahua_device.validator.js"),
  },

  DAHUA_AUTH_PLATES: {
    APIS: require("./dahua_authPlates/dahua_authPlates.controller.js"),
    VALIDATOR: require("./dahua_authPlates/dahua_authPlates.validator.js"),
  },
  DAHUA_BOOKED_PLATES: {
    APIS: require("./dahua_bookedPlates/dahua_bookedPlates.controller.js"),
    VALIDATOR: require("./dahua_bookedPlates/dahua_bookedPlates.validator.js"),
  },
  DASHBOARD: {
    APIS: require("./dashboard/dashboard.contoller.js"),
    VALIDATOR: require("./dashboard/dashboard.validator.js"),
  },
};
