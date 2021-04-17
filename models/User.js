const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: {
    type: String,
    unique: true,
  },
  account: {
    username: {
      type: String,
      required: true,
    },
    phone: String,
    avatar: Object, // nous verrons plus tard comment uploader une image
  },
  token: String,
  hash: String,
  salt: String,
});

module.exports = User;
