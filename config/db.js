const mongoose = require("mongoose");
require("dotenv").config();
mongoose.set("strictQuery", true);
const connectDB = async () => {
  try {
    mongoose.connect(process.env.MONGODB_URI);
    console.log("connected to database");
  } catch (error) {
    console.log(error);
  }
};

module.exports = connectDB;
