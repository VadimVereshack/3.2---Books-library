import mySQL from 'mysql';
import dotenv from 'dotenv';

dotenv.config();

const connection = mySQL.createPool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE
});

export default connection;