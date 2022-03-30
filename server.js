import express from "express";
import dotenv from "dotenv";
import swaggerUiExpress from "swagger-ui-express";
import YAML from "yamljs";
import connectDatabase from "./config/mongodb.js";
import ImportData from "./ImportData.js";
import {
  notFoundMiddleware,
  errorhandlingMiddleware,
} from "./middleware/Errors.js";
import orderRouter from "./routes/orderRoutes.js";
import productRouter from "./routes/productRoutes.js";
import userRouter from "./routes/userRoutes.js";
// import swaggerJsdoc from "swagger-jsdoc";
// import swaggerDocument from "./config/swagger.json";

// config file env
dotenv.config();

// connect mongoose
connectDatabase();

const app = express();
const swaggerDocument = YAML.load('./config/swagger.yaml')
app.use(express.static("public"));
app.use(express.json());

// API
app.use("/api/v1/import", ImportData)
app.use("/api/v1/products", productRoute)

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