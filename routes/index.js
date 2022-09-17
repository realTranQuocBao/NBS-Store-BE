import ImportData from "./../ImportData.js";
import orderRouter from "./order.routes.js";
import productRouter from "./product.routes.js";
import userRouter from "./user.routes.js";
import categoryRouter from "./category.routes.js";
import producerRouter from "./producer.routes.js";
import cartRouter from "./cart.routes.js";
import commentRouter from "./comment.routes.js";
import refreshTokenRouter from "./refreshToken.routes.js";

const routes = (app) => {
    app.use("/api/v1/import", ImportData);
    app.use("/api/v1/order", orderRouter);
    app.use("/api/v1/product", productRouter);
    app.use("/api/v1/user", userRouter);
    app.use("/api/v1/category", categoryRouter);
    app.use("/api/v1/producer", producerRouter);
    app.use("/api/v1/cart", cartRouter);
    app.use("/api/v1/comment", commentRouter);
    app.use("/api/v1/refresh-token", refreshTokenRouter);
    app.use("/api/v1/config/paypal", (req, res) => {
        res.send(process.env.PAYPAL_CLIENT_ID);
    });
};
export default routes;
