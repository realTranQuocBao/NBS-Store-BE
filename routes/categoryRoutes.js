import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect, optional } from "../middleware/AuthMiddleware.js";
import CategoryControler from "../controllers/category.controller.js";

const categoryRouter = express.Router();

// categoryRouter.get("/all", protect, admin, expressAsyncHandler());
// categoryRouter.get("/disabled", protect, admin, expressAsyncHandler());
categoryRouter.patch("/:id/disable", protect, admin, expressAsyncHandler(CategoryControler.disableCategory));
categoryRouter.patch("/:id/restore", protect, admin, expressAsyncHandler(CategoryControler.restoreCategory));
categoryRouter.put("/:id", protect, admin, expressAsyncHandler(CategoryControler.updateCategory));
categoryRouter.delete("/:id", protect, admin, expressAsyncHandler(CategoryControler.deleteCategory));
categoryRouter.post("/", protect, admin, expressAsyncHandler(CategoryControler.createCategory));
categoryRouter.get("/", optional, expressAsyncHandler(CategoryControler.getCategory));
// categoryRouter.get("/", expressAsyncHandler());

export default categoryRouter;
