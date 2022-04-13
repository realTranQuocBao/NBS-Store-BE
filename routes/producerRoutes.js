import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/AuthMiddleware.js";
import Producer from "../models/ProducerModel.js";

const producerRouter = express.Router();

producerRouter.post(
    "/",
    protect,
    admin,
    async (req, res) => {
        const {name, code, keyword, status} = req.body;
        const createdBy = req.user._id;
        const updatedBy = req.user._id;
        const isExist = await Producer.findOne({ name });
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
                status,
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
    });

producerRouter.get(
    "/all",
    protect,
    admin, 
    expressAsyncHandler(async (req, res) => {
      const producers = await Producer.find({}).sort({_id: -1}).populate("createdBy", "id name email").populate("updatedBy", "id name email");
      res.json(producers);
    })
);

producerRouter.put(
    "/:id",
    protect,
    admin,
    expressAsyncHandler(async (req, res) => {
      const { name, code, keyword, status } = req.body;
      let producer;
      producer = await Producer.findById(req.params.id);
      if (producer) {
        producer.name = name || producer.name;
        producer.code = code || producer.code;
        producer.keyword = keyword || producer.keyword;
        producer.status = status || producer.status;
        producer.updatedBy = req.user._id;
        const upadatedProducer = await producer.save();
        res.json(upadatedProducer);
      } else {
        res.status(404);
        throw new Error("Producer not Found");
      }
    })
  );

export default producerRouter;