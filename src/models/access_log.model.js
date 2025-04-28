
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('AccessLog', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        action: {
            type: DataTypes.STRING,
            allowNull: false
        },

        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'student',   // table name
                key: 'id'
            }
        },

        locker_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'locker',
                key: 'id'
            }
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false
        },

    }, {
        tableName: 'access_log',
        timestamps: true
    });
};
