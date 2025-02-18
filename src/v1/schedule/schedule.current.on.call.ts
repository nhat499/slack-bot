import Elysia, { t } from "elysia";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";
import { SCHEDULE_TAG } from "./schedule.tag";

export const scheduleCurrentOnCall = new Elysia().get(
  "/currentOnCall",
  ({ query }) => {
    const currOnCall = ScheduleHandler.getCurrentOnCall(query.appId);
    return currOnCall;
  },
  {
    tags: [SCHEDULE_TAG],
    query: t.Object({
      appId: t.String(),
    }),
  }
);
