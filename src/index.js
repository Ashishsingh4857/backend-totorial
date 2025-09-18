import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import connectDb from "./db/index.js";
import { app, PORT } from "./app.js";

connectDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is Running at Port : ${PORT}`);
  });
  app.on("error", (error) => {
    console.log("ERROR: ", error);
    throw error;
  });
});
