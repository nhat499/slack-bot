import Elysia, { t } from "elysia";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";

export const scheduleGet = new Elysia().get(
  "/",
  async ({ query }) => {
    const { appId } = query;
    return ScheduleHandler.getOnCallSchedule(appId);
  },
  {
    query: t.Object({
      appId: t.String(),
    }),
  }
);
