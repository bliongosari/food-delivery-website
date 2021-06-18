// Function to get the tax and total of an order

const hbs = require("hbs");

var getTotal = hbs.registerHelper("getTotal", function (total, calltype) {
    if (calltype == "tax") {
      return (0.1 * total).toFixed(2);
    } else if (calltype == "total") {
      return (1.1 * total).toFixed(2);
    }
  });

  module.exports = getTotal;