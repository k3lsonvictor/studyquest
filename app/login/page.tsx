import Link from "next/link";
import { authenticate } from "@/app/actions";
import { PRODUCT_NAME, configured, demoMode } from "@/lib/config";
import { Card, Field, Feedback, Hidden } from "@/components/ui";
import { Submit } from "@/components/forms";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const q = await searchParams;
  const signup = q.signup === "1";
  return (
    <main className="auth-page">
      <Card className="auth-card">
        <Link className="brand" href="/">
          <span className="brand-mark">✦</span>
          {PRODUCT_NAME}
        </Link>
        <h1>
          {signup
            ? "Uma nova jornada começa aqui."
            : q.parent
              ? "Área do responsável"
              : "Que bom ter você aqui."}
        </h1>
        <p className="muted">
          {signup
            ? "Crie sua conta e descubra um jeito mais leve de aprender em família."
            : q.parent
              ? "Confirme seu e-mail e senha para voltar à administração."
              : "Entre para acompanhar as próximas conquistas."}
        </p>
        <div style={{ marginTop: 20 }}>
          <Feedback searchParams={searchParams} />
        </div>
        {demoMode && (
          <div className="notice success">
            <h3>Demonstração local</h3>
            <p className="small" style={{ margin: "8px 0 14px" }}>
              Explore a Família Silva com dados fictícios. As alterações são
              apagadas ao reiniciar a demonstração. Não precisa configurar o
              Supabase.
            </p>
            <form action={authenticate}>
              <Hidden
                values={{
                  intent: "login",
                  email: "demo@studyquest.local",
                  password: "StudyQuest123!",
                }}
              />
              <Submit variant="wide">Explorar demonstração →</Submit>
            </form>
          </div>
        )}
        {configured ? (
          <form className="form" action={authenticate}>
            <Hidden values={{ intent: signup ? "signup" : "login" }} />
            {signup && (
              <Field label="Seu nome">
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </Field>
            )}
            <Field label="E-mail">
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </Field>
            <Field label="Senha">
              <input
                type="password"
                name="password"
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={8}
                maxLength={128}
                required
              />
              <span className="small muted">Pelo menos 8 caracteres.</span>
            </Field>
            <Submit>{signup ? "Criar minha conta" : "Entrar"} →</Submit>
          </form>
        ) : (
          <div className="notice error">
            Configure o Supabase em .env.local para habilitar a autenticação.
          </div>
        )}
        <div className="divider" />
        <p className="small muted">
          {signup ? "Já tem uma conta?" : "Primeira vez aqui?"}{" "}
          <Link
            className="text-link"
            href={signup ? "/login" : "/login?signup=1"}
          >
            {signup ? "Entrar" : "Criar conta"}
          </Link>
        </p>
      </Card>
    </main>
  );
}
