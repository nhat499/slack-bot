import Elysia, { t } from "elysia";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";
import { alertTimer } from "../alerts/alert.ping.on.call";
import { twilioCall } from "../../util/twilio";
import { bolt } from "../../slack-bolt";
import { cloudCoreApi } from "../../util/cloud.core.system";
import { AppPermission } from "../../../app.config";
import { acknowledgeMessage } from "./alert.ping.on.call";
import { ALERT_LABEL } from "./alert.tag";

export const alertCallOnCall = new Elysia().post(
  "/call",
  async ({ body }) => {
    let {
      applicationId,
      ticketId,
      alertChannelId,
      alertMessageTs,
      projectId,
      taskId,
    } = body;
    const onCall = ScheduleHandler.getCurrentOnCall(applicationId);
    if (onCall.length === 0) return "There is no one on call right now";

    if (!taskId) {
      // create task to assign to people
      const { data, error } = await cloudCoreApi.POST(
        "/api/v1/projects/{project}/tasks/",
        {
          params: {
            header: {
              "x-app-id": applicationId,
              // need to account for other apps
              "x-app-secret": AppPermission[applicationId],
            },
            path: {
              project: projectId,
            },
          },
          body: {
            ticketId: ticketId,
            name: `Alert task for ${ticketId}`,
            description: "see Ticket description",
            status: "TODO",
          },
        }
      );

      if (!data || !data.id || error || !data.description)
        return "error creating task";

      taskId = data.id;
    }

    // check task id exists
    const { data: taskData, error: taskError } = await cloudCoreApi.GET(
      "/api/v1/projects/{project}/tasks/{task}",
      {
        params: {
          header: {
            "x-app-id": applicationId,
            // need to account for other apps
            "x-app-secret": AppPermission[applicationId],
          },
          path: {
            project: projectId,
            task: taskId,
          },
        },
      }
    );

    if (!taskData || taskError || !taskData.description)
      return "incorrect task id";

    const { blocks, text } = acknowledgeMessage({
      applicationId,
      projectId,
      ticketId,
      ticketDescription: "check ticket description",
    });

    for (let i = 0; i < onCall.length; i++) {
      const onCallPersonnel = onCall[i];
      const timeout = setTimeout(async () => {
        // make a phone call using twilio cost $0.0135 per min, per call
        await twilioCall(onCallPersonnel.phone);

        // make acknowledgment message
        await bolt.client.chat.postMessage({
          metadata: {
            event_type: "TASK_ALERTED",
            event_payload: {
              cloudCoreUserId: onCallPersonnel.cloudCoreUserId,
              slackUserId: onCallPersonnel.slackUserId,
              channelId: alertChannelId,
              messageTs: alertMessageTs,
              applicationId,
              projectId,
              ticketId: ticketId,
              taskId: taskId,
            },
          },
          channel: onCallPersonnel.slackUserId,
          text,
          blocks,
        });
      }, i * alertTimer);
      if (ScheduleHandler.onCallTimer[applicationId] === undefined) {
        ScheduleHandler.onCallTimer[applicationId] = {};
      }
      if (ScheduleHandler.onCallTimer[applicationId][ticketId] === undefined) {
        ScheduleHandler.onCallTimer[applicationId][ticketId] = [];
      }
      ScheduleHandler.onCallTimer[applicationId][ticketId].push(timeout);
    }
  },
  {
    tags: [ALERT_LABEL],
    body: t.Object({
      alertMessageTs: t.String(),
      alertChannelId: t.String(),
      applicationId: t.String(),
      projectId: t.String(),
      ticketId: t.String(),
      taskId: t.Optional(t.String()),
    }),
  }
);
