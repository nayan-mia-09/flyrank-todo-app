import pg from "pg";
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function initDB(params) {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN DEFAULT FALSE)`);

        const res = await pool.query('SELECT COUNT(*) AS count FROM tasks');
        const count = parseInt(res.rows[0].count,10);

        if(count === 0){
            await pool.query(`
                INSERT INTO tasks (title,done) VALUES ('Buy groceries',false), ('Finish assignment',false),
                ('Read a book',false);
                `);
                console.log('Database seeded with 3 initial tasks')
        }
};

export default pool;