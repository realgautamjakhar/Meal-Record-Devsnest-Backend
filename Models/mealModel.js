const mongoose = require("mongoose");
const { Schema } = mongoose;

const mealSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  name: {
    type: String,
  },
  time: {
    type: Date,
  },
  calories: {
    type: String,
  },
});
mealSchema.index({ name: "text", userId: "text" });
const Meal = mongoose.model("meal", mealSchema);

module.exports = Meal;
