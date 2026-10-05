import { test, expect } from "@playwright/test";

test("avatar 3D: experimentar, cancelar, comprar, trocar, persistir e registrar no histórico", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/login?signup=1");
  await page.getByLabel("Seu nome").fill("Responsável Avatar");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(`avatar-${Date.now()}@example.test`);
  await page.getByLabel(/^Senha/).fill("StudyQuest123!");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await page
    .getByRole("button", { name: "Experimentar com a Família Silva" })
    .click();
  await page.getByRole("button", { name: "Entrar no modo criança" }).click();
  await expect(page).toHaveURL(/\/kid\//);
  const url = page.url().split("?")[0];
  await page
    .locator(".activity-card")
    .filter({
      has: page.getByRole("heading", { name: "Revisar vocabulário de inglês" }),
    })
    .getByRole("button", { name: "Concluir" })
    .click();
  await expect(page.getByText("⭐ 15 pontos", { exact: true })).toBeVisible();
  await page.goto(url + "?tab=profile");
  await expect(
    page.getByRole("heading", { name: "Seu estilo. Sua aventura." }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Avatar 3D de Lucas" }),
  ).toHaveAttribute("data-ready", "true", { timeout: 30000 });
  const shirt = page.getByRole("article", {
    name: "Camiseta Oceano",
    exact: true,
  });
  await shirt
    .getByRole("button", { name: "Experimentar Camiseta Oceano" })
    .click();
  await expect(
    page.getByText("Só uma prévia. Seu visual ainda não mudou."),
  ).toBeVisible();
  await shirt.getByRole("button", { name: "Comprar por 15 pontos" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Agora não" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.getByText("⭐ 15 pontos", { exact: true })).toBeVisible();
  await shirt.getByRole("button", { name: "Comprar por 15 pontos" }).click();
  await page.getByRole("button", { name: "Confirmar compra" }).click();
  await expect(
    page.getByText("Novo visual desbloqueado! Seu item já está equipado."),
  ).toBeVisible();
  await expect(page.getByText("⭐ 0 pontos", { exact: true })).toBeVisible();
  await expect(
    shirt.getByRole("button", { name: "Equipado", exact: true }),
  ).toBeDisabled();
  await expect(
    page
      .getByRole("article", { name: "Coroa Estelar", exact: true })
      .getByRole("button", { name: "Faltam 80 pontos" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Meu armário/ }).click();
  await page
    .locator(".avatar-default")
    .filter({ has: page.getByRole("heading", { name: "Camiseta original" }) })
    .getByRole("button", { name: "Usar original" })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Visual atualizado!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Meu armário/ }).click();
  await shirt.getByRole("button", { name: "Equipar", exact: true }).click();
  await expect(
    shirt.getByRole("button", { name: "Equipado", exact: true }),
  ).toBeDisabled();
  await page.reload();
  await expect(
    shirt.getByRole("button", { name: "Equipado", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Avatar: Camiseta Oceano" }),
  ).toBeVisible();
  await expect(page.getByText("-15", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Avatar 3D de Lucas" }),
  ).toHaveAttribute("data-ready", "true");
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.locator("#avatar-title").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: "test-results/avatar-desktop.png",
    caret: "initial",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Girar avatar para a direita" })
    .click();
  await page
    .locator(".avatar-showcase")
    .screenshot({ path: "test-results/avatar-mobile.png", caret: "initial" });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Cabelos", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Experimentar Cabelo longo castanho",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("img", { name: "Avatar 3D de Lucas" }),
  ).toHaveAttribute("data-ready", "true");
  await page
    .locator(".avatar-showcase")
    .screenshot({ path: "test-results/avatar-hair-mobile.png" });
  expect(errors).toEqual([]);
});
