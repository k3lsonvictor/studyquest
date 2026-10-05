import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { database, user, as, fixture, activity, balance } from "./database.mjs";

test("fluxo completo: conta, família, criança, matéria, 50 pontos, resgate de 40, saldo 10 e histórico", async () => {
  const db = await database();
  try {
    const parent = await user(db);
    const f = await fixture(db, parent);
    const a = await activity(db, parent, f);
    await as(db, parent, "select enter_kid($1)", [f.child]);
    await as(db, parent, "select complete_activity($1)", [a]);
    assert.equal(await balance(db, parent, f.child), 0);
    assert.equal(
      (await as(db, parent, "select status from activities where id=$1", [a]))
        .rows[0].status,
      "awaiting_approval",
    );
    await assert.rejects(
      as(db, parent, "select review_activity($1,true)", [a]),
      /Acesso/,
    );
    // Password reauthentication creates a new Supabase session, leaving the old
    // child's session restricted even if its bearer token is reused.
    const guardian = { ...parent, session_id: randomUUID() };
    await as(db, guardian, "select review_activity($1,true)", [a]);
    assert.equal(await balance(db, guardian, f.child), 50);
    await assert.rejects(
      as(db, guardian, "select review_activity($1,true)", [a]),
      /já foi/,
    );
    await assert.rejects(
      as(db, parent, "select complete_activity($1)", [a]),
      /já enviada/,
    );
    const reward = (
      await as(
        db,
        guardian,
        "insert into rewards(family_id,name,points_cost) values($1,'Filme',40) returning id",
        [f.family],
      )
    ).rows[0].id;
    const request = (
      await as(db, parent, "select request_reward($1,$2) id", [f.child, reward])
    ).rows[0].id;
    assert.equal(await balance(db, parent, f.child), 50);
    await assert.rejects(
      as(db, parent, "select request_reward($1,$2)", [f.child, reward]),
      /unique/,
    );
    await as(db, guardian, "select review_reward($1,true)", [request]);
    assert.equal(await balance(db, guardian, f.child), 10);
    await assert.rejects(
      as(db, guardian, "select review_reward($1,true)", [request]),
      /já foi/,
    );
    const ledger = (
      await as(
        db,
        guardian,
        "select amount,type from points_transactions order by created_at",
      )
    ).rows;
    assert.deepEqual(
      ledger.map((t) => [t.amount, t.type]),
      [
        [50, "activity"],
        [-40, "reward"],
      ],
    );
  } finally {
    await db.close();
  }
});

test("RLS: isolamento de famílias, modo criança, escritas diretas e referências cruzadas", async () => {
  const db = await database();
  try {
    const p = await user(db),
      other = await user(db, "other@example.test");
    const f = await fixture(db, p),
      g = await fixture(db, other);
    const a = await activity(db, p, f),
      foreign = await activity(db, other, g);
    assert.equal(
      (await as(db, p, "select * from children where id=$1", [g.child])).rows
        .length,
      0,
    );
    assert.equal(
      (await as(db, p, "select * from activities where id=$1", [foreign])).rows
        .length,
      0,
    );
    for (const sql of [
      "select complete_activity($1)",
      "select review_activity($1,true)",
      "select delete_activity($1)",
    ])
      await assert.rejects(as(db, p, sql, [foreign]));
    await assert.rejects(
      activity(db, p, { ...f, subject: g.subject }),
      /foreign key/,
    );
    await assert.rejects(
      as(
        db,
        p,
        "insert into points_transactions(child_id,amount,type,description,reference_id) values($1,999,'adjustment','fraude',$2)",
        [f.child, randomUUID()],
      ),
      /permission denied/,
    );
    await assert.rejects(
      as(db, p, "update activities set status='completed' where id=$1", [a]),
      /permission denied/,
    );
    const sibling = (
      await as(
        db,
        p,
        "insert into children(family_id,name) values($1,'Ana') returning id",
        [f.family],
      )
    ).rows[0].id;
    const siblingActivity = await activity(db, p, { ...f, child: sibling });
    await as(db, p, "select enter_kid($1)", [f.child]);
    assert.equal((await as(db, p, "select * from children")).rows.length, 1);
    await assert.rejects(
      as(db, p, "select complete_activity($1)", [siblingActivity]),
      /Acesso/,
    );
    await assert.rejects(
      as(db, p, "select enter_kid($1)", [sibling]),
      /Acesso/,
    );
    await assert.rejects(
      as(
        db,
        p,
        "insert into rewards(family_id,name,points_cost) values($1,'Fraude',1)",
        [f.family],
      ),
      /row-level/,
    );
    await assert.rejects(
      as(db, p, "insert into children(family_id,name) values($1,'Fraude')", [
        f.family,
      ]),
      /row-level/,
    );
    await assert.rejects(activity(db, p, f), /Acesso/);
    await assert.rejects(
      as(db, p, "delete from session_modes"),
      /permission denied/,
    );
    await db.exec("set role anon");
    await assert.rejects(
      db.query("select * from children"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select complete_activity($1)", [a]),
      /permission denied/,
    );
    await db.exec("reset role");
  } finally {
    await db.close();
  }
});

test("rejeição, reenvio, crédito automático, saldo revalidado, custo congelado e rollback", async () => {
  const db = await database();
  try {
    const p = await user(db),
      f = await fixture(db, p),
      a = await activity(db, p, f, 50, false);
    await as(db, p, "select complete_activity($1)", [a]);
    assert.equal(await balance(db, p, f.child), 50);
    await assert.rejects(as(db, p, "select delete_activity($1)", [a]));
    const b = await activity(db, p, f, 20, true);
    await as(db, p, "select complete_activity($1)", [b]);
    await as(db, p, "select review_activity($1,false)", [b]);
    assert.equal(await balance(db, p, f.child), 50);
    await as(db, p, "select complete_activity($1)", [b]);
    await as(db, p, "select review_activity($1,true)", [b]);
    assert.equal(await balance(db, p, f.child), 70);
    const r1 = (
      await as(
        db,
        p,
        "insert into rewards(family_id,name,points_cost) values($1,'R1',40) returning id",
        [f.family],
      )
    ).rows[0].id;
    const r2 = (
      await as(
        db,
        p,
        "insert into rewards(family_id,name,points_cost) values($1,'R2',40) returning id",
        [f.family],
      )
    ).rows[0].id;
    const q1 = (
      await as(db, p, "select request_reward($1,$2) id", [f.child, r1])
    ).rows[0].id;
    const q2 = (
      await as(db, p, "select request_reward($1,$2) id", [f.child, r2])
    ).rows[0].id;
    await as(db, p, "update rewards set points_cost=60 where id=$1", [r1]);
    await as(db, p, "select review_reward($1,true)", [q1]);
    assert.equal(await balance(db, p, f.child), 30);
    await assert.rejects(
      as(db, p, "select review_reward($1,true)", [q2]),
      /Saldo insuficiente/,
    );
    assert.equal(
      (
        await as(db, p, "select status from reward_redemptions where id=$1", [
          q2,
        ])
      ).rows[0].status,
      "pending",
    );
    await as(db, p, "select review_reward($1,false)", [q2]);
    assert.equal(await balance(db, p, f.child), 30);
    await assert.rejects(
      as(db, p, "select request_reward($1,$2)", [f.child, r2]),
      /Pontos insuficientes/,
    );
    await as(db, p, "update rewards set active=false where id=$1", [r1]);
    await assert.rejects(
      as(db, p, "select request_reward($1,$2)", [f.child, r1]),
      /indisponível/,
    );
    await assert.rejects(activity(db, p, f, -5, false), /check constraint/);
  } finally {
    await db.close();
  }
});

test("seed cria exemplos completos uma única vez e sem pontos artificiais", async () => {
  const db = await database();
  try {
    const p = await user(db);
    await as(db, p, "select seed_demo()");
    for (const [table, count] of [
      ["families", 1],
      ["children", 1],
      ["subjects", 4],
      ["activities", 3],
      ["rewards", 3],
      ["points_transactions", 0],
    ])
      assert.equal(
        (await as(db, p, `select * from ${table}`)).rows.length,
        count,
      );
    await assert.rejects(as(db, p, "select seed_demo()"), /sem família/);
  } finally {
    await db.close();
  }
});
