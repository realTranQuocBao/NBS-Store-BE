import express from "express";
import expressAsyncHandler from "express-async-handler";
import Product from "../models/ProductModel.js";
import { admin, protect } from "./../middleware/AuthMiddleware.js";

const productRouter = express.Router();

export default productRouter;
