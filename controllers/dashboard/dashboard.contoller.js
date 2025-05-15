const messages = require("../../json/message.json");
const apiResponse = require("../../utils/api.response");
const DB = require("../../models");
const moment = require("moment");
const { DateTime } = require("luxon");
const { eachDayOfInterval, format, startOfWeek, endOfWeek, getDay } = require("date-fns");
const fs = require("fs");
const { PAYMENT_STATUS } = require("../../json/enums.json");

const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]; // german

module.exports = exports = {
  // get data of last4month & current year
  bookingPerformance: async (req, res) => {
    try {
      let user = req.user;
      // user.parkingplot = "6811ac3f38aa0a0f5fc190e8";
      console.log(user, "---------user");
      const today = new Date();
      const currentYear = today.getFullYear();
      const startDate = new Date(`${currentYear}-01-01T00:00:00.000Z`);
      let month = today.getMonth() + 1;
      let year = today.getFullYear();

      month -= 3;
      if (month <= 0) {
        month += 12;
        year -= 1;
      }

      // Calculate 4 months ago (including current month as the 4th)
      const threeMonthsAgo = new Date(`${year}-0${month}-01T00:00:00.000Z`);
      const parkingPlotArray = Array.isArray(user?.parkingplot) ? user.parkingplot : [user?.parkingplot].filter(Boolean);

      let [last4Months, yearData] = await Promise.all([
        // Fetch last 4 months data
        DB.DAHBOOKEDPLATE.aggregate([
          {
            $match: {
              fromTime: { $gte: threeMonthsAgo, $lte: today },
              // locationId: { $in: user?.parkingplot },
              locationId: { $in: parkingPlotArray },
              paymentStatus: PAYMENT_STATUS.PAID,
            },
          },
          {
            $project: {
              month: { $month: "$fromTime" },
              year: { $year: "$fromTime" },
              totalFare: 1,
            },
          },
          {
            $group: {
              _id: { year: "$year", month: "$month" },
              total_income: { $sum: "$totalFare" },
              total_booking: { $sum: 1 },
            },
          },
          {
            $sort: { "_id.year": 1, "_id.month": 1 },
          },
        ]),
        // Fetch current year data
        DB.DAHBOOKEDPLATE.aggregate([
          {
            $match: {
              fromTime: { $gte: startDate, $lte: today },
              // locationId: { $in: user?.parkingplot },
              locationId: { $in: parkingPlotArray },
              paymentStatus: PAYMENT_STATUS.PAID,
            },
          },
          {
            $group: {
              _id: null,
              total_booking: { $sum: 1 },
              total_income: { $sum: "$totalFare" },
            },
          },
          {
            $project: { _id: 0, total_booking: 1, total_income: 1 },
          },
        ]),
      ]);

      console.log(last4Months, "----------------- last4Months");
      const last4MonthData = last4Months.map(({ _id, total_income, total_booking }) => ({
        month: monthNames[_id.month - 1],
        year: _id?.year,
        total_booking,
        total_income,
      }));
      // add unavailable month in last_4_month
      const pastMonthArr = [];
      if (last4MonthData.length < 4) {
        const reqMonthCount = 4 - last4MonthData.length;
        const today = new Date(); // make sure `today` is defined
        const target = DateTime.fromObject({
          year: last4MonthData.length > 0 ? last4MonthData[0]?.year : today.getFullYear(),
          month: last4MonthData.length > 0 ? monthNames.indexOf(last4MonthData[0]?.month) + 1 : today.getMonth() + 1, // fix: +1 to match DateTime's 1-based month
        });
        pastMonthArr.push(
          ...Array.from({ length: reqMonthCount }, (_, i) => {
            const date = target.minus({ months: reqMonthCount - i });
            return {
              month: monthNames[date.month - 1], // date.month is 1-based
              year: date?.year,
              total_booking: 0,
              total_income: 0,
            };
          })
        );
      }

      const responseObj = {
        current_year: {
          total_booking: yearData.length > 0 ? yearData[0]?.total_booking : 0,
          total_income: yearData.length > 0 ? yearData[0]?.total_income : 0,
          year: currentYear,
        },
        last_4_month: pastMonthArr.concat(last4MonthData),
      };

      return apiResponse.OK({ res, message: messages.GET_DATA, data: responseObj });
    } catch (error) {
      console.error("bookingPerformance error:", error);
      return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
    }
  },

  // Get Booking Count of each month ( last12month )
  getLast12MonthPerformance: async (req, res) => {
    try {
      const user = req.user;
      const today = new Date();
      let month = today.getMonth() + 1; // 1 to 12
      let year = today.getFullYear(); // cnvert in 12 month ago

      month -= 12; // to get the 4th *including* current (Apr = 4th, so subtract 3)
      if (month <= 0) {
        month += 12;
        year -= 1;
      }

      // Calculate 12 months ago
      const twelMonthAgo = new Date(`${year}-0${month}-01T00:00:00.000Z`);
      const parkingPlotArray = Array.isArray(user?.parkingplot) ? user.parkingplot : [user?.parkingplot].filter(Boolean);
      const last12Months = await DB.DAHBOOKEDPLATE.aggregate([
        {
          $match: {
            fromTime: { $gte: twelMonthAgo, $lte: today },
            // locationId: { $in: user?.parkingplot },
            locationId: { $in: parkingPlotArray },
            paymentStatus: PAYMENT_STATUS.PAID,
          },
        },
        {
          $project: {
            month: { $month: "$fromTime" },
            year: { $year: "$fromTime" },
            totalFare: 1,
          },
        },
        {
          $group: {
            _id: { year: "$year", month: "$month" },
            total_income: { $sum: "$totalFare" },
            total_booking: { $sum: 1 },
          },
        },
        {
          $sort: { "_id.year": 1, "_id.month": 1 },
        },
      ]);

      // format month-year string
      let last12MonthData = last12Months.map(({ _id, total_income, total_booking }) => ({
        month: monthNames[_id.month - 1],
        year: _id.year,
        total_booking,
        total_income,
      }));

      // add blank data if last12MonthData not available
      if (last12MonthData.length === 0) {
        last12MonthData.push({
          month: monthNames[today.getMonth()],
          year: today.getFullYear(),
          total_booking: 0,
          total_income: 0,
        });
      }

      // add unavailable month in last12MonthData
      const pastMonthArr = [];
      if (last12MonthData.length < 12) {
        const reqMonthCount = 12 - last12MonthData.length;
        const target = DateTime.fromObject({
          year: last12MonthData[0]?.year,
          month: monthNames.indexOf(last12MonthData[0]?.month) + 1,
        });

        pastMonthArr.push(
          ...Array.from({ length: reqMonthCount }, (_, i) => {
            const date = target.minus({ months: reqMonthCount - i });
            return {
              month: monthNames[date.month - 1],
              year: date.year,
              total_booking: 0,
              total_income: 0,
            };
          })
        );
      }

      const responseObj = {
        last_12_month: pastMonthArr.concat(last12MonthData),
      };

      return apiResponse.OK({ res, message: messages.GET_DATA, data: responseObj });
    } catch (error) {
      console.error("getLast12MonthPerformance error:", error);
      return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
    }
  },

  // get current week data and avg of each day of week from start(project) to current
  getAvgOfWeekDays: async (req, res) => {
    try {
      const user = req.user;
      const today = new Date();
      const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"]; //german
      // const today = new Date("2025/03/24");
      // const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // indian

      // get monday of any week
      function getPreviousMonday(inputDateStr) {
        const inputDate = inputDateStr;
        const dayOfWeek = inputDate.getDay(); // 0 (Sun) to 6 (Sat)

        // Calculate how many days to subtract to get to Monday
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const mondayDate = new Date(inputDate);
        mondayDate.setDate(inputDate.getDate() - diffToMonday);
        return mondayDate;
      }

      const lastMondayDate = new Date(getPreviousMonday(today).toISOString());
      const parkingPlotArray = Array.isArray(user?.parkingplot) ? user.parkingplot : [user?.parkingplot].filter(Boolean);

      let [last7DaysData, filterDayAndCountItsBookingEntry] = await Promise.all([
        // get single week data
        DB.DAHBOOKEDPLATE.aggregate([
          {
            $match: {
              fromTime: { $gte: lastMondayDate, $lte: today },
              // locationId: { $in: user?.parkingplot },
              locationId: { $in: parkingPlotArray },
              paymentStatus: PAYMENT_STATUS.PAID,
            },
          },
          {
            $project: {
              date: { $dateToString: { format: "%Y-%m-%d", date: "$fromTime" } },
              day: { $dayOfWeek: "$fromTime" },
              month: { $month: "$fromTime" },
              year: { $year: "$fromTime" },
              totalFare: 1,
            },
          },
          {
            $group: {
              _id: { day: "$day" },
              total_income: { $sum: "$totalFare" },
              total_booking: { $sum: 1 },
              // date:date
            },
          },
          {
            $project: {
              _id: 0,
              day: "$_id.day",
              total_income: 1,
              total_booking: 1,
            },
          },
          // {
          //   $sort: { "_id.year": 1, "_id.month": 1 },
          // },
        ]),
        // // geta data as per day and average
        DB.DAHBOOKEDPLATE.aggregate([
          {
            $match: {
              // locationId: { $in: user?.parkingplot },
              locationId: { $in: parkingPlotArray },
              paymentStatus: PAYMENT_STATUS.PAID,
            },
          },
          {
            $addFields: {
              dayOfWeek: { $dayOfWeek: "$fromTime" },
            },
          },
          {
            $group: {
              _id: "$dayOfWeek",
              booking_count: { $sum: 1 },
              data: { $push: "$$ROOT" },
            },
          },
          {
            $sort: { _id: 1 },
          },
          {
            $project: {
              _id: 0,
              day_of_week: "$_id",
              booking_count: 1,
            },
          },
        ]),
      ]);

      // get week firstday(sunday) and week lastday(saturday) from given startdata and endday(today)
      const projectStartDate = new Date("2025/03/17");
      const adjustedStartDate = startOfWeek(projectStartDate); // Previous Sunday
      const adjustedEndDate = endOfWeek(today); // Next Saturday

      // Get all days and count by weekday
      const dayCounts = eachDayOfInterval({
        start: adjustedStartDate,
        end: adjustedEndDate,
      }).reduce((acc, day) => {
        const dayOfWeek = getDay(day); // 0 (Sun) to 6 (Sat)
        acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
        return acc;
      }, {});

      // Format output (1=Sun to 7=Sat)
      const getAllDay = Array.from({ length: 7 }, (_, i) => ({
        day_of_week: i + 1,
        count: dayCounts[i] || 0,
      }));

      // for modification of last7DaysData
      const DAYS = [1, 2, 3, 4, 5, 6, 7];
      const availableDays = last7DaysData?.map((item) => item.day);
      const missDays = DAYS.filter((day) => !availableDays.includes(day));
      if (missDays.length > 0) {
        missDays.map((item) => {
          last7DaysData.push({
            day: item,
            total_booking: 0,
            total_income: 0,
          });
        });
      }
      last7DaysData = last7DaysData.sort((a, b) => a.day - b.day);
      last7DaysData = last7DaysData.map(({ day, total_income, total_booking }) => ({
        day_Of_Week: dayNames[day - 1],
        total_booking,
        total_income,
      }));

      // Move day_of_week === 1(sunday) to the end in (last7DaysData)
      const dayOrder = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
      const last7DaysDataSort = last7DaysData.filter((item) => item.day_Of_Week !== dayNames[0]);
      last7DaysDataSort.sort((a, b) => dayOrder.indexOf(a.day_Of_Week) - dayOrder.indexOf(b.day_Of_Week));
      const sundayData = last7DaysData.find((item) => item.day_Of_Week === dayNames[0]);
      if (sundayData) last7DaysDataSort.push(sundayData);
      last7DaysData = last7DaysDataSort;

      // for modification of filterDayAndCountItsBookingEntry & getAllDay
      const presentDays = getAllDay.map((item) => item.day_of_week);
      const missingDays = DAYS.filter((day) => !presentDays.includes(day));
      if (missingDays.length > 0) {
        missingDays.map((item) => {
          getAllDay.push({
            booking_count: 0,
            count: 0,
            day_of_week: item,
          });
        });
      }

      const mergedBothArry = getAllDay.map((item1) => {
        const match = filterDayAndCountItsBookingEntry.find((item2) => item2.day_of_week === item1.day_of_week);
        const average = (match ? match.booking_count : 0) / item1.count;
        return {
          day_of_week: item1.day_of_week,
          day_name: dayNames[item1.day_of_week - 1],
          day_count: item1.count,
          booking_count: match ? match.booking_count : 0,
          average: average ? parseFloat(average.toFixed(2)) : 0,
        };
      });

      // const finalDataWithAvg = mergedBothArry.sort((a, b) => a.day_of_week - b.day_of_week);

      // Move day_of_week === 1(sunday) to the end in (avg_of_days)
      const finalDataWithAvg = mergedBothArry.filter((item) => item.day_of_week !== 1).sort((a, b) => a.day_of_week - b.day_of_week);
      const sunday = mergedBothArry.find((item) => item.day_of_week === 1);
      if (sunday) finalDataWithAvg.push(sunday);

      const responseObj = {
        week_data: {
          note: `data is available from ${moment(lastMondayDate).format("DD/MM/YYYY")} to ${moment(today).format("DD/MM/YYYY")}.`,
          data: last7DaysData,
        },
        avg_of_days: finalDataWithAvg,
      };
      return apiResponse.OK({ res, message: messages.GET_DATA, data: responseObj });
    } catch (error) {
      console.error("getAvgOfWeekDays error:", error);
      return apiResponse.CATCH_ERROR({ res, message: messages.INTERNAL_SERVER_ERROR });
    }
  },
};
