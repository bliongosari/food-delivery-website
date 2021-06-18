// Function to check if an order is ready for pickup

const hbs = require("hbs");
var ifReady = 
    hbs.registerHelper ("ifReady", function (status, options) {
    if (status == global.READY) {
      return options.fn(this);
    }
    return options.inverse(this);
});

module.exports = ifReady;