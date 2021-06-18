// Function to display rating of a van

const hbs = require("hbs");
var setRating = 
    hbs.registerHelper("setRating", function (rating) {
    var rounded = rating | 0;
    var decimal = rating - rounded;
    var star = (rating / 5) * 100;
    var out = "";
    for (var j = 0; j < rounded; j++) {
      out +=
        '<i class="fa fa-star" style="color: #eb6e00; font-size: 20px;"></i>';
    }
    if (decimal) {
      out +=
        '<i class="fa fa-star-half" style="color: #eb6e00; font-size: 20px;"></i>';
    }
    return out;
});

module.exports = setRating;