const mongoose = require("mongoose");
const { logger } = require("../utils/logger");

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        logger.verbose(`DB connected 🤝`)
    })
    .catch((err) => {
        logger.error(`DB connection error 💔`)
    });
