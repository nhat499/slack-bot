import Elysia from "elysia";
import { twilioCallComplete } from "./twilio.call.complete";

export const twilio = new Elysia().group("/twilio", (app) => {
  app.use(twilioCallComplete);
  return app;
});
