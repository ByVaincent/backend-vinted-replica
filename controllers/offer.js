const Offer = require("../models/Offer");
const User = require("../models/User");
const convertToBase64 = require("../utils/convertToBase64");
const cloudinary = require("cloudinary").v2;

//The user token is in req.token from the midlleware isAuthorized

const publishOffer = async (req, res) => {
  try {
    //check the datas
    if (
      !req.body.title ||
      !req.body.price ||
      !req.body.description ||
      req.body.title.length > 50 ||
      req.body.price > 100000 ||
      req.body.description.length > 500
    ) {
      throw {
        status: 400,
        message: "Add a valid title, a valid price, and a valid description",
      };
    }

    const owner = await User.findOne({ token: req.token });

    const newOffer = new Offer({
      product_name: req.body.title,
      product_description: req.body.description,
      product_price: req.body.price,
      product_details: [
        { MARQUE: req.body.brand },
        { TAILLE: req.body.size },
        { ÉTAT: req.body.condition },
        { COULEUR: req.body.color },
        { EMPLACEMENT: req.body.city },
      ],
      owner: owner._id,
    });

    //upload the picture(s) to cloudinary
    if (req.files !== null) {
      const picturesToUpload = req.files.picture;

      let uploadedPictures;

      if (picturesToUpload.length >= 2) {
        const arrayOfPromises = picturesToUpload.map((picture) => {
          return cloudinary.uploader.upload(convertToBase64(picture), {
            asset_folder: `/vinted/offers/${newOffer._id}`,
          });
        });

        uploadedPictures = await Promise.all(arrayOfPromises);
      } else {
        uploadedPictures = await cloudinary.uploader.upload(
          convertToBase64(picturesToUpload),
          {
            asset_folder: `/vinted/offers/${newOffer._id}`,
          }
        );
      }

      //add the datas from cloudinary to the newOffer
      newOffer.product_image = uploadedPictures;
    }

    await newOffer.save();

    res.json(newOffer);
  } catch (error) {
    res
      .status(error.status || 500)
      .json(error.message || "Internal server error");
  }
};

const updateOffer = async (req, res) => {
  try {
    //check the datas
    if (req.body.title && req.body.title.length > 50) {
      throw {
        status: 400,
        message: "Add a valid title, a valid price, and a valid description",
      };
    }

    if (req.body.description && req.body.description.length > 500) {
      throw {
        status: 400,
        message: "Add a valid title, a valid price, and a valid description",
      };
    }

    if (req.body.price && req.body.price > 100000) {
      throw {
        status: 400,
        message: "Add a valid title, a valid price, and a valid description",
      };
    }

    //find the offer to update
    const offerToUpdate = await Offer.findById(req.params.id)
      .populate("owner")
      .catch((error) => {
        throw { status: 400, message: "Invalid Id" };
      });

    if (req.token !== offerToUpdate.owner.token) {
      throw { status: 401, message: "Unauthorized" };
    }

    if (!offerToUpdate) {
      throw { status: 400, message: "No offer found" };
    }

    //check de keys to update
    for (key in req.body) {
      switch (key) {
        case "title":
          offerToUpdate.product_name = req.body[key];
          break;
        case "description":
          offerToUpdate.product_description = req.body[key];
          break;
        case "price":
          offerToUpdate.product_price = req.body[key];
          break;
        case "condition":
          offerToUpdate.product_details[2].ÉTAT = req.body[key];
          break;
        case "city":
          offerToUpdate.product_details[4].EMPLACEMENT = req.body[key];
          break;
        case "brand":
          offerToUpdate.product_details[0].MARQUE = req.body[key];
          break;
        case "size":
          offerToUpdate.product_details[1].TAILLE = req.body[key];
          break;
        case "color":
          offerToUpdate.product_details[3].COULEUR = req.body[key];
          break;
        case "pictureToDelete":
          break;
        default:
          throw { status: 400, message: `${req.body[key]} doesn't exist` };
      }
    }

    //Update de pictures
    const newPicturesArray = [];

    //Delete the pictures in cloudinary and in the offer
    //case only one picture
    if (typeof req.body.pictureToDelete === "string") {
      const deletedPiture = await cloudinary.uploader.destroy(
        req.body.pictureToDelete
      );

      offerToUpdate.product_image.forEach((picture) => {
        if (picture.public_id !== req.body.pictureToDelete) {
          newPicturesArray.push(picture);
        }
      });
      offerToUpdate.product_image = newPicturesArray;
    }
    //Case multiple pictures
    else if (typeof req.body.pictureToDelete === "object") {
      const picturesToDeleteArray = req.body.pictureToDelete;

      const arrayOfPromises = picturesToDeleteArray.map((pictureId) => {
        return cloudinary.uploader.destroy(pictureId);
      });

      const result = await Promise.all(arrayOfPromises);

      //update the product_image field
      offerToUpdate.product_image.forEach((picture) => {
        let varTest = false;
        picturesToDeleteArray.forEach((pictIdToDelete) => {
          if (picture.public_id === pictIdToDelete) {
            varTest = true;
          }
        });
        if (varTest === false) newPicturesArray.push(picture);
      });
      offerToUpdate.product_image = newPicturesArray;
    }

    //add the new pictures

    if (req.files) {
      //case 2 or more pictures
      if (req.files.newPicture.length >= 2) {
        const picturesToUpload = req.files.newPicture;

        const arrayOfPromises = picturesToUpload.map((picture) => {
          return cloudinary.uploader.upload(convertToBase64(picture), {
            asset_folder: `vinted/offers/${req.params.id}`,
          });
        });

        const result = await Promise.all(arrayOfPromises);

        //update the offer's object for the DB
        result.forEach((picture) => {
          offerToUpdate.product_image.push(picture);
        });
      }
    }

    console.log(offerToUpdate.product_image);

    // offerToUpdate.markModified("product_details");

    // await offerToUpdate.save();

    res.json("Product updated");
  } catch (error) {
    res
      .status(error.status || 500)
      .json(error.message || "Internal server error");
  }
};

const deleteOffer = async (req, res) => {
  try {
    if (!req.params.id) {
      throw { status: 400, message: "no id!" };
    }

    const offerToDelete = await Offer.findById(req.params.id)
      .populate("owner")
      .catch((error) => {
        throw { status: 400, message: "Id not found" };
      });

    //check the owner of the delete action
    if (offerToDelete.owner.token !== req.token) {
      throw { status: 401, message: "Unauthorized" };
    }

    await Offer.deleteOne({ _id: offerToDelete._id });

    //delete the pictures on cloudinary
    const picturesToDelete = offerToDelete.product_image;

    if (picturesToDelete.length !== 0) {
      const arrayOfPromises = picturesToDelete.map((picture) => {
        return cloudinary.uploader.destroy(picture.public_id);
      });

      const picturesDeleted = await Promise.all(arrayOfPromises);

      const deleteFolder = await cloudinary.api.delete_folder(
        `/vinted/offers/${offerToDelete._id}`
      );
    }

    res.json("Offer deleted");
  } catch (error) {
    res
      .status(error.status || 500)
      .json(error.message || "Internal server error");
  }
};

const getFilteredOffers = async (req, res) => {
  try {
    let { title, priceMin, priceMax, sort, page } = req.query;

    // prepare the pagination
    if (!page) {
      page = 1;
    }

    page = Number(page);

    const limit = 5;

    const skip = page - 1 < 0 ? 0 : (page - 1) * limit;

    // prepare the object for filtering the .find()
    const regExp = new RegExp(title, "i");

    const filterObject = {};
    title ? (filterObject.product_name = new RegExp(title, "i")) : null;

    const priceFilterObject = {};
    priceMin ? (priceFilterObject.$gte = Number(priceMin)) : null;
    priceMax ? (priceFilterObject.$lte = Number(priceMax)) : null;

    if (Object.keys(priceFilterObject).length !== 0) {
      filterObject.product_price = priceFilterObject;
    }

    //prepare the object fort sort()
    const sortObject = {};

    if (sort === "price-desc") {
      sortObject.product_price = "desc";
    } else if (sort === "price-asc") {
      sortObject.product_price = "asc";
    }

    const offerLength = await Offer.countDocuments(filterObject)
      .populate("owner", "account")
      .sort(sortObject)
      .skip(skip);

    const filteredOffers = await Offer.find(filterObject)
      .populate("owner", "account")
      .sort(sortObject)
      .skip(skip)
      .limit(limit)
      .select("product_name product_price");

    res.json({ count: offerLength, offers: filteredOffers });
  } catch (error) {
    res
      .status(error.status || 500)
      .json(error.message || "Internal server error");
  }
};

const getDetailsOffer = async (req, res) => {
  try {
    if (!req.params.id) {
      throw { status: 400, message: "Invalid id" };
    }

    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );

    const {
      _id,
      product_name,
      product_description,
      product_price,
      product_details,
      owner,
      product_image,
    } = offer;

    res.json({ product_details, owner, product_image });
  } catch (error) {
    res
      .status(error.status || 500)
      .json(error.message || "Internal server error");
  }
};
module.exports = {
  publishOffer,
  updateOffer,
  deleteOffer,
  getFilteredOffers,
  getDetailsOffer,
};
