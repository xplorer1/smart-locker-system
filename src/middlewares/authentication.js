let jwt = require('jsonwebtoken');
let general_config = require("../config/general.config");

let validateJWT = (req, res, next) => {
    let authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or invalid.' });
    }

    let token = authHeader.split(' ')[1];

    try {
        jwt.verify(token, general_config.secret_key, (err, user) => {
            if (err) return res.status(403).json({ error: 'Invalid token' });
            req.user = user;
            next();
        });

    } catch (error) {
        return res.status(401).json({ message: 'Invalid JWT token' });
    }
};

// Admin-only authentication middleware
let verifyAdminAccess = (req, res, next) => {
    // Check if user exists and role is not defined (admin tokens) or is explicitly admin
    if (!req.user || (req.user.role && req.user.role !== 'admin')) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Student-only authentication middleware
let verifyUserAccess = (req, res, next) => {
    if (!req.user || req.user.role !== 'user') {
        return res.status(403).json({ error: 'User access required' });
    }
    next();
};

module.exports = {validateJWT, verifyAdminAccess, verifyUserAccess};
