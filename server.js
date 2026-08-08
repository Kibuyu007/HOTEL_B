import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import multer, { diskStorage } from 'multer'

//importing routers
import auth from './Router/Auth.js'



//config
const app = express();

dotenv.config()

const corsParameters ={
    origin: "http://localhost:4005",
    option: true,
    credentials: true
}

//Mongoose connect
mongoose.connect(process.env.MONGO_URL,()=>{
    try {
        console.log("Database Connected to PORT :" + process.env.PORT )

    } catch (error) {
        console.log(error)
    }
})

//listening
app.listen(process.env.PORT, ()=>{
    console.log("Live on This PORT : " + process.env.PORT)
})


//SS miidleware 
app.use(express.json())
app.use(cors(corsParameters))
app.use(cookieParser())


//multer configuration
const storage = multer.diskStorage({
    destination: "./images",

    filename: (req, file, cb) => {
        cb(null, `${Date.now()}_${file.originalname}`)
    }
})

const upload = multer({storage: storage})


//Router Middleware
app.use('/api',upload.single("file"),auth) 