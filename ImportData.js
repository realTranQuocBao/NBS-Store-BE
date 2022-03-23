import express from "express";
import expressAsyncHandler from "express-async-handler";
import User from "./models/UserModel.js";
import Product from "./models/ProductModel.js";
import users from "./data/User.js";
import products from "./data/Products.js";

const ImportData = express.Router();

ImportData.post(
  "/user",
  expressAsyncHandler(async (req, res) => {
    await User.remove({});
    const importUser = await User.insertMany(users);
    res.render({ importUser });
  })
);

ImportData.post(
  "/product",
  expressAsyncHandler(async (req, res) => {
    await Product.remove({});
    const importProducts = await User.insertMany(products);
    res.render({ importProducts });
  })
);

export default ImportData;
