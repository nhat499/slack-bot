import { App } from "@slack/bolt";
import {
  getOnCallSchedule,
  updateOnCall,
} from "../../../on-call-schedule/get.on.call.schedule";
import {
  extractOnCallScheduleModal,
  updateOnCallScheduleModal,
} from "../../view-modal/on-call-schedule-views/on-call-schedule.modal";

const updateOnCallScheduleTrigger = "update_on_call_schedule_trigger";

export const onCallScheduleCommands = (bolt: App) => {
  // ============================================================ //
  // ON CALL SCHEDULE ACTION //
  // ============================================================ //
  bolt.command(
    "/schedule",
    async ({ command, ack, say, body, client, payload }) => {
      await ack();

      const [appId, Action] = body.text.split(" ");
      if (!appId || !Action) {
        await client.chat.postEphemeral({
          user: body.user_id,
          channel: payload.channel_id,
          text: "Please provide a valid AppId and an action [LIST|UPDATE] ",
        });
        return;
      }

      // get on call schedule
      const onCallSchedule = await getOnCallSchedule(appId);
      if (!onCallSchedule) {
        await client.chat.postEphemeral({
          user: body.user_id,
          channel: payload.channel_id,
          text: "App does not have an on call schedule",
        });
        return;
      }

      if (Action.toLocaleLowerCase() === "list") {
        let message = `*Application:* ${onCallSchedule.application}\n
        *Type:* ${onCallSchedule.type}\n
        *On Call Personals:*\n`
          .split(/\n+\s+/)
          .join("\n");

        onCallSchedule.onCallPersonals.forEach((group, groupIndex: number) => {
          message += `\n*Group ${groupIndex + 1}:*\n`;
          group.forEach((person, personIndex) => {
            message += `${personIndex + 1}. *First Name:* ${
              person.firstName
            }\n`;
            message += `   *Last Name:* ${person.lastName}\n`;
            message += `   *Cloud Core ID:* ${person.cloudCoreUserId}\n`;
            message += `   *Slack User ID:* <@${person.slackUserId}>\n`;
            message += `   *Phone:* ${person.phone}\n\n`;
          });
        });
        client.chat.postMessage({
          channel: payload.channel_id,
          mrkdwn: true,
          text: message.trim(),
        });
      } else if (Action.toLocaleLowerCase() === "update") {
        await client.views.open({
          view: {
            ...updateOnCallScheduleModal(
              updateOnCallScheduleTrigger,
              onCallSchedule
            ).view,
            private_metadata: appId,
          },
          trigger_id: body.trigger_id,
        });
      }
    }
  );

  bolt.view(updateOnCallScheduleTrigger, async ({ ack, view }) => {
    try {
      const { onCallPersonnel, onCallScheduleType } =
        extractOnCallScheduleModal(view);
      await ack();

      await updateOnCall({
        appId: view.private_metadata,
        newOnCall: onCallPersonnel,
        type: onCallScheduleType,
      });
    } catch (error) {
      if (!(error instanceof Error)) {
        console.error(error);
        return;
      }
      await ack({
        response_action: "errors",
        errors: {
          ["on_call_personnel_block"]: error.message,
        },
      });
    }
  });
};
