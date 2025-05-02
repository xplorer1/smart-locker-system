
let bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    let User = sequelize.define('User', {

        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        full_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        user_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        rfid_card_id: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: true,
        },

        pin_code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        status: {
            type: DataTypes.STRING,
            defaultValue: "ACTIVE",
        },

    }, {
        tableName: 'user',
        timestamps: true,

        // 1) Define hooks for hashing
        hooks: {
            // beforeCreate → runs on INSERT
            beforeCreate: async (user, options) => {
                if (user.pin_code) {
                    let salt  = await bcrypt.genSalt(10);
                    user.pin_code = await bcrypt.hash(user.pin_code, salt);
                }
            },

            // beforeUpdate → runs on UPDATE
            beforeUpdate: async (user, options) => {
                // only re-hash if the pin_code field was changed
                if (user.changed('pin_code')) {
                    let salt  = await bcrypt.genSalt(10);
                    user.pin_code = await bcrypt.hash(user.pin_code, salt);
                }
            },
        }
    });

    // 2) Instance method to compare a plaintext pin_code
    User.prototype.validPinCode = async function (plaintext) {
        return bcrypt.compare(plaintext, this.pin_code);
    };

    return User
};