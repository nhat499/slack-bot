import { AnyBlock, PlainTextOption, View } from "@slack/types";
import {
  OnCallSchedule,
  OnCallScheduleType,
} from "../../../on-call-schedule/get.on.call.schedule";
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

  const onCallPersonnelInput: AnyBlock = {
    type: "input",
    block_id: "on_call_personnel_block",
    element: {
      type: "plain_text_input",
      multiline: true,
      action_id: "on_call_personnel_input",
      initial_value: JSON.stringify(onCallSchedule.onCallPersonals, null, 2),
    },
    label: {
      type: "plain_text",
      text: "On Call Personnel",
    },
  };

  const view: View = {
    type: "modal",
    callback_id: callBack_id,
    title: {
      type: "plain_text",
      text: "Update On Call Schedule",
    },
    blocks: [scheduleTypeInput, onCallPersonnelInput],
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

  const onCallPersonnel: OnCallSchedule[string]["onCallPersonals"] = JSON.parse(
    view.state.values.on_call_personnel_block.on_call_personnel_input
      ?.value as string
  );

  return { onCallScheduleType, onCallPersonnel };
};
