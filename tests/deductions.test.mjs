import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { database, user, as, fixture, activity, balance } from "./database.mjs";

for (const fromMigrations of [false, true]) {
  test(`descontos: saldo, histórico, repetição e permissões (${fromMigrations ? "migrações" : "schema"})`, async () => {
    const db = await database({ fromMigrations });
    try {
      const parent = await user(db);
      const other = await user(db, "other@example.test");
      const f = await fixture(db, parent);
      const a = await activity(db, parent, f, 50, false);
      await as(db, parent, "select complete_activity($1)", [a]);
      const request = randomUUID();
      const deduct = (
        u,
        amount = 20,
        reason = "Brinquedos não guardados",
        id = request,
      ) =>
        as(db, u, "select deduct_points($1,$2,$3,$4)", [
          f.child,
          amount,
          reason,
          id,
        ]);
      await deduct(parent);
      await deduct(parent);
      assert.equal(await balance(db, parent, f.child), 30);
      const rows = (
        await as(
          db,
          parent,
          "select amount,description from points_transactions where type='adjustment'",
        )
      ).rows;
      assert.deepEqual(rows, [
        { amount: -20, description: "Brinquedos não guardados" },
      ]);
      await assert.rejects(deduct(parent, 21), /outros dados/);
      await assert.rejects(deduct(parent, 31, "Motivo", randomUUID()), /saldo/);
      for (const [amount, reason] of [
        [0, "Motivo"],
        [-1, "Motivo"],
        [1, "   "],
        [1, "a".repeat(501)],
      ])
        await assert.rejects(
          deduct(parent, amount, reason, randomUUID()),
          /válidos/,
        );
      await assert.rejects(deduct(other), /Acesso/);
      await as(db, parent, "select enter_kid($1)", [f.child]);
      await assert.rejects(deduct(parent), /Acesso/);
      assert.equal(await balance(db, parent, f.child), 30);
    } finally {
      await db.close();
    }
  });
}
