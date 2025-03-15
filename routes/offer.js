const express = require("express");
const router = express.Router();
const offerCtrl = require("../controllers/offer");
const fileUpload = require("express-fileupload");
//middlewares import
const isAuthenticatedMiddl = require("../middlewares/isAuthenticated");

router.get("/offers", offerCtrl.getFilteredOffers);
router.post(
  "/offer/publish",
  isAuthenticatedMiddl,
  fileUpload(),
  offerCtrl.publishOffer
);
router.put(
  "/offer/update/:id",
  isAuthenticatedMiddl,
  fileUpload(),
  offerCtrl.updateOffer
);
router.delete("/offer/delete/:id", isAuthenticatedMiddl, offerCtrl.deleteOffer);

router.get("/offer/:id", offerCtrl.getDetailsOffer);
module.exports = router;
