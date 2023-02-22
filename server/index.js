const express = require("express");
const cors = require("cors");
const db = require("./models/index");
const app = express();

// var corsOptions = {
//   origin: "http://localhost:8080",
// };

app.use(cors());

db.sequelize
  .sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

// parse requests of content-type - application/json
app.use(express.json({ extended: true, limit: "30mb" }));

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true, limit: "30mb" }));

require("./routes/user.route")(app);
require("./routes/post.route")(app);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
