const User = require("../models/User");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;

const convertToBase64 = require("../utils/convertToBase64");
const encryptingFunction = require("../utils/passwordCrypt").encryptingFunction;
const decryptingFunction = require("../utils/passwordCrypt").decryptingFunction;

const signup = async (req, res) => {
  try {
    console.log(req.body);

    //check the incoming datas
    if (!req.body.email) {
      throw { status: 400, message: "Please add a valid email" };
    } else if (!req.body.username) {
      throw { status: 400, message: "Please add a username" };
    } else if (!req.body.password || req.body.password.length < 5) {
      throw {
        status: 400,
        message: "Please add a valid password (> 4 characters)",
      };
    }

    //check if the mail is already used
    if (await User.findOne({ email: req.body.email })) {
      throw { status: 409, message: "This email is already used" };
    }

    //encrypt the incoming password
    const newPassword = await encryptingFunction(req.body.password);

    //generate the token
    const newToken = await uid2(64);

    const newUser = new User({
      email: req.body.email,
      account: {
        username: req.body.username,
      },
      newsletter: req.body.newsletter,
      token: newToken,
      hash: newPassword.hash,
      salt: newPassword.salt,
    });

    //upload de l'image si elle existe

    let uploadAvatar;
    if (req.files?.picture) {
      uploadAvatar = await cloudinary.uploader.upload(
        convertToBase64(req.files.picture),
        { asset_folder: `/vinted/users/${newUser._id}` }
      );
    }

    newUser.account.avatar = {
      secure_url: uploadAvatar ? uploadAvatar.secure_url : "",
      public_id: uploadAvatar ? uploadAvatar.public_id : "",
    };

    await newUser.save();

    res.status(201).json({
      message: "User succesfully created",
      _id: newUser._id,
      token: newUser.token,
      account: newUser.account,
    });
  } catch (error) {
    console.log(error);

    res
      .status(error.status || 500)
      .json(error.message || "Internal server error");
  }
};

const login = async (req, res) => {
  try {
    //check the incoming datas
    if (!req.body.email || !req.body.password) {
      throw { status: 400, message: "Please, add an email and a password" };
    }

    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      throw { status: 400, message: "Invalid email or password" };
    }

    //check if the password is good
    const authorized = decryptingFunction(
      req.body.password,
      user.salt,
      user.hash
    );

    if (!authorized) {
      throw { status: 401, message: "Invalid email or password" };
    }

    res.json({
      _id: user._id,
      token: user.token,
      account: {
        username: user.account.username,
      },
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json(error.message || "Internal server error");
  }
};

module.exports = { signup, login };
