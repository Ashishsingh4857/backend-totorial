class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message); //calls the  constructor of parent class err  passing the message
    this.statusCode = statusCode; //http status code
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    //method that captures the current stack  trace and assigns it to err object
    if (stack) {
      this.stack = stack; //
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
