const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: { type: String, required: true },
  product_description: { type: String, required: true },
  product_price: { type: Number, required: true },
  product_details: { type: Array },
  product_image: [Object],
  sold:{type: Boolean},
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

module.exports = Offer;
