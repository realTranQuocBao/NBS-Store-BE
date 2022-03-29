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

dotenv.config();
connectDatabase();
const app = express();
const swaggerDocument = YAML.load('./config/swagger.yaml')
app.use(express.static("public"));
app.use(express.json());

// api v1.0
//handle route for api
app.use("/api/v1/import", ImportData);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/config/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID);
});

const options = {
  // swaggerOptions: {
  //   url: '/swagger/v1/swagger.json'
  // },
  definition: {
    info: {
      openapi: "3.0.1",
      title: "npsstore",
      version: "1.0",
      description: "03/29/2022 00:00:01",
      license: "MIT",
    },
  },

  apis: [
    "./routes/orderRoutes.js",
    "./routes/productRoutes.js",
    "./routes/userRoutes.js",
  ],
};

/**
 * for swagger ui express
 */
// app.use(
//   "/thisisnbsstoreswagger",
//   swaggerUiExpress.serve,
//   swaggerUiExpress.setup(null, options)
// );
/**
 * for swagger jsdoc
 */
app.use(
  "/thisisnbsstoreswagger",
  swaggerUiExpress.serve,
  swaggerUiExpress.setup(swaggerDocument)
);

app.get("/", (req, res) => {
  res.send("Alooo");
});

// error handle
app.use(notFoundMiddleware);
app.use(errorhandlingMiddleware);

const PORT = process.env.PORT || 1025;
app.listen(PORT, console.log(`Server run in port ${PORT}`));
