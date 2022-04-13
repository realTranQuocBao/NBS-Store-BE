import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/AuthMiddleware.js";
import Category from "../models/CategoryModel.js";

const categoryRouter = express.Router();

categoryRouter.post(
    "/",
    protect,
    admin,
    async (req, res) => {
        const {name, link, status} = req.body;
        const createdBy = req.user._id;
        const updatedBy = req.user._id;
        const isExist = await Category.findOne({ name });
        if (isExist) {
            res.status(400);
            throw new Error("Category name is already exist");
        }
        else {
            const newCategory = new Category({
                name,
                link,
                createdBy,
                updatedBy, 
                status,
            });
            if (newCategory) {
                const createdCategory = await newCategory.save();
                res.status(201).json(createdCategory);
            }
            else {
                res.status(400);
                throw new Error("Invalid category data");
            }
        }
    });

categoryRouter.get(
    "/all",
    protect,
    expressAsyncHandler(async (req, res) => {
      const categories = await Category.find({}).sort({_id: -1}).populate("createdBy", "id name email").populate("updatedBy", "id name email");
      res.json(categories);
    })
);

categoryRouter.put(
    "/:id",
    protect,
    admin,
    expressAsyncHandler(async (req, res) => {
      const { name, link, status } = req.body;
      let category;
      category = await Category.findById(req.params.id);
      if (category) {
        category.name = name || category.name;
        category.link = link || category.link;
        category.status = status || category.status;
        category.updatedBy = req.user._id;
        const upadatedCategory = await category.save();
        res.json(upadatedCategory);
      } else {
        res.status(404);
        throw new Error("Category not Found");
      }
    })
  );

export default categoryRouter;