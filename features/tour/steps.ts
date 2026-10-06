import type { DriveStep } from "driver.js";

type Tip = [selector: string, title: string, description: string];
const link = (path: string) => `[data-tour-link="${path}"]`;

// Only static, application-owned copy goes into Driver.js (it accepts HTML).
export function tourSteps(
  role: "parent" | "kid",
  path: string,
  tab: string,
): DriveStep[] {
  let tips: Tip[];
  if (role === "kid") {
    tips = [
      [
        ".kid-hero .points",
        "Seus pontos, suas conquistas",
        "Você ganha pontos ao concluir missões. Algumas precisam da aprovação do responsável antes de os pontos aparecerem aqui.",
      ],
      [
        link("missions"),
        "Uma missão de cada vez",
        "Abra Missões para ver o que combinaram para hoje. Marque como concluída só depois de realizar a atividade.",
      ],
      [
        link("rewards"),
        "Escolha uma recompensa",
        "Junte pontos e peça uma recompensa. O responsável aprova o pedido; você acompanha a resposta nesta aba.",
      ],
      [
        link("profile"),
        "Um avatar com a sua cara",
        "No Perfil você encontra seu avatar 3D, a loja de roupas e cabelos, suas conquistas e o histórico de pontos.",
      ],
    ];
    if (tab === "missions")
      tips.push([
        ".activity-card",
        "Sua próxima descoberta",
        "Veja a descrição, os pontos e o estado da missão. Se ela voltar para você, confira o comentário do responsável e tente novamente.",
      ]);
    if (tab === "rewards")
      tips.push([
        ".reward-card",
        "Planeje seus pontos",
        "O cartão mostra o custo e se faltam pontos. Um pedido pendente ainda precisa de aprovação; evite gastar os pontos que quer guardar para ele.",
      ]);
    if (tab === "profile")
      tips.push(
        [
          ".avatar-showcase",
          "Experimente seu visual",
          "Arraste o avatar para girar ou use as setas. Experimentar um item é só uma prévia e não gasta pontos.",
        ],
        [
          ".avatar-section-switch",
          "Loja e armário",
          "Na loja você compra itens com pontos, após confirmar. Eles ficam no armário, onde trocar o visual é grátis. Essas compras usam o mesmo saldo das recompensas.",
        ],
        [
          ".avatar-categories",
          "Escolha seu estilo",
          "Explore cabelos, camisetas, calças, chapéus e acessórios. Você também pode voltar ao visual original gratuitamente.",
        ],
      );
  } else if (path === "/onboarding") {
    tips = [
      [
        ".steps",
        "Prepare a jornada da família",
        "São quatro passos: família, criança, categoria e recompensa. Você pode completar a configuração depois.",
      ],
      [
        ".onboarding .card",
        "Comece pelo que está na tela",
        "Preencha esta etapa e continue. As categorias podem organizar estudos e atividades do dia a dia; as recompensas devem ser combinadas com a criança.",
      ],
    ];
  } else {
    tips = [
      [
        ".page-title",
        "Sua família, no seu ritmo",
        "Organize atividades de estudo e do dia a dia, acompanhe conquistas e combine recompensas. Este guia apresenta os principais caminhos desta tela.",
      ],
      [
        link("/app/activities"),
        "Crie atividades com propósito",
        "Defina a criança, a categoria, a descrição e os pontos. Escolha se a conclusão precisa da sua aprovação.",
      ],
      [
        link("/app/approvals"),
        "Acompanhe antes de aprovar",
        "Revise as atividades enviadas. Aprovar libera os pontos; ao devolver uma atividade, explique o que a criança pode melhorar.",
      ],
      [
        link("/app/rewards"),
        "Combine as recompensas",
        "Cadastre recompensas e seu custo. Depois, revise os pedidos em Resgates, também acessível pelo Perfil.",
      ],
      [
        link("/app/profile"),
        "Os atalhos da sua família",
        "No Perfil você encontra Crianças, Matérias e categorias, Solicitações de recompensa e a configuração inicial. Esses atalhos também estão disponíveis no celular.",
      ],
    ];
    if (path === "/app")
      tips.splice(
        1,
        0,
        [
          "[data-tour='children']",
          "Conheça seus aventureiros",
          "Cadastre cada criança com seu próprio saldo. Abra sua jornada para acompanhar o histórico ou use Entrar no modo criança para acessar a experiência dela.",
        ],
        [
          ".stats",
          "Um resumo do dia",
          "Veja quantas missões estão pendentes, quantas aguardam aprovação e quantas já viraram conquistas.",
        ],
      );
    if (path.startsWith("/app/children"))
      tips.splice(
        1,
        0,
        [
          "form:has(input[name='action'][value='child'])",
          "Um perfil para cada criança",
          "Cadastre ou atualize o nome e o avatar. Cada criança tem atividades, pontos e itens do armário separados.",
        ],
        [
          "form:has(input[name='amount'])",
          "Descontos com motivo",
          "Quando necessário, registre um desconto e explique o motivo. Ele aparece no histórico e não pode ultrapassar o saldo disponível.",
        ],
      );
    if (path.includes("/activities"))
      tips.splice(
        1,
        0,
        [
          ".page-title a",
          "Prepare a próxima missão",
          "Use este botão para cadastrar uma atividade. O valor em pontos e a necessidade de aprovação são definidos por você.",
        ],
        [
          "form:has(input[name='title'])",
          "Deixe a missão clara",
          "Escolha a criança e a categoria, explique o que fazer e defina os pontos. Revise a opção de aprovação antes de salvar.",
        ],
        [
          ".activity-card",
          "Acompanhe cada etapa",
          "O cartão mostra os detalhes e o estado da atividade. As ações disponíveis mudam conforme o andamento da missão.",
        ],
      );
    if (path.includes("/subjects"))
      tips.splice(1, 0, [
        ".main form.form",
        "Organize por categoria",
        "Crie categorias para estudos, hábitos e tarefas do dia a dia. Use nome, ícone e cor para facilitar a identificação.",
      ]);
    if (path.includes("/rewards"))
      tips.splice(1, 0, [
        ".main form.form",
        "Uma recompensa possível",
        "Escolha um nome e um custo em pontos. Combine com a criança o que será entregue quando o pedido for aprovado.",
      ]);
    if (path.includes("/redemptions"))
      tips.splice(1, 0, [
        ".main .card",
        "Revise os pedidos",
        "Confira a criança, a recompensa e o custo. A aprovação desconta os pontos; o saldo é conferido novamente nesse momento.",
      ]);
  }
  const steps: DriveStep[] = [];
  for (const [selector, title, description] of tips) {
    // Desktop and mobile have separate navigation elements. Highlight only a visible one.
    const target = Array.from(
      document.querySelectorAll<HTMLElement>(selector),
    ).find(
      (el) =>
        el.getClientRects().length > 0 &&
        getComputedStyle(el).visibility !== "hidden",
    );
    if (target)
      steps.push({ element: target, popover: { title, description } });
  }
  steps.push({
    popover: {
      title: role === "kid" ? "Pronto para sua aventura!" : "Vamos começar?",
      description:
        "Você pode abrir Como funciona em qualquer tela para rever as dicas. Feche este guia quando quiser e explore no seu ritmo.",
    },
  });
  return steps;
}
