import { Elysia, t } from "elysia";

const app = new Elysia();

app.get("/", () => "Hello Elysia");

app.post(
  "/hc",
  ({ headers, query, params, body }) => {
    console.log("hc");
    console.log({ headers, query, params, body });
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

app.listen(5000);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

/*
bot setting a message
POST https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
Content-type: application/json
{
    "text": "Gotta get the bread and milk!"
}

*/
