import express from "express";
import asyncHandler from "express-async-handler";
import { sendMail } from "../utils/nodeMailler.js";

const testRouter = express.Router();

// test post email
testRouter.post(
  "/send-mail",
  asyncHandler(async (req, res, next) => {
    const messageOptions = {
      recipient: "xuannhutzz@gmail.com",
      subject: "test lần thứ 2"
    };
    try {
      await sendMail(messageOptions);
      res.status(200);
      res.json("Sending mail successfully");
    } catch (error) {
      next(error);
    }
  })
);
export default testRouter;
