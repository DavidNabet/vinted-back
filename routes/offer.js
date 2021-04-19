const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const Offer = require("../models/Offer");
const cloudinary = require("cloudinary").v2;

// Filters
router.get("/offers", async (req, res) => {
  try {
    // Filter title --> { product_name: new RegExp(title, "i") }
    // Filter priceMax --> { product_price: { $lte: priceMax } }
    // Filter priceMin --> { product_price: { $gte: priceMax } }
    // Filter price interval ---> { product_price: { $lte: Number(priceMax), $gte: Number(priceMin) } }
    // Filter sort --> { product_price: sort === "price-asc" ? "asc" : "desc" }
    // Trying ternary method to fill find() -->
    // title
    // ? product_name: new RegExp(title, "i")
    // : priceMax
    // ? product_price: { $lte: priceMax }
    // : priceMin
    // ? product_price: { $gte: priceMax }
    // : priceMax && priceMin
    // ? product_price: { $lte: Number(priceMax), $gte: Number(priceMin) }
    // : {}
    const { title, priceMin, priceMax } = req.query;
    let filters = {};
    if (title) filters.product_name = new RegExp(title, "i");
    if (priceMin) filters.product_price = { $gte: priceMin };
    if (priceMax) filters.product_price = { $lte: priceMax };
    if (priceMax && priceMin)
      filters.product_price = { $lte: priceMax, $gte: priceMin };

    let sort = {};
    if (req.query.sort === "price-desc") {
      sort = { product_price: -1 };
    } else if (req.query.sort === "price-asc") {
      sort = { product_price: 1 };
    }

    let page;
    Number(req.query.page < 1) ? (page = 1) : (page = Number(req.query.page));

    let limit = Number(req.query.limit);
    const search = await Offer.find(filters)
      //sort ? { product_price: sort === "price-asc" ? 1 : -1 } : {}
      .sort(sort)
      .populate("owner", "account")
      //page < 1 ? 1 : limit * (page - 1)
      .skip((page - 1) * limit)
      .limit(limit);
    // .select("_id product_name product_price")

    const count = await Offer.countDocuments(filters);
    res.status(200).json({
      count: count,
      offers: search,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      condition,
      city,
      brand,
      size,
      color,
    } = req.fields;
    // console.log(req.user);

    if (req.fields || req.files) {
      let pictureToUpload = req.files.picture.path;
      const offer = new Offer({
        product_name: title,
        product_description: description,
        product_price: price,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ETAT: condition },
          { COULEUR: color },
          { EMPLACEMENT: city },
        ],
        owner: req.user,
      });
      // folder: `/vinted/offer/${offer._id}`,
      const result = await cloudinary.uploader.upload(pictureToUpload, {
        folder: "vinted",
      });
      offer.product_image = result;
      await offer.save();
      res.status(200).json(offer);
    } else {
      res.status(400).json({ message: "Remplissez chaque champ" });
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//Modifier une annonce
router.put("/offer/update/:id", isAuthenticated, async (req, res) => {
  // !DRY
  try {
    let pictureToUpload = req.files.picture.path;
    const {
      title,
      description,
      price,
      condition,
      city,
      brand,
      size,
      color,
    } = req.fields;

    const updateOffer = {};
    if (title) updateOffer.product_name = title;
    if (description) updateOffer.product_description = description;
    if (price) updateOffer.product_price = price;

    const details = updateOffer.product_details;
    for (let i = 0; i < details.length; i++) {
      if (details[i].MARQUE) {
        if (brand) {
          details[i].MARQUE = brand;
        }
      }
      if (details[i].TAILLE) {
        if (size) {
          details[i].TAILLE = size;
        }
      }
      if (details[i].ÉTAT) {
        if (condition) {
          details[i].ÉTAT = condition;
        }
      }
      if (details[i].COULEUR) {
        if (color) {
          details[i].COULEUR = color;
        }
      }
      if (details[i].EMPLACEMENT) {
        if (city) {
          details[i].EMPLACEMENT = city;
        }
      }
    }

    // Notifie Mongoose que l'on a modifié le tableau product_details
    offerToModify.markModified("product_details");

    // if (newTab.length > 0) updateOffer.product_details = newTab;
    if (req.user) updateOffer.owner = req.user;
    if (pictureToUpload) updateOffer.product_image = result.secure_url;

    if (pictureToUpload) {
      const result = await cloudinary.uploader.upload(pictureToUpload, {
        public_id: `api/vinted/offers/${updateOffer._id}/preview`,
      });
      updateOffer.product_image = result;
    }

    if (req.params.id) {
      if (req.fields || req.files) {
        const offer = await Offer.findByIdAndUpdate(
          req.params.id,
          { $set: updateOffer },
          { new: true }
        );
        res.status(201).json(offer);
      } else {
        res.status(400).json({ message: "Remplissez chaque champ" });
      }
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

//Supprimer une annonce
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    // Je veux supprimer l'image correspondant à l'id de l'annonce
    // await Offer.findOneAndRemove(req.params.id);
    const deleteOfferById = await Offer.findById(req.params.id);
    const cloudImgOffer = await cloudinary.api.delete_resources([
      deleteOfferById.product_image.public_id,
    ]);
    console.log(cloudImgOffer);
    await deleteOfferById.delete();
    res.status(200).json({ message: "Offer Removed" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/offer/:id", isAuthenticated, async (req, res) => {
  try {
    //Id de l'offre
    const offerId = await Offer.findById(req.params.id).populate(
      "owner",
      "account"
    );
    !offerId
      ? res.status(400).json({ message: "Cet offre n'existe plus !" })
      : res.status(200).json(offerId);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
