
let Joi = require("joi");

module.exports = {

    signIn: async function (req, res, next) {
        let schema = Joi.object({

            username: Joi.string().required(),
            password: Joi.string().required(),
        });

        // schema options
        let options = {
            abortEarly: false, // include all errors
            allowUnknown: true, // ignore unknown props
            stripUnknown: true, // remove unknown props
            "convert": false
        };

        // validate request body against schema
        let { error, value } = schema.validate(req.body, options);

        if (error) {
            return res.status(400).json({ message: error.message });

        } else {

            req.body = value;
            next();
        }
    },

    verifyLockerAccess: async function (req, res, next) {
        let schema = Joi.object({

            student_id: Joi.string().required(),
            pin_code: Joi.number().required(),
        });

        // schema options
        let options = {
            abortEarly: false, // include all errors
            allowUnknown: true, // ignore unknown props
            stripUnknown: true, // remove unknown props
            "convert": false
        };

        // validate request body against schema
        let { error, value } = schema.validate(req.body, options);

        if (error) {
            return res.status(400).json({ message: error.message });

        } else {

            req.body = value;
            next();
        }
    },

    logDoorEvents: async function (req, res, next) {
        let schema = Joi.object({

            status: Joi.string().required(),
            locker_number: Joi.number().required(),
        });

        // schema options
        let options = {
            abortEarly: false, // include all errors
            allowUnknown: true, // ignore unknown props
            stripUnknown: true, // remove unknown props
            "convert": false
        };

        // validate request body against schema
        let { error, value } = schema.validate(req.body, options);

        if (error) {
            return res.status(400).json({ message: error.message });

        } else {

            req.body = value;
            next();
        }
    },

}