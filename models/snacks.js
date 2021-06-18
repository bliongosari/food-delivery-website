const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SnackSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  image_url: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
});

const Snacks = mongoose.model("Snacks", SnackSchema);

module.exports = Snacks;
