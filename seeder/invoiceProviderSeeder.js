const DB = require("../models");
const { logger } = require("../utils/logger");
const invoiceProviderSeeder = async () => {
  try {
    const year = 2025;
    const findInvoiceNumber = await DB.INVOICENUMBERPROVIDER.findOne({ year: year }); // only one record available
    if (!findInvoiceNumber) {
      await DB.INVOICENUMBERPROVIDER.findOneAndUpdate(
        {},
        {
          $set: {
            year: year,
            lastInvNumber: 21021, // as per client req 19 record are already generated
            totalInvoice: 1,
          },
        },
        { upsert: true, new: true }
      );
    }

    logger.info("invoiceNumberProvider seeder run successfully!");
  } catch (error) {
    console.log(error);
  }
};

module.exports = { invoiceProviderSeeder };
