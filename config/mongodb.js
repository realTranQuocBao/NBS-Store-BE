import mongoose from "mongoose";

const connectDatabase = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL
            //     , {
            //     useNewUrlParser: true,
            //     useUnifiedTopology: true
            // }
        );
        console.log(`>>>Connecting to Mongoose success...`);
    } catch (error) {
        console.log(`<<<Error connect:${error.message}`);
        process.exit(1);
    }
}
export default connectDatabase;