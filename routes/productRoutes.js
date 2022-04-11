import express from "express";
import expressAsyncHandler from "express-async-handler";
import Product from "../models/ProductModel.js";
import { admin, protect } from "./../middleware/AuthMiddleware.js";

const productRouter = express.Router();

//TODO: validate product infor when creating & updating

// CRUD
/**
 * Create: CREATE A NEW PRODUCT
 * SWAGGER SETUP: no
 */
productRouter.post("/", protect, admin, async (req, res) => {
  const { name, price, description, image, countInStock } = req.body;
  const isExist = await Product.findOne({ name });
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
      user: req.user._id,
    });
    if (newProduct) {
      const createdProduct = await productRouter.save();
      res.status(201).json(createdProduct);
    } else {
      res.status(400);
      throw new Error("Invalid product data");
    }
  }
});

/**
 * Read: GET ALL PRODUCTS
 * (have filter)
 * SWAGGER SETUP: ok
 */
productRouter.get(
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
    if(count == 0){
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
);

/**
 * Read: ADMIN GET ALL PRODUCTS
 * (not search & pegination)
 * SWAGGER SETUP: no
 */
productRouter.get(
  "/all",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ _id: -1 });
    res.json(products);
  })
);

/**
 * Read: GET A PRODUCT
 * (by Id)
 * SWAGGER SETUP: no
 */
productRouter.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
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
 * SWAGGER SETUP: no
 */
productRouter.post(
  "/:id/review",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);
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
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;
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
 * SWAGGER SETUP: no
 */
productRouter.put(
  "/:id",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const { name, price, description, image, countInStock } = req.body;
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      product.image = image || product.image;
      product.countInStock = countInStock || product.countInStock;
      const upadatedProduct = await product.save();
      res.json(upadatedProduct);
    } else {
      res.status(404);
      throw new Error("Product not Found");
    }
  })
);

/**
 * Delete: DELETE A PRODUCT
 * SWAGGER SETUP: no
 */
productRouter.delete(
  "/:id",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.remove();
      res.json({ message: "Product has been deleted" });
    } else {
      res.status(404);
      throw new Error("Product not Found");
    }
  })
);

export default productRouter;
