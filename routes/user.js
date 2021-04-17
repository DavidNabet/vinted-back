const express = require("express");
const User = require("../models/User");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const cloudinary = require("cloudinary").v2;
const router = express.Router();

router.post("/signup", async(req, res) => {
    try {
        const { email, username, phone, password } = req.fields;

        let userExist = await User.findOne({ email });
        if (!userExist) {
            if (username && password) {
                // le salt
                const salt = uid2(16);
                // le password hashé
                const hashPassword = SHA256(salt + password).toString(encBase64);
                //le token
                const token = uid2(64);
                const result = await cloudinary.uploader.upload(req.files.avatar.path, {
                    folder: "vinted",
                });

                const user = new User({
                    email,
                    token: token,
                    account: {
                        username,
                        phone,
                        avatar: result.secure_url,
                    },
                    hash: hashPassword,
                    salt: salt,
                });

                await user.save();
                res.status(200).json({
                    _id: user._id,
                    email: user.email,
                    token: user.token,
                    account: user.account
                });
            } else {
                return res.status(400).json({ error: "Incorrect credentials" });
            }
        } else {
            return res.status(400).json({ error: "User already exists" });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post("/login", async(req, res) => {
    try {
        const { email, password } = req.fields;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: "Invalid Credentials" });
        } else {
            const newHash = SHA256(user.salt + password).toString(encBase64);
            //   console.log(newHash);
            if (user.hash === newHash) {
                res.status(200).json({
                    _id: user._id,
                    token: user.token,
                    account: {
                        username: user.account.username,
                        phone: user.account.phone,
                    },
                });
            } else {
                res.status(401).json({ message: "Incorrect Password" });
            }
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;