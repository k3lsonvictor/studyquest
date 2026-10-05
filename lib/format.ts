import type { Transaction } from "@/types";
export const statusLabels: Record<string, string> = {
  pending: "Pendente",
  awaiting_approval: "Em análise",
  completed: "Concluída",
  rejected: "Rejeitada",
  approved: "Aprovado",
};
export const balanceOf = (items: Transaction[], childId: string) =>
  items
    .filter((t) => t.child_id === childId)
    .reduce((sum, t) => sum + t.amount, 0);
export const points = (n: number) => n.toLocaleString("pt-BR");
export const dateLabel = (value: string) =>
  new Date(
    value.length === 10 ? value + "T12:00:00" : value,
  ).toLocaleDateString("pt-BR");
