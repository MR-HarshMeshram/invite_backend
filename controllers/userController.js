const User = require("../models/user");

exports.getTotalUsers = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    res.status(200).json({ totalUsers });
  } catch (error) {
    console.error("Error fetching total users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
