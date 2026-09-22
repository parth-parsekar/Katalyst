const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verifies a Google token from the Authorization header.
 * Supports two token types:
 *   - ID token  (JWT)    -- issued by @react-oauth/google on the frontend
 *   - Access token       -- issued by chrome.identity on the extension
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorised -- no token provided" });
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    // 1. Try as Google ID token (frontend)
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      req.user = {
        googleId: payload.sub,
        email:    payload.email,
        name:     payload.name    || payload.email,
        picture:  payload.picture || null,
      };
      return next();
    } catch (_idTokenError) {
      // Not an ID token -- fall through to access token check
    }

    // 2. Try as Google access token (Chrome extension)
    const tokenInfo = await client.getTokenInfo(token);
    if (!tokenInfo.sub) throw new Error("No sub in token info");

    // Fetch full profile via userinfo endpoint
    let name = tokenInfo.email;
    let picture = null;
    try {
      const profileRes = await fetch(
        `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`
      );
      if (profileRes.ok) {
        const profile = await profileRes.json();
        name    = profile.name    || tokenInfo.email;
        picture = profile.picture || null;
      }
    } catch (_profileError) {
      // Non-critical
    }

    req.user = {
      googleId: tokenInfo.sub,
      email:    tokenInfo.email,
      name,
      picture,
    };
    return next();

  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired Google token" });
  }
};

module.exports = protect;
