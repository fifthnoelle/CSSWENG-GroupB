//ALL USER RELATED CONTROLLER FUNCTIONS
const UsersModel = require("../models/user.model");
const { hashPassword } = require("../utils/auth");
const bcrypt = require ("bcrypt");

const plainPassword = 'admin1234';
const saltRounds = 10;

/*
For creating bcrypt hash for testing purposes. 
Run this code generate the hash, then copy the output 
and use it as the password field when creating users 
directly in the database for testing login functionality.
bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
    console.log("Your bcrypt hash is:", hash);
    // Output will look similar to: $2b$10$... (copy this string)
});
*/

/*
    TODO: 
    - update user details (admin only)
    - delete user (admin only)
*/
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        //TODO: Authentication Implemntation
        const user = await UsersModel.findOne({ email });

        if (!user){ 
            return res.status(401).json({ error: "Invalid email"});
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch){
            return res.status(401).json({ error: "Invalid password"});
        }
        // Store session details (IS THIS NEEDED FOR IMPLEMENTATION YET? IF NOT JUST DELETE)
        req.session.email = user.email;
        req.session.role = user.role;
        req.session.userId = user._id;

        return res.status(200).json({ message: "Successful login", role: user.role})
        
    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const home = (req, res) => {
    res.status(200).json({ status: "OK", message: "RiceEnroll backend is running" });
};

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).json({ error: "Error logging out" });
            }
            res.redirect("/");
        });
    } catch (error) {
        console.error("Error in logout:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// getUser API to fetch currently logged-in user's details
const getUser = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        // Query database using the session's userId
        // .select("-password") ensures we don't send the hashed password to the frontend
        const user = await UsersModel.findById(req.session.userId).select("-password");
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error in getUser:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await UsersModel.find().select("-password");
        return res.status(200).json(users);
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

//ADMIN ONLY 
//Only admin can register new users. Route protected by admin authentication middleware in auth.js
const register = async (req, res) => {
    try {
        //Validate required fields
        const { email, firstName, lastName, password, role } = req.body;
        
        if (!email || !firstName || !lastName || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }
        
        //TODO: Check if user already exists
        const existingUser = await UsersModel.findOne({email});
        if (existingUser)
        {
            return res.status(409).json({ error: "User already exists with the same email" });
        }
        
        //Password hashing
        const hashedPassword = await hashPassword(password);
        
        const newUser = new UsersModel({
            email,
            firstName,
            lastName,
            password: hashedPassword, //TODO: hashedPassword
            role: role || 'staff'
        });
    
        await newUser.save();
        console.log("User created successfully:", email);
        res.status(201).json({ 
            message: "User created successfully",
            id: newUser._id,
            email: newUser.email
        });
        
    } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).json({ error: "Error creating user" });
    }
};

//Exports for routes
module.exports = {
    login,
    home,
    register,
    logout,
    getUser,
    getAllUsers
};
