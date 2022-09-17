import mongoose from "mongoose";

const cartSchema = mongoose.Schema(
  {
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    cartItems: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                ref: "Product",
            },
            qty: {
                type: Number,
                required: true,
                default: 1,
            },
        }
    ],
  },
);

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
