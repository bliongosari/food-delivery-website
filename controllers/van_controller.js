const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
const Van = require("../models/van");
const Order = require("../models/order");
const User = require("../models/user");
const Cart = require("../models/cart");
const Snack = require("../models/snacks");
const Rating = require("../models/rating");
const bcrypt = require("bcryptjs");

var ObjectID = require("mongodb").ObjectID;
const passport = require("passport");
const NodeGeocoder = require("node-geocoder");

// constants
const UNAVAILABLE = "unavailable";
const VAN_READY = "ready";

//regex
const regexPassword = new RegExp(/(?=.*\d)(?=.*[a-zA-Z]).{8,}/);
const regexText = new RegExp(/[a-zA-Z ]+/);
const regexEmail = new RegExp(/(\w\.?)+@[\w\.-]+\.\w+/);

// Sign up requirements
const signUpAuth = async (req, res) => {
  if (regexPassword.test(req.body.password) == false) {
    return res.render("vendor/vendor-sign-up", {
      success: false,
      message:
        "Must contain atleast one alphabet character, one numerical digit (0-9), and at least 8 characters",
    });
  }

  if (regexText.test(req.body.van_name) == false) {
    return res.render("vendor/vendor-sign-up", {
      success: false,
      message: "Please enter only alphabetical characters for van name ",
    });
  }

  if (regexEmail.test(req.body.email) == false) {
    return res.render("vendor/vendor-sign-up", {
      success: false,
      message: "Email needs to be in the format of name@email.com",
    });
  }
  // hashing password
  const hashedpassword = await bcrypt.hash(req.body.password, 10);
  // check if there is exsisting email
  Van.find(
    {
      van_name: req.body.van_name,
    },
    (err, previousVans) => {
      if (err) {
        return res.render("vendor/vendor-sign-up", {
          success: false,
          message: "Server error",
        });
      } else if (previousVans.length > 0) {
        return res.render("vendor/vendor-sign-up", {
          success: false,
          message: "Van name already used",
        });
      } else {
        // saving to db
        const newVan = new Van();
        newVan.email = req.body.email;
        newVan.van_name = req.body.van_name;
        newVan.password = hashedpassword;
        newVan.save((err, van) => {
          if (err) {
            res.render("vendor/vendor-sign-up", {
              success: false,
              message: "Sign up failed. Try Again",
            });
          }
          req.flash("message", "Sucessfully signed up");
          res.redirect("/vendor");
        });
      }
    }
  );
};

// Vendor logout
const logout = async (req, res) => {
  try {
    const link = req.session.last_url;
    const van = req.user;
    req.session.destroy(null);
    res.clearCookie(this.cookie, { path: "/vendor" });
    req.logout();
    if (link) {
      return res.redirect(link);
    }
    return res.redirect("/vendor");
  } catch (err) {
    console.log(err.message);
  }
};

const setReady = async (req, res) => {
  const id = req.params.id;
  if (req.user._id == id) {
    try {
      await Van.findByIdAndUpdate(id, { status: VAN_READY });
    } catch (err) {
      return res.redirect("/error");
    }
    return res.redirect("/vendor/order");
  } else {
    return res.redirect("/error");
  }
};

// Set van status to 'unavailable'
const setUnavailable = async (req, res) => {
  if (req.user.id == req.params.id) {
    try {
      const van = await Van.findByIdAndUpdate(req.params.id, {
        status: UNAVAILABLE,
      });
    } catch (err) {
      res.redirect("/error");
    }
    res.redirect("/vendor/order");
  } else {
    res.redirect("/error");
  }
};

// To display van's past orders
const getPastOrders = async (req, res) => {
  var id = req.user.id;
  var van = await Van.findById(id);

  var item_arr = [];
  var i;
  var orders = await Order.find({ orderedTo: van, status: global.FULFILLED });
  var order_arr = [];
  var time_arr = [];

  for (i = 0; i < orders.length; i++) {
    if (typeof orders[i].items[0] == "object") {
      var curOrder = orders[i];
      var cart = new Cart(orders[i].items[0]);
      item_arr.push(cart.generateArray());
      var user = await User.findById(orders[i].orderedBy);
      if (user != null) {
        var name = user.firstname + " " + user.lastname;
        curOrder["customer"] = name;
      } else {
        // error handling
        curOrder["customer"] = "Undefined";
      }
      order_arr.push(curOrder);

      var createdOn = order_arr[i].createdOn;
      var deadline = new Date(createdOn);
      deadline.setMinutes(createdOn.getMinutes() + 15);
      var countdown = { id: order_arr[i].id, time: deadline };
      time_arr[i] = countdown;
    }
  }

  return res.render("vendor/van-past-order", {
    orders: order_arr,
    van: van,
    item_arr: item_arr,
    time_arr: JSON.stringify(time_arr),
  });
};

// To display van's ratings
const getRatings = async (req, res) => {
  try {
    const id = req.user.id;
    const van = await Van.findById(id);
    var ratings = await Rating.find({ van: van });
    var rating_arr = [];

    for (i = 0; i < ratings.length; i++) {
      rating_arr.push(ratings[i]);
      var user = await User.findById(ratings[i].writtenBy);
      var name = user.firstname + " " + user.lastname;
      rating_arr[i].customer = name;
    }

    return res.render("vendor/van-ratings", {
      ratings: rating_arr,
      van: van,
    });
  } catch (err) {
    console.log(err.message);
  }
};

// To display van's ongoing orders
const getOrders = async (req, res) => {
  var id = req.user.id;
  var van = await Van.findById(id);
  var item_arr = [];
  var i;
  var orders = await Order.find({
    orderedTo: van,
    status: [global.IN_PROGRESS, global.READY],
  });

  var order_arr = [];
  var time_arr = [];
  var ready = false;

  if (van.status == VAN_READY) {
    ready = true;
  }

  for (i = 0; i < orders.length; i++) {
    if (typeof orders[i].items[0] == "object") {
      order_arr.push(orders[i]);
      var cart = new Cart(orders[i].items[0]);
      item_arr.push(cart.generateArray());
      var user = await User.findById(orders[i].orderedBy);
      var name = user.firstname + " " + user.lastname;
      order_arr[i].customer = name;
      var createdOn = order_arr[i].createdOn;
      var deadline = new Date(createdOn);
      deadline.setMinutes(createdOn.getMinutes() + 15);
      var countdown = {
        id: order_arr[i].id,
        time: deadline,
        status: order_arr[i].status,
      };
      time_arr[i] = countdown;
    }
  }

  return res.render("vendor/vendor-order", {
    orders: order_arr,
    van: van,
    item_arr: item_arr,
    ready: ready,
    time_arr: JSON.stringify(time_arr),
  });
};

module.exports.getOrders = getOrders;
module.exports.getRatings = getRatings;
module.exports.getPastOrders = getPastOrders;
module.exports.setUnavailable = setUnavailable;
module.exports.setReady = setReady;
module.exports.logout = logout;
module.exports.signUpAuth = signUpAuth;
