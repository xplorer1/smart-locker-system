
let Joi = require("joi");

module.exports = {

    addUser: async function (req, res, next) {
        let schema = Joi.object({

            full_name: Joi.string().required(),
            user_id: Joi.string().required(),
            rfid_card_id: Joi.string().optional().allow('', null),

            pin_code: Joi.string().length(4).required().messages({
                'string.length': 'pin_code must be 4 digits long'
            }),
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

    assignLocker: async function (req, res, next) {
        let schema = Joi.object({

            user_id: Joi.number().required(),
            locker_id: Joi.number().required(),
            expiry_date: Joi.string().optional().allow('', null),
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

    addAdmin: async function (req, res, next) {
        let schema = Joi.object({

            full_name: Joi.string().required(),
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
}