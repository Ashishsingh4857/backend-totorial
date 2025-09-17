import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const url = `${process.env.MONGODB_URI}/${DB_NAME}`;

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(url);

    console.log(
      `\n MongoDB connected !! DB Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection error", error);
    process.exit(1);
  }
};

export default connectDb;
