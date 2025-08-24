const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/user");

module.exports = function (passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "https://invite-backend-vk36.onrender.com/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error("No email from Google"), null);

          let user = await User.findOne({ email });

          if (!user) {
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email,
              picture: profile.photos?.[0]?.value,
            });
          }
          return done(null, user);
        } catch (e) {
          return done(e, null);
        }
      }
    )
  );
};
