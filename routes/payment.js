const express = require ("express");
const router = express.Router()
const isAuthenticated = require ("../middlewares/isAuthenticated")
const paymentCtrl = require ("../controllers/payment")

router.post("/create-intent", paymentCtrl.intent)


module.exports = router;