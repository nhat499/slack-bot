import Elysia, { t } from "elysia";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";
import { SCHEDULE_TAG } from "./schedule.tag";

export const scheduleGet = new Elysia().get(
  "/",
  async ({ query }) => {
    const { appId } = query;
    return ScheduleHandler.getOnCallSchedule(appId);
  },
  {
    tags: [SCHEDULE_TAG],
    query: t.Object({
      appId: t.String(),
    }),
  }
);
