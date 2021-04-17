const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  // console.log("Middleware");
  if (req.headers.authorization) {
    const token = req.headers.authorization.replace("Bearer ", "");
    const publish = await User.findOne({ token: token });
    // console.log(publish);
    if (!publish) {
      res.status(400).json({ error: "Connectez-vous !" });
    } else {
      req.user = publish;
      next();
    }
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

module.exports = isAuthenticated;
