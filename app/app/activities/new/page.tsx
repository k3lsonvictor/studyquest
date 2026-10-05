import Link from "next/link";
import { notFound } from "next/navigation";
import { familyData } from "@/services/family";
import { PageTitle, Card, Feedback } from "@/components/ui";
import { ActivityForm } from "@/features/manage/forms";
export default async function NewActivity({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const d = await familyData();
  const q = await searchParams;
  const a = d.activities.find((a) => a.id === q.id);
  if (q.id && !a) notFound();
  return (
    <>
      <PageTitle
        title={a ? "Editar missão" : "Uma nova missão"}
        description="Escolha uma atividade possível e dê valor ao esforço."
      />
      <Feedback searchParams={searchParams} />
      <Card>
        {!d.children.length ? (
          <p>
            Primeiro,{" "}
            <Link className="text-link" href="/app/children">
              cadastre uma criança →
            </Link>
          </p>
        ) : !d.subjects.length ? (
          <p>
            Primeiro,{" "}
            <Link className="text-link" href="/app/subjects">
              cadastre uma matéria →
            </Link>
          </p>
        ) : a && !["pending", "rejected"].includes(a.status) ? (
          <p>Atividades enviadas ou concluídas não podem ser editadas.</p>
        ) : (
          <ActivityForm
            children={d.children}
            subjects={d.subjects}
            activity={a}
          />
        )}
      </Card>
    </>
  );
}
