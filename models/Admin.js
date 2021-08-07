const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  jars: [
    {
      type: String,
      required: true,
    },
  ],
  user: [
    {
      type: mongoose.Types.ObjectId,
      ref: "user",
    },
  ],
  isVerified: {
    type: Boolean,
    default: false,
  },
  iotToken:{
    type: String,
    required : true,
  }
});

adminSchema.pre("save", function (next) {
  const admin = this;
  if (!admin.isModified("password")) {
    return next();
  }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(admin.password, salt, (err, hash) => {
      if (err) {
        return next(err);
      }
      admin.password = hash;
      next();
    });
  });
});

adminSchema.methods.comparePassword = function (candidatePassword) {
  const admin = this;
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, admin.password, (err, isMatch) => {
      if (err) {
        return reject(err);
      }
      if (!isMatch) {
        return reject(err);
      }
      resolve(true);
    });
  });
};

mongoose.model("Admin", adminSchema);
