require("dotenv").config();
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const sendMail = require("../utils/sendEmail");
const {
  validateName,
  validateEmail,
  validatePassword,
} = require("../utils/validator");

const userAuth = require("../middlewares/userAuth");
const User = require("../Models/userModel");

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;

    if (!email || !name || !password) {
      return res.status(403).json({
        success: false,
        error: "Please fill Required Fields",
      });
    }

    //Validation
    if (!validateName(name)) {
      return res.status(200).json({
        success: false,
        error: "Please Enter name",
      });
    }

    if (!validateEmail(email)) {
      return res.status(200).json({
        success: false,
        error: "Please Enter valid email",
      });
    }
    if (!validatePassword(password)) {
      return res.status(200).json({
        success: false,
        error:
          "Please Enter valid Password with length of 6 contain atleast one digit and special character",
      });
    }

    const existingUser = await User.findOne({ email: email });

    if (existingUser) {
      return res.status(406).json({
        success: false,
        error: "User already exist",
      });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const user = {
      email,
      name,
      password: encryptedPassword,
      isAdmin,
    };

    await User.create(user);

    return res.status(200).json({
      success: true,
      message: "Account Created Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error,
    });
  }
});

//signIn
router.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(403).json({
        success: false,
        error: "Please fill Required Fields",
      });
    }

    if (!validateEmail(email)) {
      return res.status(200).json({
        success: false,
        error: "Invalid email",
      });
    }
    if (!validatePassword(password)) {
      return res.status(200).json({
        success: false,
        error:
          "Please Enter valid Password with length of 6 contain atleast one digit and special character",
      });
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not Found",
      });
    }

    const comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword) {
      return res.status(400).json({
        success: false,
        error: "Please enter Valid Credientials",
      });
    }

    const payload = {
      user: {
        id: user._id,
      },
    };
    const token = await jwt.sign(payload, process.env.JWT_SECRET);

    const options = {
      expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: false,
      sameSite: "none",
    };
    return res
      .status(200)
      .cookie("token", token, options)
      .json({
        token,
        success: true,
        message: `Welcome ${user.name}`,
        user: {
          name: user.name,
          email: user.email,
          id: user._id,
          createdAt: user.timeStamp,
        },
      });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error,
    });
  }
});

// Get user
router.get("/me", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "Unable to find User Please login Again",
      });
    }
    return res.status(200).json({ success: true, message: "Logged In", user });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error,
    });
  }
});

//signOut
router.get("/signout", async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({
      success: true,
      message: "SignOut Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error,
    });
  }
});

//Forget Passwword
router.post("/forget-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "User doesnt Exist with this email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpire = Date.now() + 10 * 60 * 1000; // expires in 10 minutes

    const updateUser = await User.updateOne(
      { _id: user._id },
      { $set: { resetToken, resetTokenExpire } }
    );

    if (updateUser.modifiedCount === 1) {
      const link = `${process.env.FRONTEND_RESETPASSWORD_LINK}/resetpassword/${resetToken}`;
      const message = `<p>Your Reset Link is ${link} </p>`;
      await sendMail({ to: user.email, subject: "Reset Link", message });
      return res.status(200).json({
        success: true,
        message: `Reset Link sent to ${user.email}`,
        link,
      });
    } else {
      return res.status(501).json({
        success: false,
        error: `Something Went Wrong`,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error,
    });
  }
});

//Reset Passwword
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!validatePassword(password)) {
      return res.status(200).json({
        success: false,
        error:
          "Please Enter valid Password with length of 6 contain atleast one digit and special character",
      });
    }

    //Find user in database
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Invalid or expired token" });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    //Update user and reset token and time to null
    const updateUser = await User.updateOne(
      { _id: user._id },
      {
        $set: {
          password: encryptedPassword,
          resetToken: null,
          resetTokenExpire: null,
        },
      }
    );

    //If updated reture 200 or 500 if failed
    if (updateUser.modifiedCount === 1) {
      return res.status(200).json({
        success: true,
        message: "Password Updated Successfully",
      });
    } else {
      return res.status(501).json({
        success: false,
        error: `Something Went Wrong`,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error,
    });
  }
});

module.exports = router;
