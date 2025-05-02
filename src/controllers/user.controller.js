let Models = require('../models/index.model');
let { Op } = require('sequelize');
let axios = require('axios');
let general_config = require('../config/general.config');
let locker_util = require('../utils/locker.util');

const {sendToClient} = require("../utils/webSocket")

module.exports = {
    getUserLockerInfo: async (req, res) => {
        // Get user ID from JWT token
        let _user_id = req.user.id;

        try {
            // Find active locker assignment
            let assignment = await Models.Assignment.findOne({
                where: {
                    user_id: _user_id,
                    status: 'ACTIVE'
                },
                include: [{
                    model: Models.Locker,
                    attributes: ['id', 'locker_number', 'block', 'status']
                }]
            });

            if (!assignment) {
                return res.json({ has_locker: false });
            }

            // Get access history
            let accessLogs = await Models.AccessLog.findAll({
                where: {
                    user_id: _user_id,
                    locker_id: assignment.locker_id,
                    action: {
                        [Op.in]: ['unlock', 'door_opened', 'door_closed']
                    }
                },
                order: [['createdAt', 'DESC']],
                limit: 10
            });

            res.json({
                has_locker: true,
                locker: {
                    id: assignment.Locker.id,
                    number: assignment.Locker.locker_number,
                    block: assignment.Locker.block,
                    status: assignment.Locker.status
                },
                assignment: {
                    id: assignment.id,
                    assigned_date: assignment.assigned_date,
                    expiry_date: assignment.expiry_date
                },
                recent_activity: accessLogs.map(log => ({
                    action: log.action,
                    status: log.status,
                    timestamp: log.createdAt
                }))
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        }
    },

    unlockLockerID: async (req, res) => {
        let { mode, rfid_code, bio_code } = req.body;
        let _user_id;

        switch (mode) {
            case "rfid":
                let rfid_user = await Models.User.findOne({ where: { rfid_card_id: rfid_code } });
                if (!rfid_user) return res.status(404).json({ message: "Invalid RFID code" });

                _user_id = rfid_user.id;
                break;

            case "bio":
                let bio_user = await Models.User.findOne({ where: { bio_code: bio_code } });
                if (!bio_user) return res.status(404).json({ message: "Invalid Bio code" });

                _user_id = bio_user.id;
                break;

            default:
                return res.status(400).json({ message: "Unknown User ID" });
        }

        try {
            let unlock_response = await locker_util.unlockLocker(_user_id);
            return res.status(unlock_response.status).json(unlock_response);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unable to unlock locker' });
        }
    },

    unlockLockerWeb: async (req, res) => {
        let _user_id = req.user.id;
        try {

            let unlock_response = await locker_util.unlockLocker(_user_id);
           
            if (unlock_response.status !== 200) {
                return res.status(unlock_response.status).json({
                    success: false,
                    message: unlock_response.message
                });
            }

            // Send unlock command to the locker
            return res.json({
                success: true,
                message: 'Unlock command sent to locker',
                locker: unlock_response
            });
    
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to unlock locker' });
        }
    }
}