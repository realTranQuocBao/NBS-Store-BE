import mongoose from "mongoose";
// import bcryptjs from "bcryptjs";
// import bcrypt from "bcryptjs/dist/bcrypt";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true,
            select: false
        },
        avatarUrl: {
            type: String,
            required: false,
            default: "/images/avatar/default.png"
        },
        isAdmin: {
            type: Boolean,
            required: true,
            default: false
        },
        isDisabled: {
            type: Boolean,
            required: true,
            default: false
        }
    },
    {
        timestamps: true
    }
);

//Login handle method
userSchema.methods.matchPassword = async function (enterPassword) {
    return await bcrypt.compare(enterPassword, this.password);
};

// Register handle method
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;
