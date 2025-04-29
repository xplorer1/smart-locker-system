
let {sequelize, User, Assignment, Locker, AccessLog, Admin} = require("../models/index");

let { Op } = require('sequelize');

module.exports = {
    /**
     * Add User.
     * @param {Object} req - The HTTP request object containing User details in req.body.
     * @param {Object} res - The HTTP response object used to send responses.
     */
    addUser: async (req, res) => {
        let { full_name, user_id, rfid_card_id, pin_code } = req.body;

        try {

            let user = await User.create({
                full_name,
                user_id,
                rfid_card_id: rfid_card_id || null,
                pin_code: pin_code || null,
            });

            res.status(201).json({
                id: user.id,
                full_name,
                user_id,
                rfid_card_id,
                message: 'User created successfully'
            });

        } catch (err) {
            if (err.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ message: 'User ID or RFID already exists' });
            }

            console.error(err);
            res.status(500).json({ message: 'Database error' });
        }
    },

    /**
     * Retrieves a list of users.
     * @param {Object} req - The HTTP request object containing id in req.params.
     * @param {Object} res - The HTTP response object used to send responses.
     */
    getUsers: async (req, res) => {
        try {

            let users = await User.findAll({
                order: [['full_name', 'ASC']]
            });
            return res.status(200).json(users);
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
    },

    /**
     * Retrieves a list of active lockers
     * @param {Object} req - The HTTP request object.
     * @param {Object} res - The HTTP response object used to send responses.
     */
    getActiveLockers: async (req, res) => {
        try {
            let lockers = await Locker.findAll({
                include: [{
                    model: Assignment,
                    where: { status: 'ACTIVE' },
                    required: false,
                    include: [{
                        model: User,
                        attributes: ['full_name', 'user_id']
                    }]
                }],
                order: [['locker_number', 'ASC']]
            });

            // Format response to match expected structure
            let formatted_lockers = lockers.map(locker => {
                let assignments = locker.Assignments || [];
                let active_assignment = assignments.length > 0 ? assignments[0] : null;

                return {
                    id: locker.id,
                    locker_number: locker.locker_number,
                    block: locker.block,
                    status: locker.status,
                    assigned_to: active_assignment ? active_assignment.User.full_name : null,
                    assigned_date: active_assignment ? active_assignment.assigned_date : null,
                    expiry_date: active_assignment ? active_assignment.expiry_date : null
                };
            });

            return res.status(200).json(formatted_lockers);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Database error' });
        }
    },

    assignLocker: async (req, res) => {
        let { user_id, locker_id, expiry_date} = req.body;

        try {
            // Begin transaction
            let transaction = await sequelize.transaction();

            try {
                // Check if locker is available
                let locker = await Locker.findOne({
                    where: {
                        id: locker_id,
                        [Op.or]: [
                            { status: 'AVAILABLE' },
                            {
                                id: {
                                    [Op.notIn]: sequelize.literal(`(SELECT locker_id FROM Assignment WHERE status = 'ACTIVE')`)
                                }
                            }
                        ]
                    }
                });

                if (!locker) {
                    await transaction.rollback();
                    return res.status(409).json({ message: 'Locker is not available.' });
                }

                // Check if User exists
                let user = await User.findByPk(user_id);
                if (!user) {
                    await transaction.rollback();
                    return res.status(404).json({ message: 'User not found' });
                }

                // Deactivate any existing active assignments for this locker
                await Assignment.update(
                    { status: 'EXPIRED' },
                    {
                        where: {
                            locker_id: locker.id,
                            status: 'ACTIVE'
                        },
                        transaction
                    }
                );

                let assigned_date = new Date();
                if(!expiry_date) {
                    let next_year = new Date(assigned_date);
                    next_year.setFullYear( assigned_date.getFullYear() + 1 );
                    expiry_date = next_year;
                }

                // Create new assignment
                let assignment = await Assignment.create(
                    {
                        user_id: user.id,
                        locker_id: locker.id,
                        assigned_date: assigned_date,
                        expiry_date: expiry_date
                    },
                    { transaction }
                );

                // Update locker status
                await locker.update({ status: 'ASSIGNED' }, { transaction });

                // Commit transaction
                await transaction.commit();

                return res.status(201).json({
                    id: assignment.id,
                    user_id,
                    expiry_date: assignment.expiry_date,
                    message: 'Locker assigned successfully.'
                });
            } catch (error) {
                // Rollback transaction on error
                await transaction.rollback();
                console.log("message: ", error);

                return res.status(500).json({ message: 'Database error' });

            }
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
    },

    deAssignLocker: async (req, res) => {
        let assignment_id = req.params.id;

        // Begin transaction
        let transaction = await sequelize.transaction();

        try {
            // Get the assignment
            let assignment = await Assignment.findOne({
                where: {
                    id: assignment_id,
                    status: 'ACTIVE'
                },
                transaction
            });

            if (!assignment) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Active assignment not found' });
            }

            let lockerId = assignment.locker_id;

            // Update assignment status
            await assignment.update({ status: 'RELEASED' }, { transaction });

            // Update locker status
            await Locker.update(
                { status: 'AVAILABLE' },
                {
                    where: { id: lockerId },
                    transaction
                }
            );

            // Commit transaction
            await transaction.commit();

            return res.status(200).json({
                message: 'Locker released successfully',
                locker_id: lockerId
            });
        } catch (err) {
            // Rollback transaction on error
            await transaction.rollback();
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
    },

    getAccessLogs: async (req, res) => {
        let { limit = 10, offset = 0, from, action, status } = req.query;

        try {
            let queryOptions = {
                include: [
                    {
                        model: User,
                        attributes: ['full_name', 'user_id']
                    },
                    {
                        model: Locker,
                        attributes: ['locker_number', 'block']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: limit,
                offset: offset
            };

            // Add filters if provided
            let whereClause = {};

            if (from) {
                whereClause.createdAt = {
                    [Op.gte]: new Date(from)
                };
            }

            if (action && action !== 'all') {
                whereClause.action = action;
            }

            if (status && status !== 'all') {
                whereClause.status = status;
            }

            if (Object.keys(whereClause).length > 0) {
                queryOptions.where = whereClause;
            }

            // Get logs with pagination
            let logs = await AccessLog.findAndCountAll(queryOptions);

            // Format logs to match expected structure
            let formattedLogs = logs.rows.map(log => {
                return {
                    id: log.id,
                    timestamp: log.createdAt,
                    full_name: log.User ? log.User.full_name : null,
                    user_id: log.User ? log.User.user_id : null,
                    locker_number: log.Locker ? log.Locker.locker_number : null,
                    block: log.Locker ? log.Locker.block : null,
                    action: log.action,
                    status: log.status
                };
            });

            return res.json({
                logs: formattedLogs,
                pagination: {
                    total: logs.count,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Database error' });
        }
    },

    addLocker: async (req, res) => {
        let {locker_number, block} = req.body;

        if (!locker_number || !block) {
            return res.status(400).json({message: 'Locker number and block are required'});
        }

        try {
            let locker = await Locker.create({
                locker_number,
                block,
                status: 'AVAILABLE'
            });

            return res.status(201).json({
                id: locker.id,
                locker_number,
                block,
                status: locker.status,
                message: 'Locker created successfully'
            });
        } catch (err) {
            if (err.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({message: 'Locker number already exists'});
            }

            console.error(err);
            return res.status(500).json({message: 'Database error'});
        }
    },
    
    /**
     * Create a new admin user
     * Requires admin privileges to create another admin
     */
    createAdmin: async (req, res) => {
        let { username, password, full_name } = req.body;

        try {
            // Check if username is already taken
            let existingAdmin = await Admin.findOne({ where: { username } });
            if (existingAdmin) return res.status(409).json({ message: 'Username is already taken' });

            // Create new admin
            let admin = await Admin.create({
                username,
                password,
                full_name
            });

            // Return success without password
            return res.status(201).json({
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name,
                createdAt: admin.createdAt,
                message: 'Admin created successfully'
            });
        } catch (err) {
            console.error('Admin creation message:', err);
            return res.status(500).json({ message: 'Failed to create admin' });
        }
    },

    /**
     * Get all admin users
     * Requires admin privileges
     */
    getAllAdmins: async (req, res) => {
        try {
            let admins = await Admin.findAll({
                attributes: ['id', 'username', 'createdAt', 'updatedAt'] // Exclude password
            });

            return res.json(admins);
        } catch (err) {
            console.error('Error fetching admins:', err);
            return res.status(500).json({ message: 'Failed to retrieve admins' });
        }
    },

    /**
     * Change admin password
     * Admins can only change their own password
     */
    changePassword: async (req, res) => {
        let { current_password, new_password } = req.body;
        let adminId = req.user.id; // From JWT token

        if (!current_password || !new_password) return res.status(400).json({ message: 'Current password and new password are required' });

        try {
            // Find the admin
            let admin = await Admin.findByPk(adminId);
            if (!admin) return res.status(404).json({ message: 'Admin not found' });

            // Verify current password
            let is_valid = await admin.validPassword(current_password);
            if (!is_valid) return res.status(401).json({ message: 'Current password is incorrect' });

            // Update password
            await admin.update({ password: new_password });

            return res.json({ message: 'Password updated successfully' });
        } catch (err) {
            console.error('Password change message:', err);
            return res.status(500).json({ message: 'Failed to change password' });
        }
    },
};
