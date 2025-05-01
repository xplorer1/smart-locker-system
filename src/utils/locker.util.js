const Models = require("../models/index.model");
const axios = require("axios");
const general_config = require("../config/general.config");

module.exports = {
    unlockLocker: async function(user_id) {
        try {
            // Find active locker assignment
            let assignment = await Models.Assignment.findOne({
                where: {
                    user_id: user_id,
                    status: 'ACTIVE'
                },
                include: [{
                    model: Models.Locker
                }]
            });

            if (!assignment) {
                return { status: 404, message: 'No locker assigned to you.' };
            }

            // Log unlock request
            await Models.AccessLog.create({
                user_id: user_id,
                locker_id: assignment.locker_id,
                action: 'REMOTE_UNLOCK',
                status: 'REQUESTED'
            });

            console.log(`Sending unlock command to LCU for locker ${assignment.Locker.block}-${assignment.Locker.locker_number}`);

            // Send HTTP request to MCU
            let response = await axios.post(`${general_config.lcu_base_url}/command`, {
                command: 'unlock',
                locker_number: assignment.Locker.locker_number,
                block: assignment.Locker.block
            });

            console.log("LCU response: ", response);

            // Record the unlock event
            await Models.AccessLog.create({
                user_id: user_id,
                locker_id: assignment.locker_id,
                action: 'UNLOCK',
                status: 'SUCCESS'
            });

            return {
                status: 200,
                message: 'Unlock command sent to locker',
                locker: {
                    number: assignment.Locker.locker_number,
                    block: assignment.Locker.block
                }
            };
        } catch (err) {
            console.error(err);
            return { status: 500, message: 'Failed to unlock locker' };
        }
    }
}