
import express from 'express';
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { error } from 'node:console';

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

// create task 
app.post("/tasks",(req,res)=>{

    const {title} = req.body;

    if(!title || title.trim() === ""){
        res.status(400).json({error: "title is required and cannot be empty"});
    };

    const newTasks = {id: nextId++, title, done: false};
    tasks.push(newTasks);
    res.status(201).json(newTasks);
})

// task update
app.put("/tasks/:id",(req,res)=>{
    const id = Number(req.params.id);
    const task = tasks.find(t => t.id === id);
    if(!task){
        return res.status(404).json({error: `task ${id} not found`})
    };

    const {title, done} = req.body || {};
    if(title !== undefined && title.trim() === ""){
        return res.status(400).json({error: "title cannot be empty"})
    };

    if(title !== undefined) task.title = title;
    if(done !== undefined) task.done = done;

    res.json(task)
})

// task delete
app.delete("/tasks/delete/:id",(req,res)=>{
    const id = Number(req.params.id);
    const index = tasks.findIndex(t => t.id === id);
    if(index === -1){
        return res.status(404).json({error: `Task ${id} not found.`})
    }
    tasks.splice(index,1);
    res.status(204).send()
})
app.listen(port,()=>{
    console.log(`Server running on Port: ${port}`)
})