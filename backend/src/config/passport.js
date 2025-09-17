import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import * as UserDao from '../database/dao/UserDao.js';
import logger from '../helpers/logger.js';

// Conditionally configure the Google Strategy only if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
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
} else {
    logger.warn('Google OAuth credentials are not configured. Google login will be disabled.');
}


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