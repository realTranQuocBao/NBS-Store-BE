import express from "express";
import expressAsyncHandler from "express-async-handler";
import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";
import Order from "../models/OrderModel.js";
import Cart from "../models/CartModel.js";
import Comment from "../models/CommentModel.js";
import { admin, protect, optional } from "../middleware/AuthMiddleware.js";
import { productQueryParams, validateConstants } from "../constants/searchConstants.js";

//Admin create new product
const createProduct = async (req, res) => {
    const { name, price, description, image, countInStock, category } = req.body;
    const isExist = await Product.findOne({ name: name });
    if (isExist) {
        res.status(400);
        throw new Error("Product name already exist");
    }
    const newProduct = new Product({
        name,
        price,
        description,
        image,
        countInStock,
        category,
        user: req.user._id
    });
    if (!newProduct) {
        res.status(400);
        throw new Error("Invalid product data");
    }
    const createdProduct = await newProduct.save();
    res.status(201).json(createdProduct);
};

/**
 * Read: GET ALL PRODUCTS
 * (have filter)
 * SWAGGER SETUP: ok
 */
/* productRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const pageSize = Number(req.query.pageSize) || 9; //EDIT HERE
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword
      ? {
        name: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
      : {}; // TODO: return cannot find product
    const count = await Product.countDocuments({ ...keyword });
    if (count == 0) {
      res.status(204);
      throw new Error("No products found for this keyword");
    }
    //else
    const products = await Product.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ _id: -1 });
    res.json({ products, page, pages: Math.ceil(count / pageSize) });
  })
); */

// Non-user, user and admin filter product
const getProducts = async (req, res) => {
    const pageSize = Number(req.query.pageSize) || 20; //EDIT HERE
    const page = Number(req.query.pageNumber) || 1;
    const dateOrderFilter = validateConstants(productQueryParams, "date", req.query.dateOrder);
    const priceOrderFilter = validateConstants(productQueryParams, "price", req.query.priceOrder);
    const bestSellerFilter = validateConstants(productQueryParams, "totalSales", req.query.bestSeller);
    const sortBy = { ...bestSellerFilter, ...priceOrderFilter, ...dateOrderFilter };
    let statusFilter;
    if (!req.user || req.user.isAdmin == false) {
        statusFilter = validateConstants(productQueryParams, "status", "default");
    } else if (req.user.isAdmin) {
        statusFilter = validateConstants(productQueryParams, "status", req.query.status);
    }
    const keyword = req.query.keyword
        ? {
              name: {
                  $regex: req.query.keyword,
                  $options: "i"
              }
          }
        : {}; // TODO: return cannot find product

    //Check if category existed
    let categoryName = req.query.category;
    if (!req.query.category) {
        categoryName = "All";
    }
    let categoryIds;
    if (categoryName == "All") {
        categoryIds = await Category.find({ ...statusFilter }).select({ _id: 1 });
    } else {
        categoryIds = await Category.find({ name: categoryName, ...statusFilter }).select({ _id: 1 });
    }
    const categoryFilter = categoryIds ? { category: categoryIds } : {};
    //(categoryFilter);
    const count = await Product.countDocuments({ ...keyword, ...categoryFilter, ...statusFilter });
    //Check if product match keyword
    if (count == 0) {
        res.status(204);
        throw new Error("No products found for this keyword");
    }
    //else
    const products = await Product.find({ ...keyword, ...categoryFilter, ...statusFilter })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .sort(sortBy)
        .populate("category", "name");
    res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
};

// /**
//  * Read: ADMIN GET ALL PRODUCTS
//  * (not search & pegination)
//  * SWAGGER SETUP: ok
//  */
// productRouter.get(
//     "/all",
//     protect,
//     admin,
//     expressAsyncHandler(async (req, res) => {
//         const products = await Product.find({ isDisabled: false }).sort({ _id: -1 });
//         res.json(products);
//     })
// );

// //Admin get all disabled products
// productRouter.get(
//     "/disabled",
//     protect,
//     admin,
//     expressAsyncHandler(async (req, res) => {
//         const products = await Product.find({ isDisabled: true });
//         if (products.length != 0) {
//             res.status(200);
//             res.json(products);
//         } else {
//             res.status(204);
//             res.json({ message: "No products are disabled" });
//         }
//     })
// );

//Non-user, user, admin get product by id
const getDetailProductById = async (req, res) => {
    const productId = req.params.id || null;
    const product = await Product.findOne({ _id: productId, isDisabled: false }).populate(
        "reviews.user",
        "name avatarUrl"
    );

    // let product;
    // console.log("new", product);
    // try {
    //   product = await Product.findById(req.params.id).exec();
    // } catch (error) {
    //   console.log("err", product);
    //   res.status(404);
    //   throw new Error("Product not Found");
    // }
    if (!product) {
        res.status(404);
        throw new Error("Product not Found");
    }

    // increment Product View counter
    product.numViews = product.numViews + 1;
    await product.save();

    res.status(200);
    res.json(product);
};

//Non-user, user, admin get product comments
const getProductComments = async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id, isDisabled: false });
    if (!product) {
        res.status(404);
        throw new Error("Product not Found");
    }
    let comments = await Comment.find({ product: req.params.id, isDisabled: false }).populate("user replies.user");
    res.status(200);
    res.json(comments);
};

//User review a product
const reviewProduct = async (req, res, next) => {
    const { rating, reviewContent } = req.body;
    const productId = req.params.id || null;
    const product = await Product.findOne({ _id: productId, isDisabled: false });
    if (!product) {
        res.status(404);
        throw new Error("Product not Found");
    }
    const orders = await Order.find({ user: req.user._id, "orderItems.product": product._id, isDisabled: false });
    const totalOrdered = orders.length;
    const totalReviewed = product.reviews.reduce((previousValue, currentReview) => {
        if (currentReview.user.toString() === req.user._id.toString()) {
            previousValue++;
        }
        return previousValue;
    }, 0);
    if (totalOrdered <= totalReviewed) {
        res.status(400);
        throw new Error("Product already reviewed");
    }
    //.
    //else
    const review = {
        name: req.user.name,
        rating: Number(rating),
        reviewContent: reviewContent,
        user: req.user._id
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
        product.reviews.reduce((previousValue, curentReview) => curentReview.rating + previousValue, 0) /
        product.numReviews;
    await product.save();
    res.status(201);
    res.json({ message: "Added review" });
};

//Admin update product
const updateProduct = async (req, res) => {
    const { name, price, description, image, countInStock, category } = req.body;
    const productId = req.params.id || null;
    const product = await Product.findOne({ _id: productId, isDisabled: false });
    if (!product) {
        res.status(404);
        throw new Error("Product not Found");
    }
    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    product.image = image || product.image;
    product.countInStock = countInStock || product.countInStock;
    let existedCategory;
    if (category != null) {
        existedCategory = await Category.findOne({ _id: category, isDisabled: false });
        if (!existedCategory) {
            res.status(404);
            throw new Error("Category not found");
        }
        product.category = existedCategory._id;
    }
    const upadatedProduct = await product.save();
    res.json(upadatedProduct);
};

//Admin disable product
//Note: check if product is added to users cart
const disableProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }
    const order = await Order.findOne({ "orderItems.product": product._id, isDisabled: false });
    if (order) {
        res.status(400);
        throw new Error("Cannot disable ordered product");
    }
    const cart = await Cart.findOne({ "cartItems.product": product._id });
    if (cart) {
        res.status(400);
        throw new Error("Cannot disable in-cart product");
    }
    const disabledProduct = await Product.findOneAndUpdate({ _id: product._id }, { isDisabled: true }, { new: true });
    //disable comments
    await Comment.updateMany({ isDisabled: false, product: disabledProduct._id }, { $set: { isDisabled: true } });
    res.status(200);
    res.json(disabledProduct);
};

//Admin restore disabled product
const restoreProduct = async (req, res) => {
    const productId = req.params.id || null;
    const product = await Product.findOne({ _id: productId, isDisabled: true });
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }
    // const duplicatedProduct = await Product.findOne({ name: product.name, isDisabled: false });
    // if (duplicatedProduct) {
    //     res.status(400);
    //     throw new Error("Restore this product will result in duplicated product name");
    // }
    product.isDisabled = false;
    const restoredProduct = await Product.findOneAndUpdate({ _id: product._id }, { isDisabled: false }, { new: true });
    //restore comments
    // const comments = await Comment.find({
    //     product: restoredProduct._id,
    //     isDisabled: true
    // }).populate("user product replies.user replies.product");
    // for (const comment of comments) {
    //     if (comment.product._id.toString() === restoredProduct._id.toString() && comment.isDisabled == true) {
    //         comment.isDisabled = comment.user.isDisabled || comment.product.isDisabled || false;
    //     }
    //     for (const reply of comment.replies) {
    //         if (reply.product._id.toString() === restoredProduct._id.toString() && reply.isDisabled == true) {
    //             reply.isDisabled = reply.user.isDisabled || reply.product.isDisabled || false;
    //         }
    //     }
    //     await comment.save();
    // }
    res.status(200);
    res.json(restoredProduct);
};

//Admin delete product
const deleteProduct = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }
    const order = await Order.findOne({ "orderItems.product": product._id, isDisabled: false });
    if (order) {
        res.status(400);
        throw new Error("Cannot delete ordered product");
    }
    const cart = await Cart.findOne({ "cartItems.product": product._id });
    if (cart) {
        res.status(400);
        throw new Error("Cannot delete in-cart product");
    }
    const deletedProduct = await product.remove();
    //delete comments
    await Comment.deleteMany({ product: deletedProduct._id });
    res.status(200);
    res.json({ message: "Product has been deleted" });
};

// const updatenewfield = async (req, res) => {
//     await Product.updateMany({}, { numViews: 0 });
// };

const ProductControler = {
    createProduct,
    getProducts,
    getDetailProductById,
    getProductComments,
    reviewProduct,
    updateProduct,
    disableProduct,
    restoreProduct,
    deleteProduct
    // updatenewfield
};

export default ProductControler;
