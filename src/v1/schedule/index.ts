import Elysia from "elysia";
import scheduleAdd from "./schedule.add";
import { scheduleSave } from "./schedule.save";
import { scheduleGroups } from "./group";
import { scheduleGet } from "./schedule.get";
import { scheduleGetDay } from "./schedule.day.get";
import { scheduleDelete } from "./schedule.delete";

export const schedule = new Elysia().group("/schedule", (app) => {
  app.use(scheduleAdd);
  app.use(scheduleSave);
  app.use(scheduleGet);
  app.use(scheduleGetDay);
  app.use(scheduleDelete);
  app.use(scheduleGroups);
  return app;
});
