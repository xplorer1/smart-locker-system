require("dotenv").config();
let express = require('express');
let path = require('path');
let helmet = require("helmet");
let logger = require('morgan');
let cors = require('cors');
let general_config = require("./src/config/general_config");

let fs = require('fs');

let app = express();

app.use(cors());
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

app.use(logger('dev'));
app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({ extended: false, limit: "5mb" }));

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'x-access-token,X-Requested-With,Content-Type,Authorization,cache-control');

    //To handle timeout errors gracefully.
    res.setTimeout(29000, function() {
        return res.status(402).json({
            status: false,
            message: "Taking too long to respond. Please try again after some minutes."
        });
    });

    next();
});

let index = require('./src/routes/index');

app.use('/api', index);

app.get('/admin', (req, res) => {
    //res.sendFile(path.join(__dirname, 'public', 'admin.html'));

    let file_path = path.join(__dirname, 'public', 'admin.html');
    fs.readFile(file_path, 'utf8', (err, html) => {
        if (err) return res.status(500).send('Error loading page');
        // replace the placeholder with the real env-var

        let out = html.replace(
            /__API_BASE_URL__/g,
            process.env.API_BASE_URL
        );
        res.type('html').send(out);
    });
});

app.get('/user', (req, res) => {
    //res.sendFile(path.join(__dirname, 'public', 'user.html'));

    let file_path = path.join(__dirname, 'public', 'user.html');
    fs.readFile(file_path, 'utf8', (err, html) => {
        if (err) return res.status(500).send('Error loading page');
        // replace the placeholder with the real env-var

        let out = html.replace(
            /__API_BASE_URL__/g,
            process.env.API_BASE_URL
        );
        res.type('html').send(out);
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    res.status(404).send({ message: "Requested resource cannot be found at this location.", status: false, });
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app.listen(general_config.port, () => console.log(`Listening on port ${general_config.port}!`));