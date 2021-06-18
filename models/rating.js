const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const RatingSchema = new Schema({
  writtenBy: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  van: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  comment: {
    type: String,
    required: false,
  },
  rating: {
    type: Number,
    required: true,
  },
  order_id: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
});

const Rating = mongoose.model("Rating", RatingSchema);

module.exports = Rating;
