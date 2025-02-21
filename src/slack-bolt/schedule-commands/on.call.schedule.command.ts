import { App } from "@slack/bolt";
import {
  extractUpdateOnCallScheduleModal,
  updateOnCallScheduleModal,
} from "../view-modal/schedule-modal/update.on.call.schedule.modal";
import ScheduleHandler from "../../util/on-call-schedule/schedule.handler";
import { OnCallScheduleType } from "../../util/on-call-schedule/on.call.schedule.helper";
import {
  deleteOnCallScheduleModal,
  extractDeleteOnCallScheduleModal,
} from "../view-modal/schedule-modal/delete.oncall.schedule.modal";

const updateOnCallScheduleTrigger = "update_on_call_schedule_trigger";
const deleteOnCallScheduleTrigger = "delete_on_call_schedule_trigger";

export const onCallScheduleCommands = (bolt: App) => {
  // ============================================================ //
  // ON CALL SCHEDULE ACTION //
  // ============================================================ //
  bolt.command(
    "/schedule",
    async ({ command, ack, say, body, client, payload }) => {
      const [appId, Action] = body.text.split(" ");
      if (!appId || !Action) {
        await client.chat.postEphemeral({
          user: body.user_id,
          channel: payload.channel_id,
          text: "Please provide a valid AppId and an action [LIST|UPDATE] ",
        });
        return;
      }
      let schedule, onCallPersonals;
      try {
        // get on call schedule
        const UTCDateString = new Date().toISOString().split("T")[0]; // 2025-02-19T22:07:56.617Z
        onCallPersonals = ScheduleHandler.getDaySchedule({
          appId,
          date: UTCDateString,
        });

        schedule = ScheduleHandler.getOnCallSchedule(appId);
        await ack();
      } catch (err) {
        await ack("cant find appid");
        return;
      }

      switch (Action.toLowerCase()) {
        case "list":
          let message = `
            *Application:* ${schedule.application}\n
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
          break;
        case "update":
          await client.views.open({
            view: {
              ...updateOnCallScheduleModal(updateOnCallScheduleTrigger),
              private_metadata: appId,
            },
            trigger_id: body.trigger_id,
          });
          break;
        case "delete":
          deleteOnCallScheduleModal(deleteOnCallScheduleTrigger);
          await client.views.open({
            view: {
              ...deleteOnCallScheduleModal(deleteOnCallScheduleTrigger),
              private_metadata: appId,
            },
            trigger_id: body.trigger_id,
          });
          break;
        default:
          await ack("Please provide a valid action [LIST|UPDATE|DELETE]");
          return;
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
      date = new Date(date).toISOString().split("T")[0];
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
          },
        },
      ],
    });
  });

  // ============================================================ //
  // ON CALL SCHEDULE DELETE //
  // ============================================================ //
  bolt.view(deleteOnCallScheduleTrigger, async ({ ack, view }) => {
    console.log("onCallScheduleType test");
    let { date, day, endTime, startTime, onCallScheduleType } =
      extractDeleteOnCallScheduleModal(view);

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
      date = new Date(date).toISOString().split("T")[0];
    }

    await ack();
    ScheduleHandler.addEventToQueue({
      event: "deleteOnCallSchedule",
      data: [
        {
          appId: view.private_metadata,
          data: {
            [onCallScheduleType]: {
              date,
              day,
              startTime,
              endTime,
            },
          },
        },
      ],
    });
  });
};
