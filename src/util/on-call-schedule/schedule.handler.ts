import {
  OnCallGroup,
  OnCallSchedule,
  OnCallScheduleType,
  OnCallTimer,
  ScheduleHelperFunction,
} from "./on.call.schedule.helper";
import fs from "fs/promises";
import path from "path";
import { start } from "repl";

type ScheduleEvent<
  T extends keyof ScheduleHelperFunction = keyof ScheduleHelperFunction
> = {
  event: T;
  data: Parameters<ScheduleHelperFunction[T]>;
  callBack?: () => void;
};

const filePath = path.join(__dirname, "../../../on.call.schedule2.json");

class ScheduleHandler {
  static isProcessing: boolean = false;
  static onCallTimer: OnCallTimer = {};
  private static eventsQueue: ScheduleEvent[] = [];
  private static onCallSchedule: OnCallSchedule = {};
  // every 12 hour
  // private static updateInterval = 1_000 * 60 * 60 * 12;
  private static updateInterval = 10_000;
  // every 7 days
  private static cleanUpInterval = 1_000 * 60 * 60 * 24 * 7;
  constructor() {}

  init = async () => {
    // load json file
    const jsonString = await fs.readFile(filePath, "utf8");
    ScheduleHandler.onCallSchedule = JSON.parse(jsonString);

    // set interval to update to json file
    setInterval(() => {
      ScheduleHandler.saveSChedule();
    }, ScheduleHandler.updateInterval);

    // set interval to clean up over write
    setInterval(() => {
      console.log("cleaning up over write");
      const currDate = new Date();
      currDate.setDate(currDate.getDate() - 7);
      ScheduleHandler.cleanExpireOverWrite(currDate);
    }, ScheduleHandler.cleanUpInterval);
  };

  //=============================================================//
  // EVENT QUEUE
  //=============================================================//

  private static processQueue() {
    if (
      ScheduleHandler.isProcessing ||
      ScheduleHandler.eventsQueue.length === 0
    )
      return;

    ScheduleHandler.isProcessing = true;

    const event = ScheduleHandler.eventsQueue.shift();

    switch (event?.event) {
      case "addOnCallSchedule":
        this.addOnCallSchedule(event as ScheduleEvent<"addOnCallSchedule">);
        break;
      case "addGroup":
        this.addGroup(event as ScheduleEvent<"addGroup">);
        break;
      case "saveOnCallSchedule":
        this.saveOnCallSchedule(event as ScheduleEvent<"saveOnCallSchedule">);
        break;
      case "deleteOnCallSchedule":
        this.deleteOnCallSchedule(
          event as ScheduleEvent<"deleteOnCallSchedule">
        );
        break;
      default:
        console.warn(`Unhandled event type: ${(event?.data, event?.event)}`);
    }
  }

  public static addEventToQueue = ({ data, event }: ScheduleEvent) => {
    ScheduleHandler.eventsQueue.push({
      data,
      event,
      callBack: () => {
        ScheduleHandler.isProcessing = false;
        this.processQueue();
      },
    });
    ScheduleHandler.processQueue();
  };

  //=============================================================//
  // initiate queue event functions
  //=============================================================//

  private static addOnCallSchedule = ({
    data,
    callBack,
  }: ScheduleEvent<"addOnCallSchedule">) => {
    ScheduleHandler.addOnCallScheduleHelper(...data);
    if (callBack) callBack();
  };

  private static addGroup = ({ data, callBack }: ScheduleEvent<"addGroup">) => {
    ScheduleHandler.addGroupHelper(...data);
    if (callBack) callBack();
  };

  private static saveOnCallSchedule = ({
    callBack,
  }: ScheduleEvent<"saveOnCallSchedule">) => {
    ScheduleHandler.saveSChedule();
    if (callBack) callBack();
  };

  private static deleteOnCallSchedule({
    data,
    callBack,
  }: ScheduleEvent<"deleteOnCallSchedule">) {
    ScheduleHandler.deleteOnCallScheduleHelper(...data);
    if (callBack) callBack();
  }

  //=============================================================//
  // public helper functions
  //=============================================================//
  public static getOnCallSchedule = (appId: string) => {
    const data = this.onCallSchedule as OnCallSchedule;
    return data[appId];
  };

  /**
   * Gets the current on-call personnel based on schedule type and current date time
   * @param appId - The ID of the application
   * @returns Array of currently on-call personnel
   * @throws Error if no schedule found or invalid schedule type
   */
  public static getCurrentOnCall = (appId: string) => {
    const onCallData = this.getOnCallSchedule(appId);

    if (!onCallData) {
      throw new Error("No on call schedule found for the given appId");
    }

    const currentDate = new Date();
    //   currentDate.setDate(currentDate.getDate() + 1);
    //   currentDate.setDate(currentDate.getHours() + 1);
    currentDate.toLocaleTimeString(undefined, { hour12: false });
    const dateString = currentDate.toLocaleDateString();
    const currHour = parseInt(
      currentDate.toLocaleTimeString(undefined, { hour12: false }).split(":")[0]
    );

    // check overwrite
    const overWriteGroups = onCallData.overWrite[dateString];
    if (overWriteGroups) {
      const onCallGroup = overWriteGroups.find((group) => {
        return (
          parseInt(group.startTime) < currHour &&
          parseInt(group.endTime) > currHour
        );
      });
      if (onCallGroup) {
        return onCallData.groups[onCallGroup.group];
      }
    }

    switch (onCallData.type) {
      case OnCallScheduleType.DAILIES: {
        const dailies = onCallData[OnCallScheduleType.DAILIES];
        const onCallGroup = dailies.find((group) => {
          return (
            parseInt(group.startTime) < currHour &&
            parseInt(group.endTime) > currHour
          );
        });
        if (onCallGroup) {
          return onCallData.groups[onCallGroup.group];
        } else {
          // no body on call at this time
          return [];
        }
      }
      case OnCallScheduleType.WEEKLIES: {
        const dayOfWeek = currentDate.getDay();
        const day = onCallData[OnCallScheduleType.WEEKLIES][dayOfWeek];
        const onCallGroup = day.find((group) => {
          return (
            parseInt(group.startTime) < currHour &&
            parseInt(group.endTime) > currHour
          );
        });
        if (onCallGroup) {
          return onCallData.groups[onCallGroup.group];
        } else {
          // no body on call at this time
          return [];
        }
      }
      default:
        throw new Error("Invalid on call schedule type");
    }
  };

  /**
   * Gets the on-call schedule for a specific day, merging any overwrite schedules with the regular schedule
   * @param appId - The ID of the application to get the schedule for
   * @param date - The date to get the schedule for in month/day/year format
   * @returns Array of on-call groups for that day with their schedules
   * @throws Error if no schedule found for the given appId
   */
  public static getDaySchedule = ({
    appId,
    date,
  }: {
    appId: string;
    date: string;
  }) => {
    const onCallData = this.getOnCallSchedule(appId);
    if (!onCallData) {
      throw new Error("No on call schedule found for the given appId");
    }

    const overWriteGroups = onCallData.overWrite[date];
    let repeatGroups: OnCallGroup[] = [];
    if (onCallData.type === OnCallScheduleType.DAILIES) {
      repeatGroups = onCallData[onCallData.type];
    } else if (onCallData.type === OnCallScheduleType.WEEKLIES) {
      repeatGroups = onCallData[onCallData.type][new Date(date).getDay()];
    }
    const result = ScheduleHandler.mergeGroup(
      overWriteGroups ?? [],
      repeatGroups
    );
    return result;
  };

  /**
   * Renders an on-call schedule as a text grid showing time ranges and corresponding groups
   * @param onCallGroup - Array of on-call groups with their schedules
   * @returns Formatted string with time ranges as column headers and on-call groups below
   */
  public static renderSchedule = (onCallGroup: OnCallGroup[]) => {
    const spacing = 10;
    let header = "";
    let body = "";
    for (const onCall of onCallGroup) {
      const time = `${onCall.startTime} - ${onCall.endTime}`;
      header += `${time}${" ".repeat(spacing - time.length - 1)}`;
      body += onCall.group;
      body += " ".repeat(spacing - onCall.group.length - 1);
    }
    return header + "\n" + body;
  };

  /**
   * Renders an on-call schedule as a text grid showing which group is on call for each hour
   * @param onCallGroup - Array of on-call groups with their schedules
   * @returns Formatted string with hours as column headers and on-call groups below
   */
  public static renderDayScheduleByHours = (onCallGroup: OnCallGroup[]) => {
    const spacing = 10;
    let header = "";
    for (let hour = 0; hour < 24; hour++) {
      header += `${hour}`;
      header += " ".repeat(spacing - hour.toString().length - 1);
    }
    header += "\n";
    let body = "";
    for (let hour = 0; hour < 24; hour++) {
      const curr = onCallGroup.find((obj) => {
        if (hour >= parseInt(obj.startTime) && hour < parseInt(obj.endTime)) {
          return true;
        }
      });
      if (curr) {
        body += curr.group;
        body += " ".repeat(spacing - curr.group.length - 1);
      } else {
        body += " ".repeat(spacing);
      }
    }
    return header + body;
  };

  //=============================================================//
  // private helper function
  //=============================================================//

  /**
   * Save in memory on call schedule to json file.
   */
  private static saveSChedule = () => {
    console.log("writing to file");
    fs.writeFile(
      filePath,
      JSON.stringify(ScheduleHandler.onCallSchedule, null, 2)
    );
  };

  /**
   * Clean up expired over write.
   * @param currDate delete overwrite previous of this date
   */
  private static cleanExpireOverWrite = (currDate: Date) => {
    for (const [appId, Schedule] of Object.entries(
      ScheduleHandler.onCallSchedule
    )) {
      for (const [date, value] of Object.entries(Schedule.overWrite)) {
        if (new Date(date) < currDate) {
          console.log("value", date);
          delete ScheduleHandler.onCallSchedule[appId].overWrite[date];
        }
      }
    }
  };

  private static addGroupHelper: ScheduleHelperFunction["addGroup"] = (
    appId,
    groupName,
    data
  ) => {
    ScheduleHandler.getOnCallSchedule(appId).groups[groupName] = data;
  };

  /**
   * Helper function to add or update on-call schedules
   * @param appId - The ID of the application to update the schedule for
   * @param data - Object containing schedule data to add/update:
   *              - overWrite: Override schedule for specific dates
   *              - DAILIES: Daily recurring schedule
   *              - WEEKLIES: Weekly recurring schedule for specific days
   * @description Handles three types of schedule updates:
   * 1. Overwrites - Merges new schedule with existing overrides for a specific date
   * 2. Dailies - Merges new daily schedule with existing daily schedule
   * 3. Weeklies - Merges new schedule for a specific day with existing weekly schedule
   */
  private static addOnCallScheduleHelper: ScheduleHelperFunction["addOnCallSchedule"] =
    ({ appId, data }) => {
      const { overWrite, DAILIES, WEEKLIES } = data;
      if (overWrite) {
        const { date, group } = overWrite;
        // onCallSchedule[appId].overWrite[date] = group;
        ScheduleHandler.onCallSchedule[appId].overWrite[date] =
          ScheduleHandler.mergeGroup(
            group,
            ScheduleHandler.onCallSchedule[appId].overWrite[date]
          );
      }
      if (DAILIES) {
        const { group } = DAILIES;
        // onCallSchedule[appId].DAILIES.push(group);
        ScheduleHandler.onCallSchedule[appId][OnCallScheduleType.DAILIES] =
          ScheduleHandler.mergeGroup(
            group,
            ScheduleHandler.onCallSchedule[appId][OnCallScheduleType.DAILIES]
          );
      }
      if (WEEKLIES) {
        const { day, group } = WEEKLIES;
        // onCallSchedule[appId].WEEKLIES[day].push(group);
        ScheduleHandler.onCallSchedule[appId][OnCallScheduleType.WEEKLIES][
          day
        ] = ScheduleHandler.mergeGroup(
          group,
          ScheduleHandler.onCallSchedule[appId][OnCallScheduleType.WEEKLIES][
            day
          ]
        );
      }
    };

  private static deleteOnCallScheduleHelper: ScheduleHelperFunction["deleteOnCallSchedule"] =
    ({ appId, data }) => {
      const schedule = ScheduleHandler.getOnCallSchedule(appId);
      if (!schedule) return;

      const { overWrite, DAILIES, WEEKLIES } = data;

      if (overWrite) {
        const { date, startTime, endTime } = overWrite;

        schedule.overWrite[date] = ScheduleHandler.deleteScheduleTime(
          schedule.overWrite[date],
          startTime,
          endTime
        );
      }

      if (DAILIES) {
        const { endTime, startTime } = DAILIES;
      }

      if (WEEKLIES) {
        const { day, endTime, startTime } = WEEKLIES;
      }
    };

  private static deleteScheduleTime = (
    groups: OnCallGroup[],
    startTime: number,
    endTime: number
  ) => {
    const result: OnCallGroup[] = [];
    for (const group of groups) {
      if (
        startTime > parseInt(group.startTime) &&
        startTime < parseInt(group.endTime)
      ) {
        result.push({ ...group, endTime: startTime.toString() });
      } else if (
        endTime > parseInt(group.startTime) &&
        endTime < parseInt(group.endTime)
      ) {
        result.push({ ...group, startTime: endTime.toString() });
      } else if (parseInt(group.endTime) < startTime) {
        result.push(group);
      } else if (parseInt(group.startTime) > endTime) {
        result.push(group);
      }
    }
    console.log(result);
    return result;
  };

  /**
   * helper function to merge overwrite and repeated on call
   * @param overWrite - new group
   * @param repeat - Old group
   * @returns Array of currently on-call groups and their onCall times
   */
  private static mergeGroup = (
    overWriteGroup: OnCallGroup[],
    repeatGroup: OnCallGroup[]
  ) => {
    const overWrite = structuredClone(overWriteGroup);
    const repeat = structuredClone(repeatGroup);

    while (overWrite.length > 0) {
      const curr = overWrite.shift();
      if (!curr) continue;
      const index = ScheduleHandler.findArrIndex(repeat, curr);
      if (
        index === repeat.length ||
        parseInt(curr.startTime) <= parseInt(repeat[index].endTime)
      ) {
        // update prev
        if (
          repeat[index - 1] &&
          parseInt(curr.startTime) <= parseInt(repeat[index - 1].endTime)
        ) {
          if (parseInt(repeat[index - 1].endTime) > parseInt(curr.endTime)) {
            repeat.splice(index, 0, {
              ...repeat[index - 1],
              startTime: curr.endTime,
            });
          }

          repeat[index - 1].endTime = curr.startTime;
        }

        let n = index;
        while (
          repeat[n] &&
          parseInt(curr.endTime) >= parseInt(repeat[n].endTime)
        ) {
          n++;
        }

        // update next
        if (
          repeat[n] &&
          parseInt(curr.endTime) > parseInt(repeat[n].startTime)
        ) {
          repeat[n].startTime = curr.endTime;
        }

        // add and delete in between
        repeat.splice(index, n - index, curr);
      }
    }
    return repeat;
  };

  /**
   * Binary Search function
   * @param arr - on call groups
   * @param group - the new group to be indexed
   * @returns Number of the index where the new group should be inserted
   */
  private static findArrIndex = (arr: OnCallGroup[], group: OnCallGroup) => {
    let l = 0;
    let r = arr.length;
    while (l < r) {
      let mid = Math.floor((l + r) / 2);
      if (parseInt(arr[mid].startTime) < parseInt(group.startTime)) {
        l = mid + 1;
      } else {
        r = mid;
      }
    }

    return l;
  };
}

export default ScheduleHandler;
