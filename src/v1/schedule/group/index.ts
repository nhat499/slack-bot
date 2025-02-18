import Elysia from "elysia";
import { groupUpdate } from "./group.update";
import { groupDelete } from "./group.delete";

export const scheduleGroups = new Elysia().group("/group", (app) => {
  app.use(groupUpdate);
  app.use(groupDelete);
  return app;
});
