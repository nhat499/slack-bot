import Elysia from "elysia";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";
import { SCHEDULE_TAG } from "./schedule.tag";

export const scheduleSave = new Elysia().post(
  "/save",
  async ({ body }) => {
    ScheduleHandler.addEventToQueue({
      event: "saveOnCallSchedule",
      data: [],
    });
  },
  {
    tags: [SCHEDULE_TAG],
  }
);
