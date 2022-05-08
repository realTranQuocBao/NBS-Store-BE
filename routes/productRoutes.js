import express from "express";
import expressAsyncHandler from "express-async-handler";
import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";
import Order from "../models/OrderModel.js";
import Cart from "../models/CartModel.js";
import { admin, protect } from "./../middleware/AuthMiddleware.js";
import { searchConstants, validateConstants } from "../constants/searchConstants.js";

const productRouter = express.Router();

//TODO: validate product infor when creating & updating

// CRUD
/**
 * Create: CREATE A NEW PRODUCT
 * SWAGGER SETUP: ok
 */
productRouter.post("/", protect, admin, expressAsyncHandler(async (req, res) => {
  const { name, price, description, image, countInStock, category } = req.body;
  const isExist = await Product.findOne({ name: name, isDisabled: false });
  if (isExist) {
    res.status(400);
    throw new Error("Product name already exist");
  } else {
    const newProduct = new Product({
      name,
      price,
      description,
      image,
      countInStock,
      category,
      user: req.user._id,
    });
    if (newProduct) {
      const createdProduct = await newProduct.save();
      res.status(201).json(createdProduct);
    } else {
      res.status(400);
      throw new Error("Invalid product data");
    }
  }
})
);

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

productRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const pageSize = Number(req.query.pageSize) || 9; //EDIT HERE
    const page = Number(req.query.pageNumber) || 1;
    const dateOrderFilter = validateConstants('date', req.query.dateOrder);
    const priceOrderFilter = validateConstants('price', req.query.priceOrder);
    const bestSellerFilter = validateConstants('totalSales', req.query.bestSeller);
    const sortBy = {...bestSellerFilter,...dateOrderFilter, ...priceOrderFilter};
    const keyword = req.query.keyword
      ? {
        name: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
      : {}; // TODO: return cannot find product

    //Check if category existed
    let categoryName = req.query.category;
    if (!req.query.category) {
      categoryName = "All";
    }
    let categoryIds;
    if (categoryName == "All") {
      categoryIds = await Category.find({ isDisabled: false }).select({ _id: 1 });
    }
    else {
      categoryIds = await Category.find({ name: categoryName, isDisabled: false }).select({ _id: 1 });
    }
    const categoryFilter = categoryIds ? { category: categoryIds } : {};
    //(categoryFilter);
    const count = await Product.countDocuments({ ...keyword, ...categoryFilter, isDisabled: false });

    //Check if product match keyword
    if (count == 0) {
      res.status(204);
      throw new Error("No products found for this keyword");
    }
    //else
    const products = await Product.find({ ...keyword, ...categoryFilter, isDisabled: false })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort(sortBy)
      .populate('category', 'name');
    res.json({ products, page, pages: Math.ceil(count / pageSize) });
  })
);

/**
 * Read: ADMIN GET ALL PRODUCTS
 * (not search & pegination)
 * SWAGGER SETUP: ok
 */
productRouter.get(
  "/all",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const products = await Product.find({ isDisabled: false }).sort({ _id: -1 });
    res.json(products);
  })
);

/**
 * Read: GET A PRODUCT DETAIL
 * (by Id)
 * SWAGGER SETUP: ok
 */
productRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    // console.log("Bảo nè");
    const productId = req.params.id ? req.params.id : null;
    const product = await Product.findOne({ _id: productId, isDisabled: false });
    // let product;
    // console.log("new", product);
    // try {
    //   product = await Product.findById(req.params.id).exec();
    // } catch (error) {
    //   console.log("err", product);
    //   res.status(404);
    //   throw new Error("Product not Found");
    // }
    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error("Product not Found");
    }
  })
);

/**
 * Update: REVIEW A PRODUCT
 * SWAGGER SETUP: ok
 */
productRouter.post(
  "/:id/review",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const productId = req.params.id ? req.params.id : null;
    const product = await Product.findOne({ _id: productId, isDisabled: false });
    if (product) {
      const alreadyReviewed = product.reviews.find(
        (reviewItem) => reviewItem.user.toString() === req.user._id.toString()
      );
      if (alreadyReviewed) {
        res.status(400);
        throw new Error("Product already reviewed");
      }
      //else
      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };
      product.reviews.push(review);
      product.numReview = product.reviews.length;
      product.rating = product.reviews.reduce(
        (previousValue, curentReview) => curentReview.rating + previousValue,
        0
      );
      await product.save();
      res.status(201).json({ message: "Added review" });
    } else {
      res.status(404);
      throw new Error("Product not Found");
    }
  })
);

/**
 * Update: UPDATE A PRODUCT
 * SWAGGER SETUP: ok
 */
productRouter.put(
  "/:id",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const { name, price, description, image, countInStock, category } = req.body;
    const productId = req.params.id ? req.params.id : null;
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
    if (req.body.category != null) {
      existedCategory = await Category.findOne({ _id: req.body.category, isDisabled: false });
      if (!existedCategory) {
        res.status(404);
        throw new Error("Category not found");
      }
      else {
        product.category = existedCategory._id;
      }
    }
    const upadatedProduct = await product.save();
    res.json(upadatedProduct);
  })
);


//Admin disable product
//Note: check if product is added to users cart 
productRouter.patch(
  "/:id/disable",
  protect,
  admin, 
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    const order = await Order.findOne({ 'orderItems.product': product._id, isDisabled: false });        
    if (order) {
      res.status(400);
      throw new Error("Cannot disable ordered product");
    }     
    const cart = await Cart.findOne({ 'cartItems.product': product._id });
    if (cart) {
      res.status(400);
      throw new Error("Cannot disable in-cart product");
    }
    product.isDisabled = req.body.isDisabled;
    await product.save();
    res.status(200);
    res.json({ message: "Product has been disabled" });
  })
);

//Admin restore disabled product
productRouter.patch(
  "/:id/restore",
  protect,
  admin, 
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id ? req.params.id : null;
    const product = await Order.findOne({ _id: productId, isDisabled: true });
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    } else {
      product.isDisabled = req.body.isDisabled;
      const updateProduct = await product.save();
      res.status(200);
      res.json(updateProduct);
    }
  })
);

/**
 * Delete: DELETE A PRODUCT
 * SWAGGER SETUP: ok
 */
productRouter.delete(
  "/:id",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    } 
    const order = await Order.findOne({ 'orderItems.product': product._id, isDisabled: false });        
    if (order) {
      res.status(400);
      throw new Error("Cannot delete ordered product");
    }
    const cart = await Cart.findOne({ 'cartItems.product': product._id });
    if (cart) {
      res.status(400);
      throw new Error("Cannot delete in-cart product");
    }
    await product.remove();
    res.status(200);
    res.json({ message: "Product has been deleted"});
  })
);

export default productRouter;
