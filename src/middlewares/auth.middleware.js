import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken;
  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }
  // Verify the token

  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await User.findById(decodedToken?._id);
  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }
  req.user = user;
  next();
});
export { verifyJWT };
