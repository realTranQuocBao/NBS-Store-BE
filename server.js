import express from "express";
import dotenv from "dotenv";
import swaggerUiExpress from "swagger-ui-express";
import YAML from "yamljs";
import cors from "cors";
import connectDatabase from "./config/mongodb.js";

import { notFoundMiddleware, errorhandlingMiddleware } from "./middleware/Errors.js";
import routes from "./routes/index.js";

// import swaggerJsdoc from "swagger-jsdoc";
// import swaggerDocument from "./config/swagger.json";

dotenv.config();
connectDatabase();
const app = express();
const swaggerDocument = YAML.load("./config/swagger.yaml");
app.use(express.static("public"));
app.use(express.json());
app.use(cors());
// api v1.0
//handle route for api
routes(app);

/**
 * swaggerDocument2 created by JSON file
 */
// const options = {
//   swaggerOptions: {
//     url: '/swagger/v1/swagger_copy.json'
//   },
// };
// const swaggerDocument2 = [null, options];  //use: ...swaggerDocument2

/**
 * for swagger ui express + YAML file
 */
// const options = {
//   swaggerOptions: {
//     docExpansion: "none",
//   },
// };
app.use(
    "/thisisnbsstoreswagger",
    swaggerUiExpress.serve,
    swaggerUiExpress.setup(swaggerDocument, {
        swaggerOptions: {
            docExpansion: "none"
        }
    })
);

app.get("/", (req, res) => {
    res.send(
        'Welcome to NBS-Store API, <a href="http://nbs-store.quocbaoit.com">Click here to visit the shopping page</a><br>Made by Bảo&Nhựt&Hải 24.06.2022'
    );
});

// error handle
app.use(notFoundMiddleware);
app.use(errorhandlingMiddleware);

const PORT = process.env.PORT || 1025;
app.listen(PORT, console.log(`Server run in port ${PORT}`));
