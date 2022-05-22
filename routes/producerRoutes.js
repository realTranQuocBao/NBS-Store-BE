import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/AuthMiddleware.js";
import Producer from "../models/ProducerModel.js";
import Product from "../models/ProductModel.js";

const producerRouter = express.Router();

//Admin create new producer
producerRouter.post(
    "/",
    protect,
    admin,
    expressAsyncHandler(async (req, res) => {
        const {name, code, keyword} = req.body;
        const createdBy = req.user._id;
        const updatedBy = req.user._id;
        const isExist = await Producer.findOne({ name: name, isDisabled: false });
        if (isExist) {
            res.status(400);
            throw new Error("Producer name is already exist");
        }
        else {
            const newProducer = new Producer({
                name,
                code,
                keyword,
                createdBy,
                updatedBy, 
            });
            if (newProducer) {
                const createdProducer = await newProducer.save();
                res.status(201).json(createdProducer);
            }
            else {
                res.status(400);
                throw new Error("Invalid Producer data");
            }
        }
    })
    );

//Admin get all producers
producerRouter.get(
    "/all",
    protect,
    admin, 
    expressAsyncHandler(async (req, res) => {
      const producers = await Producer.find({ isDisabled: false }).sort({_id: -1}).populate("createdBy", "id name email").populate("updatedBy", "id name email");
      res.json(producers);
    })
);

//Admin get all disabled producers
producerRouter.get(
  "/disabled",
  protect,
  admin,
  expressAsyncHandler(async (req, res) => {
    const producers = await Producer.find({ isDisabled: true });
    if (producers.length != 0) {
      res.status(200);
      res.json(producers);
    }
    else {
      res.status(204);
      res.json({ message: "No producers are disabled"} );
    }
  })
);

//Admin update producer by id
producerRouter.put(
    "/:id",
    protect,
    admin,
    expressAsyncHandler(async (req, res) => {
      const { name, code, keyword } = req.body;
      const producerId = req.params.id ? req.params.id : null;
      const producer = await Producer.findOne({ _id: producer, isDisabled: false });
      if (producer) {
        producer.name = name || producer.name;
        producer.code = code || producer.code;
        producer.keyword = keyword || producer.keyword;
        producer.updatedBy = req.user._id;
        const upadatedProducer = await producer.save();
        res.json(upadatedProducer);
      } else {
        res.status(404);
        throw new Error("Producer not Found");
      }
    })
  );

//Admin disable producer
  producerRouter.patch(
    "/:id/disable",
    protect,
    admin,
    expressAsyncHandler(async (req, res) => {
      const producer = await Producer.findById(req.params.id);
      if (!producer) {
        res.status(404);
        throw new Error("Producer not found");
      } else {
        const product = await Product.findOne({ producer: producer._id });
        if (product) {
          res.status(400);
          throw new Error("Cannot disable producer with products");
        }
        else {
          producer.isDisabled = true;
          await producer.save();
          res.status(200);
          res.json({ message: "Producer has been disabled" });
        }
      }
    })
  );

//Admin restore disabled producer
  producerRouter.patch(
    "/:id/restore",
    protect,
    admin,
    expressAsyncHandler(async (req, res) => {
      const producerId = req.params.id ? req.params.id : null;
      const producer = await Producer.findOne({ _id: producerId, isDisabled: true });
      if (!producer) {
        res.status(404);
        throw new Error("Producer not found");
      }
      const duplicatedProducer = await Producer.findOne({ name: producer.name, isDisabled: false });
      if (duplicatedProducer) {
        res.status(400);
        throw new Error("Restore this producer will result in duplicated producer name");
      }
      producer.isDisabled = false;
      const updateProducer = await producer.save();
      res.status(200);
      res.json(updateProducer);
    })
  );

//Admin delete producer  
  producerRouter.delete(
    "/:id",
    protect,
    admin,
    expressAsyncHandler(async (req, res) => {
      const producer = await Producer.findById(req.params.id);
      if (!producer) {
        res.status(404);
        throw new Error("Producer not found");
      } else {
        const product = await Product.findOne({ producer: producer._id });
        if (product) {
          res.status(400);
          throw new Error("Cannot disable producer with products");
        }
        else {
          await producer.remove();
          res.status(200);
          res.json({ message: "Producer has been deleted"});
        }
      }
    })
  );  

export default producerRouter;