import express from "express";
import expressAsyncHandler from "express-async-handler";
import { admin, protect } from "./../middleware/AuthMiddleware.js";
import { upload } from "./../middleware/UploadMiddleware.js";
import UserControler from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.post(
  "/CreateOrUpdateAvatar/:userId",
  protect,
  upload.single("file"),
  expressAsyncHandler(UserControler.uploadAvatar)
);
// userRouter.get("/disabled", protect, admin, expressAsyncHandler());
userRouter.post("/login", expressAsyncHandler(UserControler.login));
userRouter.get("/profile", protect, expressAsyncHandler(UserControler.getProfile));
userRouter.put("/profile", protect, expressAsyncHandler(UserControler.updateProfile));
userRouter.patch("/:id/disable", protect, admin, expressAsyncHandler(UserControler.disableUser));
userRouter.patch("/:id/restore", protect, admin, expressAsyncHandler(UserControler.restoreUser));
userRouter.delete("/:id", protect, admin, expressAsyncHandler(UserControler.deleteUser));
userRouter.get("/", protect, admin, expressAsyncHandler(UserControler.getUsers));
userRouter.post("/", expressAsyncHandler(UserControler.register));
userRouter.patch("/verify-email", expressAsyncHandler(UserControler.verifyEmail));
// userRouter.get("/", protect, admin, expressAsyncHandler());
// userRouter.get("/", protect, admin, expressAsyncHandler());

export default userRouter;
