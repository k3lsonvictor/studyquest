import { redirect } from "next/navigation";
import { familyData } from "@/services/family";
import { balanceOf } from "@/lib/format";
import { PageTitle, Card, Feedback, Empty } from "@/components/ui";
import { ChildCard } from "@/features/children/summary";
import { ChildForm } from "@/features/manage/forms";
export default async function Children({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const d = await familyData();
  if (!d.family) redirect("/onboarding");
  return (
    <>
      <PageTitle
        title="Nossos aventureiros"
        description="Cada criança tem seu próprio ritmo e suas próprias conquistas."
      />
      <Feedback searchParams={searchParams} />
      <div className="dashboard-grid">
        <div>
          {d.children.length ? (
            <div className="grid-2">
              {d.children.map((c) => (
                <ChildCard
                  key={c.id}
                  child={c}
                  balance={balanceOf(d.transactions, c.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <Empty>Vamos criar sua primeira criança.</Empty>
            </Card>
          )}
        </div>
        <Card>
          <ChildForm familyId={d.family.id} />
        </Card>
      </div>
    </>
  );
}
