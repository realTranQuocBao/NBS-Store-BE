import jwt from "jsonwebtoken";
import expressAsyncHandler from "express-async-handler";
import User from "../models/UserModel";

const protect = expressAsyncHandler(async (req, res, next) => {
  {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      try {
        token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        next();
      } catch (error) {
        console.error(`Error when protect auth middleware: ${error}`);
        res.status(401);
        throw new Error("Not authorized, token faild");
      }
    }
    if (!token) {
      res.status(401);
      throw new Error("Not authorized, no token");
    }
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an Admin");
  }
};

export { protect, admin };
