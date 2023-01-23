const express = require("express");

const jwt = require("jsonwebtoken");
const User = require("../Models/userModel");

const isAdmin = async (req, res, next) => {
  try {
    const isAdmin = req.user.isAdmin;
    if (!isAdmin) {
      return res.status(401).json({
        success: false,
        error: "Not Admin",
      });
    }
    next();
  } catch (error) {
    console.log(error);
  }
};

module.exports = isAdmin;
