import Elysia from "elysia";
import { alertCallOnCall } from "./alert.call.on.call";
import { alertConnectCloudCore } from "./alert.connect.cloud.core";
import { alertPostMessage } from "./alert.post.message";
import { alertPingOnCall } from "./alert.ping.on.call";

export const alerts2 = new Elysia().group("/alert2", (app) => {
  app.use(alertCallOnCall);
  app.use(alertPingOnCall);
  app.use(alertPostMessage);
  app.use(alertConnectCloudCore);
  return app;
});
