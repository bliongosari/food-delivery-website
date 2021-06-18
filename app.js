const express = require("express");
const app = express();
const hbs = require("hbs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("req-flash");
const passport = require("passport");
const Snack = require("./models/snacks");
const Van = require("./models/van");
const User = require("./models/user");
const Order = require("./models/order");
const Cart = require("./models/cart");
const NodeGeocoder = require("node-geocoder");
const MongoStore = require("connect-mongo")(session);
const expressHbs = require("express-handlebars");
require("dotenv").config();

// global variables
global.IN_PROGRESS = "In Progress";
global.READY = "Ready";
global.FULFILLED = "Fulfilled";
global.CANCELLED = "Cancelled";

//Routes
const userRoute = require("./routes/userRoute");
const vendorRoute = require("./routes/vendorRoute");
const orderRoute = require("./routes/orderRoute");
const cartRoute = require("./routes/cartRoute");

// controllers
const userController = require("./controllers/user_controller");
const menuController = require("./controllers/menu_controller");
const cart = require("./models/cart");

// mongoose connection
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// options for maps api
const options = {
  provider: "mapquest",
  apiKey: "	jkxgUmiUP7USj2NSAKqAF5VQ5CGU1GwJ",
  formatter: null,
};

// middlewares and set
require("./config/passport-config")(passport);
const auth = require("./config/auth");
app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: { maxAge: 120 * 60 * 1000 },
  })
);
app.use(flash());
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("views/images"));
app.use(function (req, res, next) {
  res.locals.login = req.isAuthenticated;
  res.locals.session = req.session;
  next();
});

app.set("view engine", "hbs");
const pubDirectoryPath = path.resolve(__dirname, "public");
app.use(express.static(pubDirectoryPath));

dotenv.config();
const geocoder = NodeGeocoder(options);

// partials
hbs.registerPartials(__dirname + "/views/partials");

// helpers
const getItems = require("./helpers/getItems");
const getTotal = require("./helpers/getTotal");
const ifReady = require("./helpers/ifReady");
const ifNotReady = require("./helpers/ifNotReady");
const setRating = require("./helpers/setRating");

app.get("/", auth.isNotVendorAccount, userController.getHomePage);
app.get("/nearestvans", auth.isNotVendorAccount, userController.getNearestVans);
app.post(
  "/nearestvans",
  auth.isNotVendorAccount,
  userController.postNearestVans
);
app.get("/menu", auth.isNotVendorAccount, menuController.getMenu);
app.get("/partner-up", auth.isNotVendorAccount, userController.getPartnerUp);
app.get(
  "/checkout",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  userController.getCheckout
);
app.get(
  "/payment",
  auth.isNotVendorAccount,
  auth.isUserLoggedIn,
  userController.getPayment
);

// routes
app.use("/order", orderRoute);
app.use("/user", userRoute);
app.use("/vendor", vendorRoute);
app.use("/cart", cartRoute);

// error route
app.get("/error", async (req, res) => {
  res.status(404).render("user/error", {
    message: "You are not authorized to view this page",
  });
});

// if route not found
app.all("*", (req, res) => {
  res.status(404).render("user/error", {
    message: "Sorry. Route not found.",
  });
});

PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log("Backend on port " + PORT));

module.exports = app;
