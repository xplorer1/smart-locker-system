// models/admin.js
let bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    let Admin = sequelize.define('Admin', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        full_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },

    }, {
        tableName: 'admin',
        timestamps: true,

        // 1) Define hooks for hashing
        hooks: {
            // beforeCreate → runs on INSERT
            beforeCreate: async (admin, options) => {
                if (admin.password) {
                    let salt  = await bcrypt.genSalt(10);
                    admin.password = await bcrypt.hash(admin.password, salt);
                }
            },
            // beforeUpdate → runs on UPDATE
            beforeUpdate: async (admin, options) => {
                // only re-hash if the password field was changed
                if (admin.changed('password')) {
                    let salt  = await bcrypt.genSalt(10);
                    admin.password = await bcrypt.hash(admin.password, salt);
                }
            },
        }
    });

    // 2) Instance method to compare a plaintext password
    Admin.prototype.validPassword = async function (plaintext) {
        return bcrypt.compare(plaintext, this.password);
    };

    return Admin;
};
