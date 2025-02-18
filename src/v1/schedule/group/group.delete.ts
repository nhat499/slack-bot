import Elysia, { t } from "elysia";
import ScheduleHandler from "../../../util/on-call-schedule/schedule.handler";
import { GROUP_TAG } from "./group.tags";

export const groupDelete = new Elysia().delete(
  "/",
  async ({ body }) => {
    console.log(body);
    ScheduleHandler.addEventToQueue({
      event: "deleteGroup",
      data: [body.appId, body.groupName],
    });
  },
  {
    tags: [GROUP_TAG],
    body: t.Object({
      appId: t.String(),
      groupName: t.String(),
    }),
  }
);
