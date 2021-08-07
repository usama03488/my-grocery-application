const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { jwtkey } = require("../keys")
const bcrypt = require("bcrypt");
const router = express.Router();
const fetch = require("node-fetch");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const { check, validationResult } = require("express-validator");
const User = mongoose.model("User");
const Admin = mongoose.model("Admin");
const emailVerification = require("../middleware/emailVerification");

router.post("/forgetPassword", async (req, res) => {
  const email = req.body.email;
  const admin = await Admin.findOne({ email: email });
  if (!admin) {
    res.send("Please Provide Correct Email");
  }
  const token = jwt.sign({ email: admin.email }, jwtkey, {
    expiresIn: "100m",
  });

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "Usama.shafiq03488@gmail.com",
      pass: "godis?111",
    },
  });

  let mailOptions = {
    from: "groceryapp@gmail.com",
    to: email,
    subject: "Reset Password Link",
    text: "To Reset Password Please Click The Link",
    html: `<a href="https://stark-dusk-55835.herokuapp.com/updatePassword/${token}/${email}">Click This Link to update Your Password</a>`,
  };

  transporter
    .sendMail(mailOptions)
    .then(function (response) {
      console.log("Email Sent!");
      res.send({ status: "Reset Link Sent To Your Email Account" });
    })
    .catch(function (error) {
      console.log("Error: ", error);
    });
});

router.get(
  "/updatePassword/:token/:email",
  emailVerification,
  async (req, res) => {
    console.log("I am In update password Route");
    global.email = req.params.email;
    res.render("index", { email: req.params.email.toLowerCase() });
  }
);

router.post("/createUser/:adminId", async (req, res) => {
  console.log(req.body.name, req.body.email, req.body.password);
  console.log("Admin ID: " + req.params.adminId);
  console.log("user signup request received");
  const { name, email, contact, password } = req.body;

  try {
    const user = new User({
      name,
      email,
      contact,
      password,
      admin: mongoose.Types.ObjectId(req.params.adminId.toString()),
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, jwtkey);

    const assignUser = await User.findOne({
      email: email,
    });
    console.log(assignUser);
    const admin = await Admin.findOne({ _id: req.params.adminId });
    let userArray = admin.user;
    userArray.push(mongoose.Types.ObjectId(assignUser.id));
    console.log(userArray);
    const updated = await Admin.updateOne(
      { _id: req.params.adminId },
      { user: userArray }
    );
    console.log(token);
    res.send({ token });
  } catch (err) {
    return res.send(err);
  }
});

router.post(
  "/updatePassword",
  urlencodedParser,
  [
    check("password", "This Password must me 3+ characters long")
      .exists()
      .isLength({ min: 3 }),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const alert = errors.array();
      res.render("index", {
        alert,
      });
    } else {
      bcrypt.hash(req.body.password, 10, async function (err, hash) {
        if (err) {
          console.log(err);
        } else {
          try {
            const admin = await Admin.updateOne(
              { email: req.body.email },
              { password: hash }
            );
            console.log(hash);
            res.send(
              `<h1>Password has been reset. Please proceed to login.</h1>`
            );
          } catch (e) {
            console.log(e);
          }
        }
      });
    }
  }
);



router.post("/adminSignup", async (req, res) => {
  console.log(req.body.name, req.body.email, req.body.password);
  console.log("Admin signup request received");
  const { name, email, contact, password, jars , iotToken } = req.body;
  try {
    const admin = new Admin({
      name,
      email,
      contact,
      password,
      jars,
      user: [],
      iotToken,
      isVarified: false,
    });
    await admin.save();
    const token = jwt.sign({ adminId: admin._id }, jwtkey, {
      expiresIn: "10m",
    });

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "usama.shafiq03488@gmail.com",
        pass: "godis?111",
      },
    });

    let mailOptions = {
      from: "groceryapp@gmail.com",
      to: email,
      subject: "Email Verification",
      cc: "Muhammad Haris",
      bcc: "AMmar Ahmed",
      text: "Please Verify Your Email By Clicking",
      html: `<a href="https://stark-dusk-55835.herokuapp.com/confirmAdminSignup/${token}/${email}">Click This Link to verify your Email</a>`,
    };

    transporter
      .sendMail(mailOptions)
      .then(function (response) {
        console.log("Email Sent!");
        res.send("Verification email sent to your Email Account");
      })
      .catch(function (error) {
        console.log("Error: ", error);
      });
  } catch (err) {
    return res.send(err);
  }
});

router.get(
  "/confirmAdminSignup/:token/:email",
  emailVerification,
  async (req, res) => {
    await Admin.updateOne({ email: req.params.email }, { isVerified: true });

    res.send(`<h1>Email Verified...!  </h1> <br> <h1>Please Proceed to login</h1>`);
  }
);

router.get("/sendMail/:adminId", async (req, res) => {
  console.log("Send Mail Req Received!");
  const { adminId } = req.params;
  console.log(adminId);
  await Admin.findOne({ _id: adminId }, async (err, admin) => {
    const email = admin.email;
    console.log(email);
    if (err) {
      console.log("Mail Not Found");
    } else {
      console.log("Email Found!");
      
      let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "Usama.shafiq03488@gmail.com",
          pass: "godis?111",
        },
      });

      let mailOptions = {
        from: "Usama.shafiq03488@gmail.com",
        to: email,
        subject: "Auto Grocery App",
        text: "Jar is Full",
      };

      transporter
        .sendMail(mailOptions)
        .then(function (response) {
          console.log("Email Sent!");
          res.send("res sent!");
        })
        .catch(function (error) {
          console.log("Error: ", error);
        });
    }
  });
});

router.post("/adminSignin", async (req, res) => {
  console.log("admin lognin request Received");
  const { email, password } = req.body;
  console.log(password)
  if (!email || !password) {
    return res.status(422).send({ error: "must provide email and password1" });
  }
  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res.status(422).send({ error: "This user Doesn't Exist" });
  }
  try {
    await admin.comparePassword(password);
    const token = jwt.sign({ adminId: admin._id }, jwtkey, {
      expiresIn: "30days",
    });
    const adminId = admin.id;
    const iotToken = admin.iotToken;
    const storageData = [adminId, token , iotToken];
    res.send(storageData);
  } catch (err) {
    return res.status(422).send({ error: "Something is wrong" });
  }
});

router.get("/getHomeData/:adminId", async (req, res) => {
  console.log('s1');
  const adminId = req.params.adminId;
  const getJarsArray1 = await getJarsArray(adminId);
  const admin=await Admin.findOne({_id : adminId});
  const iotToken = admin.iotToken;
  const getValues1 = await getValues(iotToken);
  console.log(iotToken)
  var responseArray = [];
  for (let i = 0; i < getJarsArray1.length; i++) {
    var newObject = {
      key: getJarsArray1[i],
      value: getValues1[i],
      iotToken: iotToken,
    };
    responseArray.push(newObject);
  }
  console.log(responseArray);
  res.send(responseArray);
});

const getJarsArray = async (id) => {
  return new Promise(async (resolve, reject) => {
    await Admin.find({ _id: id }, function (err, adminUsers) {
      var responseArray = [];
      for (var i = 0; i < adminUsers.length; i++) {
        for (var j = i; j < adminUsers[i].jars.length; j++) {
          responseArray.push(adminUsers[i].jars[j]);
        }
      }
      resolve(responseArray);
    });
  });
};

const getValues = async (iotToken) => {
  return new Promise(async (resolve, reject) => {
    var newArray = [];
    fetch(`https://demo.thingsboard.io/api/v1/${iotToken}/attributes`)
      .then((res) => res.json())
      .then((data) => {
        for (var key in data.client) {
          if (data.client.hasOwnProperty(key)) {
            newArray.push(data.client[key]);
          } else {
            return { status: "No Jar Exists" };
          }
        }
        resolve(newArray);
      })
      .catch((e) => console.log("error", e));
  });
};

router.put("/deleteJarItem/:adminId/:jarName", function (req, res) {
  console.log("I reached delete jar item route");
  const id = req.params.adminId;
  const jarName = req.params.jarName;
  Admin.findOne({ _id: id }, async (err, adminUsers) => {
    const jar_index = adminUsers.jars;
    console.log(jar_index.indexOf(jarName));
    const jarIndex = jar_index.indexOf(jarName);

    var handleCaseArray = [];
    var newJarArray = [];

    if (jarIndex === 0) {
      handleCaseArray = adminUsers.jars;
      handleCaseArray.shift();
      newJarArray = handleCaseArray;
      console.log("First Case: " + newJarArray);
    } else if (jarIndex + 1 === adminUsers.jars.length) {
      handleCaseArray = adminUsers.jars;
      handleCaseArray.pop();
      newJarArray = handleCaseArray;
      console.log("Second Case: " + newJarArray);
    } else {
      var firstArray = [];
      var secondArray = [];
      firstArray = adminUsers.jars.slice(0, jarIndex);
      console.log("i am first array  :" + firstArray);
      secondArray = adminUsers.jars.slice(jarIndex + 1);
      console.log("i am second array :" + secondArray);
      newJarArray = firstArray.concat(secondArray);
      console.log("Third Case: " + newJarArray);
    }
    const updatedJars = await Admin.updateOne(
      { _id: id },
      { jars: newJarArray }
    );

    res.send(updatedJars);
  });
});

router.put("/addJar/:adminId", function (req, res) {
  console.log("I reached add jar item route");
  const id = req.params.adminId;
  const toBeAdded = req.body.jarName;

  Admin.findOne({ _id: id }, async (err, adminUsers) => {
    const jarsArray = adminUsers.jars;
    jarsArray.push(toBeAdded);
    const updatedJars = await Admin.updateOne({ _id: id }, { jars: jarsArray });
    res.send(updatedJars);
  });
});

router.get("/getAdminUsers/:adminId", function (req, res) {
  console.log("I reached admin's users route");
  const id = req.params.adminId;
  console.log(id);
  User.find({ admin: id }, function (err, adminUsers) {
    var newUsersInfo = [];
    var newUser = {
      userName: "",
      userEmail: "",
      contact: "",
    };
    for (i = 0; i < adminUsers.length; i++) {
      newUser = {
        userName: adminUsers[i].name,
        userEmail: adminUsers[i].email,
        contact: adminUsers[i].contact,
      };
      newUsersInfo[i] = newUser;
    }
    res.send(newUsersInfo);
  });
});

router.get("/history/:name/:iotToken", async (req, res) => {
  const name = req.params.name;
  const iotToken = req.params.iotToken;

  fetch(`https://demo.thingsboard.io/api/v1/${iotToken}/attributes`)
    .then((res) => res.json())
    .then((data) => {
      for (var key in data.client) {
        if (data.client.hasOwnProperty(key)) {
          if (key === name) {
            res.send({ status: data.client[key] });
          }
        } else {
          res.send({ status: "Jar is not present" });
        }
      }
    });
 
});

router.post("/userSignin", async (req, res) => {
  console.log("user lognin request Received");
  const { email, password } = req.body;
  console.log("im server side email: " + email);
  if (!email || !password) {
    return res.status(422).send({ error: "must provide email and password1" });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(422).send({ error: "This user Doesn't Exist" });
  }
  try {
    await user.comparePassword(password);

    const token = jwt.sign({ userId: user._id }, jwtkey, {
      expiresIn: "30days",
    });
    const userId = user.id;
    const adminId = user.admin;
    const storageData = [userId, adminId, token];
    res.send(storageData);
  } catch (err) {
    return res.status(422).send({ error: "Something is wrong" });
  }
});

router.get("/see", async (req, res) => {
  console.log("see request received");
  const user = await Admin.find({}).populate({ path: "user", model: "User" });
  res.json(user);
});

router.post("/adminSignup", async (req, res) => {
  console.log(req.body.name, req.body.email, req.body.password);
  console.log("Admin signup request received");
  const { name, email, contact, password, jars } = req.body;
  try {
    const admin = new Admin({
      name,
      email,
      contact,
      password,
      jars,
      user: [],
    });
    await admin.save();
    const token = jwt.sign({ adminId: admin._id }, jwtkey);
    console.log(token);
    res.send({ token });
  } catch (err) {
    return res.send(err);
  }
});

router.post("/createUser/:adminId", async (req, res) => {
  console.log(req.body.name, req.body.email, req.body.password);
  console.log("Admin ID: " + req.params.adminId);
  console.log("user signup request received");
  const { name, email, contact, password } = req.body;
  try {
    const user = new User({
      name,
      email,
      contact,
      password,
      admin: mongoose.Types.ObjectId(req.params.adminId.toString()),
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, jwtkey);

    const assignUser = await User.findOne({
      email: email,
    });
    console.log(assignUser);
    const admin = await Admin.findOne({ _id: req.params.adminId });
    let userArray = admin.user;
    userArray.push(mongoose.Types.ObjectId(assignUser.id));
    console.log(userArray);
    const updated = await Admin.updateOne(
      { _id: req.params.adminId },
      { user: userArray }
    );
    console.log(token);
    res.send({ token });
  } catch (err) {
    return res.send(err);
  }
});

module.exports = router;
