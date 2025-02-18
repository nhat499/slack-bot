import { AnyBlock, PlainTextOption, View } from "@slack/types";
import {
  OnCallGroup,
  OnCallSchedule,
  OnCallScheduleType,
} from "../../../util/on-call-schedule/on.call.schedule.helper";
import { ViewOutput } from "@slack/bolt";

export const updateOnCallScheduleModal = (
  callBack_id: string,
  onCallSchedule: OnCallSchedule[string]
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

  const initial_onCall_value = JSON.stringify(
    [{ group: "groupZ", startTime: "10", endTime: "12" }],
    null,
    2
  );

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

  const dateInput: AnyBlock = {
    type: "input",
    block_id: "date_input_block",
    optional: true,
    element: {
      type: "datepicker",
      action_id: "date_input",
    },
    label: {
      type: "plain_text",
      text: "Date",
    },
  };

  const dayOfWeek: AnyBlock = {
    type: "input",
    block_id: "day_input_block",
    optional: true,
    element: {
      type: "number_input",
      action_id: "day_input",
      is_decimal_allowed: false,
    },
    label: {
      type: "plain_text",
      text: "Day of week (0-6)",
    },
  };

  const scheduleInput: AnyBlock = {
    type: "input",
    block_id: "Schedule_input_block",
    element: {
      type: "plain_text_input",
      multiline: true,
      action_id: "Schedule_input",
      initial_value: initial_onCall_value,
    },
    label: {
      type: "plain_text",
      text: "Group on Call",
    },
  };

  // const onCallOverWriteInput: AnyBlock = {
  //   type: "input",
  //   optional: true,

  //   block_id: "on_call_overwrite_block",
  //   element: {
  //     type: "plain_text_input",
  //     multiline: true,
  //     action_id: "on_call_overwrite_input",
  //     initial_value: initial_onCall_value,
  //   },
  //   label: {
  //     type: "plain_text",
  //     text: "Over Write",
  //   },
  // };

  // const onCallWeeklyInput: AnyBlock = {
  //   type: "input",
  //   block_id: "on_call_weeklies_block",
  //   element: {
  //     type: "plain_text_input",
  //     multiline: true,
  //     action_id: "on_call_weeklies_input",
  //     initial_value: JSON.stringify(
  //       onCallSchedule[OnCallScheduleType.WEEKLIES],
  //       null,
  //       2
  //     ),
  //   },
  //   label: {
  //     type: "plain_text",
  //     text: "Weekly",
  //   },
  // };

  // const onCallDailiesInput: AnyBlock = {
  //   type: "input",
  //   block_id: "on_call_dailies_block",
  //   element: {
  //     type: "plain_text_input",
  //     multiline: true,
  //     action_id: "on_call_dailies_input",
  //     initial_value: JSON.stringify(
  //       onCallSchedule[OnCallScheduleType.DAILIES],
  //       null,
  //       2
  //     ),
  //   },
  //   label: {
  //     type: "plain_text",
  //     text: "Dailies",
  //   },
  // };

  const view: View = {
    type: "modal",
    callback_id: callBack_id,
    title: {
      type: "plain_text",
      text: "Update On Call Schedule",
    },
    blocks: [
      scheduleTypeInput,
      dateInput,
      dayOfWeek,
      scheduleInput,
      // onCallOverWriteInput,
      // onCallWeeklyInput,
      // onCallDailiesInput,
    ],
    submit: {
      type: "plain_text",
      text: "Submit",
    },
  };
  return { view };
};

export const extractUpdateOnCallScheduleModal = (view: ViewOutput) => {
  const onCallScheduleType = view.state.values.on_call_schedule_block
    .on_call_schedule_input.selected_option?.value as
    | OnCallScheduleType
    | "overWrite";

  const date = view.state.values.date_input_block.date_input.selected_date;

  const day = view.state.values.day_input_block.day_input.value;

  const onCallGroup: OnCallGroup[] = JSON.parse(
    view.state.values.Schedule_input_block.Schedule_input?.value as string
  );

  // const weeklies: OnCallSchedule[string][OnCallScheduleType.WEEKLIES] =
  //   JSON.parse(
  //     view.state.values.on_call_weeklies_block.on_call_weeklies_input
  //       ?.value as string
  //   );
  // const overWrite: OnCallSchedule[string]["overWrite"] = JSON.parse(
  //   view.state.values.on_call_overwrite_block.on_call_overwrite_input
  //     ?.value as string
  // );

  // const dailies: OnCallSchedule[string][OnCallScheduleType.DAILIES] =
  //   JSON.parse(
  //     view.state.values.on_call_dailies_block.on_call_dailies_input
  //       ?.value as string
  //   );

  // return { onCallScheduleType, overWrite, weeklies, dailies };
  return { onCallScheduleType, onCallGroup, day, date };
};
