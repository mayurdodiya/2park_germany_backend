const DB = require("../models");
const path = require("path");
const fs = require("fs");

module.exports = {
  latestInvoiceNumber: async () => {
    try {
      const findInvoiceNumber = await DB.INVOICENUMBERPROVIDER.findOne(); // only one record available
      let currentYear = new Date().getFullYear();
      let invObj = {
        year: findInvoiceNumber?.year,
        lastInvNumber: findInvoiceNumber?.lastInvNumber + 1,
        totalInvoice: findInvoiceNumber?.totalInvoice + 1,
      };
      if (findInvoiceNumber?.year !== currentYear) {
        invObj.year = currentYear;
        invObj.lastInvNumber = 21001;
        invObj.totalInvoice = 1;
      }
      const updateInv = await DB.INVOICENUMBERPROVIDER.findOneAndUpdate({ _id: findInvoiceNumber._id }, { $set: { ...invObj } }, { upsert: true, new: true });
      const finalInvoiceNumber = `${updateInv?.year}/2P/${updateInv?.lastInvNumber}`;
      const pdfFileName = `booking-${updateInv?.year}-${updateInv?.lastInvNumber}.pdf`;
      return [finalInvoiceNumber, pdfFileName];
    } catch (error) {
      throw error;
    }
  },

  removeRootDirFile: async (pdfFileName) => {
    try {
      const removefilePath = path.join(__dirname, "..", "uploads", "pdf", pdfFileName);
      fs.unlink(removefilePath, (err) => {
        if (err) {
          console.error("Failed to delete file:", err);
        } else {
          console.log("invoice pdf file deleted from root dir successfully");
        }
      });
    } catch (error) {
      throw error;
    }
  },
  
  formatGermanCurrency: (params) => {
    params = params.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return params;
  },
};
