import express from "express";
import dotenv from 'dotenv';
import connectDatabase from "./config/mongoDb.js";
import ImportData from "./DataImport.js";
import productRoute from "./Routes/ProductRoutes.js";
import { errorHandler, notFound } from "./Middleware/Errors.js";

// config file env
dotenv.config();

// connect mongoose
connectDatabase();

const app = express();

// API
app.use("/api/import", ImportData)
app.use("/api/products", productRoute)

// error handle
app.use(notFound)
app.use(errorHandler)

// app.get('/', (req, res) => {
//     res.send(">>>API is running...")
// })

const port = process.env.PORT || 1000;
app.listen(port, () => {
    console.log(`>>>Server running at port ${port}`)
});