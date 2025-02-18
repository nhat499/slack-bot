import Elysia from "elysia";
import { TWILIO_TAG } from "./twilio.tags";

export const twilioCallComplete = new Elysia().post(
  "/callCompleted",
  ({ body }) => {
    console.log("body: ", body);

    return "twilio call complete";
  },
  { tags: [TWILIO_TAG] }
);
