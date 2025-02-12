import Elysia, { t } from "elysia";
import { OnCallGroupSchema } from "../../util/on-call-schedule/on.call.schedule.helper";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";

export const scheduleAdd = new Elysia().post(
  "/add",
  async ({ body, set }) => {
    const { appId, data } = body;
    if (!ScheduleHandler.getOnCallSchedule(appId)) {
      set.status = 400;
      return {
        message: "Incorrect appId.",
      };
    }
    ScheduleHandler.addEventToQueue({
      event: "addOnCallSchedule",
      data: [{ appId: appId, data }],
    });
    return ScheduleHandler.getOnCallSchedule(appId);
  },
  {
    body: t.Object({
      appId: t.String(),
      data: t.Object({
        overWrite: t.Optional(
          t.Object({
            date: t.String({
              format: "date-time",
              description: "month/day/year",
            }),
            group: t.Array(OnCallGroupSchema),
          })
        ),
        DAILIES: t.Optional(
          t.Object({
            group: t.Array(OnCallGroupSchema),
          })
        ),
        WEEKLIES: t.Optional(
          t.Object({
            day: t.Number(),
            group: t.Array(OnCallGroupSchema),
          })
        ),
      }),
    }),
  }
);

export default scheduleAdd;
