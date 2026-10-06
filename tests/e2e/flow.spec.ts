import { test, expect } from "@playwright/test";
test("jornada completa pelo navegador, modo criança e layout mobile", async ({
  page,
}) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  const email = `family-${Date.now()}@example.test`;
  const password = "StudyQuest123!";
  await page.goto("/login?signup=1");
  await page.getByLabel("Seu nome").fill("Marina");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel(/^Senha/).fill(password);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page.getByLabel("Nome da família").fill("Família Teste");
  await page.getByRole("button", { name: "Criar família e continuar" }).click();
  await page.getByLabel("Nome da criança").fill("Lucas");
  await page.getByRole("button", { name: "Cadastrar criança" }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Matemática");
  await page.getByRole("button", { name: "Cadastrar categoria" }).click();
  await page.getByRole("link", { name: "Ir para o início" }).click();
  await page
    .getByRole("link", { name: "Criar atividade", exact: false })
    .first()
    .click();
  await page
    .getByRole("combobox", { name: "Criança", exact: true })
    .selectOption({ label: "🦊 Lucas" });
  await page
    .getByRole("combobox", { name: "Categoria ou matéria", exact: true })
    .selectOption({ label: "📚 Matemática" });
  await page.getByLabel("Título da atividade").fill("Missão de 50 pontos");
  await page.getByLabel("Pontos pela conquista").fill("50");
  await page.getByRole("button", { name: "Salvar atividade" }).click();
  await expect(
    page.getByRole("heading", { name: "Missão de 50 pontos" }),
  ).toBeVisible();
  await page.goto("/app/children");
  await page.getByRole("button", { name: "Entrar no modo criança" }).click();
  await expect(page).toHaveURL(/\/kid\//);
  const kidURL = page.url().split("?")[0];
  await page.goto("/app/rewards");
  await expect(page).toHaveURL(/\/kid\//);
  await page.getByRole("button", { name: "Concluir" }).click();
  await expect(page.getByText("Em análise", { exact: true })).toBeVisible();
  await expect(page.getByText("⭐ 0 pontos", { exact: true })).toBeVisible();
  async function parent() {
    await page.getByRole("link", { name: "Área do responsável" }).click();
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel(/^Senha/).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: false }).click();
    await expect(page).toHaveURL(/\/app/);
  }
  await parent();
  await page.goto("/app/approvals");
  await page.getByRole("button", { name: "Aprovar", exact: true }).click();
  await expect(
    page.getByText("Tudo em dia! As atividades enviadas vão aparecer aqui."),
  ).toBeVisible();
  await page.goto("/app/children");
  await expect(page.getByText("✦ 50 pontos", { exact: true })).toBeVisible();
  await page.goto("/app/rewards/new");
  await page.getByLabel("Nome da recompensa").fill("Escolher o filme");
  await page.getByLabel("Custo em pontos").fill("40");
  await page.getByRole("button", { name: "Salvar recompensa" }).click();
  await page.goto("/app/children");
  await page.getByRole("button", { name: "Entrar no modo criança" }).click();
  await page.goto(kidURL + "?tab=rewards");
  await page.getByRole("button", { name: "Resgatar", exact: true }).click();
  await parent();
  await page.goto("/app/redemptions");
  await page.getByRole("button", { name: "Aprovar resgate" }).click();
  await expect(page.getByText("Aprovado", { exact: true })).toBeVisible();
  await page.goto("/app/children");
  await expect(page.getByText("✦ 10 pontos", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Ver jornada" }).click();
  await expect(page.getByText("+50", { exact: true })).toBeVisible();
  await expect(page.getByText("-40", { exact: true })).toBeVisible();
  await page.goto("/app");
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
    caret: "initial",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("navigation", { name: "Navegação inferior", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
    caret: "initial",
  });
  await page.goto("/app/children");
  await page.getByRole("button", { name: "Entrar no modo criança" }).click();
  await expect(page).toHaveURL(new RegExp("/kid/"));
  await expect(
    page.getByRole("heading", { name: "Olá, Lucas!" }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/kid-mobile.png",
    fullPage: true,
    caret: "initial",
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(browserErrors).toEqual([]);
});
