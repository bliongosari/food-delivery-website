const express = require("express");
const app = express();
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const passport = require("passport");
const userController = require("../controllers/user_controller");
const { session } = require("passport");
const Order = require("../models/order");
const Cart = require("../models/cart");
const Van = require("../models/van");
const auth = require("../config/auth");

// User login 
router.get("/login", auth.isNotVendorAccount, (req, res) => {
  if (req.isAuthenticated()) {
    // already logged in
    res.redirect("/");
  } else {
    res.render("user/login", {
      error: req.flash("error"),
      message: req.flash("message"),
    });
  }
});

router.post("/login", auth.isNotVendorAccount, (req, res, next) => {
  passport.authenticate("user", {
    successRedirect: "/",
    failureRedirect: "/user/login",
    failureFlash: true,
  })(req, res, next);
});

// User sign up
router.get("/sign-up", auth.isNotVendorAccount, (req, res) => {
  res.render("user/sign-up");
});

// needs password strengths for extra
router.post("/sign-up", auth.isNotVendorAccount, userController.signUpAuth);

// User logout
router.get(
  "/logout",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  userController.logout
);

// Change customer's password
router.get(
  "/changepassword",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  async (req, res) => {
    try {
      res.render("user/changepassword", {
        user: req.user,
      });
    } catch (err) {
      console.log(err.message);
    }
  }
);

router.post(
  "/changepassword",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  userController.changePassword
);

// To display customer's profile
router.get(
  "/:id",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  userController.getProfile
);

// To get van's rating
router.get("/rating/:id", auth.isNotVendorAccount, userController.getRatings);

// To edit customer's profile
router.get(
  "/:id/editprofile",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  async (req, res) => {
    if (req.user.id != req.params.id) {
      return res.redirect("/error");
    }
    try {
      res.render("user/editprofile", {
        user: req.user,
      });
    } catch (err) {
      console.log(err.message);
    }
  }
);

// Update customer's profile
router.post(
  "/:id/editprofile",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  userController.updateProfile
);

// To cancel order
router.get("/:id/cancel", async (req, res) => {
  const id = req.params.id;
  try {
    await Order.findByIdAndUpdate(id, {
      status: global.CANCELLED,
    });
    res.redirect("/order/" + id);
  } catch (err) {
    console.log(err.message);
  }
});

module.exports = router;
