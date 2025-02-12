import { App } from "@slack/bolt";
import { cloudCoreApi } from "../../util/ticket.system";
import { AppPermission } from "../../../app.config";
import { env } from "../../../env.config";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";
import {
  cloudCoreChecks,
  postAlertMessage,
} from "../../v1/alerts/alert.post.alert";
import {
  createTicket,
  postTicketCreated,
} from "../../v1/alerts/alert.post.create.ticket";
import { sentAcknowledgementRequest } from "../../v1/alerts/alert.ping.on.call";
import { twilioCall } from "../../util/twilio";
import { createTask } from "../../v1/alerts/alert.post.create.task";

// five minutes
const alertTimer = 5 * 60 * 1000;

export const systemMonitorAlert = (bolt: App) => {
  // listen for alerts and ping on call personnel
  bolt.message(
    /\[ALERT\] (HIGH|LOW|MEDIUM|CRITICAL)\n.+\n.+\n.+\n(.+|\n)*/gm,
    async ({ message }) => {
      if (!("text" in message && message.text)) return;
      const { applicationId, description, priority, projectId, ticketName } =
        parseAlertText(message.text);

      const slackChannelId = message.channel;
      const shouldPostAlert = {
        shouldCreateTicket: {
          shouldCreateTask: {
            pingOnCall: {
              sendAcknowledgement: true,
              ping: true,
              makePhoneCall: false,
            },
            postTaskCreated: true,
          },
          postTicketCreated: true,
        },
        alertName: ticketName,
        alertDescription: description,
      };

      // check app/project exists
      const {
        error: CCError,
        app,
        project,
      } = await cloudCoreChecks({
        applicationId,
        projectId,
      });
      if (CCError || !app || !project) {
        throw CCError;
      }

      // post alert message
      if (!shouldPostAlert) return;

      const { alertMessageTs, error: PAMError } = await postAlertMessage({
        slackChannelId,
        applicationId,
        description: shouldPostAlert.alertDescription,
        priority,
        projectId,
        ticketName: shouldPostAlert.alertName,
      });
      if (PAMError || !alertMessageTs) throw PAMError;

      // create ticket
      if (!shouldPostAlert.shouldCreateTicket) return;
      let {
        error: CTError,
        ticket,
        ticketId,
      } = await createTicket({
        applicationId,
        projectId,
        ticketName: shouldPostAlert.alertName,
        description: shouldPostAlert.alertDescription,
      });
      if (CTError || !ticket || !ticketId) throw CTError;

      // post saying ticket is created
      // allow to keep track of comments
      if (shouldPostAlert.shouldCreateTicket.postTicketCreated) {
        await postTicketCreated({
          alertMessageTs: alertMessageTs,
          ticketCreationText: `*Ticket Created*`,
          slackChannelId,
          ticketMetaData: {
            applicationId,
            projectId,
            ticketId,
          },
        });
      }

      // create task
      if (!shouldPostAlert.shouldCreateTicket.shouldCreateTask) return;
      const { task, taskId, error } = await createTask({
        applicationId,
        projectId,
        ticketId,
        taskName: "slack bot task",
        taskDescription: "check ticket description for more info",
      });

      if (error || !task || !taskId) {
        throw error;
      }

      // post saying task is created
      if (shouldPostAlert.shouldCreateTicket.shouldCreateTask.postTaskCreated) {
        await bolt.client.chat.postMessage({
          channel: slackChannelId,
          thread_ts: alertMessageTs,
          text: `*Task Created*`,
        });
      }

      const text = `*Task Created*\n
        >*Application:* ${app.name}\n
        >*Project:* ${project.name}\n
        >*Ticket:* ${shouldPostAlert.alertName}\n
        >*Description:* ${shouldPostAlert.alertDescription}`
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

      const pingOnCall =
        shouldPostAlert.shouldCreateTicket.shouldCreateTask.pingOnCall;
      // ping and call people every ${fiveMin}
      if (!pingOnCall) return;
      const onCall = ScheduleHandler.getCurrentOnCall(applicationId);
      if (onCall.length === 0) throw "There is no one on call right now";
      for (let i = 0; i < onCall.length; i++) {
        const onCallPersonnel = onCall[i];
        const timeout = setTimeout(async () => {
          // send acknowledgement request to slack
          if (pingOnCall.sendAcknowledgement) {
            await sentAcknowledgementRequest({
              alertMessageTs,
              applicationId,
              blocks,
              onCallPersonnel,
              projectId,
              slackChannelId,
              text,
              ticketId,
              taskId,
            });
          }

          // show who is being pinged
          if (pingOnCall.ping) {
            await bolt.client.chat.postMessage({
              channel: slackChannelId,
              thread_ts: alertMessageTs,
              text: `Pinging <@${onCallPersonnel.slackUserId}> ${onCallPersonnel.firstName}`,
            });
          }

          // make a phone call using twilio cost $0.0135 per min, per call
          if (pingOnCall.makePhoneCall) {
            await twilioCall(onCallPersonnel.phone);
          }
        }, i * alertTimer);
        if (ScheduleHandler.onCallTimer[applicationId] === undefined) {
          ScheduleHandler.onCallTimer[applicationId] = {};
        }
        if (
          ScheduleHandler.onCallTimer[applicationId][ticketId] === undefined
        ) {
          ScheduleHandler.onCallTimer[applicationId][ticketId] = [];
        }
        ScheduleHandler.onCallTimer[applicationId][ticketId].push(timeout);
      }
    }
  );
};

const parseAlertText = (text: string) => {
  const [line1, applicationId, projectId, ticketName, description] =
    text.split("\n");

  const [_alert, priority] = line1.split(" ");

  return {
    applicationId,
    projectId,
    ticketName,
    description,
    priority,
  };
};
