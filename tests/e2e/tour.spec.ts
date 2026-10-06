import { test, expect, type Page } from "@playwright/test";

async function finishTour(page: Page) {
  for (let i = 0; i < 15; i++) {
    const next = page.locator(".driver-popover-next-btn");
    if ((await next.textContent()) === "Concluir") {
      await next.click();
      await expect(page.locator(".driver-popover")).toHaveCount(0);
      return;
    }
    await next.click();
  }
  throw new Error("Tour did not finish within 15 steps");
}

test("guia: convite, pular, rever, teclado, conclusão e experiência infantil no celular", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login?signup=1");
  await page.getByLabel("Seu nome").fill("Responsável Tour");
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(`tour-${Date.now()}@example.test`);
  await page.getByLabel(/^Senha/).fill("StudyQuest123!");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await page.getByRole("button", { name: "Conhecer a plataforma" }).click();
  await expect(page.locator(".driver-popover-title")).toHaveText(
    "Prepare a jornada da família",
  );
  await page.getByRole("button", { name: "Pular tour" }).click();
  await expect(page.locator(".driver-popover")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Experimentar com a Família Silva" })
    .click();
  await page.getByRole("button", { name: "Agora não", exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Conhecer a plataforma" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Como funciona" }).click();
  await expect(page.locator(".driver-popover-title")).toHaveText(
    "Sua família, no seu ritmo",
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".driver-popover-title")).toHaveText(
    "Conheça seus aventureiros",
  );
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".driver-popover-title")).toHaveText(
    "Sua família, no seu ritmo",
  );
  await page.screenshot({ path: "test-results/tour-parent.png" });
  await finishTour(page);
  await expect(
    page.getByRole("button", { name: "Como funciona" }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Como funciona" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".driver-overlay")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Como funciona" }).click();
  await finishTour(page); // Hidden desktop navigation is never used on mobile.
  await page.getByRole("button", { name: "Entrar no modo criança" }).click();
  await page.getByRole("button", { name: "Conhecer a plataforma" }).click();
  await expect(page.locator(".driver-popover-title")).toHaveText(
    "Seus pontos, suas conquistas",
  );
  await page.screenshot({ path: "test-results/tour-kid-mobile.png" });
  const bounds = await page.locator(".driver-popover").boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await finishTour(page);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Conhecer a plataforma" }),
  ).toHaveCount(0);
  const kidURL = page.url().split("?")[0];
  await page.goto(kidURL + "?tab=profile");
  await page.getByRole("button", { name: "Como funciona" }).click();
  for (let i = 0; i < 4; i++)
    await page.locator(".driver-popover-next-btn").click();
  await expect(page.locator(".driver-popover-title")).toHaveText(
    "Experimente seu visual",
  );
  await finishTour(page);
  await page.evaluate(() => {
    Storage.prototype.getItem = () => {
      throw new Error("storage blocked");
    };
    Storage.prototype.setItem = () => {
      throw new Error("storage blocked");
    };
  });
  await page.getByRole("button", { name: "Como funciona" }).click();
  await page.getByRole("button", { name: "Pular tour" }).click();
  expect(errors).toEqual([]);
});
