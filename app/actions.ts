"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { supabase } from "@/lib/supabase/server";
import { session } from "@/services/family";
import { authErrorMessage } from "@/lib/auth-errors";

function text(f: FormData, key: string, max = 2000) {
  return String(f.get(key) ?? "")
    .trim()
    .slice(0, max);
}
function back(f: FormData) {
  const path = text(f, "returnTo");
  if (!/^\/(app|onboarding|kid)(\/|\?|$)/.test(path) || path.includes("\\"))
    return "/app";
  const [pathname, query] = path.split("?");
  const tab = new URLSearchParams(query).get("tab");
  return (
    pathname +
    (tab && ["missions", "rewards", "profile"].includes(tab)
      ? `?tab=${tab}`
      : "")
  );
}
function finish(path: string, message: string, error = false): never {
  revalidatePath("/", "layout");
  redirect(
    `${path}${path.includes("?") ? "&" : "?"}${error ? "error" : "success"}=${encodeURIComponent(message)}`,
  );
}
function errorMessage(error: { message: string; code?: string }) {
  if (error.code === "23505") return "Este registro ou solicitação já existe.";
  if (
    error.code === "23514" ||
    error.code === "22P02" ||
    error.code === "23503"
  )
    return "Confira os campos e selecione registros válidos da sua família.";
  if (error.code === "42501") return "Você não tem permissão para esta ação.";
  return error.code === "P0001"
    ? error.message
    : "Não foi possível salvar. Confira os dados e tente novamente.";
}
export async function authenticate(f: FormData) {
  const db = await supabase();
  const email = text(f, "email", 254),
    password = String(f.get("password") ?? "");
  const signup = text(f, "intent") === "signup";
  if (!email || password.length < 8 || password.length > 128)
    finish(
      "/login",
      "Informe um e-mail e uma senha entre 8 e 128 caracteres.",
      true,
    );
  if (signup) {
    const origin = (await headers()).get("origin");
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { name: text(f, "name", 100) || "Responsável" },
        ...(origin
          ? { emailRedirectTo: new URL("/auth/callback", origin).href }
          : {}),
      },
    });
    if (error) {
      console.warn("[auth:signup]", { code: error.code, status: error.status });
      finish("/login?signup=1", authErrorMessage(error, "signup"), true);
    }
    if (!data.session)
      finish(
        "/login",
        "Se o cadastro estiver pendente de confirmação, confira seu e-mail e o spam. Se você já confirmou este endereço, entre com sua senha.",
      );
    redirect("/onboarding");
  }
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    console.warn("[auth:login]", { code: error.code, status: error.status });
    finish("/login", authErrorMessage(error, "login"), true);
  }
  redirect("/app");
}
export async function logout() {
  const db = await supabase();
  await db.auth.signOut({ scope: "local" });
  redirect("/login");
}

export async function mutate(f: FormData) {
  const { db, kid } = await session();
  const action = text(f, "action");
  const path = back(f);
  if (
    kid &&
    !["complete", "request", "avatar_buy", "avatar_equip"].includes(action)
  )
    finish(`/kid/${kid}`, "Acesso reservado ao responsável.", true);
  let error: { message: string; code?: string } | null = null;
  let message = "Salvo com sucesso!";
  switch (action) {
    case "deduct_points": {
      const amount = Number(f.get("amount"));
      const reason = text(f, "reason", 500);
      if (
        !Number.isInteger(amount) ||
        amount < 1 ||
        amount > 100000 ||
        !reason ||
        f.get("confirmed") !== "on"
      )
        finish(
          path,
          "Informe os pontos, o motivo e confirme o desconto.",
          true,
        );
      ({ error } = await db.rpc("deduct_points", {
        p_child: text(f, "child_id"),
        p_amount: amount,
        p_reason: reason,
        p_request: text(f, "request_id"),
      }));
      message = "Desconto registrado no histórico de pontos.";
      break;
    }
    case "avatar_buy":
      ({ error } = await db.rpc("buy_avatar_item", {
        p_child: kid || text(f, "child_id"),
        p_item: text(f, "id"),
      }));
      message = "Novo visual desbloqueado! Seu item já está equipado.";
      break;
    case "avatar_equip":
      ({ error } = await db.rpc("equip_avatar_item", {
        p_child: kid || text(f, "child_id"),
        p_slot: text(f, "slot"),
        p_item: text(f, "id") || null,
      }));
      message = "Visual atualizado!";
      break;
    case "family":
      ({ error } = await db.rpc("create_family", {
        p_name: text(f, "name", 100),
      }));
      break;
    case "child": {
      const id = text(f, "id");
      const row = {
        name: text(f, "name", 100),
        avatar: text(f, "avatar", 20) || "🦊",
      };
      if (id) ({ error } = await db.from("children").update(row).eq("id", id));
      else
        ({ error } = await db
          .from("children")
          .insert({ ...row, family_id: text(f, "family_id") }));
      break;
    }
    case "subject":
      ({ error } = await db.from("subjects").insert({
        family_id: text(f, "family_id"),
        name: text(f, "name", 100),
        icon: text(f, "icon", 20) || "📚",
        color: text(f, "color", 7) || "#6d5ce7",
      }));
      break;
    case "activity":
      ({ error } = await db.rpc("save_activity", {
        p_id: text(f, "id") || null,
        p_child: text(f, "child_id"),
        p_subject: text(f, "subject_id"),
        p_title: text(f, "title", 160),
        p_description: text(f, "description"),
        p_points: Number(f.get("points")),
        p_due: text(f, "due_date") || null,
        p_approval: f.get("requires_approval") === "on",
      }));
      break;
    case "delete":
      ({ error } = await db.rpc("delete_activity", { p_id: text(f, "id") }));
      message = "Atividade excluída.";
      break;
    case "complete":
      ({ error } = await db.rpc("complete_activity", { p_id: text(f, "id") }));
      message = "Missão enviada! Confira o status e seus pontos.";
      break;
    case "review_activity":
      ({ error } = await db.rpc("review_activity", {
        p_id: text(f, "id"),
        p_approve: text(f, "approve") === "true",
      }));
      message = "Atividade analisada.";
      break;
    case "reward": {
      const id = text(f, "id");
      const row = {
        name: text(f, "name", 160),
        description: text(f, "description"),
        points_cost: Number(f.get("points_cost")),
        active: f.get("active") === "on",
      };
      if (id) ({ error } = await db.from("rewards").update(row).eq("id", id));
      else
        ({ error } = await db
          .from("rewards")
          .insert({ ...row, family_id: text(f, "family_id") }));
      break;
    }
    case "request":
      ({ error } = await db.rpc("request_reward", {
        p_child: kid || text(f, "child_id"),
        p_reward: text(f, "id"),
      }));
      message = "Recompensa solicitada! Aguarde a aprovação.";
      break;
    case "review_reward":
      ({ error } = await db.rpc("review_reward", {
        p_id: text(f, "id"),
        p_approve: text(f, "approve") === "true",
      }));
      message = "Solicitação analisada.";
      break;
    case "kid": {
      const id = text(f, "id");
      ({ error } = await db.rpc("enter_kid", { p_child: id }));
      if (!error) {
        revalidatePath("/", "layout");
        redirect(`/kid/${id}`);
      }
      break;
    }
    case "seed":
      ({ error } = await db.rpc("seed_demo"));
      message = "Família de exemplo criada!";
      break;
    default:
      finish(path, "Ação inválida.", true);
  }
  if (error) finish(path, errorMessage(error), true);
  finish(path, message);
}
