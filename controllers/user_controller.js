const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Order = require("../models/order");
const Van = require("../models/van");
const Snack = require("../models/snacks");
const Rating = require("../models/rating");
const Cart = require("../models/cart");
const passport = require("passport");
const mongoose = require("mongoose");
const NodeGeocoder = require("node-geocoder");

mongoose.set("useFindAndModify", false);

const options = {
  provider: "mapquest",
  apiKey: "	jkxgUmiUP7USj2NSAKqAF5VQ5CGU1GwJ",
  formatter: null,
};

const geocoder = NodeGeocoder(options);

// regex
const regexPassword = new RegExp(/(?=.*\d)(?=.*[a-zA-Z]).{8,}/);
const regexText = new RegExp(/[a-zA-Z ]+/);
const regexEmail = new RegExp(/(\w\.?)+@[\w\.-]+\.\w+/);
const regexDigit = new RegExp(/\d+/);
const regexAntiJS = new RegExp(/[^;<>]+/);

// To display the 'ready' vans
const getNearestVans = async (req, res) => {
  var from = "";
  var fromCheckout = false;
  if (req.query.from == "checkout") {
    from = req.query.from;
    fromCheckout = true;
  }
  result = await Van.find({ status: "ready" });
  const geocode = await geocoder.geocode("Melbourne");
  return res.render("user/nearestvansdefault", {
    user: req.user,
    geocode: geocode[0],
    vans_stringify: JSON.stringify(result),
    vans: result,
    from: from,
    fromCheckout: fromCheckout,
  });
};

// To display the nearest vans based on user's location
const postNearestVans = async (req, res) => {
  result = await Van.find({ status: "ready" });
  if (req.body.address) {
    const geocode = await geocoder.geocode(req.body.address);
    for (var i = 0; i < result.length; i++) {
      var distance = Math.sqrt(
        Math.pow(result[i].current_location[0] - geocode[0].latitude, 2) +
          Math.pow(result[i].current_location[1] - geocode[0].longitude, 2)
      );
      distance = parseFloat(distance.toFixed(4));
      Object.assign(result[i], { distance: distance });
    }
    result.sort(function (van1, van2) {
      return van1.distance - van2.distance;
    });
    var from = req.body.from;
    var fromCheckout = false;
    if (from == "checkout") {
      fromCheckout = true;
    }
    return res.render("user/nearestvans", {
      user: req.user,
      geocode: geocode[0],
      vans_stringify: JSON.stringify(result),
      vans: result,
      fromCheckout: fromCheckout,
    });
  }
};

// To go to the customer home page
const getHomePage = async (req, res) => {
  try {
    const menu = await Snack.find({});
    const sortedmenu = menu.sort(
      (obj1, obj2) => obj2.createdOn - obj1.createdOn
    );
    const newlyadded = sortedmenu.slice(0, 8);
    res.render("user/index", {
      menu: newlyadded,
      user: req.user,
    });
  } catch (err) {
    res.status(500).send(err);
  }
};

// Sign up requirements
const signUpAuth = async (req, res) => {
  // already implemented in frontend but checking again
  if (!req.body.firstname) {
    return res.render("user/sign-up", {
      success: false,
      message: "First name cannot be blank",
    });
  }
  if (!req.body.lastname) {
    return res.render("user/sign-up", {
      success: false,
      message: "Last name cannot be blank",
    });
  }
  if (!req.body.password) {
    return res.render("user/sign-up", {
      success: false,
      message: "Password cannot be blank",
    });
  }
  if (!req.body.email) {
    return res.render("user/sign-up", {
      success: false,
      message: "Email cannot be blank",
    });
  }

  if (regexPassword.test(req.body.password) == false) {
    return res.render("user/sign-up", {
      success: false,
      message:
        "Must contain atleast one alphabet character, one numerical digit (0-9), and at least 8 characters",
    });
  }

  if (regexText.test(req.body.firstname) == false) {
    return res.render("user/sign-up", {
      success: false,
      message: "Please enter only alphabetical characters on firstname",
    });
  }

  if (regexText.test(req.body.lastname) == false) {
    return res.render("user/sign-up", {
      success: false,
      message: "Please enter only alphabetical characters on lastname",
    });
  }
  if (regexEmail.test(req.body.email) == false) {
    return res.render("user/sign-up", {
      success: false,
      message: "Email needs to be in the format of name@email.com",
    });
  }

  // hashing password
  const hashedpassword = await bcrypt.hash(req.body.password, 10);
  // check if there is exsisting email
  User.find(
    {
      email: req.body.email,
    },
    (err, previousUsers) => {
      if (err) {
        return res.render("user/sign-up", {
          success: false,
          message: "Sever error",
        });
      } else if (previousUsers.length > 0) {
        return res.render("user/sign-up", {
          success: false,
          message: "Email already used",
        });
      } else {
        // saving to db
        const newUser = new User();
        newUser.email = req.body.email;
        newUser.firstname = req.body.firstname;
        newUser.lastname = req.body.lastname;
        newUser.password = hashedpassword;
        newUser.save((err, user) => {
          if (err) {
            res.render("user/sign-up", {
              success: false,
              message: "Sign up failed. Try Again",
            });
          }
          req.flash("message", "Sucessfully signed up");
          res.redirect("login");
        });
      }
    }
  );
};

// To edit customer's profile
const updateProfile = async (req, res) => {
  if (req.user.id != req.params.id) {
    return res.redirect("/error");
  }
  try {
    const id = req.params.id;
    if (!req.body.firstname || regexText.test(req.body.firstname) == false) {
      return res.render("user/editprofile", {
        success: false,
        user: req.user,
        message: "Firstname has to be alphabetical characters only",
      });
    }
    if (!req.body.lastname || regexText.test(req.body.lastname) == false) {
      return res.render("user/editprofile", {
        success: false,
        user: req.user,
        message: "Lastname has to be alphabetical characters only",
      });
    }
    if (req.body.phone) {
      if (regexDigit.test(req.body.phone) == false) {
        return res.render("user/editprofile", {
          success: false,
          user: req.user,
          message: "Phone number must be in the form of digits only",
        });
      }
    }
    if (req.body.address) {
      if (regexAntiJS.test(req.body.address) == false) {
        return res.render("user/editprofile", {
          success: false,
          user: req.user,
          message: "(;,<,>) not allowed",
        });
      }
    }
    const changes = req.body;
    const result = await User.findByIdAndUpdate(id, changes);
    res.redirect(`/user/${id}`);
  } catch (err) {
    console.log(err.message);
  }
};

// To display Customer's profile and past orders
const getProfile = async (req, res) => {
  try {
    if (req.user.id != req.params.id) {
      return res.redirect("user/error");
    }
    const orders = await Order.find({ orderedBy: req.params.id });
    orders.reverse();
    var order_arr = [];
    var item_arr = [];
    for (var i = 0; i < orders.length; i++) {
      if (typeof orders[i].items[0] == "object") {
        var curOrder = orders[i];
        var vendor = await Van.findById(curOrder.orderedTo);
        if (vendor.van_name != null) {
          curOrder["van_name"] = vendor.van_name;
        } else {
          // error handling
          curOrder["van_name"] = "Undefined";
        }
        order_arr.push(curOrder);
        var cart = new Cart(orders[i].items[0]);
        item_arr.push(cart.generateArray());
      }
    }
    var hasPastOrders = false;
    if (order_arr.length > 0) {
      hasPastOrders = true;
    }
    res.render("user/profile", {
      user: req.user,
      orders: order_arr,
      item_arr: item_arr,
      pastOrders: hasPastOrders,
    });
  } catch (err) {
    console.log(err.message);
  }
};

// To change customer's password
const changePassword = async (req, res) => {
  try {
    const id = req.user.id;
    console.log(req.body);
    if (
      !req.body.current_password ||
      !req.body.new_password ||
      !req.body.confirm_password
    ) {
      return res.render("user/changepassword", {
        success: false,
        message: "Fields cannot be blank",
        user: req.user,
      });
    }
    if (req.body.new_password != req.body.confirm_password) {
      return res.render("user/changepassword", {
        success: false,
        message: "Passwords do not match",
        user: req.user,
      });
    }
    if (regexPassword.test(req.body.new_password) == false) {
      return res.render("user/changepassword", {
        success: false,
        user: req.user,
        message:
          "Password must contain must contain atleast one alphabet character, one numerical digit (0-9), and at least 8 characters",
      });
    }
    bcrypt.compare(
      req.body.current_password,
      req.user.password,
      async (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          const hashedpassword = await bcrypt.hash(req.body.new_password, 10);
          const user = await User.findByIdAndUpdate(id, {
            password: hashedpassword,
          });
          res.redirect(`/user/${id}`);
        } else {
          return res.render("user/changepassword", {
            success: false,
            user: req.user,
            message: "Current password incorrect",
          });
        }
      }
    );
  } catch (err) {
    console.log(err.message);
  }
};

// To display checkout page
const getCheckout = async (req, res) => {
  if (!req.session.cart) {
    return res.redirect("/cart");
  }
  const cart = new Cart(req.session.cart);
  res.render("user/checkout", {
    items: cart.generateArray(),
    user: req.user,
    totalPrice: cart.totalPrice,
    van: req.session.vanChosen,
  });
};

// To display payment page
const getPayment = async (req, res) => {
  if (!req.session.cart) {
    return res.redirect("/cart");
  }
  const cart = new Cart(req.session.cart);
  res.render("user/payment", {
    items: cart.generateArray(),
    totalPrice: cart.totalPrice,
    user: req.user,
    totalPrice: cart.totalPrice,
    van: req.session.vanChosen,
  });
};

// Customer logout
const logout = async (req, res) => {
  try {
    const link = req.session.last_url;
    req.session.destroy(null);
    res.clearCookie(this.cookie, { path: "/" });
    req.logout();
    if (link) {
      return res.redirect(link);
    }
    return res.redirect("/");
  } catch (err) {
    console.log(err.message);
  }
};

// To get van's rating on customer app
const getRatings = async (req, res) => {
  try {
    const id = req.params.id;
    const van = await Van.findById(id);
    var ratings = await Rating.find({ van: van });
    var rating_arr = [];

    for (i = 0; i < ratings.length; i++) {
      rating_arr.push(ratings[i]);
      var user = await User.findById(ratings[i].writtenBy);
      var name = user.firstname + " " + user.lastname;
      rating_arr[i].customer = name;
    }

    return res.render("user/van-rating", {
      ratings: rating_arr,
      van: van,
      user: req.user,
    });
  } catch (err) {
    console.log(err.message);
  }
};

const getPartnerUp = async (req, res) => {
  res.render("user/partner-up", {
    user: req.user,
  });
};

module.exports.getRatings = getRatings;
module.exports.logout = logout;
module.exports.getPartnerUp = getPartnerUp;
module.exports.getPayment = getPayment;
module.exports.getCheckout = getCheckout;
module.exports.getNearestVans = getNearestVans;
module.exports.postNearestVans = postNearestVans;
module.exports.getHomePage = getHomePage;
module.exports.changePassword = changePassword;
module.exports.getProfile = getProfile;
module.exports.updateProfile = updateProfile;
module.exports.signUpAuth = signUpAuth;
