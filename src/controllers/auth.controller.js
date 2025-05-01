
let Models = require('../models/index.model');
let jwt = require("jsonwebtoken");
let general_config = require("../config/general.config");

module.exports = {
    /**
     * Sign In.
     * @param {Object} req - The HTTP request object containing book details in req.body.
     * @param {Object} res - The HTTP response object used to send responses.
     */
    adminSignIn: async (req, res) => {
        let { username, password } = req.body;

        try {
            let admin = await Models.Admin.findOne({ where: { username } });
            if (!admin) return res.status(401).json({ message: 'Invalid credentials.' });

            let match = await admin.validPassword(password);
            if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

            let token = jwt.sign({ id: admin.id, username: admin.username }, general_config.secret_key, { expiresIn: '24h' });

            return res.json({
                message: 'Authentication successful',
                token,
                admin: {
                    id: admin.id,
                    username: admin.username,
                    full_name: admin.full_name
                }
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Database error' });
        }
    },

    /**
     * Confirms locker access.
     * @param {Object} req - The HTTP request object.
     * @param {Object} res - The HTTP response object used to send responses.
     */
    verifyLockerAccess: async (req, res) => {
        let { user_id, pin_code } = req.body;

        try {
            // Find user by RFID or user ID.
            let user = await Models.User.findOne({where: { user_id }});
            if (!user) return res.status(401).json({authenticated: false, message: 'Invalid user ID'});

            // Verify PIN code
            let match = await user.validPinCode(pin_code.toString());

            if (!match) {
                // Log failed access attempt
                // await Models.AccessLog.create({
                //     user_id: user.id,
                //     action: 'AUTHENTICATION',
                //     status: 'FAILED'
                // });

                return res.status(401).json({authenticated: false, message: "Invalid PIN." });
            }

            // Find assigned locker
            let assignment = await Models.Assignment.findOne({
                where: {
                    user_id: user.id,
                    status: 'ACTIVE'
                },
                include: [{
                    model: Models.Locker
                }]
            });

            if (!assignment) {
                // Log failed access (no locker assigned)
                //await Models.AccessLog.create({ user_id: user.id, action: 'AUTHENTICATION', status: 'NO_LOCKER' });
                return res.status(404).json({authenticated: false, message: 'No locker assigned'});
            }

            // Log successful access
            await Models.AccessLog.create({
                user_id: user.id,
                locker_id: assignment.locker_id,
                action: 'UNLOCK',
                status: 'SUCCESS'
            });

            // Return success with locker information
            return res.json({
                authenticated: true,
                locker: {
                    id: assignment.Locker.id,
                    number: assignment.Locker.locker_number,
                    block: assignment.Locker.block
                },
                user: {
                    id: user.id,
                    name: user.full_name
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Database error' });
        }
    },

    logDoorEvents: async (req, res) => {
        let { locker_number, status, user_rfid, user_id } = req.body;

        if (!locker_number || !status) {
            return res.status(400).json({ message: 'Locker number and status are required' });
        }

        try {
            // Get locker ID
            let locker = await Models.Locker.findOne({
                where: { locker_number }
            });

            if (!locker) return res.status(404).json({ message: 'Locker not found' });

            let _user_d = null;

            // Get user ID if ID provided
            if (user_rfid) {
                let user = await Models.User.findOne({
                    where: { user_id: user_id }
                });

                if (user) {
                    _user_d = user.id;
                }
            }

            // Log door event
            await Models.AccessLog.create({
                locker_id: locker.id,
                user_id: _user_d,
                action: status === 'OPEN' ? 'DOOR_OPENED' : 'DOOR_CLOSED',
                status: 'RECORDED'
            });

            return res.json({ success: true });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
    },
    
    userSignIn: async (req, res) => {
        let { user_id, pin_code } = req.body;

        if (!user_id || !pin_code) {
            return res.status(400).json({ message: 'User ID and PIN are required' });
        }

        try {
            // Find user by ID
            let user = await Models.User.findOne({
                where: { user_id }
            });

            if (!user) return res.status(401).json({ message: 'Invalid credentials' });

            // Verify PIN code
            let match = await user.validPinCode(pin_code);

            if (!match) {
                // Log failed login attempt
                await Models.AccessLog.create({
                    user_id: user.id,
                    action: 'WEB_LOGIN',
                    status: 'FAILED'
                });

                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Log successful login
            // await Models.AccessLog.create({
            //     user_id: user.id,
            //     action: 'WEB_LOGIN',
            //     status: 'SUCCESS'
            // });

            // Generate JWT token for user
            let token = jwt.sign(
                {
                    id: user.id,
                    user_id: user.user_id,
                    role: 'user' // Add role to distinguish from admin tokens
                },
                general_config.secret_key,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Authentication successful',
                token,
                user: {
                    id: user.id,
                    user_id: user.user_id,
                    full_name: user.full_name
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Database error' });
        }
    },
};
