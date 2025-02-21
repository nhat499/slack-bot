import { App } from "@slack/bolt";
import ScheduleHandler from "../../../util/on-call-schedule/schedule.handler";
import {
  extractUpdateOnCallGroupModal,
  updateOnCallGroupModal,
} from "../../view-modal/schedule-modal/groups-modal/update.on.call.groups.modal";

const updateOnCallGroupTrigger = "update_on_call_group_trigger";
export const onCallGroupsCommands = (bolt: App) => {
  // ============================================================ //
  // ON CALL GROUP ACTION //
  // ============================================================ //
  bolt.command("/groups", async ({ ack, body, client, payload }) => {
    console.log("blot groups");
    await ack();

    const [appId, action] = body.text.split(" ");
    if (!appId || !action) {
      await client.chat.postEphemeral({
        user: body.user_id,
        channel: payload.channel_id,
        text: "Please provide a valid AppId and an action [LIST|UPDATE] ",
      });
      return;
    }

    let groups = ScheduleHandler.getOnCallSchedule(appId).groups;

    switch (action.toLowerCase()) {
      case "list":
        let message = `
            *Application Id:* ${appId}\n
            *On Call Groups* \n
            ${Object.keys(groups)
              .map((key) => {
                let string = `${key}\n`;
                for (const [index, user] of groups[key].entries()) {
                  string += `>*Personnel ${index + 1}:* ${user.firstName} ${
                    user.lastName
                  }\n`;
                }
                return `${string}\n`;
              })
              .join("")}
        `;
        await client.chat.postMessage({
          channel: payload.channel_id,
          mrkdwn: true,
          text: message.split(/\n+\s+/).join("\n"),
        });
        break;
      case "update":
        updateOnCallGroupModal;
        await client.views.open({
          view: {
            ...updateOnCallGroupModal(updateOnCallGroupTrigger),
            private_metadata: appId,
          },
          trigger_id: body.trigger_id,
        });
        break;
      default:
        await client.chat.postEphemeral({
          user: body.user_id,
          channel: payload.channel_id,
          text: "Please provide a valid action [LIST|UPDATE] ",
        });
        return;
    }
  });

  bolt.view(updateOnCallGroupTrigger, async ({ ack, view }) => {
    let { groupName, members } = extractUpdateOnCallGroupModal(view);
    if (!groupName || !members) {
      await ack({
        response_action: "errors",
        errors: {
          ["group_name_input_block"]: "Group name is required",
          ["members_input_block"]: "Members are required",
        },
      });
      return;
    }

    await ack();
    ScheduleHandler.addEventToQueue({
      event: "updateGroup",
      data: [view.private_metadata, groupName, members],
    });
  });
};
