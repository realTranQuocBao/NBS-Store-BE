import express from "express";
import mongoose from "mongoose";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "./../middleware/AuthMiddleware.js";
import Order from "./../models/OrderModel.js";
import Product from "../models/ProductModel.js";
import Cart from "../models/CartModel.js";
const orderRouter = express.Router();

// CRUD
/**
 * Create: CREATE ORDER
 */
/* orderRouter.post(
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
); */


//User place new order
orderRouter.post(
  "/",
  protect,
  expressAsyncHandler(async (req, res, next) => {
      const {
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
      } = req.body;
      if (orderItems && orderItems.length === 0) {
        res.status(400);
        throw new Error("No order items");
      }
      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        res.status(404);
        throw new Error("Cart not found");
      }
      const session = await mongoose.startSession();
      const transactionOptions = {
        readPreference: 'primary',
        readConcern: { level: 'local' },
        writeConcern: { w: 'majority' },
      };
      try {
        await session.withTransaction(async () => { 
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
          for (const orderItem of orderItems) {
            const product = await Product.findOne({ _id: orderItem.product, isDisabled: false }).session(session);
            if (product.countInStock < orderItem.qty) {
              await session.abortTransaction();
              res.status(400);
              throw new Error("One or more product order quantity exceed available quantity");
            }
            let cartItemIndex = cart.cartItems.findIndex(cartItem => cartItem.product.toString() == orderItem.product.toString());  
            if (cartItemIndex !== -1) {
              cart.cartItems.splice(cartItemIndex, 1);
            }
            await Product.findOneAndUpdate(
              { _id: orderItem.product, isDisabled: false }, 
              { $inc: 
                { countInStock: -orderItem.qty, totalSales: +orderItem.qty }
              },
              { new: true },
            ).session(session);
          }
          await cart.save();
          const createdOrder = await order.save();
          res.status(201);
          res.json(createdOrder);
        }, transactionOptions);
      }
      catch (error) {
        next(error);
      }
      finally {
        await session.endSession();
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
    //await Order.updateMany({}, { $set: { isDisabled: false } }, {multi: true});
    const orders = await Order.find({ isDisabled: false })
      .sort({ _id: -1 })
      .populate("user", "id name email");
    res.json(orders);
  })
);

//Admin get all disabled orders
orderRouter.get(
  "/disabled",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ isDisabled: true });
    if (orders.length != 0) {
      res.status(200);
      res.json(orders);
    }
    else {
      res.status(204);
      res.json({ message: "No orders are disabled"} );
    }
  })
);

/**
 * Read: USER LOGIN ORDERS
 */
orderRouter.get(
  "/",
  protect,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id, isDisabled: false }).sort({ _id: -1 });
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
    const orderId = req.params.id ? req.params.id : null;
    const order = await Order.findOne({ _id: orderId, isDisabled: false }).populate(
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
    const orderId = req.params.id ? req.params.id : null;
    const order = await Order.findOne({ _id: orderId, isDisabled: false });
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
    const orderId = req.params.id ? req.params.id : null;
    const order = await Order.findOne({ _id: orderId, isDisabled: false });
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

//Admin disable order
orderRouter.patch(
  "/:id/disable",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    } else {
      order.isDisabled = req.body.isDisabled;
      await order.save();
      res.status(200);
      res.json({ message: "Order has been disabled" });
    }
  })
);

//Admin restore disabled order
orderRouter.patch(
  "/:id/restore",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const orderId = req.params.id ? req.params.id : null;
    const order = await Order.findOne({ _id: orderId, isDisabled: true });
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    } else {
      order.isDisabled = req.body.isDisabled;
      const updateOrder = await order.save();
      res.status(200);
      res.json(updateOrder);
    }
  })
);

//Admin delete order
 orderRouter.delete(
  "/:id",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error("Order not found");
    } else {
      await order.remove();
      res.status(200);
      res.json({ message: "Order has been deleted"});
    }
  })
);

export default orderRouter;