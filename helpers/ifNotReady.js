// Function to check if an order status is 'In Progress'

const hbs = require("hbs");
var ifNotReady = 
    hbs.registerHelper("ifNotReady", function (status, options) {
        if (status == global.IN_PROGRESS) {
        return options.fn(this);
        }
        return options.inverse(this);
    });

module.exports = ifNotReady;