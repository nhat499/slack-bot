import Elysia from "elysia";
import { groupAdd } from "./group.add";

export const scheduleGroups = new Elysia().group("/group", (app) => {
  app.use(groupAdd);
  return app;
});
