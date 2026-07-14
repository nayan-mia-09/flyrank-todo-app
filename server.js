import express from 'express';

const app = express();

const port = 3000;

// middleware to parse incoming json request bodies
app.use(express.json());


app.get("/",(req,res)=>{
    res.status(200).json({
        success: true,
        message: "Hello Server!"
    })
})

app.listen(port,()=>{
    console.log(`Server running on Port: ${port}`)
})