import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/AuthMiddleware.js";
import CartControler from "../controllers/cart.controller.js";

const cartRouter = express.Router();

cartRouter.patch("/add", protect, expressAsyncHandler(CartControler.userAddToCart));
cartRouter.patch("/update", protect, expressAsyncHandler(CartControler.updateExisedtCart));
cartRouter.patch("/remove", protect, expressAsyncHandler(CartControler.removeCart));
cartRouter.get("/", protect, expressAsyncHandler(CartControler.userGetTheirCart));
cartRouter.post("/", protect, expressAsyncHandler(CartControler.createNewCart));

export default cartRouter;
