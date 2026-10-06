import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
export async function database({ fromMigrations = false } = {}) {
  const db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
    grant usage on schema auth,public to anon,authenticated;
    grant execute on function auth.jwt(),auth.uid() to anon,authenticated;`);
  const files = fromMigrations
    ? [
        "migrations/202610010001_initial.sql",
        "migrations/202610010002_seed_function.sql",
        "migrations/202610030001_avatar_shop.sql",
        "migrations/202610030002_avatar_hair.sql",
        "migrations/202610050001_daily_life_points.sql",
      ]
    : ["schema.sql", "seed.sql"];
  for (const file of files)
    await db.exec(
      await readFile(new URL(`../supabase/${file}`, import.meta.url), "utf8"),
    );
  return db;
}
export async function user(db, email = "parent@example.test") {
  const id = randomUUID();
  await db.query(
    'insert into auth.users(id,email,raw_user_meta_data) values($1,$2,\'{"name":"Responsável"}\')',
    [id, email],
  );
  return { id, session_id: randomUUID() };
}
export async function as(db, u, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.query("select set_config('request.jwt.claims',$1,true)", [
      JSON.stringify({
        sub: u.id,
        session_id: u.session_id,
        role: "authenticated",
      }),
    ]);
    await tx.exec("set local role authenticated");
    return tx.query(sql, params);
  });
}
export async function fixture(db, u) {
  const family = (
    await as(db, u, "select public.create_family('Família de teste') id")
  ).rows[0].id;
  const child = (
    await as(
      db,
      u,
      "insert into children(family_id,name) values($1,'Lucas') returning id",
      [family],
    )
  ).rows[0].id;
  const subject = (
    await as(
      db,
      u,
      "insert into subjects(family_id,name) values($1,'Matemática') returning id",
      [family],
    )
  ).rows[0].id;
  return { family, child, subject };
}
export async function activity(db, u, f, points = 50, approval = true) {
  return (
    await as(
      db,
      u,
      "select save_activity(null,$1,$2,'Missão de teste','Descrição',$3,null,$4) id",
      [f.child, f.subject, points, approval],
    )
  ).rows[0].id;
}
export async function balance(db, u, child) {
  return Number(
    (
      await as(
        db,
        u,
        "select coalesce(sum(amount),0) n from points_transactions where child_id=$1",
        [child],
      )
    ).rows[0].n,
  );
}
