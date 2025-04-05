const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers["authorization"];

  // Check if bearerHeader is undefined
  if (typeof bearerHeader !== "undefined") {
    // Split at the space
    const bearer = bearerHeader.split(" ");
    // Get token from array
    const bearerToken = bearer[1];
    // Set the token in the request object
    req.token = bearerToken;

    // Verify the token
    jwt.verify(bearerToken, process.env.JWT_SECRET, (err, authData) => {
      if (err) {
        return res.sendStatus(403); // Forbidden if token is invalid
      }
      // Attach auth data to the request object so it's accessible in the next middleware
      req.authData = authData;
      // Proceed to the next middleware or route handler
      next();
    });
  } else {
    // Forbidden if no token is provided
    res.sendStatus(403);
  }
}

module.exports = verifyToken;
