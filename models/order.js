const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  orderedBy: {
    type: Schema.Types.ObjectId, ref: 'User',
    required: true,
  },
  items: {
    type: [{}],
    required: true,
  },
  orderedTo: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  status: {
    type: String,
    default: "In Progress",
  },
  discounted: {
    type: Boolean,
    default: false,
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
});

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order;
