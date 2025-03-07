import Elysia, { t } from "elysia";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";
import { SCHEDULE_TAG } from "./schedule.tag";

export const scheduleGetDay = new Elysia().get(
  "/day",
  async ({ query }) => {
    const { appId, date } = query;
    return ScheduleHandler.getDaySchedule({ appId, date });
  },
  {
    tags: [SCHEDULE_TAG],
    query: t.Object({
      appId: t.String(),
      date: t.String({
        format: "date-time",
        description: "yyyy-mm-dd",
      }),
    }),
  }
);
