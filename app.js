const express = require("express");
var cors = require("cors");
const mongoose = require("mongoose");
var path = require("path");
const app = express();
const PORT = process.env.PORT || 3001;
const { mongoUrl } = require("./keys");

var server = require("http").createServer(app)

require("./models/Admin");
require("./models/User")

const requireToken = require("./middleware/requireToken");
const authRoutes = require("./routes/authRoutes");
app.use(cors());
app.use(
  express.json({limit: '50mb',
    type: ["application/json", "text/plain"],
  })
);
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(authRoutes);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");
app.set("view engine", "ejs");

mongoose.connect(mongoUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

mongoose.connection.on("connected", () => {
  console.log("connected to mongo");
});

mongoose.connection.on("error", (err) => {
  console.log("its a connection error", err);
});

app.get("/", requireToken, (req, res) => {});


server.listen(PORT);
console.log("server running on port " + PORT)
