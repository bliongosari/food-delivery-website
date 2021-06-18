const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Van = require("../models/van");
const User = require("../models/user");

module.exports = function (passport) {
  // strategy for customer
  passport.use(
    "user",
    new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
      User.findOne({
        email: email,
      })
        .then((user) => {
          if (!user) {
            return done(null, false, { message: "Email is not registered" });
          }
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Password incorrect" });
            }
          });
        })
        .catch((err) => console.log(err));
    })
  );
  passport.use(
    // strategy for van
    "van",
    new LocalStrategy(
      { usernameField: "van_name" },
      (van_name, password, done) => {
        Van.findOne({
          van_name: van_name,
        })
          .then((van) => {
            if (!van) {
              return done(null, false, {
                message: "Van name is not registered",
              });
            }
            bcrypt.compare(password, van.password, (err, isMatch) => {
              if (err) throw err;
              if (isMatch) {
                return done(null, van);
              } else {
                return done(null, false, { message: "Password incorrect" });
              }
            });
          })
          .catch((err) => console.log(err));
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    const userExist = await User.exists({ _id: id });
    if (userExist) {
      User.findById(id, (err, user) => {
        done(err, user);
      });
    } else {
      Van.findById(id, (err, user) => {
        done(err, user);
      });
    }
  });
};
