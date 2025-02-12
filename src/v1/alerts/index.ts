import Elysia from "elysia";
import { alertsPost } from "./alert.post";

export const alerts = new Elysia().group("/alert", (app) => {
  app.use(alertsPost);
  return app;
});
