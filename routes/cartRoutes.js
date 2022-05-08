import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/AuthMiddleware.js";
import Cart from "../models/CartModel.js";
//import User from "../models/CategoryModel.js";
import Product from "../models/ProductModel.js";

const cartRouter = express.Router();

//User get their cart
cartRouter.get(
    "/",
    protect,
    expressAsyncHandler(async(req, res) => {
        const userId = req.user.id ? req.user.id : null;
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            res.status(404);
            throw new Error("Cart not found");
        }
        res.status(200);
        res.json(cart);
    })
);

//Create new cart
cartRouter.post(
    "/",
    protect,
    expressAsyncHandler(async(req, res) => {
        const userId = req.user.id ? req.user.id : null;
        const existedCart = await Cart.findOne({ user: userId });
        if (existedCart) {
            res.status(400);
            throw new Error("Cart is already created");
        }
        const newCart = await Cart.create({
            user: userId,
            cartItems: [],
        });
        res.status(200);
        res.json(newCart);
    })
); 

//User add to cart
cartRouter.patch(
    "/add",
    protect,
    expressAsyncHandler(async(req, res) => {
        const userId = req.user.id ? req.user.id : null;
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            res.status(404);
            throw new Error("Cart not found");
        }
        const { productId, qty } = req.body;
        if (qty <= 0) {
            res.status(400);
            throw new Error("Quantity must be greater than 0");
        }
        let addedItemIndex = cart.cartItems.findIndex(item => item.product.toString() == productId.toString());
        let statusCode;
        if (addedItemIndex !== -1) {
            cart.cartItems[addedItemIndex].qty += qty;
            statusCode = 200;
        }
        else {
            const product = await Product.findOne({ _id: productId, isDisabled: false });
            if (!product) {
                res.status(404);
                throw new Error("Product not found");
            }
            const cartItem = {
                product: productId,
                qty: qty,
            }        
            addedItemIndex = cart.cartItems.push(cartItem) - 1;
            statusCode = 201;
        }
        const updatedCart = await cart.save();
        res.status(statusCode);
        res.json(updatedCart.cartItems[addedItemIndex]);
    })
); 

//User update existed cart item
cartRouter.patch(
    "/update",
    protect,
    expressAsyncHandler(async(req, res) => {
        const userId = req.user.id ? req.user.id : null;
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            res.status(404);
            throw new Error("Cart not found");
        }
        const { productId, qty } = req.body;
        const addedItemIndex = cart.cartItems.findIndex(item => item.product.toString() === productId.toString());
        if (addedItemIndex == -1) {
            throw new Error("Product isn't in cart");
        }
        else {
            cart.cartItems[addedItemIndex].qty = qty;
            if (cart.cartItems[addedItemIndex].qty <= 0) {
                cart.cartItems.splice(addedItemIndex, 1);
                await cart.save();
                res.status(204);
                res.json({ message: "Product is removed"});
            }
            else {
                const updatedCart = await cart.save();
                res.status(200);
                res.json(updatedCart.cartItems[addedItemIndex]);
            }
        }
    })
);

//User remove selected cart items. 
cartRouter.patch(
    "/remove",
    protect,
    expressAsyncHandler(async(req, res) => {
        const userId = req.user.id ? req.user.id : null;
        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            res.status(404);
            throw new Error("Cart not found");
        }
        //productIds: [productId1, productId2, ...]
        const productIds = req.body.productIds;
        for (const productId of productIds) {
            let addedItemIndex = cart.cartItems.findIndex(item => item.product.toString() == productId.toString());
            if (addedItemIndex != -1) {
                cart.cartItems.splice(addedItemIndex, 1);
            }
        }
        const updatedCart = await cart.save();
        res.status(200);
        res.json(updatedCart);
    })
); 

export default cartRouter;