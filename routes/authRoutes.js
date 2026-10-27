const express = require("express");
const crypto = require("crypto");
const User = require("../models/User");

const router = express.Router();

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    try {
        const [salt, storedHash] = stored.split(":");
        const hash = crypto.scryptSync(password, salt, 64).toString("hex");
        return crypto.timingSafeEqual(
            Buffer.from(hash, "hex"),
            Buffer.from(storedHash, "hex")
        );
    } catch (error) {
        return false;
    }
}

router.post("/login", async (req, res) => {
    try {
        const username = String(req.body.username || "").trim().toLowerCase();
        const password = String(req.body.password || "");

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: "Username and password are required."
            });
        }

        const user = await User.findOne({ username }).lean();

        if (user) {
            if (!verifyPassword(password, user.passwordHash)) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid username or password."
                });
            }

            return res.json({
                success: true,
                message: "Login successful.",
                user: {
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        }

        const adminUsername = String(
            process.env.ADMIN_USERNAME || "admin"
        ).trim().toLowerCase();

        const adminPassword =
            process.env.ADMIN_PASSWORD || "admin123";

        if (username === adminUsername && password === adminPassword) {
            return res.json({
                success: true,
                message: "Login successful.",
                user: {
                    name: "Administrator",
                    username: adminUsername,
                    role: "admin"
                }
            });
        }

        return res.status(401).json({
            success: false,
            message: "Invalid username or password."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post("/register", async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const username = String(req.body.username || "").trim().toLowerCase();
        const email = String(req.body.email || "").trim().toLowerCase();
        const password = String(req.body.password || "");
        const confirmPassword = String(req.body.confirmPassword || "");

        if (!name || !username || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid email address."
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters."
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        const existingUsername = await User.findOne({ username }).lean();
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                message: "Username already exists."
            });
        }

        const existingEmail = await User.findOne({ email }).lean();
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                message: "Email already exists."
            });
        }

        const user = await User.create({
            name,
            username,
            email,
            passwordHash: hashPassword(password),
            role: "staff"
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully.",
            user: {
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Username or email already exists."
            });
        }

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post("/forgot-password", async (req, res) => {
    try {
        const username = String(req.body.username || "").trim().toLowerCase();
        const email = String(req.body.email || "").trim().toLowerCase();
        const newPassword = String(req.body.newPassword || "");
        const confirmPassword = String(req.body.confirmPassword || "");

        if (!username || !email || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "All fields are required."
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters."
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        const user = await User.findOne({ username, email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Username and email do not match any account."
            });
        }

        user.passwordHash = hashPassword(newPassword);
        await user.save();

        res.json({
            success: true,
            message: "Password reset successfully. You can now login."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
