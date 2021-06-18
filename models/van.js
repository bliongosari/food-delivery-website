const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const vanSchema = new Schema({
  email: {
    type: String,
    required: true,
  },
  van_name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
  rating: {
    type: Number,
  },
  current_location: {
    type: [Number],
    default: [-37.8136, 144.9631],
  },
  status: {
    type: String,
    default: "unavailable",
  },
  address: {
    type: String,
    default: "Melbourne CBD",
  },
  image: {
    type: String,
  },
  phone_number: {
    type: String,
  },
});

const Van = mongoose.model("Van", vanSchema);
module.exports = Van;
