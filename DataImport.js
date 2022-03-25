import express from 'express';
import products from './data/Products.js';
import users from './data/Users.js';
import Product from './Models/ProductModel.js';
import User from './Models/UserModel.js';
import asyncHandler from 'express-async-handler';

const ImportData = express.Router();

// handle import API user
ImportData.post('/user', asyncHandler(
    async (req, res) => {
        await User.remove({});
        const importUser = await User.insertMany(users);
        res.send({ importUser });
    }
))

// handle import API product
ImportData.post('/product', asyncHandler(
    async (req, res) => {
        await Product.remove({});
        const importProduct = await Product.insertMany(products);
        res.send({ importProduct });
    }
))

export default ImportData;