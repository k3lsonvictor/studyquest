import { test } from "node:test";
import assert from "node:assert/strict";
import { authErrorMessage } from "../lib/auth-errors.ts";

test("erros de envio distinguem limite, endereço não autorizado e configuração desativada", () => {
  assert.match(
    authErrorMessage({ code: "over_email_send_rate_limit" }, "signup"),
    /limite de envio/,
  );
  assert.match(
    authErrorMessage({ code: "email_address_not_authorized" }, "signup"),
    /não está autorizado/,
  );
  assert.match(
    authErrorMessage({ code: "signup_disabled" }, "signup"),
    /desativado/,
  );
  assert.match(authErrorMessage({ status: 429 }, "signup"), /limite de envio/);
});
test("login distingue confirmação pendente e erro inesperado não expõe detalhes internos", () => {
  assert.match(
    authErrorMessage({ code: "email_not_confirmed" }, "login"),
    /ainda não foi confirmado/,
  );
  assert.match(
    authErrorMessage({ code: "invalid_credentials" }, "login"),
    /senha inválidos/,
  );
  const message = authErrorMessage(
    {
      code: "unexpected_failure",
      status: 500,
      message: "sensitive provider detail",
    },
    "signup",
  );
  assert.ok(!message.includes("sensitive"));
  assert.match(message, /serviço de autenticação/);
});
