
let bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    let Student = sequelize.define('Student', {

        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },

        full_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        student_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        rfid_card_id: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
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
        tableName: 'student',
        timestamps: true,

        // 1) Define hooks for hashing
        hooks: {
            // beforeCreate → runs on INSERT
            beforeCreate: async (student, options) => {
                if (student.pin_code) {
                    let salt  = await bcrypt.genSalt(10);
                    student.pin_code = await bcrypt.hash(student.pin_code, salt);
                }
            },

            // beforeUpdate → runs on UPDATE
            beforeUpdate: async (student, options) => {
                // only re-hash if the pin_code field was changed
                if (student.changed('pin_code')) {
                    let salt  = await bcrypt.genSalt(10);
                    student.pin_code = await bcrypt.hash(student.pin_code, salt);
                }
            },
        }
    });

    // 2) Instance method to compare a plaintext pin_code
    Student.prototype.validPinCode = async function (plaintext) {
        return bcrypt.compare(plaintext, this.pin_code);
    };

    return Student
};