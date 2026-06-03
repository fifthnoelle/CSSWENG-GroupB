//ALL USER RELATED CONTROLLER FUNCTIONS
const UsersModel = require("../models/user.model");
const { hashPassword } = require("../utils/auth");
const bcrypt = require ("bcrypt");

const getHome = (req, res) => {
    try {
        console.log("session email:", req.session.email);

        if (req.session.email) {
            return res.render("Home", {
                layout: "",
                title: "RiceNRoll Inventory | Home",
                css: ""
            });
        }

        return res.render("Home", { //TODO: Change to login page when implemented
            layout: "",
            title: "RiceNRoll Inventory | Log In",
            css: ""
        });
    } catch (error) {
        console.error("Error in getHome:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        //TODO: Authentication Implemntation
        const user = await UsersModel.findOne({email});

        if (!user){ 
            return res.status(401).json({ error: "Invalid email or password"});
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch){
            return res.status(401).json({ error: "Invalid email or password"});
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
    getHome,
    login,
    register,
    logout
};
