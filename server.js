import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Importing routers
import errorHandler from "./Middleware/errorHandler.js";
import auth from "./Router/Management/Users/Users.js";

// Config
const app = express();
dotenv.config();

const corsParameters = {
  origin: "http://localhost:1500",
  options: true,
  credentials: true,
};

// Middleware
app.use(express.json());
app.use(cors(corsParameters));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// ===== ROUTES =====
app.use("/api/auth", auth);

// ===== ERROR HANDLER - MUST BE LAST =====
app.use(errorHandler);

// ===== 404 HANDLER - Catch all undefined routes =====
app.use((req, res, next) => {
  res.status(404).json({
    status: "fail",
    message: `Cannot find ${req.originalUrl} on this server`,
  });
});

// Mongoose connect
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((error) => {
    console.log("Database Connection Error:", error);
  });

// Listening
app.listen(process.env.PORT, () => {
  console.log("Server is Live on PORT: " + process.env.PORT);
});
