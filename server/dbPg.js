import pg from 'pg';
const { Pool } = pg;
import { DB_HOST, DB_DATABASE, DB_PASSWORD, DB_PORT, DB_USER } from "./config.js";

export const pool = new Pool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_DATABASE,
});
