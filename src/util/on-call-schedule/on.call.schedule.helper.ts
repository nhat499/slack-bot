import { t, Static } from "elysia";

export enum AlertPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum OnCallScheduleType {
  DAILIES = "DAILIES",
  WEEKLIES = "WEEKLIES",
}

export const onCallPersonnelSchema = t.Object({
  slackUserId: t.String(),
  cloudCoreUserId: t.String(),
  firstName: t.String(),
  lastName: t.String(),
  phone: t.String(),
});

export type onCallPersonnel = Static<typeof onCallPersonnelSchema>;

export interface Groups {
  [groupName: string]: onCallPersonnel[];
}

export const OnCallGroupSchema = t.Object({
  group: t.String(),
  startTime: t.String(),
  endTime: t.String(),
});

export type OnCallGroup = Static<typeof OnCallGroupSchema>;

export interface overWrite {
  [date: string]: OnCallGroup[];
}

export interface OnCallSchedule {
  [appId: string]: {
    application: string;
    type: OnCallScheduleType;
    groups: Groups;
    overWrite: overWrite;
    [OnCallScheduleType.DAILIES]: OnCallGroup[];
    [OnCallScheduleType.WEEKLIES]: OnCallGroup[][];
  };
}

export interface OnCallTimer {
  [appId: string]: {
    [ticketId: string]: Timer[];
  };
}

// interface for The Schedule's Event queue function
export interface ScheduleHelperFunction {
  addOnCallSchedule: ({
    appId,
    data,
  }: {
    appId: string;
    data: {
      overWrite?: { date: string; group: OnCallGroup[] };
      DAILIES?: { group: OnCallGroup[] };
      WEEKLIES?: { day: number; group: OnCallGroup[] };
    };
  }) => void;

  saveOnCallSchedule: () => void;

  deleteOnCallSchedule: (data: {
    appId: string;
    data: {
      overWrite?: { date: string; startTime: number; endTime: number };
      DAILIES?: { startTime: number; endTime: number };
      WEEKLIES?: { day: number; startTime: number; endTime: number };
    };
  }) => void;

  updateGroup: (
    appId: string,
    groupName: string,
    data: onCallPersonnel[]
  ) => void;

  deleteGroup: (appId: string, groupName: string) => void;
}
