const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = mongoose.model("User");
const { jwtkey } = require("../keys");

module.exports = (req, res, next) => {
  const token = req.params.token;
  console.log("I am in ev middleware");

  jwt.verify(token, jwtkey, async (err, payload) => {
    if (err) {
      return res.status(401).send({ error: "token is tempered" });
    }
    next();
  });
};
