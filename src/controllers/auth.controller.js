
let Models = require('../models/index');
let jwt = require("jsonwebtoken");

module.exports = {
    /**
     * Sign In.
     * @param {Object} req - The HTTP request object containing book details in req.body.
     * @param {Object} res - The HTTP response object used to send responses.
     */
    signIn: async (req, res) => {
        let { username, password } = req.body;

        try {
            let admin = await Models.Admin.findOne({ where: { username } });
            if (!admin) return res.status(401).json({ message: 'Invalid credentials.' });

            let match = await admin.validPassword(password);
            if (!match) return res.status(401).json({ error: 'Invalid credentials.' });

            let token = jwt.sign({ id: admin.id, username: admin.username }, 'your_jwt_secret_key', { expiresIn: '24h' });

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
            return res.status(500).json({ error: 'Database error' });
        }
    },

    /**
     * Confirms locker access.
     * @param {Object} req - The HTTP request object containing request details in req.params and updated details in req.body.
     * @param {Object} res - The HTTP response object used to send responses.
     */
    verifyLockerAccess: async (req, res) => {
        let { student_id, pin_code } = req.body;

        try {
            // Find student by RFID or student ID.
            let student = await Models.Student.findOne({where: { student_id }});
            if (!student) return res.status(401).json({authenticated: false, error: 'Invalid student ID'});

            // Verify PIN code
            let match = await student.validPinCode(pin_code.toString());

            if (!match) {
                // Log failed access attempt
                // await Models.AccessLog.create({
                //     student_id: student.id,
                //     action: 'authentication',
                //     status: 'failed'
                // });

                return res.status(401).json({authenticated: false, error: "Invalid PIN." });
            }

            // Find assigned locker
            let assignment = await Models.Assignment.findOne({
                where: {
                    student_id: student.id,
                    status: 'ACTIVE'
                },
                include: [{
                    model: Models.Locker
                }]
            });

            if (!assignment) {
                // Log failed access (no locker assigned)
                //await Models.AccessLog.create({ student_id: student.id, action: 'authentication', status: 'no_locker' });
                return res.status(404).json({authenticated: false, error: 'No locker assigned'});
            }

            // Log successful access
            await Models.AccessLog.create({
                student_id: student.id,
                locker_id: assignment.locker_id,
                action: 'unlock',
                status: 'success'
            });

            // Return success with locker information
            res.json({
                authenticated: true,
                locker: {
                    id: assignment.Locker.id,
                    number: assignment.Locker.locker_number,
                    block: assignment.Locker.block
                },
                student: {
                    id: student.id,
                    name: student.full_name
                }
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Database error' });
        }
    },

    logDoorEvents: async (req, res) => {
        let { locker_number, status, student_rfid, student_id } = req.body;

        if (!locker_number || !status) {
            return res.status(400).json({ error: 'Locker number and status are required' });
        }

        try {
            // Get locker ID
            let locker = await Models.Locker.findOne({
                where: { locker_number }
            });

            if (!locker) return res.status(404).json({ error: 'Locker not found' });

            let studentId = null;

            // Get student ID if ID provided
            if (student_rfid) {
                let student = await Models.Student.findOne({
                    where: { student_id: student_id }
                });

                if (student) {
                    studentId = student.id;
                }
            }

            // Log door event
            await Models.AccessLog.create({
                locker_id: locker.id,
                student_id: studentId,
                action: status === 'open' ? 'door_opened' : 'door_closed',
                status: 'recorded'
            });

            return res.json({ success: true });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
    }
};
