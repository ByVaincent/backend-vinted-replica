const express = require("express");
const router = express.Router();
const userCtrl = require("../controllers/user");
const fileUpload = require("express-fileupload");

//signup route
router.post("/user/signup", fileUpload(), userCtrl.signup);

//authentication route login
router.post("/user/login", userCtrl.login);
module.exports = router;
