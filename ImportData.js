import express from "express";
import expressAsyncHandler from "express-async-handler";
import User from "./models/UserModel.js";
import Product from "./models/ProductModel.js";
// import Category from "./models/Category.js";

import users from "./data/User.js";
import products from "./data/Products.js";
// import category from "./data/Category.js";

const ImportData = express.Router();

ImportData.post(
  "/user",
  expressAsyncHandler(async (req, res) => {
    await User.deleteMany({});
    const importUser = await User.insertMany(users);
    res.send({ importUser });
  })
);

ImportData.post(
  "/product",
  expressAsyncHandler(async (req, res) => {
    await Product.deleteMany({});
    const importProducts = await Product.insertMany(products);
    res.send({ importProducts });
  })
);
// ImportData.post(
//   "/category",
//   expressAsyncHandler(async (req, res) => {
//     await Category.deleteMany({});
//     const importCategory = await Category.insertMany(category);
//     res.send({ importCategory });
//   })
// );

export default ImportData;
