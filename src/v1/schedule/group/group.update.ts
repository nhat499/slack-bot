import Elysia, { t } from "elysia";
import { onCallPersonnelSchema } from "../../../util/on-call-schedule/on.call.schedule.helper";
import ScheduleHandler from "../../../util/on-call-schedule/schedule.handler";
import { GROUP_TAG } from "./group.tags";

export const groupUpdate = new Elysia().post(
  "/update",
  async ({ body }) => {
    const { appId, groupMembers, groupName } = body;
    ScheduleHandler.addEventToQueue({
      event: "updateGroup",
      data: [appId, groupName, groupMembers],
    });
  },
  {
    tags: [GROUP_TAG],
    body: t.Object({
      appId: t.String(),
      groupName: t.String(),
      groupMembers: t.Array(onCallPersonnelSchema),
    }),
  }
);
