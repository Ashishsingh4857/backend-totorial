import express from "express";
import cors from "cors"; // Cross-Origin Resource Sharing
import cookieParser from "cookie-parser"; // Parse Cookie header and populate req.cookies

const app = express();
const PORT = process.env.PORT || 8000;
// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" })); // Enable JSON body parsing

// Enable URL-encoded body parsing
app.use(
  express.urlencoded({
    extended: true,
    inflate: true,
    limit: "16kb",
  })
);
// Serve static files from the "public" directory
app.use(express.static("public"));
// Enable cookie parsing
app.use(cookieParser());

export { app, PORT };
