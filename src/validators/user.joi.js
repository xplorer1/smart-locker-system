
let Joi = require("joi");

module.exports = {

    unlockLocker: async function (req, res, next) {
        let schema = Joi.object({
            mode: Joi.string().required().valid('web', 'rfid', 'bio'),

            rfid_code: Joi.string().when('mode', {
                is: 'rfid',
                then: Joi.required(),
                otherwise: Joi.forbidden()
            }),

            bio_code: Joi.string().when('mode', {
                is: 'bio',
                then: Joi.required(),
                otherwise: Joi.forbidden()
            })
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