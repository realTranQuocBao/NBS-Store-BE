import express from "express";
import mongoose from "mongoose";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/auth.middleware.js";
import Order from "../models/order.model.js";
import Product from "../models/producer.model.js";
import Cart from "../models/cart.model.js";
import { orderQueryParams, validateConstants } from "../constants/searchConstants.js";

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
const createNewOrder = async (req, res, next) => {
    const { orderItems, shippingAddress, paymentMethod, itemsPrice, taxPrice, shippingPrice, totalPrice } = req.body;
    const orderItemsId = orderItems.map((orderItem) => orderItem.product);
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
        readPreference: "primary",
        readConcern: { level: "local" },
        writeConcern: { w: "majority" }
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
                totalPrice
            });
            for (const orderItem of orderItems) {
                const orderedProduct = await Product.findOneAndUpdate(
                    { _id: orderItem.product, isDisabled: false, countInStock: { $gte: orderItem.qty } },
                    { $inc: { countInStock: -orderItem.qty, totalSales: +orderItem.qty } },
                    { new: true }
                ).session(session);
                if (!orderedProduct) {
                    await session.abortTransaction();
                    res.status(400);
                    throw new Error("One or more product order quantity exceed available quantity");
                }
                /* let cartItemIndex = cart.cartItems.findIndex(
                        (cartItem) => cartItem.product.toString() == orderItem.product.toString()
                    );
                    if (cartItemIndex !== -1) {
                        cart.cartItems.splice(cartItemIndex, 1);
                    } */
            }
            const updatedCart = await Cart.findOneAndUpdate(
                { user: req.user._id },
                { $pull: { cartItems: { product: { $in: orderItemsId } } } }
            );
            if (!updatedCart) {
                await session.abortTransaction();
                res.status(500);
                throw new Error("Removing ordered items from cart failed");
            }
            const createdOrder = await order.save();
            res.status(201);
            res.json(createdOrder);
        }, transactionOptions);
    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
};

//Get order
const getOrderAdmin = async (req, res) => {
    const dateOrderFilter = validateConstants(orderQueryParams, "date", req.query.dateOrder);
    const statusFilter = validateConstants(orderQueryParams, "status", req.query.status);
    const orders = await Order.find({ ...statusFilter })
        .sort({ ...dateOrderFilter })
        .populate("user", "-password");
    res.status(200);
    res.json(orders);
};

/**
 * Read: ADMIN GET ALL ORDERS
 */
// orderRouter.get(
//     "/all",
//     protect,
//     admin,
//     expressAsyncHandler(async (req, res) => {
//         //await Order.updateMany({}, { $set: { isDisabled: false } }, {multi: true});
//         const orders = await Order.find({ isDisabled: false }).sort({ _id: -1 }).populate("user", "-password");
//         res.json(orders);
//     })
// );

// //Admin get all disabled orders
// orderRouter.get(
//     "/disabled",
//     protect,
//     admin,
//     expressAsyncHandler(async (req, res) => {
//         const orders = await Order.find({ isDisabled: true });
//         if (orders.length != 0) {
//             res.status(200);
//             res.json(orders);
//         } else {
//             res.status(204);
//             res.json({ message: "No orders are disabled" });
//         }
//     })
// );

/**
 * Read: USER LOGIN ORDERS
 */
const getOrder = async (req, res) => {
    const dateOrderFilter = validateConstants(orderQueryParams, "date", req.query.dateOrder);
    const orders = await Order.find({ user: req.user._id, isDisabled: false })
        .sort({ ...dateOrderFilter })
        .populate("user", "-password");
    res.json(orders);
};

/**
 * Read: GET ORDER BY ID
 */
const getDetailOrderById = async (req, res) => {
    const orderId = req.params.id || null;
    const order = await Order.findOne({ _id: orderId, isDisabled: false }).populate("user", "-password");
    if (!order) {
        res.status(404);
        throw new Error("Order Not Found");
    }
    res.status(200);
    res.json(order);
};

/**
 * Update: ORDER IS PAID
 * for test + demo
 */
const payOrderByApi = async (req, res) => {
    const orderId = req.params.id || null;
    const order = await Order.findOne({ _id: orderId, isDisabled: false });
    if (!order) {
        res.status(404);
        throw new Error("Order Not Found");
    }
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address
    };
    const updateOrder = await order.save();
    res.json(updateOrder);
};

/**
 * Update: ORDER IS DELIVERED
 */
const confirmDelivered = async (req, res) => {
    const orderId = req.params.id || null;
    const order = await Order.findOne({ _id: orderId, isDisabled: false });
    if (!order) {
        res.status(404);
        throw new Error("Order Not Found");
    }
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    const updateOrder = await order.save();
    res.status(200);
    res.json(updateOrder);
};

//Admin disable order
const disableOrder = async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }
    order.isDisabled = true;
    await order.save();
    res.status(200);
    res.json({ message: "Order has been disabled" });
};

//Admin restore disabled order
const restoreOrder = async (req, res) => {
    const orderId = req.params.id || null;
    const order = await Order.findOne({ _id: orderId, isDisabled: true });
    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }
    order.isDisabled = save;
    const updateOrder = await order.save();
    res.status(200);
    res.json(updateOrder);
};

//Admin delete order
const deteleOrder = async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        res.status(404);
        throw new Error("Order not found");
    }
    await order.remove();
    res.status(200);
    res.json({ message: "Order has been deleted" });
};

const OrderControler = {
    createNewOrder,
    getOrderAdmin,
    getOrder,
    getDetailOrderById,
    payOrderByApi,
    confirmDelivered,
    disableOrder,
    restoreOrder,
    deteleOrder
};

export default OrderControler;
