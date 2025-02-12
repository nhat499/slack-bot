import { AnyBlock, PlainTextOption, View } from "@slack/types";
import {
  OnCallSchedule,
  OnCallScheduleType,
} from "../../../util/on-call-schedule/on.call.schedule.helper";
import { ViewOutput } from "@slack/bolt";

export const updateOnCallScheduleModal = (
  callBack_id: string,
  onCallSchedule: OnCallSchedule[string]
) => {
  const OnCallScheduleTypeOptions: PlainTextOption[] = Object.values(
    OnCallScheduleType
  ).map((value) => {
    return {
      text: {
        type: "plain_text",
        text: value,
      },
      value: value,
    };
  });

  const scheduleTypeInput: AnyBlock = {
    type: "input",
    block_id: "on_call_schedule_block",
    element: {
      type: "static_select",
      action_id: "on_call_schedule_input",
      placeholder: {
        type: "plain_text",
        text: "Select an option",
      },
      initial_option: {
        text: {
          type: "plain_text",
          text: onCallSchedule.type,
        },
        value: onCallSchedule.type,
      },
      options: OnCallScheduleTypeOptions,
    },
    label: {
      type: "plain_text",
      text: "On Call Schedule",
    },
  };

  const onCallOverWriteInput: AnyBlock = {
    type: "input",
    block_id: "on_call_overwrite_block",
    element: {
      type: "plain_text_input",
      multiline: true,
      action_id: "on_call_overwrite_input",
      initial_value: JSON.stringify(onCallSchedule.overWrite, null, 2),
    },
    label: {
      type: "plain_text",
      text: "Over Write",
    },
  };

  const onCallWeeklyInput: AnyBlock = {
    type: "input",
    block_id: "on_call_weeklies_block",
    element: {
      type: "plain_text_input",
      multiline: true,
      action_id: "on_call_weeklies_input",
      initial_value: JSON.stringify(
        onCallSchedule[OnCallScheduleType.WEEKLIES],
        null,
        2
      ),
    },
    label: {
      type: "plain_text",
      text: "Weekly",
    },
  };

  const onCallDailiesInput: AnyBlock = {
    type: "input",
    block_id: "on_call_dailies_block",
    element: {
      type: "plain_text_input",
      multiline: true,
      action_id: "on_call_dailies_input",
      initial_value: JSON.stringify(
        onCallSchedule[OnCallScheduleType.DAILIES],
        null,
        2
      ),
    },
    label: {
      type: "plain_text",
      text: "Dailies",
    },
  };

  const view: View = {
    type: "modal",
    callback_id: callBack_id,
    title: {
      type: "plain_text",
      text: "Update On Call Schedule",
    },
    blocks: [
      scheduleTypeInput,
      onCallOverWriteInput,
      onCallWeeklyInput,
      onCallDailiesInput,
    ],
    submit: {
      type: "plain_text",
      text: "Submit",
    },
  };
  return { view };
};

export const extractOnCallScheduleModal = (view: ViewOutput) => {
  const onCallScheduleType = view.state.values.on_call_schedule_block
    .on_call_schedule_input.selected_option?.value as OnCallScheduleType;
  const weeklies: OnCallSchedule[string][OnCallScheduleType.WEEKLIES] =
    JSON.parse(
      view.state.values.on_call_weeklies_block.on_call_weeklies_input
        ?.value as string
    );
  const overWrite: OnCallSchedule[string]["overWrite"] = JSON.parse(
    view.state.values.on_call_overwrite_block.on_call_overwrite_input
      ?.value as string
  );

  const dailies: OnCallSchedule[string][OnCallScheduleType.DAILIES] =
    JSON.parse(
      view.state.values.on_call_dailies_block.on_call_dailies_input
        ?.value as string
    );

  return { onCallScheduleType, overWrite, weeklies, dailies };
};
