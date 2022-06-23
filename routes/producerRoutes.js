import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/AuthMiddleware.js";
import ProducerControler from "../controllers/producer.controller.js";

const producerRouter = express.Router();

// producerRouter.get("/all", protect, admin, expressAsyncHandler());
// producerRouter.get("/disabled", protect, admin, expressAsyncHandler());
producerRouter.patch("/:id/disable", protect, admin, expressAsyncHandler(ProducerControler.disableProducer));
producerRouter.patch("/:id/restore", protect, admin, expressAsyncHandler(ProducerControler.restoreProducer));
producerRouter.delete("/:id", protect, admin, expressAsyncHandler(ProducerControler.deleteProducer));
producerRouter.put("/:id", protect, admin, expressAsyncHandler(ProducerControler.updateProducer));
producerRouter.get("/", protect, admin, expressAsyncHandler(ProducerControler.getProducers));
producerRouter.post("/", protect, admin, expressAsyncHandler(ProducerControler.createProducer));

export default producerRouter;
