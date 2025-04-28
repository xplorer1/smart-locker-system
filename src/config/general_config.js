module.exports = {
    port: process.env.PORT || "8070",
    sqlite3_database: process.env.SQLITE3_DATABASE,
    sqlite3_database_user: process.env.SQLITE3_DATABASE_USER,
    sqlite3_database_password: process.env.SQLITE3_DATABASE_PASSWORD,
    sqlite3_database_host: process.env.SQLITE3_DATABASE_HOST,
    secret_key: process.env.SECRET_KEY
}