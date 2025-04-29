let Models = require('../models/index');
let { Op } = require('sequelize');

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

    unlockLocker: async (req, res) => {
        // Get User ID from JWT token
        let _user_id = req.user.id;

        try {
            // Find active locker assignment
            let assignment = await Models.Assignment.findOne({
                where: {
                    user_id: _user_id,
                    status: 'ACTIVE'
                },
                include: [{
                    model: Models.Locker
                }]
            });

            if (!assignment) {
                return res.status(404).json({ error: 'No locker assigned to you' });
            }

            // Log unlock request
            await Models.AccessLog.create({
                user_id: _user_id,
                locker_id: assignment.locker_id,
                action: 'remote_unlock',
                status: 'requested'
            });

            // In a real implementation, you would send a command to the Master Control Unit
            // to unlock the specific locker. For this demo, we'll simulate a successful unlock.

            // Record the unlock event
            await Models.AccessLog.create({
                user_id: _user_id,
                locker_id: assignment.locker_id,
                action: 'unlock',
                status: 'success'
            });

            return res.json({
                success: true,
                message: 'Unlock command sent to locker',
                locker: {
                    number: assignment.Locker.locker_number,
                    block: assignment.Locker.block
                }
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to unlock locker' });
        }
    }
}