const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: { type: String, required: true },
  account: {
    username: { type: String, required: true },
    avatar: Object,
  },
  newsletter: { type: Boolean, default: false },
  token: { type: String, required: true },
  hash: { type: String, required: true },
  salt: { type: String, required: true },
});

module.exports = User;
