import Elysia from "elysia";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";

export const scheduleSave = new Elysia().post("/save", async ({ body }) => {
  ScheduleHandler.addEventToQueue({
    event: "saveOnCallSchedule",
    data: [],
  });
});
