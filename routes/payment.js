const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_API_KEY_SECRET);
const router = express.Router();

router.post("/payment", async (req, res) => {
  try {
    // Recevoir un stripeToken
    // console.log(req.fields.stripeToken);
    // Envoyer le token à l'API Stripe
    // Pour sécuriser au max les choses : chercher en BDD le prix du produit acheté
    // console.log(req.fields);
    const response = await stripe.charges.create({
      amount: req.fields.priceOffer * 100,
      currency: "eur",
      description: req.fields.descriptionOffer,
      source: req.fields.stripeToken,
    });
    // Recevoir une réponse de l'API Stripe
    // console.log(response);
    if (response.status === "succeeded") {
      res.status(200).json({ message: "Paiement validé" });
    } else {
      res.status(400).json({ message: "An error occured" });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
