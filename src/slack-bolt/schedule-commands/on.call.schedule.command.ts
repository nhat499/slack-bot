import { App } from "@slack/bolt";
import {
  extractUpdateOnCallScheduleModal,
  updateOnCallScheduleModal,
} from "../view-modal/schedule-modal/update.on.call.schedule.modal";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";
import { OnCallScheduleType } from "../../util/on-call-schedule/on.call.schedule.helper";

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
    let { date, day, onCallGroup, onCallScheduleType } =
      extractUpdateOnCallScheduleModal(view);
    if (onCallScheduleType === OnCallScheduleType.WEEKLIES && !day) {
      ack({
        response_action: "errors",
        errors: { ["day_input_block"]: "day is needed for WEEKLIES UPDATE" },
      });
      return;
    } else if (onCallScheduleType === "overWrite" && !date) {
      ack({
        response_action: "errors",
        errors: {
          ["date_input_block"]: "date is needed for OVERWRITE UPDATE",
        },
      });
      return;
    }

    if (date) {
      const dateParts = date.split("-");

      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1; // Months are zero-based
      const day = parseInt(dateParts[2], 10);

      date = new Date(year, month, day).toLocaleDateString();
    }

    await ack();
    ScheduleHandler.addEventToQueue({
      event: "addOnCallSchedule",
      data: [
        {
          appId: view.private_metadata,
          data: {
            [onCallScheduleType]: {
              date,
              day,
              group: onCallGroup,
            },
            // DAILIES: { group: dailies },
            // overWrite: {
            //   group: Object.values(overWrite)[0],
            //   date: Object.keys(overWrite)[0],
            // },
            // WEEKLIES: {
            //   day: 0,
            //   group: weeklies[0],
            // },
          },
        },
      ],
    });
  });
};
