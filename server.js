import express from "express";
import dotenv from "dotenv";
import connectDatabase from "./config/mongodb.js";
import ImportData from "./ImportData.js";
import {
  notFoundMiddleware,
  errorhandlingMiddleware,
} from "./middleware/Errors.js";
import orderRouter from "./routes/orderRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import userRouter from "./routes/userRoutes.js";

dotenv.config();
connectDatabase();
const app = express();
app.use(express.json());

// api v1.0
//handle route for api
app.use("/api/v1/import", ImportData);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/config/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID);
});

app.get("/", (req, res) => {
  res.send("Alooo");
});

// error handle
app.use(notFoundMiddleware);
app.use(errorhandlingMiddleware);

const PORT = process.env.PORT || 1025;
app.listen(PORT, console.log(`Server run in port ${PORT}`));
