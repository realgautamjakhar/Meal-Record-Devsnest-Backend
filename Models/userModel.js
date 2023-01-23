const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const userSchema = new Schema({
  name: String,
  email: String,
  password: String,
  isAdmin: {
    type: Boolean,
    default: false,
  },
  resetToken: { type: String },
  resetTokenExpire: { type: Date },
});

const User = mongoose.model("user", userSchema);
module.exports = User;
