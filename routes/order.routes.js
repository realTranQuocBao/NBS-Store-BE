import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/auth.middleware.js";
import OrderControler from "../controllers/order.controller.js";

const orderRouter = express.Router();

// orderRouter.get("/all", protect, admin, expressAsyncHandler());
// orderRouter.get("/disabled", protect, admin, expressAsyncHandler());
orderRouter.get("/ordered", protect, expressAsyncHandler(OrderControler.getOrder));
orderRouter.patch("/:id/delivered", protect, expressAsyncHandler(OrderControler.confirmDelivered));
orderRouter.patch("/:id/disable", protect, admin, expressAsyncHandler(OrderControler.disableOrder));
orderRouter.patch("/:id/pay", protect, expressAsyncHandler(OrderControler.payOrderByApi));
orderRouter.patch("/:id/restore", protect, admin, expressAsyncHandler(OrderControler.restoreOrder));
orderRouter.delete("/:id", protect, admin, expressAsyncHandler(OrderControler.deteleOrder));
orderRouter.get("/:id", protect, expressAsyncHandler(OrderControler.getDetailOrderById));
orderRouter.get("/", protect, admin, expressAsyncHandler(OrderControler.getOrderAdmin));
orderRouter.post("/", protect, expressAsyncHandler(OrderControler.createNewOrder));
// orderRouter.post("/", protect, expressAsyncHandler());

export default orderRouter;
