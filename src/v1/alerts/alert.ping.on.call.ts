import Elysia, { t } from "elysia";
import {
  // getCurrentOnCall,
  onCallPersonnel,
  // onCallTimer,
} from "../../util/on-call-schedule/on.call.schedule.helper";
import { Block } from "@slack/types";
import { bolt } from "../../slack-bolt";
import { twilioCall } from "../../util/twilio";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";

// five minutes
export const alertTimer = 5 * 60 * 1000;

export const alertsPingOnCall = new Elysia().post(
  "/pingOnCall",
  async ({ body, set }) => {
    const {
      applicationId,
      applicationName,
      projectId,
      projectName,
      ticketId,
      ticketName,
      ticketDescription,
      taskId,
      ping,
      makePhoneCall,
    } = body;

    const text = `*Task Created*\n
    >*Application:* ${applicationName}\n
    >*Project:* ${projectName}\n
    >*Ticket:* ${ticketName}\n
    >*Description:* ${ticketDescription}`
      .split(/\n+\s+/)
      .join("\n");

    const blocks = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text,
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Acknowledged",
          },
          action_id: "Acknowledged_task",
        },
      },
    ];

    const onCall = ScheduleHandler.getCurrentOnCall(applicationId);

    for (let i = 0; i < onCall.length; i++) {
      const onCallPersonnel = onCall[i];
      const timeout = setTimeout(async () => {
        // show who is being pinged
        if (ping) {
          await bolt.client.chat.postMessage({
            channel: ping.slackChannelId,
            thread_ts: ping.alertMessageTs,
            text: `Pinging <@${onCallPersonnel.slackUserId}> ${onCallPersonnel.firstName}`,
          });

          // send acknowledgement request to slack
          if (ping.sendAcknowledgement) {
            await sentAcknowledgementRequest({
              alertMessageTs: ping.alertMessageTs,
              applicationId,
              blocks,
              onCallPersonnel,
              projectId,
              slackChannelId: ping.slackChannelId,
              text,
              ticketId,
              taskId,
            });
          }
        }

        // make a phone call using twilio cost $0.0135 per min, per call
        if (makePhoneCall) {
          await twilioCall(onCallPersonnel.phone);
        }
      }, i * alertTimer);
      if (ScheduleHandler.onCallTimer[applicationId] === undefined) {
        ScheduleHandler.onCallTimer[applicationId] = {};
      }
      if (ScheduleHandler.onCallTimer[applicationId][ticketId] === undefined) {
        ScheduleHandler.onCallTimer[applicationId][ticketId] = [];
      }
      ScheduleHandler.onCallTimer[applicationId][ticketId].push(timeout);
    }

    set.status = 200;
    return { message: "ok" };
  },
  {
    body: t.Object({
      applicationId: t.String(),
      sendAcknowledgement: t.Boolean(),
      applicationName: t.String(),
      projectId: t.String(),
      projectName: t.String(),
      ticketId: t.String(),
      ticketName: t.String(),
      ticketDescription: t.String(),
      taskId: t.String(),
      ping: t.Optional(
        t.Object({
          slackChannelId: t.String(),
          alertMessageTs: t.String(),
          sendAcknowledgement: t.Boolean(),
        })
      ),
      makePhoneCall: t.Boolean(),
    }),
  }
);

interface sentAcknowledgementRequestParams {
  onCallPersonnel: onCallPersonnel;
  slackChannelId: string;
  alertMessageTs: string;
  applicationId: string;
  projectId: string;
  ticketId: string;
  taskId: string;
  text: string;
  blocks: Block[];
}
export const sentAcknowledgementRequest = async ({
  onCallPersonnel,
  slackChannelId,
  alertMessageTs,
  applicationId,
  projectId,
  ticketId,
  taskId,
  text,
  blocks,
}: sentAcknowledgementRequestParams) => {
  const result = await bolt.client.chat.postMessage({
    metadata: {
      event_type: "TASK_ALERTED",
      event_payload: {
        cloudCoreUserId: onCallPersonnel.cloudCoreUserId,
        slackUserId: onCallPersonnel.slackUserId,
        channelId: slackChannelId,
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

  return result;
};
