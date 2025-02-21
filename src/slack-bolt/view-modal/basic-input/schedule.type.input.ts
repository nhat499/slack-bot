import { AnyBlock, PlainTextOption } from "@slack/types";
import { OnCallScheduleType } from "../../../util/on-call-schedule/on.call.schedule.helper";
import { ViewOutput } from "@slack/bolt";

export const scheduleTypeInput = (
  label: string,
  block_id: string,
  action_id: string
) => {
  const OnCallScheduleTypeOptions: PlainTextOption[] = Object.values({
    ...OnCallScheduleType,
    overWrite: "overWrite",
  }).map((value) => {
    return {
      text: {
        type: "plain_text",
        text: value,
      },
      value: value,
    };
  });

  const block: AnyBlock = {
    type: "input",
    block_id,
    element: {
      type: "static_select",
      action_id,
      placeholder: {
        type: "plain_text",
        text: "Select an option",
      },
      initial_option: {
        text: {
          type: "plain_text",
          text: OnCallScheduleType.DAILIES,
        },
        value: OnCallScheduleType.DAILIES,
      },
      options: OnCallScheduleTypeOptions,
    },
    label: {
      type: "plain_text",
      text: label,
    },
  };

  return block;
};

export const extractScheduleTypeInput = (data: {
  view: ViewOutput;
  block_id: string;
  action_id: string;
}) => {
  const { view, block_id, action_id } = data;
  return view.state.values[block_id][action_id].selected_option?.value as
    | OnCallScheduleType
    | "overWrite";
};
