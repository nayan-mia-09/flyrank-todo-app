
import express from 'express';
import { error } from 'node:console';

const app = express();

const port = 3000;

// middleware to parse incoming json request bodies
app.use(express.json());

// In-memory database

let tasks = [
    {id: 1, title: "Buy milk", done: false},
    {id: 2, title: "Write code", done: true},
    {id: 3, title: "Assignment completed", done: true}
]

app.get("/",(req,res)=>{
    res.json({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] })
})

app.get("/health",(req,res)=>{
    res.json({"status": "ok"})
})

// get all task
app.get("/tasks",(req,res)=>{
    res.json(tasks)
});

// get single task by id
app.get("/tasks/:id",(req,res)=>{
  const id = Number(req.params.id);

  const task = tasks.find(t => t.id === id);
  if(!task) {
    res.status(404).json({error: `Task ${id} not found.`})
  }
  res.json(task);
})
app.listen(port,()=>{
    console.log(`Server running on Port: ${port}`)
})