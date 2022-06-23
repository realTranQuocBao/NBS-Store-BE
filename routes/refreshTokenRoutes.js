import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "../middleware/AuthMiddleware.js";
import RefreshTokenControler from "../controllers/refreshToken.controller.js";

const refreshTokenRouter = express.Router();

refreshTokenRouter.patch("/refresh", expressAsyncHandler(RefreshTokenControler.refreshAccessToken));
refreshTokenRouter.get("/", expressAsyncHandler(RefreshTokenControler.getAllRefreshTokenForTest));
refreshTokenRouter.post("/", protect, expressAsyncHandler(RefreshTokenControler.createNewRefreshTokenForTest));

export default refreshTokenRouter;
