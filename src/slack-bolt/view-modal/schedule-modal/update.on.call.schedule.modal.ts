import { AnyBlock, PlainTextOption, View } from "@slack/types";
import {
  OnCallGroup,
  OnCallScheduleType,
} from "../../../util/on-call-schedule/on.call.schedule.helper";
import { ViewOutput } from "@slack/bolt";
import {
  extractMultilineInput,
  multilineInput,
} from "../basic-input/multiline.input";
import { dateInput, extractDateInput } from "../basic-input/date.input";
import { dayInput, extractDayInput } from "../basic-input/day.input";
import {
  extractScheduleTypeInput,
  scheduleTypeInput,
} from "../basic-input/schedule.type.input";

const scheduleTypeInputBlockId = "on_call_schedule_block";
const scheduleTypeInputActionId = "on_call_schedule_input";

const multilineInputBlockId = "Schedule_input_block";
const multilineInputActionId = "Schedule_input";

const dateInputBlockId = "date_input_block";
const dateInputActionId = "date_input";

const dayInputBlockId = "day_input_block";
const dayInputActionId = "day_input";
export const updateOnCallScheduleModal = (callBack_id: string) => {
  const initial_value = JSON.stringify(
    [{ group: "groupZ", startTime: "10", endTime: "12" }],
    null,
    2
  );

  const view: View = {
    type: "modal",
    callback_id: callBack_id,
    title: {
      type: "plain_text",
      text: "Update On Call Schedule",
    },
    blocks: [
      scheduleTypeInput(
        "On Call Schedule",
        scheduleTypeInputBlockId,
        scheduleTypeInputActionId
      ),
      dateInput("Date", dateInputBlockId, dateInputActionId),
      dayInput("Day of week (0-6)", dayInputBlockId, dayInputActionId),
      multilineInput(
        "Group on Call",
        multilineInputBlockId,
        multilineInputActionId,
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

export const extractUpdateOnCallScheduleModal = (view: ViewOutput) => {
  const onCallScheduleType = extractScheduleTypeInput({
    view,
    action_id: scheduleTypeInputActionId,
    block_id: scheduleTypeInputBlockId,
  });

  const date = extractDateInput({
    view,
    block_id: dateInputBlockId,
    action_id: dateInputActionId,
  });

  const day = extractDayInput({
    view,
    action_id: dayInputActionId,
    block_id: dayInputBlockId,
  });

  const onCallGroup: OnCallGroup[] = JSON.parse(
    extractMultilineInput({
      view,
      block_id: multilineInputBlockId,
      action_id: multilineInputActionId,
    })
  );

  return { onCallScheduleType, onCallGroup, day, date };
};
