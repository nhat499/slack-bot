import { ErrorHandler } from "elysia";

export const handleError: ErrorHandler<any, any> = ({ error, code }) => {
  console.log(error);
  switch (code) {
    case "VALIDATION":
      return { message: "Incorrect parameters were provided" };
    case "INTERNAL_SERVER_ERROR":
      return { message: "An internal server error occurred" };
    case "NOT_FOUND":
      return { message: "The requested endpoint does not exist" };
    default:
      return { message: error.toString() };
  }
};
