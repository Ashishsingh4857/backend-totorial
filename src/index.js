import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import connectDb from "./db/index.js";
connectDb();
