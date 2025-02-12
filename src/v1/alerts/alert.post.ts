import Elysia, { t } from "elysia";
import { AlertPriority } from "../../util/on-call-schedule/on.call.schedule.helper";
import { bolt } from "../../slack-bolt";
import { twilioCall } from "../../util/twilio";
import { cloudCoreChecks, postAlertMessage } from "./alert.post.alert";
import { createTicket, postTicketCreated } from "./alert.post.create.ticket";
import { createTask } from "./alert.post.create.task";
import { alertTimer, sentAcknowledgementRequest } from "./alert.ping.on.call";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";

export const alertsPost = new Elysia().post(
  "/",
  async ({ body }) => {
    const {
      slackChannelId,
      applicationId,
      projectId,
      priority,
      shouldPostAlert,
    } = body;

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
      return CCError;
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
    if (PAMError || !alertMessageTs) return PAMError;

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
    if (CTError || !ticket || !ticketId) return CTError;

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
      return error;
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
    if (onCall.length === 0) return "There is no one on call right now";
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
      if (ScheduleHandler.onCallTimer[applicationId][ticketId] === undefined) {
        ScheduleHandler.onCallTimer[applicationId][ticketId] = [];
      }
      ScheduleHandler.onCallTimer[applicationId][ticketId].push(timeout);
    }

    return {
      message: "ok",
    };
  },
  {
    body: t.Object({
      slackChannelId: t.String(),
      priority: t.Enum(AlertPriority),
      applicationId: t.String(),
      projectId: t.String(),
      shouldPostAlert: t.Optional(
        t.Object({
          alertName: t.String(),
          alertDescription: t.String(),
          shouldCreateTicket: t.Optional(
            t.Object({
              postTicketCreated: t.Boolean(), // allows commenting to be posted on cloud core
              shouldCreateTask: t.Optional(
                t.Object({
                  postTaskCreated: t.Boolean(),
                  pingOnCall: t.Optional(
                    t.Object({
                      sendAcknowledgement: t.Boolean(),
                      ping: t.Boolean(),
                      makePhoneCall: t.Boolean(),
                    })
                  ),
                })
              ),
            })
          ),
        })
      ),
    }),
  }
);
