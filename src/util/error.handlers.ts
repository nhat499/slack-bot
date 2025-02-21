import { ErrorHandler } from "elysia";

export class CustomError {
  code: number | string;
  message?: string;
  constructor(code: number | string, message?: string) {
    this.code = code;
    this.message = message;
  }
}

export const handleError: ErrorHandler<any, any> = (data) => {
  console.log("i am handler erorr data", data);
  const { error, code, set } = data;
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
      set.status = 400;
      return { message: "Bad Request" };
    default:
      set.status = 500;
      return { message: error.toString() };
  }
};
