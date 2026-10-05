export type Child = {
  id: string;
  family_id: string;
  name: string;
  avatar: string;
};
export type Subject = { id: string; name: string; icon: string; color: string };
export type Activity = {
  id: string;
  child_id: string;
  subject_id: string;
  title: string;
  description: string;
  points: number;
  due_date: string | null;
  status: "pending" | "awaiting_approval" | "completed" | "rejected";
  requires_approval: boolean;
  completed_at: string | null;
};
export type Reward = {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  active: boolean;
};
export type Redemption = {
  id: string;
  child_id: string;
  reward_id: string;
  points_cost: number;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
};
export type Transaction = {
  id: string;
  child_id: string;
  amount: number;
  type: "activity" | "reward" | "adjustment" | "avatar";
  description: string;
  created_at: string;
};
export type Family = { id: string; name: string };
export type AvatarSlot = "shirt" | "pants" | "hat" | "accessory" | "hair";
export type AvatarStyle =
  | "hair_short"
  | "hair_long"
  | "hair_bob"
  | "hair_ponytail"
  | "solid"
  | "cap"
  | "crown"
  | "headphones"
  | "glasses"
  | "backpack";
export type AvatarItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  slot: AvatarSlot;
  style: AvatarStyle;
  color: string;
  points_cost: number;
  active: boolean;
  sort_order: number;
};
export type AvatarOwnedItem = {
  id: string;
  child_id: string;
  item_id: string;
  points_paid: number;
  purchased_at: string;
};
export type AvatarEquipment = {
  child_id: string;
  slot: AvatarSlot;
  item_id: string;
};
export type AvatarData = {
  catalog: AvatarItem[];
  owned: AvatarOwnedItem[];
  equipment: AvatarEquipment[];
};
export type AvatarAppearance = Partial<
  Record<AvatarSlot, Pick<AvatarItem, "style" | "color">>
>;
export type FamilyData = {
  family: Family | null;
  children: Child[];
  subjects: Subject[];
  activities: Activity[];
  rewards: Reward[];
  redemptions: Redemption[];
  transactions: Transaction[];
};
