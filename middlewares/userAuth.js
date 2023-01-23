const express = require("express");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");

const userAuth = async (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization;
    if (!bearerToken) {
      return res.status(400).json({
        success: false,
        err: "Authorization failed",
      });
    }
    const token = bearerToken.split(" ")[1];

    if (!token) {
      return res.status(403).json({
        success: false,
        err: "Authorization failed",
      });
    }

    if (token) {
      const decordedData = jwt.verify(token, process.env.JWT_SECRET);
      const existingUser = await User.findById(decordedData.user.id);
      if (!existingUser) {
        return res.status(400).json({
          success: false,
          error: "User doesnt exist",
        });
      }
      req.user = existingUser;
      next();
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

module.exports = userAuth;
