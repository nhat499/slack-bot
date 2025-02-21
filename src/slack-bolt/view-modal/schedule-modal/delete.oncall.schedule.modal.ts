import { AnyBlock, View } from "@slack/types";
// import { dayOfWeek, scheduleTypeInput } from "./update.on.call.schedule.modal";
import { ViewOutput } from "@slack/bolt";
import { OnCallScheduleType } from "../../../util/on-call-schedule/on.call.schedule.helper";
import { dateInput, extractDateInput } from "../basic-input/date.input";
import { extractNumberInput, numberInput } from "../basic-input/number.input";
import {
  extractScheduleTypeInput,
  scheduleTypeInput,
} from "../basic-input/schedule.type.input";
import { dayInput, extractDayInput } from "../basic-input/day.input";

// export const numberInput = (label: string, block_id: string) => {
//   const block: AnyBlock = {
//     type: "input",
//     block_id: block_id,
//     element: {
//       type: "number_input",
//       is_decimal_allowed: false,
//       action_id: "number_input",
//       min_value: "0",
//       max_value: "24",
//     },
//     label: {
//       type: "plain_text",
//       text: label,
//     },
//   };
//   return block;
// };

const scheduleTypeInputBlockId = "on_call_schedule_block";
const scheduleTypeInputActionId = "on_call_schedule_input";

const dateInputBlockId = "date_input_block";
const dateInputActionId = "date_input";

const dayInputBlockId = "day_input_block";
const dayInputActionId = "day_input";

const startTimeBlockId = "start_time_input_block";
const startTimeActionId = "start_time_input";

const endTimeBlockId = "end_time_input_block";
const endTimeActionId = "end_time_input";
export const deleteOnCallScheduleModal = (callBack_id: string) => {
  const view: View = {
    type: "modal",
    callback_id: callBack_id,
    title: {
      type: "plain_text",
      text: "Delete On Call Schedule",
    },
    blocks: [
      scheduleTypeInput(
        "On Call Schedule",
        scheduleTypeInputBlockId,
        scheduleTypeInputActionId
      ),
      dateInput("Date", dateInputBlockId, dateInputActionId),
      dayInput("Day of week (0-6)", dayInputBlockId, dayInputActionId),
      numberInput("Start Time", startTimeBlockId, startTimeActionId),
      numberInput("End Time", endTimeBlockId, endTimeActionId),
    ],
    submit: {
      type: "plain_text",
      text: "Delete",
    },
    close: {
      type: "plain_text",
      text: "Cancel",
    },
  };

  return view;
};

export const extractDeleteOnCallScheduleModal = (view: ViewOutput) => {
  const date = extractDateInput({
    view,
    action_id: dateInputActionId,
    block_id: dateInputBlockId,
  });

  const onCallScheduleType = extractScheduleTypeInput({
    view,
    action_id: scheduleTypeInputActionId,
    block_id: scheduleTypeInputBlockId,
  });

  const day = extractDayInput({
    view,
    action_id: dayInputActionId,
    block_id: dayInputBlockId,
  });

  const startTime = parseInt(
    extractNumberInput({
      view,
      action_id: startTimeActionId,
      block_id: startTimeBlockId,
    })
  );

  const endTime = parseInt(
    extractNumberInput({
      view,
      action_id: endTimeActionId,
      block_id: endTimeBlockId,
    })
  );

  return {
    date,
    onCallScheduleType,
    day,
    startTime,
    endTime,
  };
};
