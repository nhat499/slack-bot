import { App } from "@slack/bolt";
import {
  extractOnCallScheduleModal,
  updateOnCallScheduleModal,
} from "../../view-modal/on-call-schedule-views/on-call-schedule.modal";
import ScheduleHandler from "../../../util/on-call-schedule/schedule.handler";

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
      const currDate = new Date();
      const onCallPersonals = ScheduleHandler.getDaySchedule({
        appId,
        date: currDate.toLocaleDateString(),
      });
      const schedule = ScheduleHandler.getOnCallSchedule(appId);

      if (Action.toLocaleLowerCase() === "list") {
        let message = `*Application:* ${schedule.application}\n
        *Type:* ${schedule.type}\n
        *On Call Personals:*\n`
          .split(/\n+\s+/)
          .join("\n");
        message += `\`\`\`${ScheduleHandler.renderSchedule(
          onCallPersonals
        )}\`\`\``;
        client.chat.postMessage({
          channel: payload.channel_id,
          mrkdwn: true,
          text: message.trim(),
        });
      } else if (Action.toLocaleLowerCase() === "update") {
        await client.views.open({
          view: {
            ...updateOnCallScheduleModal(updateOnCallScheduleTrigger, schedule)
              .view,
            private_metadata: appId,
          },
          trigger_id: body.trigger_id,
        });
      }
    }
  );

  // ============================================================ //
  // ON CALL SCHEDULE UPDATE //
  // ============================================================ //
  bolt.view(updateOnCallScheduleTrigger, async ({ ack, view }) => {
    try {
      const { dailies, overWrite, weeklies, onCallScheduleType } =
        extractOnCallScheduleModal(view);
      await ack();
      console.log({ dailies, overWrite, weeklies, onCallScheduleType });

      // UI need to be updated since data has been updated
      ScheduleHandler.addEventToQueue({
        event: "addOnCallSchedule",
        data: [
          {
            appId: view.private_metadata,
            data: {
              DAILIES: { group: dailies },
              overWrite: {
                group: Object.values(overWrite)[0],
                date: Object.keys(overWrite)[0],
              },
              WEEKLIES: {
                day: 0,
                group: weeklies[0],
              },
            },
          },
        ],
      });

      // updateOnCallSchedule({
      //   appId: view.private_metadata,
      //   daySchedule: dailies,
      //   overWriteSchedule: overWrite,
      //   weeklySchedule: weeklies,
      //   type: onCallScheduleType,
      // });
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
