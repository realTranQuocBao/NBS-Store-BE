import express from "express";
import expressAsyncHandler from "express-async-handler";
import Product from "../models/ProductModel.js";
import Category from "../models/CategoryModel.js";
import { admin, protect } from "./../middleware/AuthMiddleware.js";
import { searchConstants, validateConstants } from "../constants/searchConstants.js";

const productRouter = express.Router();

//TODO: validate product infor when creating & updating

// CRUD
/**
 * Create: CREATE A NEW PRODUCT
 * SWAGGER SETUP: ok
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
      const createdProduct = await newProduct.save();
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
    const dateOrder = req.query.dateOrder || validateConstants('date', dateOrder);
    const priceOrder = req.query.priceOrder || validateConstants('price', priceOrder); 
    const keyword = req.query.keyword
      ? {
        name: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
      : {}; // TODO: return cannot find product

     //Check if category existed 
    const categoryId = await Category
    .findOne({ "name": { 
                          $regex: req.query.category, 
                          $options: 'i', 
                      }
            });
    const category = categoryId ? { category: categoryId } : {};
    const count = await Product.countDocuments({ ...keyword, ...category });

    //Check if product match keyword
    if (count == 0) {
      res.status(204);
      throw new Error("No products found for this keyword");
    }
    
    //else
    const products = await Product.find({ ...keyword, ...category })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ price: searchConstants.price[priceOrder], createdAt: searchConstants.date[dateOrder] })
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
    const products = await Product.find({}).sort({ _id: -1 });
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
    let product;
    product = await Product.findById(req.params.id).exec();
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
    let product;
    product = await Product.findById(req.params.id);
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
    const { name, price, description, image, countInStock } = req.body;
    let product;
    product = await Product.findById(req.params.id);
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
 * SWAGGER SETUP: ok
 */
productRouter.delete(
  "/:id",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    let product;
    product = await Product.findById(req.params.id);
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
