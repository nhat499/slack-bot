import { env } from "../../env.config";
import { getClientAPI } from "tecace-cloud-sdk";

export const headers = {
  authorization: "Bearer UWoaQIfef1",
  "x-app-id": env.SLACK_APP_ID,
  "x-app-secret": env.SLACK_APP_SECRET,
};

export const cloudCoreApi = getClientAPI("CLOUD_CORE", {
  headers,
  baseUrl: env.CLOUD_CORE_URL + "/",
});

export enum Direction {
  ASC = "asc",
  DESC = "desc",
}
