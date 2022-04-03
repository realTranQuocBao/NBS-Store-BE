import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "./../middleware/AuthMiddleware.js";
import Order from "./../models/OrderModel.js";

const orderRouter = express.Router();

// CRUD
/**
 * Create: CREATE ORDER
 */
orderRouter.post(
  "/",
  protect,
  expressAsyncHandler(async (req, res) => {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;
    console.log("hihi",{
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });
    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error("No order items");
      return;
    } else {
      const order = new Order({
        orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      });
      const createOrder = await order.save();
      res.status(201).json(createOrder);
    }
  })
);

/**
 * Read: ADMIN GET ALL ORDERS
 */
orderRouter.get(
  "/all",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({})
      .sort({ _id: -1 })
      .populate("user", "id name imail");
    res.json(orders);
  })
);

/**
 * Read: USER LOGIN ORDERS
 */
orderRouter.get(
  "/",
  protect,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ _id: -1 });
    res.json(orders);
  })
);

/**
 * Read: GET ORDER BY ID
 */
orderRouter.get(
  "/:id",
  protect,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "name email"
    );
    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

/**
 * Update: ORDER IS PAID
 */
orderRouter.patch(
  "/:id/pay",
  protect,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };
      const updateOrder = await order.save();
      res.json(updateOrder);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

/**
 * Update: ORDER IS DELIVERED
 */
orderRouter.patch(
  "/:id/delivered",
  protect,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      const updateOrder = await order.save();
      res.json(updateOrder);
    } else {
      res.status(404);
      throw new Error("Order Not Found");
    }
  })
);

/**
 * Delete: ...
 * 
 */

export default orderRouter;