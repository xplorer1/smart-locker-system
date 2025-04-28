
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Assignment', {

        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
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

        assigned_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        expiry_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        status: {
            type: DataTypes.STRING,
            defaultValue: "ACTIVE",
        },

    }, {
        tableName: 'assignment',
        timestamps: true
    });
};
