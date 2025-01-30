import fs from "fs/promises";
import path from "path";
import {} from "./../../test.txt";

export enum OnCallScheduleType {
  DAILIES = "DAILIES",
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
}

interface onCallPersonnel {
  slackUserId: string;
  cloudCoreUserId: string;
  firstName: string;
  lastName: string;
  phone: number;
}

export interface OnCallSchedule {
  [appId: string]: {
    application: string;
    type: OnCallScheduleType;
    onCallPersonals: Array<onCallPersonnel[]>;
  };
}

/**
 * Retrieves the on-call schedule for a specific application ID from a JSON file
 * @param appId - The ID of the application to get the schedule for
 * @returns The on-call schedule data for the specified application
 * @throws Error if file cannot be read or parsed
 */
export const getOnCallSchedule = async (appId: string) => {
  const filePath = path.join(__dirname, "../../on.call.schedule.json");
  try {
    const jsonString = await fs.readFile(filePath, "utf8");
    const data: OnCallSchedule = JSON.parse(jsonString);
    return data[appId];
  } catch (err) {
    console.error("Error reading or parsing file:", err);
    throw new Error("Error reading or parsing file");
  }
};

/**
 * Updates the on-call schedule for a specific application ID
 * @param appId - The ID of the application to update
 * @param newOnCall - The new on-call personnel schedule
 * @param type - The type of schedule rotation (daily, weekly, etc)
 * @throws Error if file cannot be read, parsed or written
 */
export const updateOnCall = async ({
  appId,
  newOnCall,
  type,
}: {
  appId: string;
  newOnCall: OnCallSchedule[string]["onCallPersonals"];
  type: OnCallScheduleType;
}) => {
  const filePath = path.join(__dirname, "../../on.call.schedule.json");
  try {
    const jsonString = await fs.readFile(filePath, "utf8");
    const data: OnCallSchedule = JSON.parse(jsonString);
    data[appId].type = type;
    data[appId].onCallPersonals = newOnCall;
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error reading or parsing file:", err);
    throw new Error("Error reading or parsing file");
  }
};

/**
 * Gets the current on-call personnel based on schedule type and current date
 * @param appId - The ID of the application to get current on-call for
 * @returns Array of currently on-call personnel
 * @throws Error if no schedule found or invalid schedule type
 */
export const getCurrentOnCall = async (appId: string) => {
  const onCallData = await getOnCallSchedule(appId);

  if (!onCallData) {
    throw new Error("No on call schedule found for the given appId");
  }

  const currentDate = new Date();
  // currentDate.setDate(currentDate.getDate() + 1);
  switch (onCallData.type) {
    case OnCallScheduleType.DAILIES: {
      const dayOfYear = getDayOfYear(currentDate);
      const index = dayOfYear % onCallData.onCallPersonals.length;
      return onCallData.onCallPersonals[index];
    }
    case OnCallScheduleType.WEEKLY: {
      const weekOfYear = getWeekOfYear(currentDate);

      const index = weekOfYear % onCallData.onCallPersonals.length;
      return onCallData.onCallPersonals[index];
    }
    case OnCallScheduleType.BIWEEKLY: {
      const biWeekOfYear = getBiWeekOfYear(currentDate);
      const index = biWeekOfYear % onCallData.onCallPersonals.length;
      return onCallData.onCallPersonals[index];
    }
    case OnCallScheduleType.MONTHLY: {
      const dayOfMonth = getMonthOfYear(currentDate);

      const index = dayOfMonth % onCallData.onCallPersonals.length;
      return onCallData.onCallPersonals[index];
    }
    default:
      throw new Error("Invalid on call schedule type");
  }
};

/**
 * Calculates the day of the year (1-365/366) for a given date
 * @param today - The date to calculate for
 * @returns The day number of the year
 */
const getDayOfYear = (today: Date) => {
  const startOfYear: Date = new Date(today.getFullYear(), 0, 0);
  const diff: number = today.getTime() - startOfYear.getTime();
  const oneDay: number = 1000 * 60 * 60 * 24;
  const dayOfYear: number = Math.floor(diff / oneDay);
  return dayOfYear;
};

/**
 * Calculates the week number (1-52/53) for a given date
 * @param today - The date to calculate for
 * @returns The week number of the year
 */
const getWeekOfYear = (today: Date) => {
  const startOfYear: Date = new Date(today.getFullYear(), 0, 1);
  const daysOfYear: number = Math.floor(
    (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weekOfYear: number = Math.ceil((daysOfYear + 1) / 7);
  return weekOfYear;
};

/**
 * Calculates the bi-week number (1-26/27) for a given date
 * @param today - The date to calculate for
 * @returns The bi-week number of the year
 */
const getBiWeekOfYear = (today: Date) => {
  const startOfYear: Date = new Date(today.getFullYear(), 0, 1);
  const daysOfYear: number = Math.floor(
    (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  const biWeekOfYear: number = Math.ceil((daysOfYear + 1) / 14);
  return biWeekOfYear;
};

/**
 * Gets the month number (1-12) for a given date
 * @param today - The date to get the month for
 * @returns The month number (1-12)
 */
const getMonthOfYear = (today: Date) => {
  return today.getMonth() + 1;
};
