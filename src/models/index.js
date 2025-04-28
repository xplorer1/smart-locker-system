let { Sequelize, DataTypes } = require('sequelize');

//connect to the database using the information in the environment variable.
let sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './smartlocker.db',
    logging: false // Set to console.log to see SQL queries
});

// load each model
let Student = require('./student.model')(sequelize, DataTypes);
let Locker = require('./locker.model')(sequelize, DataTypes);
let Assignment = require('./assignment.model')(sequelize, DataTypes);
let AccessLog = require('./access_log.model')(sequelize, DataTypes);
let Admin = require('./admin.model')(sequelize, DataTypes);

// define associations *after* you've created all models:
Student.hasMany( Assignment, { foreignKey: 'student_id', onDelete: 'CASCADE' });
Assignment.belongsTo( Student,   { foreignKey: 'student_id' });

Locker.hasMany( Assignment, { foreignKey: 'locker_id', onDelete: 'SET NULL' });
Assignment.belongsTo( Locker,    { foreignKey: 'locker_id' });

Student.hasMany( AccessLog,  { foreignKey: 'student_id', onDelete: 'CASCADE' });
AccessLog.belongsTo( Student,  { foreignKey: 'student_id' });

Locker.hasMany( AccessLog,  { foreignKey: 'locker_id', onDelete: 'CASCADE' });
AccessLog.belongsTo( Locker,   { foreignKey: 'locker_id' });

try {
    // Sync all models with database
    (async () => {
        await sequelize.sync();

        let adminCount = await Admin.count();
        if (adminCount === 0) {
            await Admin.create({
                username: 'admin',
                password: 'admin123',
                full_name: 'System Administrator'
            });

            console.log('Default admin created');
        }
    })();

} catch (err) {
    console.error('Database initialization error:', err);
}

module.exports = { sequelize, Student, Locker, Assignment, AccessLog, Admin };