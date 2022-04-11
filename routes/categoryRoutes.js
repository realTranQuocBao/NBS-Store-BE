// import express from "express";
// import expressAsyncHandler from "express-async-handler";
// import Category from "../models/Category";
// import { admin, protect } from "./../middleware/AuthMiddleware.js";


// const categoryRouter = express.Router();

// // CREATE CATEGORY
// categoryRouter.post("/category", protect, admin, async (req, res) => {
//     const { name } = req.body;
//     const isExist = await Category.findOne({ name });
//     if (isExist) {
//         res.status(400);
//         throw new Error("Category name already exist");
//     } else {
//         const newCategory = new Category({
//             name
//         });
//         if (newCategory) {
//             const createdCategory = await categoryRouter.save();
//             res.status(201).json(createdCategory);
//         } else {
//             res.status(400);
//             throw new Error("Invalid Category data");
//         }
//     }
// });

// // GET CATEGORY
// categoryRouter.get(
//     "/category",
//     expressAsyncHandler(async (req, res) => {
//         if (count == 0) {
//             res.status(204);
//             throw new Error("No category found for this keyword");
//         }
//         //else
//         const category = await Category.find({ ...keyword })
//         res.json({ category });
//     })
// );