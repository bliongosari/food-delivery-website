const express = require("express");
const app = express();
const router = express.Router();
const { Router } = require("express");
const mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);
const Van = require("../models/van");
const Order = require("../models/order");
var ObjectID = require("mongodb").ObjectID;
const passport = require("passport");
const vanController = require("../controllers/van_controller");
const NodeGeocoder = require("node-geocoder");
const User = require("../models/user");
const Cart = require("../models/cart");
const Snack = require("../models/snacks");
const auth = require("../config/auth");
const Rating = require("../models/rating");
const UNAVAILABLE = "unavailable";
const VAN_READY = "ready";

const options = {
  provider: "mapquest",
  apiKey: "	jkxgUmiUP7USj2NSAKqAF5VQ5CGU1GwJ",
  formatter: null,
};

const geocoder = NodeGeocoder(options);

// Go to vendor home page
// logout if switched from customer app
router.get("/", auth.isNotUserAccount, function (req, res) {
  res.render("vendor/vendor-home", {
    error: req.flash("error"),
    message: req.flash("message"),
  });
});

// Vendor logout
router.get(
  "/logout",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  vanController.logout
);

// For vendor to enter location
router.get(
  "/location",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  async (req, res) => {
    geocode = await geocoder.geocode("Melbourne");
    res.render("vendor/vanlocation_default", {
      van: req.user,
      geocode: geocode[0],
    });
  }
);

// Get new location
router.post(
  "/location",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  async (req, res) => {
    var geocode;
    if (req.body.address) {
      geocode = await geocoder.geocode(req.body.address);
    } else {
      geocode = await geocoder.geocode("Melbourne");
    }
    res.render("vendor/vanlocation", {
      van: req.user,
      geocode: geocode[0],
    });
  }
);

// Vendor sign up
router.get("/sign-up", function (req, res) {
  res.render("vendor/vendor-sign-up");
});

// needs password strengths for extra
router.post("/sign-up", auth.isNotUserAccount, vanController.signUpAuth);

// Vendor sign in
router.post("/sign-in", auth.isNotUserAccount, (req, res, next) => {
  passport.authenticate("van", {
    successRedirect: "/vendor/location",
    failureRedirect: "/vendor/",
    failureFlash: true,
  })(req, res, next);
});

// To change location
router.post(
  "/changeLocation",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  async (req, res) => {
    try {
      const address = req.body.address;
      geocode = await geocoder.geocode(req.body.address);
      const currentLocation = [geocode[0].latitude, geocode[0].longitude];
      const result = await Van.findByIdAndUpdate(req.user, {
        address: address,
        current_location: currentLocation,
      });
      res.redirect("/vendor/order");
    } catch (err) {
      console.log(err.message);
    }
  }
);

// To set van status to 'ready'
router.get(
  "/ready/:id",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  vanController.setReady
);

// To set van status to 'unavailable'
router.get(
  "/setUnavailable/:id",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  vanController.setUnavailable
);

// To get van's ongoing orders
router.get(
  "/order",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  vanController.getOrders
);

// To display vendor's menu
router.get(
  "/menu",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  async (req, res) => {
    result = await Snack.find({});
    res.render("vendor/vendor-menu", {
      menu: result,
      van: req.user,
    });
  }
);

// To display van's profile
router.get(
  "/profile",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  async (req, res) => {
    var id = req.user.id;
    var van = await Van.findById(id);
    res.render("vendor/van-profile", {
      van: van,
    });
  }
);

// To edit van's profile
router.get(
  "/editprofile",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  async (req, res) => {
    var id = req.user.id;
    var van = await Van.findById(id);
    res.render("vendor/van-editprofile", {
      van: van,
    });
  }
);

// Update profile
router.post(
  "/editprofile",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  async (req, res) => {
    try {
      const id = req.user.id;
      const changes = req.body;
      const result = await Van.findByIdAndUpdate(id, changes);
      res.redirect("/vendor/profile");
    } catch (err) {
      console.log(err.message);
    }
  }
);

// To get van's ratings
router.get(
  "/ratings",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  vanController.getRatings
);

// To display van's past orders
router.get(
  "/past-orders",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  vanController.getPastOrders
);

// To cancel order
router.get("/:id/cancel", async (req, res) => {
  const id = req.params.id;
  try {
    await Order.findByIdAndUpdate(id, {
      status: global.CANCELLED,
    });
    res.redirect("/vendor/order/");
  } catch (err) {
    console.log(err.message);
  }
});
module.exports = router;
