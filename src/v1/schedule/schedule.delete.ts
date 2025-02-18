import Elysia, { t } from "elysia";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";
import { SCHEDULE_TAG } from "./schedule.tag";

export const scheduleDelete = new Elysia().delete(
  "/",
  async ({ body, set }) => {
    const { appId, data } = body;
    if (!ScheduleHandler.getOnCallSchedule(appId)) {
      set.status = 400;
      return {
        message: "Incorrect appId.",
      };
    }
    ScheduleHandler.addEventToQueue({
      event: "deleteOnCallSchedule",
      data: [{ appId: appId, data }],
    });
    return ScheduleHandler.getOnCallSchedule(appId);
  },
  {
    tags: [SCHEDULE_TAG],
    body: t.Object({
      appId: t.String(),
      data: t.Object({
        overWrite: t.Optional(
          t.Object({
            date: t.String({
              format: "date-time",
              description: "month/day/year",
            }),
            startTime: t.Number(),
            endTime: t.Number(),
          })
        ),
        DAILIES: t.Optional(
          t.Object({
            startTime: t.Number(),
            endTime: t.Number(),
          })
        ),
        WEEKLIES: t.Optional(
          t.Object({
            day: t.Number(),
            startTime: t.Number(),
            endTime: t.Number(),
          })
        ),
      }),
    }),
  }
);
