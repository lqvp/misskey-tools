const { DataSource } = require("typeorm");
const fs = require('fs');
const path = require('path');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

const AppDataSource = new DataSource({
    type: 'postgres',
    host: config.db.host,
    port: config.db.port,
    username: config.db.user,
    password: config.db.pass,
    database: config.db.db,
    entities: [path.join(__dirname, 'built/backend/models/entities/*.js')],
    migrations: [path.join(__dirname, 'built/migration/*.cjs')], // 拡張子を.cjsに変更
    migrationsTableName: "migrations",
    synchronize: false,
    logging: true
});

module.exports = AppDataSource;