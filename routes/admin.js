const express = require("express");
const isAdmin = require("../middlewares/isAdmin");
const userAuth = require("../middlewares/userAuth");
const Meal = require("../Models/mealModel");
const User = require("../Models/userModel");
const router = express.Router();

// >>> Get
router.get("/meal", userAuth, isAdmin, async (req, res) => {
  try {
    const { page, limit, calories, search } = req.query;
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    if (calories) {
      query.calories = { $gte: parseInt(calories) };
    }
    if (search) {
      query = {
        ...query,
        $or: [{ name: { $regex: new RegExp(search, "i") } }],
      };
    }
    const meals = await Meal.find(query).skip(skip).limit(limitNum);
    const total = await Meal.countDocuments(query);
    return res.status(200).json({ meals, total });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

router.get("/users", userAuth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().limit(20);
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

router.get("/stats", userAuth, isAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const mealCount = await Meal.countDocuments();
    const adminCount = await User.find({ isAdmin: true }).countDocuments();

    return res.status(200).json({ userCount, mealCount, adminCount });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

router.get("/privilege/:id", userAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(404).json({
        success: false,
        error: "Provide id",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User Does't exist with specified id",
      });
    }

    if (user.isAdmin) {
      await User.findByIdAndUpdate(user._id, {
        isAdmin: false,
      });

      return res.status(200).json({
        success: true,
        message: `${user.name} is Demoted to User`,
      });
    } else {
      await User.findByIdAndUpdate(user._id, {
        isAdmin: true,
      });
      return res.status(200).json({
        success: true,
        message: `${user.name} is Promoted to Admin`,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

// >>> Delete meals
router.delete("/meal/:id", userAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(404).json({
        success: false,
        error: "Provide Id",
      });
    }

    // >>> Find the meal in database
    const meal = await Meal.findById(id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        error: "Meal with id provided not found",
      });
    }

    // >>> Deleting the meal in meal collection
    await Meal.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Deleted Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

module.exports = router;
