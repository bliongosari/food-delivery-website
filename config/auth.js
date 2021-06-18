const Van = require("../models/van");
const User = require("../models/user");

// check if user is logged in
async function isUserLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash("message", "This page requires you to be logged in");
  res.redirect("/user/login");
}

// check if there is user and if there is check if its vendor account
// used in customer app
async function isNotVendorAccount(req, res, next) {
  if (!req.user) {
    return next();
  }
  const van = await Van.exists({ _id: req.user._id });
  if (van) {
    if (req.originalUrl) {
      req.session.last_url = req.originalUrl;
    }
    req.flash("message", "Need to logout from vendor first");
    res.redirect("/vendor/logout");
  } else {
    return next();
  }
}

// check if there is user logged in and if there is check if it is a customer account
// used in vendor app
async function isNotUserAccount(req, res, next) {
  if (!req.user) {
    return next();
  }
  const user = await User.exists({ _id: req.user._id });
  if (user) {
    if (req.originalUrl) {
      req.session.last_url = req.originalUrl;
    }
    req.flash("message", "Need to logout from User Account first");
    return res.redirect("/user/logout");
  } else {
    return next();
  }
}

// check if vendor is logged in
function isVendorLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash("message", "This page requires you to be logged in");
  res.redirect("/vendor/");
}

module.exports = {
  isUserLoggedIn,
  isVendorLoggedIn,
  isNotVendorAccount,
  isNotUserAccount,
};
