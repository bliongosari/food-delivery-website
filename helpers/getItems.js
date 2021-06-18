// Function to display the items of an order

const hbs = require("hbs");

var getItems = 
hbs.registerHelper("getItems", function (item_arr, index, calltype) {
    var i;
    var out = "";
    for (i = 0; i < item_arr[index].length; i++) {
      if (calltype == "order") {
        out +=
          item_arr[index][i].qty + "x " + item_arr[index][i].item.name + "<br>";
      } else if (calltype == "popup") {
        out +=
          "<tr><td><img src='/" +
          item_arr[index][i].item.image_url +
          "' alt=''></td>";
        out +=
          "<td class='name'>" +
          item_arr[index][i].qty +
          "x " +
          item_arr[index][i].item.name +
          "</td>";
        out +=
          "<td class='price'>$" + item_arr[index][i].item.price + "</td></tr>";
      }
    }
    return out;
  });

  module.exports = getItems;