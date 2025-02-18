import { ErrorHandler } from "elysia";

export class CustomError extends Error {
  code: number | string;
  constructor(code: number | string) {
    super();
    this.code = code;
  }
}

export const handleError: ErrorHandler<any, any> = ({ error, code, set }) => {
  console.log(error);
  console.log(code);
  switch (code) {
    case "VALIDATION":
      return { message: "Incorrect parameters were provided" };
    case "INTERNAL_SERVER_ERROR":
      return { message: "An internal server error occurred" };
    case "NOT_FOUND":
      return { message: "The requested endpoint does not exist" };
    case 400:
      return { message: "Bad Request" };
    default:
      return { message: error.toString() };
  }
};
