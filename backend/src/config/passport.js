import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import * as UserDao from '../database/dao/UserDao.js';
import logger from '../helpers/logger.js';

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    logger.warn('Google OAuth credentials are not configured. Google login will not work.');
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/v1/auth/google/callback" // This should match the path in your auth routes
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
        const user = await UserDao.findOrCreateGoogleUser(profile);
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
  }
));

// Stores user ID in the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Retrieves user details from the session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await UserDao.getUserById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;
