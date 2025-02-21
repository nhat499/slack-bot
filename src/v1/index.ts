import Elysia from "elysia";
import { twilio } from "./twilio";
import { schedule } from "./schedule";
import { alerts } from "./alerts";

export const v1 = new Elysia().group("/v1", (app) => {
  app.use(alerts);
  app.use(twilio);
  app.use(schedule);
  return app;
});
