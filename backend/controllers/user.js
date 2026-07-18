const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const createAuthPayload = (user) => {
    const token = jwt.sign(
        { id: user._id.toString(), email: user.email, name: user.name },
        process.env.JWT_SECRET || "fallback-secret",
        { expiresIn: "1d" }
    );

    return {
        token,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
        },
    };
};

// Register User
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please fill all fields",
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        res.status(201).json({
            message: "User registered successfully",
            ...createAuthPayload(user),
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

// Login User
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please fill all fields",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid password",
            });
        }

        res.status(200).json({
            message: "Login successful",
            ...createAuthPayload(user),
        });
    } catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
};