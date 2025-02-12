import Elysia from "elysia";
import { alerts } from "./alerts";
import { twilio } from "./twilio";
import { schedule } from "./schedule";

export const v1 = new Elysia().group("/v1", (app) => {
  app.use(alerts);
  app.use(twilio);
  app.use(schedule);
  return app;
});
