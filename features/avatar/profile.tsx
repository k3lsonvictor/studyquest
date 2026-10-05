import { avatarData } from "@/services/avatar";
import { Card, Empty } from "@/components/ui";
import { AvatarStudio } from "./avatar-studio";

export async function AvatarProfile({
  childId,
  name,
  balance,
}: {
  childId: string;
  name: string;
  balance: number;
}) {
  const data = await avatarData(childId);
  if (!data)
    return (
      <Card>
        <h2>Meu avatar</h2>
        <Empty>
          A personalização ainda não está disponível. Tente novamente mais
          tarde.
        </Empty>
      </Card>
    );
  return (
    <AvatarStudio data={data} childId={childId} name={name} balance={balance} />
  );
}
