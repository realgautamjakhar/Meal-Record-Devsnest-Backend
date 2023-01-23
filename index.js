const express = require("express");
const connectDB = require("./config/db");
const PORT = 1338;
const app = express();

app.use(express.json());

app.use("/api/v1/user", require("./routes/user"));
app.use("/api/v1/admin", require("./routes/admin"));
app.use("/api/v1/meal", require("./routes/meal"));

app.listen(PORT, () => {
  console.log("server is running");
  connectDB();
});
