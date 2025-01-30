import { App } from "@slack/bolt";
import { systemMonitorAlert } from "./system.monitor.alert";
import { acknowledgeAlert } from "./acknowledge.alert";
import { repliesAlert } from "./replies.alert";

export const alertsEvents = (bolt: App) => {
  // alert message from our monitory system
  systemMonitorAlert(bolt);

  // listen for when Acknowledged is press
  acknowledgeAlert(bolt);

  // listen for replies to alert threads
  repliesAlert(bolt);
};
