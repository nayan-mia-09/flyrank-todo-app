
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://mlapuyasdlmawetfvelv.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

import express from 'express';
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import { error } from 'node:console';
import  pool, { initDB } from './db.js';
import dotenv from 'dotenv';
import { subscribe } from 'node:diagnostics_channel';

dotenv.config()
const app = express();

const port = process.env.PORT;

// middleware to parse incoming json request bodies
app.use(express.json());

async function requireAuth(req,res,next) {
    const authHeader = req.headers['authorization'];

     if(!authHeader || !authHeader.startsWith('Bearer ')){
         return res.status(401).json({ error: 'Access token required' }); } 

         const token = authHeader.split(' ')[1]; 
         const { data, error } = await supabase.auth.getUser(token); 
         if(error){ 
            return res.status(401).json({ error: 'Invalid or expired token' });
        } 
    req.user = data.user;
    next();
    
}

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
app.post("/tasks",async(req,res)=>{

    const {title} = req.body;

    if(!title || title.trim() === ""){
        res.status(400).json({error: "title is required and cannot be empty"});
    };

    try {
        const task = await pool.query('INSERT INTO tasks (title,done) VALUES ($1, $2) RETURNING *',[title,false]);
        res.status(201).json(task.rows[0]);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
})

// task update
app.put("/tasks/:id", async(req, res) => {
    const id = Number(req.params.id);
    const { title, done } = req.body || {};

    try {
        const task = await pool.query('UPDATE tasks SET title = COALESCE($1,title), done = COALESCE($2,done) WHERE id = $3 RETURNING *', [title,done,id]);

        if(task.rows.length === 0){
            return res.status(404).json({error: 'Task not found'});
        }
        res.json(task.rows[0]);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
});

// task delete
app.delete("/tasks/:id", async(req, res) => {
    const id = Number(req.params.id);
   try {
    const task = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING *',[id]);

    if(task.rows.length === 0){
        return res.status(404).json({error: 'Task not found'});
    }

    res.status(204).send();
   } catch (error) {
    res.status(500).json({error: error.message});
   }
});

// Auth Routes Stage 01
// Sign Up

app.post("/auth/signup", async(req,res)=>{
    const {email,password} = req.body;

    if(!email || !password){
        return res.status(400).json({error: "Email and Password required."})
    }
    const {data,error} = await supabase.auth.signUp({email,password});
    if(error){
        return res.status(400).json({error: error.message});
    }
    return res.status(201).json(data.user);
});

// Log in
app.post("/auth/login", async(req,res)=>{
    const {email,password} = req.body;

    if(!email || !password){
        return res.status(400).json({error: "Email and Password required."})
    }

    const {data,error} = await supabase.auth.signInWithPassword({email,password});

    if(error){
        return res.status(401).json({error: "Invalid login credentials"});
    }

    return res.status(200).json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token
    });
});

// Log out
app.post("/auth/logout", requireAuth,async(req,res)=>{
    const {error} = await supabase.auth.signOut();

    if(error){
        return res.status(400).json({error: error.message});
    }

    res.status(204).send()
})

// Public and Protected gates

// get public info
app.get("/public/info", (req, res) => {
  res.status(200).json({ message: "Welcome stranger! This info is public." });
});
// Protected gates
app.get("/protected/profile", requireAuth,  async (req, res) => {
    
         return res.status(200).json({
             id: data.user.id, 
             email: data.user.email,
             created_at: data.user.created_at }); 
    });

// Dashboard
app.get("/protected/dashboard", requireAuth, async(req,res)=>{
    res.status(200).json({
        message: `Welcome to out dashboard, ${req.user.email}`
    })
})


initDB().then(()=> console.log('Postgres initialized')).catch((err)=> console.error('DB Error:', err));
app.listen(port,()=>{
    console.log(`Server running on Port: ${port}`)
})