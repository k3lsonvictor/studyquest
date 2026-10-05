// Local test/demo HTTP adapter. Auth is simulated; business logic and RLS execute
// actual production SQL in PGlite/PostgreSQL. Never deploy this backend.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { database, as, user } from "./database.mjs";
const db = await database();
const accounts = new Map();
const tokens = new Map();
const port = Number(process.env.STUDYQUEST_FIXTURE_PORT || 54329);
if (process.env.STUDYQUEST_DEMO === "1") {
  const email = "demo@studyquest.local";
  const parent = await user(db, email);
  accounts.set(email, {
    ...parent,
    email,
    password: "StudyQuest123!",
    name: "Marina Silva",
  });
  await as(db, parent, "select seed_demo()");
  const child = (await as(db, parent, "select id from children")).rows[0].id;
  const subject = (
    await as(db, parent, "select id from subjects where name='Matemática'")
  ).rows[0].id;
  const welcome = (
    await as(
      db,
      parent,
      "select save_activity(null,$1,$2,'Primeira semana de estudos','Uma conquista de exemplo para explorar os resgates.',100,null,false) id",
      [child, subject],
    )
  ).rows[0].id;
  await as(db, parent, "select complete_activity($1)", [welcome]);
  const activities = (
    await as(
      db,
      parent,
      "select id,requires_approval from activities where status='pending' order by title",
    )
  ).rows;
  for (const activity of activities.filter(
    (a) =>
      !a.requires_approval || a === activities.find((a) => a.requires_approval),
  )) {
    await as(db, parent, "select complete_activity($1)", [activity.id]);
  }
  const reward = (
    await as(db, parent, "select id from rewards where points_cost=100")
  ).rows[0].id;
  await as(db, parent, "select request_reward($1,$2)", [child, reward]);
}
const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};
const identifier = (value) => {
  if (!/^[a-z_]+$/.test(value)) throw new Error("Invalid identifier");
  return '"' + value + '"';
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost:54329");
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString();
    const body = raw ? JSON.parse(raw) : {};
    if (url.pathname === "/health") return json(res, 200, { ok: true });
    const token = req.headers.authorization?.replace("Bearer ", "");
    const account = tokens.get(token);
    if (
      url.pathname === "/auth/v1/signup" ||
      url.pathname === "/auth/v1/token"
    ) {
      let existing = accounts.get(body.email);
      if (url.pathname.endsWith("signup")) {
        if (existing) return json(res, 400, { msg: "Already registered" });
        const u = await user(db, body.email);
        existing = {
          ...u,
          email: body.email,
          password: body.password,
          name: body.data?.name || "Responsável",
        };
        accounts.set(body.email, existing);
      }
      if (!existing || existing.password !== body.password)
        return json(res, 400, {
          error: "invalid_grant",
          error_description: "Invalid credentials",
        });
      const session = { ...existing, session_id: randomUUID() };
      const authUser = {
        id: session.id,
        email: session.email,
        aud: "authenticated",
        role: "authenticated",
        user_metadata: { name: session.name },
        app_metadata: { provider: "email" },
        created_at: new Date().toISOString(),
      };
      const jwt = [
        Buffer.from('{"alg":"HS256","typ":"JWT"}').toString("base64url"),
        Buffer.from(
          JSON.stringify({
            sub: session.id,
            session_id: session.session_id,
            exp: Math.floor(Date.now() / 1000) + 3600,
            role: "authenticated",
          }),
        ).toString("base64url"),
        "test-signature",
      ].join(".");
      tokens.set(jwt, { ...session, authUser });
      return json(res, 200, {
        access_token: jwt,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: randomUUID(),
        user: authUser,
      });
    }
    if (!account) return json(res, 401, { msg: "Unauthorized" });
    if (url.pathname === "/auth/v1/user")
      return json(res, 200, account.authUser);
    if (url.pathname === "/auth/v1/logout") {
      tokens.delete(token);
      return json(res, 200, {});
    }
    if (url.pathname.startsWith("/rest/v1/rpc/")) {
      const fn = url.pathname.split("/").at(-1);
      const args = Object.entries(body);
      const sql = `select public.${identifier(fn)}(${args.map(([k], i) => identifier(k) + " => $" + (i + 1)).join(",")}) result`;
      const result = await as(
        db,
        account,
        sql,
        args.map(([, v]) => v),
      );
      return json(res, 200, result.rows[0].result);
    }
    if (url.pathname.startsWith("/rest/v1/")) {
      const table = url.pathname.split("/").at(-1);
      const values = [];
      const conditions = [];
      for (const [key, value] of url.searchParams) {
        if (["select", "order", "limit", "offset"].includes(key)) continue;
        if (!value.startsWith("eq.")) throw new Error("Unsupported filter");
        values.push(value.slice(3));
        conditions.push(identifier(key) + "=$" + values.length);
      }
      const where = conditions.length
        ? " where " + conditions.join(" and ")
        : "";
      let sql;
      if (req.method === "GET") {
        sql = `select * from public.${identifier(table)}${where}`;
        const order = url.searchParams.get("order");
        if (order) {
          sql +=
            " order by " +
            order
              .split(",")
              .map((part) => {
                const [field, direction] = part.split(".");
                return (
                  identifier(field) + (direction === "desc" ? " desc" : " asc")
                );
              })
              .join(",");
        }
        for (const key of ["limit", "offset"])
          if (url.searchParams.has(key)) {
            const n = Number(url.searchParams.get(key));
            if (!Number.isSafeInteger(n) || n < 0)
              throw new Error("Invalid range");
            sql += ` ${key} ${n}`;
          }
      } else if (req.method === "POST") {
        const row = Array.isArray(body) ? body[0] : body;
        const keys = Object.keys(row);
        values.length = 0;
        values.push(...Object.values(row));
        sql = `insert into public.${identifier(table)}(${keys.map(identifier).join(",")}) values(${keys.map((_, i) => "$" + (i + 1)).join(",")})`;
      } else if (req.method === "PATCH") {
        const assignments = Object.entries(body).map(([k, v]) => {
          values.push(v);
          return identifier(k) + "=$" + values.length;
        });
        sql = `update public.${identifier(table)} set ${assignments.join(",")}${where}`;
      } else throw new Error("Unsupported method");
      const result = await as(db, account, sql, values);
      if (req.method !== "GET") {
        res.writeHead(204);
        return res.end();
      }
      if (req.headers.accept?.includes("application/vnd.pgrst.object+json")) {
        if (result.rows.length !== 1)
          return json(res, 406, {
            code: "PGRST116",
            details: `The result contains ${result.rows.length} rows`,
            message: "JSON object requested, multiple (or no) rows returned",
          });
        return json(res, 200, result.rows[0]);
      }
      return json(res, 200, result.rows);
    }
    json(res, 404, { message: "Not found" });
  } catch (error) {
    json(res, 400, {
      code: error.code || "TEST_ERROR",
      message: error.message,
    });
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Local Supabase adapter ready at 127.0.0.1:${port}`),
);
process.on("SIGTERM", () =>
  server.close(async () => {
    await db.close();
    process.exit(0);
  }),
);
