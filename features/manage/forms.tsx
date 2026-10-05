import { mutate } from "@/app/actions";
import { Field, Hidden } from "@/components/ui";
import { Submit } from "@/components/forms";
import type { Activity, Child, Subject, Reward } from "@/types";

export function ChildForm({
  familyId,
  child,
  returnTo = "/app/children",
}: {
  familyId: string;
  child?: Child;
  returnTo?: string;
}) {
  return (
    <form action={mutate} className="form">
      <Hidden
        values={{
          action: "child",
          family_id: familyId,
          id: child?.id || "",
          returnTo,
        }}
      />
      <h2>
        {child ? "Editar criança" : "Uma nova aventureira ou aventureiro"}
      </h2>
      <Field label="Nome da criança">
        <input
          name="name"
          required
          maxLength={100}
          defaultValue={child?.name}
          placeholder="Como a criança se chama?"
        />
      </Field>
      <Field label="Escolha um companheiro">
        <select name="avatar" defaultValue={child?.avatar || "🦊"}>
          {["🦊", "🐼", "🐨", "🐯", "🐸", "🐰", "🦁", "🐻"].map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </Field>
      <Submit>{child ? "Salvar alterações" : "Cadastrar criança"}</Submit>
    </form>
  );
}
export function SubjectForm({
  familyId,
  returnTo = "/app/subjects",
}: {
  familyId: string;
  returnTo?: string;
}) {
  return (
    <form action={mutate} className="form">
      <Hidden values={{ action: "subject", family_id: familyId, returnTo }} />
      <h2>Nova matéria</h2>
      <Field label="Nome">
        <input
          name="name"
          required
          maxLength={100}
          placeholder="Ex.: Matemática"
        />
      </Field>
      <div className="grid-2">
        <Field label="Ícone">
          <select name="icon">
            {["📚", "🔢", "📖", "🔬", "🌎", "🎨", "🎵", "🏃"].map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </Field>
        <Field label="Cor">
          <input name="color" type="color" defaultValue="#6d5ce7" />
        </Field>
      </div>
      <Submit>Cadastrar matéria</Submit>
    </form>
  );
}
export function RewardForm({
  familyId,
  reward,
  returnTo = "/app/rewards",
}: {
  familyId: string;
  reward?: Reward;
  returnTo?: string;
}) {
  return (
    <form action={mutate} className="form">
      <Hidden
        values={{
          action: "reward",
          family_id: familyId,
          id: reward?.id || "",
          returnTo,
        }}
      />
      <h2>{reward ? "Editar recompensa" : "Uma nova motivação"}</h2>
      <Field label="Nome da recompensa">
        <input
          name="name"
          required
          maxLength={160}
          defaultValue={reward?.name}
          placeholder="Ex.: Escolher o filme da noite"
        />
      </Field>
      <Field label="Descrição">
        <textarea
          name="description"
          maxLength={2000}
          defaultValue={reward?.description}
          placeholder="Combine os detalhes com a criança."
        />
      </Field>
      <Field label="Custo em pontos">
        <input
          type="number"
          name="points_cost"
          required
          min={1}
          max={1000000}
          defaultValue={reward?.points_cost || 100}
        />
      </Field>
      <label className="check">
        <input
          type="checkbox"
          name="active"
          defaultChecked={reward?.active ?? true}
        />
        Disponível para resgate
      </label>
      <Submit>Salvar recompensa</Submit>
    </form>
  );
}
export function ActivityForm({
  children,
  subjects,
  activity,
}: {
  children: Child[];
  subjects: Subject[];
  activity?: Activity;
}) {
  return (
    <form action={mutate} className="form">
      <Hidden
        values={{
          action: "activity",
          id: activity?.id || "",
          returnTo: "/app/activities",
        }}
      />
      <div className="grid-2">
        <Field label="Criança">
          <select
            name="child_id"
            required
            defaultValue={activity?.child_id || ""}
          >
            <option value="" disabled>
              Selecione
            </option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.avatar} {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Matéria">
          <select
            name="subject_id"
            required
            defaultValue={activity?.subject_id || ""}
          >
            <option value="" disabled>
              Selecione
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Título da atividade">
        <input
          name="title"
          required
          maxLength={160}
          defaultValue={activity?.title}
          placeholder="Ex.: Resolver 10 questões de matemática"
        />
      </Field>
      <Field label="Descrição">
        <textarea
          name="description"
          maxLength={2000}
          defaultValue={activity?.description}
          placeholder="O que precisa ser feito?"
        />
      </Field>
      <div className="grid-2">
        <Field label="Pontos pela conquista">
          <input
            type="number"
            name="points"
            min={1}
            max={100000}
            required
            defaultValue={activity?.points || 50}
          />
        </Field>
        <Field label="Prazo (opcional)">
          <input
            type="date"
            name="due_date"
            defaultValue={activity?.due_date || ""}
          />
        </Field>
      </div>
      <label className="check">
        <input
          name="requires_approval"
          type="checkbox"
          defaultChecked={activity?.requires_approval ?? true}
        />
        Exigir minha aprovação antes de liberar os pontos
      </label>
      <p className="small muted">
        Sem aprovação, os pontos são liberados assim que a criança concluir a
        missão.
      </p>
      <Submit>Salvar atividade</Submit>
    </form>
  );
}
