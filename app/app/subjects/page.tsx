import { redirect } from "next/navigation";
import { familyData } from "@/services/family";
import { PageTitle, Card, Feedback, Empty } from "@/components/ui";
import { SubjectForm } from "@/features/manage/forms";
export default async function Subjects({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const d = await familyData();
  if (!d.family) redirect("/onboarding");
  return (
    <>
      <PageTitle
        title="Um mundo para descobrir"
        description="Organize estudos, rotina, comportamento, educação e tarefas de casa."
      />
      <Feedback searchParams={searchParams} />
      <div className="grid-2">
        <Card>
          {d.subjects.length ? (
            d.subjects.map((s) => (
              <div key={s.id} className="list-item">
                <span
                  className="list-icon"
                  style={{ border: `2px solid ${s.color}` }}
                >
                  {s.icon}
                </span>
                <h3>{s.name}</h3>
              </div>
            ))
          ) : (
            <Empty>Cadastre sua primeira categoria ou matéria.</Empty>
          )}
        </Card>
        <Card>
          <SubjectForm familyId={d.family.id} />
        </Card>
      </div>
    </>
  );
}
