let jwt = require('jsonwebtoken');

let validateJWT = (req, res, next) => {
    let authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authorization header missing or invalid.' });
    }

    let token = authHeader.split(' ')[1];

    try {
        jwt.verify(token, 'your_jwt_secret_key', (err, user) => {
            if (err) return res.status(403).json({ error: 'Invalid token' });
            req.user = user;
            next();
        });

    } catch (error) {
        return res.status(401).json({ message: 'Invalid JWT token' });
    }
};

module.exports = {validateJWT};
