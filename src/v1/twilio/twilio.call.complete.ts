import Elysia from "elysia";

export const twilioCallComplete = new Elysia().post(
  "/callCompleted",
  ({ body }) => {
    console.log("body: ", body);

    return "twilio call complete";
  }
);
