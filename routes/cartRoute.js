const express = require("express");
const app = express();
const router = express.Router();
const Order = require("../models/order");
const { Router } = require("express");
const Van = require("../models/van");
const Snack = require("../models/snacks");
const Cart = require("../models/cart");
const auth = require("../config/auth");

// view cart
router.get(
  "/",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  function (req, res) {
    const cart = new Cart(req.session.cart ? req.session.cart : { items: {} });
    try {
      return res.render("user/cart", {
        user: req.user,
        items: cart.generateArray(),
        totalPrice: cart.totalPrice,
      });
    } catch (err) {
      return res.status(500).send(err);
    }
  }
);

// Add an item to cart
router.post(
  "/add-to-cart/:id",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  function (req, res, next) {
    var productId = req.params.id;
    quantity = req.body.quantity;
    const cart = new Cart(req.session.cart ? req.session.cart : { items: {} });
    Snack.findById(productId, function (err, item) {
      if (err) {
        return res.redirect("/menu");
        console.log(err.message);
      }
      for (var i = 0; i < quantity; i++) {
        cart.add(item, item.id);
      }
      req.session.cart = cart;
      return res.redirect("/menu");
    });
  }
);

// Edit cart to reduce item's quantity
router.post(
  "/reduce/:id",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  function (req, res) {
    var productId = req.params.id;
    const cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.removeOne(productId);
    req.session.cart = cart;
    res.redirect("/cart");
  }
);

// Edit cart to add an item
router.post(
  "/add/:id",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  function (req, res) {
    var productId = req.params.id;
    const cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.addOne(productId);
    req.session.cart = cart;
    res.redirect("/cart");
  }
);

// Edit cart to remove an item
router.post(
  "/remove/:id",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  function (req, res) {
    var productId = req.params.id;
    const cart = new Cart(req.session.cart ? req.session.cart : {});

    cart.remove(productId);
    req.session.cart = cart;
    res.redirect("/cart");
  }
);

app.post;
module.exports = router;
