const mongoose = require("mongoose");
const { Schema } = require("mongoose");

const userSchema = new Schema({
  name: String,
  email: String,
  password: String,
  meals: [
    {
      type: Schema.Types.ObjectId,
      ref: "meal",
    },
  ],
  isAdmin: {
    type: Boolean,
    default: false,
  },
  resetToken: { type: String },
  resetTokenExpire: { type: Date },
});

const User = mongoose.model("user", userSchema);
module.exports = User;
