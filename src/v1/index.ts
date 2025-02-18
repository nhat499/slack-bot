import Elysia from "elysia";
import { alerts } from "./alerts";
import { twilio } from "./twilio";
import { schedule } from "./schedule";
import { alerts2 } from "./alerts2";

export const v1 = new Elysia().group("/v1", (app) => {
  app.use(alerts);
  app.use(alerts2);
  app.use(twilio);
  app.use(schedule);
  return app;
});
