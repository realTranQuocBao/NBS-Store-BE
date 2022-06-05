import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/AuthMiddleware.js";
import Category from "../models/CategoryModel.js";
import Product from "../models/ProductModel.js";

const categoryRouter = express.Router();

//Admin create new category
categoryRouter.post("/", protect, admin, expressAsyncHandler(async (req, res) => {
  const {name, slug, isDisabled} = req.body;
  const createdBy = req.user._id;
  const updatedBy = req.user._id;
  const isExist = await Category.findOne({ name: name, isDisabled: false });
  if (isExist) {
    res.status(400);
    throw new Error("Category name is already exist");
  }
    else {
      const newCategory = new Category({
        name,
        slug,
        createdBy,
        updatedBy, 
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
})
);

//Admin get all categories
categoryRouter.get(
  "/all",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const categories = await Category.find({ isDisabled: false })
    .sort({_id: -1});
    res.json(categories);
  })
);

//Admin get all disabled categories
categoryRouter.get(
  "/disabled",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const categories = await Category.find({ isDisabled: true });
    if (categories.length != 0) {
      res.status(200);
      res.json(categories);
    }
    else {
      res.status(204);
      res.json({ message: "No categories are disabled"} );
    }
  })
);


//User, non-user get all catgories
categoryRouter.get(
  "/",
  expressAsyncHandler(async (req, res) => {
    const categories = await Category.find({ isDisabled: false }).sort({_id: -1});
    res.json(categories);
  })
);

//Admin udpate category
categoryRouter.put(
    "/:id",
    protect,
    admin,
    expressAsyncHandler(async (req, res) => {
      const { name, slug } = req.body;
      const categoryId = req.params.id || null;
      const category = await Category.findOne({ _id: categoryId, isDisabled: false });
      if (!category) {
        res.status(404);
        throw new Error("Category not Found");
      }
      category.name = name || category.name;
      category.slug = slug || category.slug;
      category.updatedBy = req.user._id;
      const updatedCategory = await category.save();
      res.json(updatedCategory);
    })
  );

//Admin disable category
categoryRouter.patch(
  "/:id/disable",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }
    const product = await Product.findOne({ category: category._id });
    if (product) {
      res.status(400);
      throw new Error("Cannot disable category with products");
    }
    category.isDisabled = true;
    await category.save();
    res.status(200);
    res.json({ message: "Category has been disabled" });
  })
);

//Admin restore disabled category
categoryRouter.patch(
  "/:id/restore",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const categoryId = req.params.id || null;
    const category = await Category.findOne({ _id: categoryId, isDisabled: true });
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    }
    const duplicatedCategory = await Category.findOne({ name: category.name, isDisabled: false });
    if (duplicatedCategory) {
      res.status(400);
      throw new Error("Restore this category will result in duplicated category name");
    }
    category.isDisabled = false;
    const updateCategory = await category.save();
    res.status(200);
    res.json(updateCategory);
  })
);

//Admin delete category
categoryRouter.delete(
  "/:id",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404);
      throw new Error("Category not found");
    } 
    const product = await Product.findOne({ category: category._id });
    if (product) {
      res.status(400);
      throw new Error("Cannot disable category with products");
    }
    await category.remove();
    res.status(200);
    res.json({ message: "Category has been deleted"});
  })
);

export default categoryRouter;