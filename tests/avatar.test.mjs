import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { database, user, as, fixture, activity, balance } from "./database.mjs";

async function item(db, parent, slug) {
  return (
    await as(db, parent, "select * from avatar_items where slug=$1", [slug])
  ).rows[0];
}
async function credit(db, parent, f, amount) {
  const id = await activity(db, parent, f, amount, false);
  await as(db, parent, "select complete_activity($1)", [id]);
}

test("hair: purchase preserves hat, default is free, and owned hair can be equipped again", async () => {
  const db = await database({ fromMigrations: true });
  try {
    const p = await user(db),
      f = await fixture(db, p);
    await credit(db, p, f, 60);
    const hair = await item(db, p, "hair-long-brown");
    const hat = await item(db, p, "cap-explorer");
    await as(db, p, "select enter_kid($1)", [f.child]);
    await as(db, p, "select buy_avatar_item($1,$2)", [f.child, hat.id]);
    await as(db, p, "select buy_avatar_item($1,$2)", [f.child, hair.id]);
    assert.equal(await balance(db, p, f.child), 15);
    assert.equal(
      (await as(db, p, "select * from child_avatar_equipment")).rows.length,
      2,
    );
    await as(db, p, "select equip_avatar_item($1,'hair',null)", [f.child]);
    assert.equal(
      (await as(db, p, "select slot from child_avatar_equipment")).rows[0].slot,
      "hat",
    );
    await as(db, p, "select equip_avatar_item($1,'hair',$2)", [
      f.child,
      hair.id,
    ]);
    assert.equal(await balance(db, p, f.child), 15);
    await assert.rejects(
      as(db, p, "select equip_avatar_item($1,'hair',$2)", [f.child, hat.id]),
      /categoria/,
    );
  } finally {
    await db.close();
  }
});

test("avatar: compra debita uma vez, equipa, persiste no armário e permite trocar de graça", async () => {
  const db = await database();
  try {
    const p = await user(db),
      f = await fixture(db, p);
    await credit(db, p, f, 50);
    const shirt = await item(db, p, "shirt-ocean"),
      otherShirt = await item(db, p, "shirt-sunset");
    await as(db, p, "select enter_kid($1)", [f.child]);
    await as(db, p, "select buy_avatar_item($1,$2)", [f.child, shirt.id]);
    assert.equal(await balance(db, p, f.child), 35);
    assert.equal(
      (await as(db, p, "select item_id from child_avatar_equipment")).rows[0]
        .item_id,
      shirt.id,
    );
    await assert.rejects(
      as(db, p, "select buy_avatar_item($1,$2)", [f.child, shirt.id]),
      /já tem/,
    );
    await as(db, p, "select buy_avatar_item($1,$2)", [f.child, otherShirt.id]);
    assert.equal(await balance(db, p, f.child), 15);
    await as(db, p, "select equip_avatar_item($1,'shirt',$2)", [
      f.child,
      shirt.id,
    ]);
    await as(db, p, "select equip_avatar_item($1,'shirt',null)", [f.child]);
    assert.equal(
      (await as(db, p, "select * from child_avatar_equipment")).rows.length,
      0,
    );
    assert.equal(
      (await as(db, p, "select * from child_avatar_items")).rows.length,
      2,
    );
    await as(db, p, "select equip_avatar_item($1,'shirt',$2)", [
      f.child,
      otherShirt.id,
    ]);
    assert.equal(await balance(db, p, f.child), 15);
    const ledger = (
      await as(
        db,
        p,
        "select amount,description,reference_id from points_transactions where type='avatar' order by created_at",
      )
    ).rows;
    assert.deepEqual(
      ledger.map((t) => t.amount),
      [-15, -20],
    );
    const purchases = (
      await as(db, p, "select * from child_avatar_items order by purchased_at")
    ).rows;
    assert.equal(ledger[0].reference_id, purchases[0].id);
    assert.match(ledger[0].description, /Camiseta Oceano/);
  } finally {
    await db.close();
  }
});

test("avatar: saldo insuficiente, item inativo e equipamento não comprado não alteram saldo", async () => {
  const db = await database();
  try {
    const p = await user(db),
      f = await fixture(db, p),
      shirt = await item(db, p, "shirt-ocean"),
      hat = await item(db, p, "crown-star");
    await assert.rejects(
      as(db, p, "select buy_avatar_item($1,$2)", [f.child, shirt.id]),
      /Pontos insuficientes/,
    );
    await credit(db, p, f, 30);
    await assert.rejects(
      as(db, p, "select equip_avatar_item($1,'hat',$2)", [f.child, hat.id]),
      /precisa ter/,
    );
    await as(db, p, "select buy_avatar_item($1,$2)", [f.child, shirt.id]);
    await assert.rejects(
      as(db, p, "select equip_avatar_item($1,'hat',$2)", [f.child, shirt.id]),
      /precisa ter/,
    );
    await assert.rejects(
      as(db, p, "select equip_avatar_item($1,'admin',null)", [f.child]),
      /Categoria inválida/,
    );
    await assert.rejects(
      as(db, p, "select buy_avatar_item($1,$2)", [f.child, randomUUID()]),
      /não está disponível/,
    );
    await db.query("update avatar_items set active=false where id=$1", [
      hat.id,
    ]);
    await assert.rejects(
      as(db, p, "select buy_avatar_item($1,$2)", [f.child, hat.id]),
      /não está disponível/,
    );
    await db.query("update avatar_items set active=false where id=$1", [
      shirt.id,
    ]);
    await as(db, p, "select equip_avatar_item($1,'shirt',$2)", [
      f.child,
      shirt.id,
    ]);
    assert.equal(await balance(db, p, f.child), 15);
    assert.equal(
      (await as(db, p, "select * from child_avatar_items")).rows.length,
      1,
    );
  } finally {
    await db.close();
  }
});

test("avatar: RLS protege inventário de outras famílias e irmãos; escrita direta é proibida", async () => {
  const db = await database();
  try {
    const p = await user(db),
      other = await user(db),
      f = await fixture(db, p),
      g = await fixture(db, other),
      shirt = await item(db, p, "shirt-ocean");
    await credit(db, other, g, 50);
    await as(db, other, "select buy_avatar_item($1,$2)", [g.child, shirt.id]);
    for (const table of ["child_avatar_items", "child_avatar_equipment"])
      assert.equal((await as(db, p, `select * from ${table}`)).rows.length, 0);
    await assert.rejects(
      as(db, p, "select buy_avatar_item($1,$2)", [g.child, shirt.id]),
      /Acesso/,
    );
    await assert.rejects(
      as(db, p, "select equip_avatar_item($1,'shirt',null)", [g.child]),
      /Acesso/,
    );
    await assert.rejects(
      as(db, p, "update avatar_items set points_cost=1"),
      /permission denied/,
    );
    await assert.rejects(
      as(
        db,
        p,
        "insert into child_avatar_items(child_id,item_id,points_paid) values($1,$2,1)",
        [f.child, shirt.id],
      ),
      /permission denied/,
    );
    await assert.rejects(
      as(
        db,
        p,
        "insert into child_avatar_equipment(child_id,slot,item_id) values($1,'shirt',$2)",
        [f.child, shirt.id],
      ),
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
    await credit(db, p, { ...f, child: sibling }, 50);
    await as(db, p, "select buy_avatar_item($1,$2)", [sibling, shirt.id]);
    await as(db, p, "select enter_kid($1)", [f.child]);
    assert.equal(
      (await as(db, p, "select * from child_avatar_items")).rows.length,
      0,
    );
    await assert.rejects(
      as(db, p, "select equip_avatar_item($1,'shirt',null)", [sibling]),
      /Acesso/,
    );
    await db.exec("set role anon");
    await assert.rejects(
      db.query("select buy_avatar_item($1,$2)", [f.child, shirt.id]),
      /permission denied/,
    );
    await db.exec("reset role");
  } finally {
    await db.close();
  }
});

test("avatar: disputa com recompensa não permite gastar saldo já usado; migration atualiza banco existente", async () => {
  const db = await database({ fromMigrations: true });
  try {
    const p = await user(db),
      f = await fixture(db, p);
    await credit(db, p, f, 50);
    const shirt = await item(db, p, "shirt-ocean"),
      crown = await item(db, p, "crown-star");
    const reward = (
      await as(
        db,
        p,
        "insert into rewards(family_id,name,points_cost) values($1,'Filme',40) returning id",
        [f.family],
      )
    ).rows[0].id;
    const request = (
      await as(db, p, "select request_reward($1,$2) id", [f.child, reward])
    ).rows[0].id;
    await as(db, p, "select buy_avatar_item($1,$2)", [f.child, shirt.id]);
    await assert.rejects(
      as(db, p, "select review_reward($1,true)", [request]),
      /Saldo insuficiente/,
    );
    await assert.rejects(
      as(db, p, "select buy_avatar_item($1,$2)", [f.child, crown.id]),
      /Pontos insuficientes/,
    );
    assert.equal(await balance(db, p, f.child), 35);
    assert.equal(
      (
        await as(db, p, "select status from reward_redemptions where id=$1", [
          request,
        ])
      ).rows[0].status,
      "pending",
    );
    assert.equal(
      (await as(db, p, "select * from avatar_items")).rows.length,
      15,
    );
  } finally {
    await db.close();
  }
});
