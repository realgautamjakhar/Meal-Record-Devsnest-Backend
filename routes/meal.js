require("dotenv").config();

const express = require("express");
const userAuth = require("../middlewares/userAuth");
const Meal = require("../Models/mealModel");
const User = require("../Models/userModel");
const router = express.Router();

//>>> Get request for the user to fetch all the meal
router.get("/", userAuth, async (req, res) => {
  try {
    const { page, limit, calories, search } = req.query;
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    const skip = (pageNum - 1) * limitNum;

    //Filter
    let query = { userId: req.user.id };
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
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

router.get("/:id", userAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const meal = await Meal.findOne({ userId: req.user._id, _id: id });
    return res.status(200).json(meal);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

router.post("/", userAuth, async (req, res) => {
  try {
    let { name, time, calories } = req.body;

    if (!calories) {
      try {
        const response = await fetch(
          "https://trackapi.nutritionix.com/v2/natural/nutrients",
          {
            method: "POST",
            headers: {
              "x-app-id": process.env.NUTRITIONIX_X_ID,
              "x-app-key": process.env.NUTRITIONIX_X_KEY,
              "x-remote-user-id": 1,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              query: name,
            }),
          }
        );
        const result = await response.json();
        if (result.foods) {
          calories = result?.foods[0]?.nf_calories;
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: "Internal Server Error",
        });
      }
    }

    const meal = {
      userId: req.user._id,
      name,
      time,
      calories: calories ? calories : 250,
    };

    const createdMeal = await Meal.create(meal);

    return res.status(200).json({
      success: true,
      message: "Success",
      createdMeal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

router.put("/:id", userAuth, async (req, res) => {
  try {
    const mealId = req.params.id;

    const { name, time, calories } = req.body;

    const newMeal = {
      name,
      time,
      calories,
    };

    const updatedMeal = await Meal.updateOne(
      {
        _id: mealId,
        userId: req.user._id,
      },
      { $set: newMeal }
    );

    if (updatedMeal.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Meal with user not found",
      });
    } else if (updatedMeal.matchedCount >= 0) {
      return res.status(200).json({
        success: true,
        message: "Meal updated Successfully",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

// >>> Delete

router.delete("/:id", userAuth, async (req, res) => {
  try {
    const mealId = req.params.id;

    const deletedMeal = await Meal.deleteOne({
      _id: mealId,
      userId: req.user._id,
    });

    if (deletedMeal.deletedCount) {
      return res.status(200).json({
        success: true,
        message: "Deleted Successfully",
      });
    } else {
      return res.status(404).json({
        success: false,
        error: "Meal not found",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
});

module.exports = router;
