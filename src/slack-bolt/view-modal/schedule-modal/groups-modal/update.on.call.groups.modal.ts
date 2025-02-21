import { AnyBlock, View } from "@slack/types";
import { onCallPersonnel } from "../../../../util/on-call-schedule/on.call.schedule.helper";
import { ViewOutput } from "@slack/bolt";
import {
  extractMultilineInput,
  multilineInput,
} from "../../basic-input/multiline.input";
import {
  extractStringInput,
  stringInput,
} from "../../basic-input/string.input";

const multilineBockId = "members_input_block";
const multilineActionId = "members_input";

const stringInputBlockId = "group_name_input_block";
const stringInputActionId = "plain_text_input";
export const updateOnCallGroupModal = (callback_id: string) => {
  const memberArray: onCallPersonnel[] = [
    {
      cloudCoreUserId: "",
      firstName: "",
      lastName: "",
      phone: "+1",
      slackUserId: "",
    },
  ];
  const initial_value = JSON.stringify(memberArray, null, 2);
  const view: View = {
    type: "modal",
    callback_id,
    title: {
      type: "plain_text",
      text: "Update On Call Group",
    },
    blocks: [
      stringInput("Group Name", stringInputBlockId, stringInputActionId),
      multilineInput(
        "Members",
        multilineBockId,
        multilineActionId,
        initial_value
      ),
    ],
    submit: {
      type: "plain_text",
      text: "Submit",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
  };
  return view;
};

export const extractUpdateOnCallGroupModal = (view: ViewOutput) => {
  const groupName = extractStringInput({
    view,
    action_id: stringInputActionId,
    block_id: stringInputActionId,
  });

  const members: onCallPersonnel[] = JSON.parse(
    extractMultilineInput({
      view,
      block_id: multilineBockId,
      action_id: multilineActionId,
    })
  );
  return { groupName, members };
};
