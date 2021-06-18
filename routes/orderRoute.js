const express = require("express");
const app = express();
const router = express.Router();
const Order = require("../models/order");
const { Router } = require("express");
const Van = require("../models/van");
const Snack = require("../models/snacks");
const User = require("../models/user");
const Cart = require("../models/cart");
const Rating = require("../models/rating");
const auth = require("../config/auth");
const DISCOUNT_MIN = 15;
const EDITABLE_MIN = 15;
const DISCOUNT = 0.2;

// create order
router.post("/create", auth.isNotVendorAccount, async (req, res) => {
  const order = new Order({
    orderedBy: req.user,
    orderedTo: req.session.vanChosen,
    items: req.session.cart,
    status: global.IN_PROGRESS,
  });
  try {
    await order.save();
    delete req.session.cart;
    return res.redirect("/order/" + order._id);
  } catch (err) {
    return res.status(500).send(err);
  }
});

// To display Customer's order receipt
router.get(
  "/:id",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  async (req, res) => {
    try {
      const id = req.params.id;
      var order = await Order.findById(id);
      const van = await Van.findById(order.orderedTo);
      const user = await User.findById(order.orderedBy);
      if (req.user.id != user._id) {
        return res.redirect("/error");
      }
      const items = new Cart(order.items[0]);
      const menu = await Snack.find({});

      var editable = true;
      const time_ordered = order.createdOn;
      var current = new Date();
      var difference = current.getTime() - time_ordered.getTime();
      var day_difference = difference / (1000 * 3600 * 24);
      var minute_difference = difference / (1000 * 60);
      var hour_difference = (difference / (1000 * 60 * 60)) % 24;
      var time_elapsed = 0 + " Minutes";
      if (hour_difference > 1) {
        if (day_difference > 1) {
          time_elapsed = Math.round(day_difference) + " day(s)";
        } else {
          time_elapsed = Math.round(hour_difference) + " hour(s)";
        }
      } else {
        time_elapsed = Math.round(minute_difference) + " minute(s)";
      }

      // once reached cant change currentorder
      if (minute_difference > EDITABLE_MIN) {
        editable = false;
      }
      if (minute_difference > DISCOUNT_MIN) {
        if (order.discounted == false && order.status == global.IN_PROGRESS) {
          order = await Order.findByIdAndUpdate(order._id, {
            discounted: true,
          });
        }
        items.addDiscount(DISCOUNT);
      }

      var cancelled = false;
      if (order.status == global.CANCELLED) {
        cancelled = true;
        editable = false;
      }

      var ratingWritten = false;
      rating = await Rating.findOne({ order_id: order._id });
      if (rating) {
        ratingWritten = true;
      }

      res.render("user/order", {
        order: order,
        time_elapsed: time_elapsed,
        items: items.generateArray(),
        van: van,
        user: user,
        date: time_ordered.toLocaleString(),
        totalPrice: items.totalPrice.toFixed(2),
        editable: editable,
        menu: menu,
        cancelled: cancelled,
        discount: DISCOUNT * 100 + "%",
        rating: ratingWritten,
      });
    } catch (err) {
      console.log(err.message);
    }
  }
);

// To mark order as picked up or 'Fulfilled'
router.get("/:id/pickup", async (req, res) => {
  const id = req.params.id;
  try {
    await Order.findByIdAndUpdate(id, {
      status: global.FULFILLED,
    });
    res.redirect("/vendor/order/");
  } catch (err) {
    console.log(err.message);
  }
});

// To edit order after it's placed
router.get(
  "/:id/edit",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  async (req, res) => {
    const id = req.params.id;
    const order = await Order.findById(id);
    const van = await Van.findById(order.orderedTo);
    const user = await User.findById(order.orderedBy);
    const items = new Cart(order.items[0]);
    const menu = await Snack.find({});

    try {
      res.render("user/popup-menu", {
        order: order,
        items: items.generateArray(),
        van: van,
        user: user,
        menu: menu,
      });
    } catch (err) {
      console.log(err.message);
    }
  }
);

// For customer to order from a van
router.get("/van/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const menu = await Snack.find({});
    const van = await Van.findById(id);
    req.session.vanChosen = van;
    const from = req.query.from;
    if (from == "checkout") {
      return res.redirect("/checkout");
    }
    res.render("user/van-order", {
      user: req.user,
      menu: menu,
      van: van,
    });
  } catch (err) {
    console.log(err.message);
  }
});

// To add more items to a placed order
router.post(
  "/:orderid/add-to-cart/:id",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  async (req, res) => {
    var productId = req.params.id;
    var id = req.params.orderid;
    var quantity = req.body.quantity;
    var order = await Order.findById(id);
    var item = await Snack.findById(productId);
    var cart = new Cart(order.items[0]);
    var current = new Date();

    for (var i = 0; i < quantity; i++) {
      cart.add(item, productId);
    }

    order = await Order.findByIdAndUpdate(id, {
      items: cart,
      createdOn: current,
    });
    res.redirect("/order/" + id + "/edit");
  }
);

// To reduce quantity of an item of placed order
router.post(
  "/:orderid/reduce/:id",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  async (req, res) => {
    var productId = req.params.id;
    var id = req.params.orderid;
    var order = await Order.findById(id);
    var cart = new Cart(order.items[0]);
    var current = new Date();

    cart.removeOne(productId);
    order = await Order.findByIdAndUpdate(id, {
      items: cart,
      createdOn: current,
    });
    res.redirect("/order/" + id + "/edit");
  }
);

// To add quantity of an item of placed order
router.post(
  "/:orderid/add/:id",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  async (req, res) => {
    var productId = req.params.id;
    var id = req.params.orderid;
    var order = await Order.findById(id);
    var cart = new Cart(order.items[0]);
    var current = new Date();

    cart.addOne(productId);
    order = await Order.findByIdAndUpdate(id, {
      items: cart,
      createdOn: current,
    });
    res.redirect("/order/" + id + "/edit");
  }
);

// To remove an item from a placed order
router.post(
  "/:orderid/remove/:id",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  async (req, res) => {
    var productId = req.params.id;
    var id = req.params.orderid;
    var order = await Order.findById(id);
    var cart = new Cart(order.items[0]);
    var current = new Date();

    cart.remove(productId);
    order = await Order.findByIdAndUpdate(id, {
      items: cart,
      createdOn: current,
    });
    res.redirect("/order/" + id + "/edit");
  }
);

// For van to mark the order as ready
router.get(
  "/:orderid/ready",
  auth.isNotUserAccount,
  auth.isVendorLoggedIn,
  async (req, res) => {
    var id = req.params.orderid;
    var currentOrder = await Order.findById(id);

    if (currentOrder.orderedTo != req.user.id) {
      return res.redirect("/error");
    }

    var changedOrder = await Order.findByIdAndUpdate(id, {
      status: global.READY,
    });
    res.redirect("/vendor/order");
  }
);

// For user to rate an order
router.post(
  "/rate/:id",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  async (req, res) => {
    id = req.params.id;
    const hasRated = await Rating.exists({ order_id: id });
    if (hasRated) {
      req.flash("message", "You already rated this order");
      return res.redirect("/order/" + id);
    }

    const newRating = new Rating();
    const order = await Order.findById(id);
    var van = await Van.findById(order.orderedTo);
    var avg = 0;
    var i = 0;

    newRating.writtenBy = order.orderedBy;
    newRating.van = order.orderedTo;
    newRating.rating = req.body.rating;
    newRating.order_id = id;

    if (req.body.comment != null) {
      newRating.comment = req.body.comment;
    }

    var ratings = await Rating.find({ van: van });
    for (i = 0; i < ratings.length; i++) {
      avg += ratings[i].rating;
    }
    avg += newRating.rating;
    if (ratings.length > 0) {
      avg /= ratings.length + 1;
    }
    avg = avg.toFixed(1);
    van = await Van.findByIdAndUpdate(order.orderedTo, { rating: avg });
    newRating.save((err, rating) => {
      if (err) {
        console.log(err);
        return res.redirect("/order/" + id);
      }
      req.flash("message", "Sucessfully rated");
      res.redirect("/order/" + id);
    });
  }
);

app.post;
module.exports = router;
