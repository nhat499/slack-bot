import Elysia, { t } from "elysia";
import { onCallPersonnelSchema } from "../../../util/on-call-schedule/on.call.schedule.helper";
import ScheduleHandler from "../../../util/on-call-schedule/schedule.handler";

export const groupAdd = new Elysia().post(
  "/add",
  async ({ body }) => {
    console.log(body);
    const { appId, groupMembers, groupName } = body;
    ScheduleHandler.addEventToQueue({
      event: "addGroup",
      data: [appId, groupName, groupMembers],
    });
  },
  {
    body: t.Object({
      appId: t.String(),
      groupName: t.String(),
      groupMembers: t.Array(onCallPersonnelSchema),
    }),
  }
);
