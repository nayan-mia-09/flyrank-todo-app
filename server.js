import express from 'express';

const app = express();

const port = 3000;

// middleware to parse incoming json request bodies
app.use(express.json());


app.get("/",(req,res)=>{
    res.json({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] })
})

app.get("/health",(req,res)=>{
    res.json({"status": "ok"})
})

app.listen(port,()=>{
    console.log(`Server running on Port: ${port}`)
})