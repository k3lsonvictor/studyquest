import { test } from "node:test";
import assert from "node:assert/strict";
import { confirmationDestination } from "../lib/auth-callback.ts";

test("confirmação troca o código PKCE e preserva o identificador do fluxo", async () => {
  const calls = [];
  const target = await confirmationDestination(
    new URLSearchParams(
      "code=test-code&sb_flow_id=test-flow&next=https://example.org",
    ),
    async (...args) => {
      calls.push(args);
      return {
        data: { session: { access_token: "test-session" } },
        error: null,
      };
    },
  );
  assert.equal(target, "/app");
  assert.deepEqual(calls, [["test-code", { flowId: "test-flow" }]]);
});
test("código legado funciona sem flowId", async () => {
  assert.equal(
    await confirmationDestination(
      new URLSearchParams("code=legacy"),
      async (code, options) => {
        assert.equal(code, "legacy");
        assert.equal(options, undefined);
        return { data: { session: {} }, error: null };
      },
    ),
    "/app",
  );
});
test("retorno inválido não troca código nem expõe erro do provedor", async () => {
  for (const query of [
    "",
    "error=access_denied&code=secret",
    "error_code=otp_expired",
  ]) {
    const target = await confirmationDestination(
      new URLSearchParams(query),
      async () => {
        assert.fail("Não deve chamar o provedor");
      },
    );
    assert.match(target, /^\/login\?error=/);
    assert.ok(!target.includes("secret"));
  }
});
test("falha de troca, ausência de sessão e falha de rede retornam ao login", async () => {
  for (const exchange of [
    async () => ({ data: { session: null }, error: { message: "sensitive" } }),
    async () => ({ data: { session: null }, error: null }),
    async () => {
      throw new Error("sensitive");
    },
  ]) {
    const target = await confirmationDestination(
      new URLSearchParams("code=secret"),
      exchange,
    );
    assert.match(target, /^\/login\?error=/);
    assert.ok(!target.includes("sensitive") && !target.includes("secret"));
  }
});
