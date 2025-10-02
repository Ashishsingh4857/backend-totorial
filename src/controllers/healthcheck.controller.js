import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthCheck = asyncHandler(async (req, res) => {
  // healthCheck response that simply returns the OK status as json with a message
  return res.status(200).json(new ApiResponse(200, {}, "server status : OK"));
});

export { healthCheck };
