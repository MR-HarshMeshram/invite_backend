const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    console.log('Authorization Header:', header);
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    console.log('Extracted Token:', token);

    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
    const user = await User.findById(decoded.sub).select("-__v");
    console.log('User from DB:', user);

    if (!user) return res.status(401).json({ message: "Invalid user" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized", error: err.message });
  }
};
