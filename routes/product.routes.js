import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect, optional } from "../middleware/auth.middleware.js";
import ProductControler from "../controllers/product.controller.js";
const productRouter = express.Router();

//TODO: validate product infor when creating & updating

// productRouter.get("/updatenewfield", expressAsyncHandler(ProductControler.updatenewfield));
productRouter.get("/:id/comments", expressAsyncHandler(ProductControler.getProductComments));
productRouter.patch("/:id/disable", protect, admin, expressAsyncHandler(ProductControler.disableProduct));
productRouter.patch("/:id/restore", protect, admin, expressAsyncHandler(ProductControler.restoreProduct));
productRouter.post("/:id/review", protect, expressAsyncHandler(ProductControler.reviewProduct));
productRouter.get("/:id", expressAsyncHandler(ProductControler.getDetailProductById));
productRouter.put("/:id", protect, admin, expressAsyncHandler(ProductControler.updateProduct));
productRouter.delete("/:id", protect, admin, expressAsyncHandler(ProductControler.deleteProduct));
productRouter.get("/", optional, expressAsyncHandler(ProductControler.getProducts));
productRouter.post("/", protect, admin, expressAsyncHandler(ProductControler.createProduct));

export default productRouter;
