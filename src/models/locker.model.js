
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Locker', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        locker_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "ACTIVE",
        },

        block: {
            type: DataTypes.STRING,
            allowNull: false,
        },

    }, {
        tableName: 'locker',
        timestamps: true
    });
};
