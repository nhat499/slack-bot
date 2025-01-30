import axios from "axios";
import { env } from "../env.config";
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

interface ListAppArg {
  search?: string | null;
  page?: number | null;
  rows?: number | null;
  order?: string | null;
  direction?: Direction | null;
}

interface CreateAppArg {
  name: string;
  description?: string;
}

// list App
const listApp = async ({
  search,
  page,
  rows,
  order,
  direction,
}: ListAppArg) => {
  // const response = await axios.get(`${TicketSystemUrl}/api/v1/apps/`, {
  //   params: {
  //     search: search ?? "",
  //     page: page ?? 0,
  //     rows: rows ?? 25,
  //     order: order ?? "createdAt",
  //     direction: direction ?? Direction.DESC,
  //   },
  // });

  const response = await cloudCoreApi.GET("/api/v1/apps/", {
    params: {
      query: {
        search: search ?? undefined,
        page: page ?? 0,
        rows: rows ?? 25,
        order: order ?? "createdAt",
        direction: direction ?? Direction.DESC,
      },
    },
  });

  return response.data;
};

// create App
// Doesn't make sense to create an app
const createApp = async ({ name, description }: CreateAppArg) => {
  console.log("createApp");
  // const response = await axios.post(`${TicketSystemUrl}/api/v1/apps/`, {
  //   name,
  //   description,
  // });
  // return response.data;
};

export default { listApp, createApp };
