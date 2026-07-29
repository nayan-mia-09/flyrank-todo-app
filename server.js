
import express from 'express';
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { error } from 'node:console';
import  pool, { initDB } from './db.js';

const app = express();

const port = 3000;

// middleware to parse incoming json request bodies
app.use(express.json());

// Load the OpenAPI spec (safer than JSON import assertions across Node versions)
const openapiDocument = JSON.parse(readFileSync("./openapi.json", "utf-8"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

// In-memory database

let tasks = [
    {id: 1, title: "Buy milk", done: false},
    {id: 2, title: "Write code", done: true},
    {id: 3, title: "Assignment completed", done: true}
]
let nextId = 4;

app.get("/",(req,res)=>{
    res.json({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] })
})

app.get("/health",(req,res)=>{
    res.json({"status": "ok"})
})

// get all task
app.get("/tasks",async(req,res)=>{
   try {
    const tasks = await pool.query('SELECT * FROM tasks ORDER BY id ASC');
    res.json(tasks.rows);
   } catch (error) {
    res.status(500).json({error: error.message})
   }
});

// get single task by id
app.get("/tasks/:id",async(req,res)=>{
    const {id} = req.params;
  try {

    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);

    if(task.rows.length === 0){
        return res.status(404).json({error: 'Task not found'});
    }

    res.json(task.rows[0]);
    
  } catch (error) {
      res.status(500).json({error: error.message})
  }
})

// create task 
// app.post("/tasks",(req,res)=>{

//     const {title} = req.body;

//     if(!title || title.trim() === ""){
//         res.status(400).json({error: "title is required and cannot be empty"});
//     };

//     const insert = db.prepare("INSERT INTO task (title,done) VALUES (?, ?)");
//     const result = insert.run(title,0);

//     const newTasks = db.prepare("SELECT * FROM task WHERE id = ?").get(result.lastInsertRowid);
    
//     res.status(201).json(newTasks);
// })

// task update
// app.put("/tasks/:id", (req, res) => {
//     const id = Number(req.params.id);
//     const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

//     if (!existing) {
//         return res.status(404).json({ error: `task ${id} not found` });
//     }

//     const { title, done } = req.body || {};
//     if (title !== undefined && title.trim() === "") {
//         return res.status(400).json({ error: "title cannot be empty" });
//     }

//     const updatedTitle = title !== undefined ? title : existing.title;
//     const updatedDone = done !== undefined ? (done ? 1 : 0) : existing.done;

//     db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?")
//       .run(updatedTitle, updatedDone, id);

//     const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
//     res.json(updatedTask);
// });

// task delete
// app.delete("/tasks/:id", (req, res) => {
//     const id = Number(req.params.id);
//     const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

//     if (!existing) {
//         return res.status(404).json({ error: `Task ${id} not found.` });
//     }

//     db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
//     res.status(204).send();
// });


initDB().then(()=> console.log('Postgres initialized')).catch((err)=> console.error('DB Error:', err));
app.listen(port,()=>{
    console.log(`Server running on Port: ${port}`)
})