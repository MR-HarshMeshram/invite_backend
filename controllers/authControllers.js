const { signAccessToken, signRefreshToken } = require("../utils/jwttoken");

exports.googleCallbackHandler = (req, res) => {
  // user is attached by Passport (session: false)
  const user = req.user;

  const payload = { sub: user.id, email: user.email, name: user.name };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // httpOnly cookie for refresh token (optional but recommended)
  res.cookie("rtk", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // send access token in JSON (frontend stores in memory or secure storage)
  /*return res.json({
    message: "Logged in with Google",
    accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
    },
  });*/

  return res.redirect(
    `${process.env.FRONTEND_URL}/home?token=${accessToken}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&picture=${encodeURIComponent(user.picture)}`
  );
};

exports.refreshToken = (req, res) => {
  const jwt = require("jsonwebtoken");
  const rt = req.cookies?.rtk;
  if (!rt) return res.status(401).json({ message: "No refresh token" });

  try {
    const decoded = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);
    const payload = { sub: decoded.sub, email: decoded.email, name: decoded.name };
    const accessToken = signAccessToken(payload);
    return res.json({ accessToken });
  } catch (e) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
};

exports.logoutUser = (req, res) => {
  res.clearCookie("rtk", { httpOnly: true, sameSite: "lax", secure: process.env.COOKIE_SECURE === "true" });
  return res.json({ message: "Logged out" });
};

exports.me = (req, res) => {
  return res.json({ user: req.user });
};


exports.logoutUser1 = (req, res) => {
  res.clearCookie("rtk", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true"
  });
  return res.json({ message: "Logged out" });
};
