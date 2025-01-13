import { Elysia, t } from "elysia";

const app = new Elysia().get("/", () => "Hello Elysia").listen(5000);

/*
bot setting a message
POST https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
Content-type: application/json
{
    "text": "Gotta get the bread and milk!"
}

*/

app.post(
  "/hc",
  ({ body, params, headers, set }) => {
    console.log("hc");
    console.log({
      params,
      headers,
      body,
    });
    set.status = 200;
    return "ok";
  },
  {}
);

app.post(
  "/slack/:challenge",
  ({ params, set, body }) => {
    set.status = 200;
    return { challenge: body.challenge };
  },
  {
    params: t.Object({
      challenge: t.String(),
    }),
    body: t.Object({
      token: t.String(),
      challenge: t.String(),
      type: t.String(),
    }),
  }
);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
