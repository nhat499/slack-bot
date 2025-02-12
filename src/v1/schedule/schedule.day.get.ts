import Elysia, { t } from "elysia";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";

export const scheduleGetDay = new Elysia().get(
  "/day",
  async ({ query }) => {
    const { appId, date } = query;
    return ScheduleHandler.getDaySchedule({ appId, date });
  },
  {
    query: t.Object({
      appId: t.String(),
      date: t.String({
        format: "date-time",
        description: "month/day/year",
      }),
    }),
  }
);
