import { App } from "@slack/bolt";
import { acknowledgeAlert } from "./acknowledge.alert";
import { repliesAlert } from "./replies.alert";

export const alertsEvents = (bolt: App) => {
  // listen for when Acknowledged is press
  acknowledgeAlert(bolt);

  // listen for replies to alert threads
  repliesAlert(bolt);
};
