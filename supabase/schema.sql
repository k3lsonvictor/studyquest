-- StudyQuest: run once in a fresh Supabase project. All monetary-like point
-- operations run in one transaction, serialize on the child, and use a ledger.
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 100),
  email text not null, created_at timestamptz not null default now()
);
create table public.families (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null check(length(name) between 1 and 100),
  created_at timestamptz not null default now()
);
create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null check(length(name) between 1 and 100),
  avatar text not null default '🦊' check(length(avatar) between 1 and 20),
  created_at timestamptz not null default now(), unique(id, family_id)
);
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null check(length(name) between 1 and 100),
  icon text not null default '📚' check(length(icon) between 1 and 20),
  color text not null default '#6d5ce7' check(color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(), unique(id, family_id), unique(family_id,name)
);
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null, subject_id uuid not null,
  title text not null check(length(title) between 1 and 160),
  description text not null default '' check(length(description) <= 2000),
  points integer not null check(points between 1 and 100000), due_date date,
  status text not null default 'pending' check(status in ('pending','awaiting_approval','completed','rejected')),
  requires_approval boolean not null default true,
  created_at timestamptz not null default now(), completed_at timestamptz, approved_at timestamptz,
  foreign key(child_id,family_id) references public.children(id,family_id),
  foreign key(subject_id,family_id) references public.subjects(id,family_id)
);
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null check(length(name) between 1 and 160),
  description text not null default '' check(length(description) <= 2000),
  points_cost integer not null check(points_cost between 1 and 1000000),
  active boolean not null default true, created_at timestamptz not null default now(), unique(id,family_id)
);
create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null, reward_id uuid not null,
  points_cost integer not null check(points_cost > 0),
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  requested_at timestamptz not null default now(), approved_at timestamptz,
  foreign key(child_id,family_id) references public.children(id,family_id),
  foreign key(reward_id,family_id) references public.rewards(id,family_id)
);
create unique index one_pending_redemption on public.reward_redemptions(child_id,reward_id) where status='pending';
create table public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id),
  amount integer not null check(amount <> 0),
  type text not null check(type in ('activity','reward','adjustment')),
  description text not null, reference_id uuid not null,
  created_at timestamptz not null default now(), unique(type,reference_id),
  check((type='activity' and amount>0) or (type='reward' and amount<0) or type='adjustment')
);
-- No cached total_points: balance always comes from the immutable ledger.
create table public.session_modes (
  session_id uuid primary key, owner_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index children_family_idx on public.children(family_id);
create index activities_child_status_idx on public.activities(child_id,status);
create index activities_family_idx on public.activities(family_id);
create index activities_subject_idx on public.activities(subject_id);
create index redemptions_family_status_idx on public.reward_redemptions(family_id,status);
create index redemptions_reward_idx on public.reward_redemptions(reward_id);
create index ledger_child_date_idx on public.points_transactions(child_id,created_at desc);
create index session_modes_owner_idx on public.session_modes(owner_id);

create function public.kid_id() returns uuid language sql stable security definer set search_path='' as $$
  select child_id from public.session_modes where session_id=(auth.jwt()->>'session_id')::uuid and owner_id=auth.uid()
$$;
create function public.owns_family(fid uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.families where id=fid and owner_id=auth.uid())
$$;
create function public.is_parent(fid uuid) returns boolean language sql stable security definer set search_path='' as $$
  select public.owns_family(fid) and public.kid_id() is null
$$;
create function public.can_child(cid uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.children c where c.id=cid and public.owns_family(c.family_id) and (public.kid_id() is null or public.kid_id()=cid))
$$;

alter table public.users enable row level security;
alter table public.families enable row level security;
alter table public.children enable row level security;
alter table public.subjects enable row level security;
alter table public.activities enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.points_transactions enable row level security;
alter table public.session_modes enable row level security;

create policy users_read on public.users for select to authenticated using(id=auth.uid());
create policy family_read on public.families for select to authenticated using(owner_id=auth.uid());
create policy children_read on public.children for select to authenticated using(public.owns_family(family_id) and (public.kid_id() is null or public.kid_id()=id));
create policy children_create on public.children for insert to authenticated with check(public.is_parent(family_id));
create policy children_update on public.children for update to authenticated using(public.is_parent(family_id)) with check(public.is_parent(family_id));
create policy subjects_read on public.subjects for select to authenticated using(public.owns_family(family_id));
create policy subjects_create on public.subjects for insert to authenticated with check(public.is_parent(family_id));
create policy activities_read on public.activities for select to authenticated using(public.can_child(child_id));
create policy rewards_read on public.rewards for select to authenticated using(public.owns_family(family_id));
create policy rewards_create on public.rewards for insert to authenticated with check(public.is_parent(family_id));
create policy rewards_update on public.rewards for update to authenticated using(public.is_parent(family_id)) with check(public.is_parent(family_id));
create policy redemptions_read on public.reward_redemptions for select to authenticated using(public.can_child(child_id));
create policy ledger_read on public.points_transactions for select to authenticated using(public.can_child(child_id));
create policy mode_read on public.session_modes for select to authenticated using(owner_id=auth.uid() and session_id=(auth.jwt()->>'session_id')::uuid);

revoke all on public.users,public.families,public.children,public.subjects,public.activities,public.rewards,public.reward_redemptions,public.points_transactions,public.session_modes from anon,authenticated;
grant select on public.users,public.families,public.children,public.subjects,public.activities,public.rewards,public.reward_redemptions,public.points_transactions,public.session_modes to authenticated;
grant insert on public.children,public.subjects,public.rewards to authenticated;
grant update(name,avatar) on public.children to authenticated;
grant update(name,description,points_cost,active) on public.rewards to authenticated;

create function public.create_family(p_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare fid uuid;
begin
  if auth.uid() is null or public.kid_id() is not null then raise exception 'Acesso não permitido.'; end if;
  insert into public.users(id,name,email) select id,coalesce(nullif(raw_user_meta_data->>'name',''),'Responsável'),email from auth.users where id=auth.uid() on conflict(id) do nothing;
  insert into public.families(owner_id,name) values(auth.uid(),trim(p_name)) on conflict(owner_id) do nothing;
  select id into fid from public.families where owner_id=auth.uid();
  return fid;
end $$;

create function public.enter_kid(p_child uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  if public.kid_id() is not null or not public.can_child(p_child) or auth.jwt()->>'session_id' is null then raise exception 'Acesso não permitido.'; end if;
  insert into public.session_modes(session_id,owner_id,child_id) values((auth.jwt()->>'session_id')::uuid,auth.uid(),p_child);
end $$;

create function public.save_activity(p_id uuid,p_child uuid,p_subject uuid,p_title text,p_description text,p_points integer,p_due date,p_approval boolean) returns uuid language plpgsql security definer set search_path='' as $$
declare fid uuid; aid uuid;
begin
  select family_id into fid from public.children where id=p_child;
  if fid is null or not public.is_parent(fid) then raise exception 'Acesso não permitido.'; end if;
  if p_id is null then
    insert into public.activities(family_id,child_id,subject_id,title,description,points,due_date,requires_approval)
    values(fid,p_child,p_subject,trim(p_title),p_description,p_points,p_due,p_approval) returning id into aid;
  else
    update public.activities set child_id=p_child,subject_id=p_subject,title=trim(p_title),description=p_description,points=p_points,due_date=p_due,requires_approval=p_approval
    where id=p_id and family_id=fid and status in ('pending','rejected') returning id into aid;
    if aid is null then raise exception 'Somente atividades pendentes ou rejeitadas podem ser editadas.'; end if;
  end if;
  return aid;
end $$;

create function public.delete_activity(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
  delete from public.activities where id=p_id and public.is_parent(family_id) and status in ('pending','rejected');
  if not found then raise exception 'Somente atividades pendentes ou rejeitadas podem ser excluídas.'; end if;
end $$;

create function public.complete_activity(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare a public.activities;
begin
  select * into a from public.activities where id=p_id for update;
  if a.id is null or not public.can_child(a.child_id) then raise exception 'Acesso não permitido.'; end if;
  if a.status not in ('pending','rejected') then raise exception 'Atividade já enviada ou concluída.'; end if;
  perform 1 from public.children where id=a.child_id for update;
  update public.activities set status=case when a.requires_approval then 'awaiting_approval' else 'completed' end,completed_at=now() where id=a.id;
  if not a.requires_approval then
    insert into public.points_transactions(child_id,amount,type,description,reference_id) values(a.child_id,a.points,'activity',a.title,a.id);
  end if;
end $$;

create function public.review_activity(p_id uuid,p_approve boolean) returns void language plpgsql security definer set search_path='' as $$
declare a public.activities;
begin
  select * into a from public.activities where id=p_id for update;
  if a.id is null or not public.is_parent(a.family_id) then raise exception 'Acesso não permitido.'; end if;
  if a.status <> 'awaiting_approval' then raise exception 'Esta atividade já foi analisada.'; end if;
  perform 1 from public.children where id=a.child_id for update;
  update public.activities set status=case when p_approve then 'completed' else 'rejected' end,approved_at=case when p_approve then now() else null end where id=a.id;
  if p_approve then
    insert into public.points_transactions(child_id,amount,type,description,reference_id) values(a.child_id,a.points,'activity',a.title,a.id);
  end if;
end $$;

create function public.request_reward(p_child uuid,p_reward uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare r public.rewards; fid uuid; balance bigint; rid uuid;
begin
  if not public.can_child(p_child) then raise exception 'Acesso não permitido.'; end if;
  select family_id into fid from public.children where id=p_child for update;
  select * into r from public.rewards where id=p_reward and family_id=fid for share;
  if r.id is null or not r.active then raise exception 'Recompensa indisponível.'; end if;
  select coalesce(sum(amount),0) into balance from public.points_transactions where child_id=p_child;
  if balance < r.points_cost then raise exception 'Pontos insuficientes.'; end if;
  insert into public.reward_redemptions(family_id,child_id,reward_id,points_cost) values(fid,p_child,r.id,r.points_cost) returning id into rid;
  return rid;
end $$;

create function public.review_reward(p_id uuid,p_approve boolean) returns void language plpgsql security definer set search_path='' as $$
declare r public.reward_redemptions; balance bigint; reward_name text;
begin
  select * into r from public.reward_redemptions where id=p_id for update;
  if r.id is null or not public.is_parent(r.family_id) then raise exception 'Acesso não permitido.'; end if;
  if r.status <> 'pending' then raise exception 'Esta solicitação já foi analisada.'; end if;
  perform 1 from public.children where id=r.child_id for update;
  if p_approve then
    select coalesce(sum(amount),0) into balance from public.points_transactions where child_id=r.child_id;
    if balance < r.points_cost then raise exception 'Saldo insuficiente para aprovar este resgate.'; end if;
    select name into reward_name from public.rewards where id=r.reward_id;
    insert into public.points_transactions(child_id,amount,type,description,reference_id) values(r.child_id,-r.points_cost,'reward',reward_name,r.id);
  end if;
  update public.reward_redemptions set status=case when p_approve then 'approved' else 'rejected' end,approved_at=case when p_approve then now() else null end where id=r.id;
end $$;

-- Functions are not executable by anonymous users, including SECURITY DEFINER RPCs.
revoke execute on function public.kid_id(),public.owns_family(uuid),public.is_parent(uuid),public.can_child(uuid),public.create_family(text),public.enter_kid(uuid),public.save_activity(uuid,uuid,uuid,text,text,integer,date,boolean),public.delete_activity(uuid),public.complete_activity(uuid),public.review_activity(uuid,boolean),public.request_reward(uuid,uuid),public.review_reward(uuid,boolean) from public,anon;
grant execute on function public.kid_id(),public.owns_family(uuid),public.is_parent(uuid),public.can_child(uuid),public.create_family(text),public.enter_kid(uuid),public.save_activity(uuid,uuid,uuid,text,text,integer,date,boolean),public.delete_activity(uuid),public.complete_activity(uuid),public.review_activity(uuid,boolean),public.request_reward(uuid,uuid),public.review_reward(uuid,boolean) to authenticated;

-- Avatar shop extension (202610030001).
-- Existing projects: run ONLY this migration once in the Supabase SQL Editor.
-- The catalog is shared, but inventory/equipment are private to each child.
begin;

alter table public.points_transactions drop constraint points_transactions_type_check;
alter table public.points_transactions drop constraint points_transactions_check;
alter table public.points_transactions add constraint points_transactions_type_check
  check(type in ('activity','reward','adjustment','avatar'));
alter table public.points_transactions add constraint points_transactions_check
  check((type='activity' and amount>0) or (type in ('reward','avatar') and amount<0) or type='adjustment');

create table public.avatar_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null check(length(name) between 1 and 100),
  description text not null check(length(description)<=300),
  slot text not null check(slot in ('shirt','pants','hat','accessory')),
  style text not null check(style in ('solid','cap','crown','headphones','glasses','backpack')),
  color text not null check(color ~ '^#[0-9a-fA-F]{6}$'),
  points_cost integer not null check(points_cost between 1 and 100000),
  active boolean not null default true,
  sort_order integer not null default 0,
  unique(id,slot),
  check((slot in ('shirt','pants') and style='solid') or
    (slot='hat' and style in ('cap','crown','headphones')) or
    (slot='accessory' and style in ('glasses','backpack')))
);
create table public.child_avatar_items (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id),
  item_id uuid not null references public.avatar_items(id),
  points_paid integer not null check(points_paid>0),
  purchased_at timestamptz not null default now(),
  unique(child_id,item_id)
);
create table public.child_avatar_equipment (
  child_id uuid not null references public.children(id),
  slot text not null,
  item_id uuid not null,
  updated_at timestamptz not null default now(),
  primary key(child_id,slot),
  foreign key(item_id,slot) references public.avatar_items(id,slot),
  foreign key(child_id,item_id) references public.child_avatar_items(child_id,item_id)
);
create index child_avatar_items_item_idx on public.child_avatar_items(item_id);
create index child_avatar_equipment_item_idx on public.child_avatar_equipment(item_id,slot);
create index child_avatar_equipment_owned_idx on public.child_avatar_equipment(child_id,item_id);

alter table public.avatar_items enable row level security;
alter table public.child_avatar_items enable row level security;
alter table public.child_avatar_equipment enable row level security;
create policy avatar_catalog_read on public.avatar_items for select to authenticated using(true);
create policy avatar_inventory_read on public.child_avatar_items for select to authenticated using(public.can_child(child_id));
create policy avatar_equipment_read on public.child_avatar_equipment for select to authenticated using(public.can_child(child_id));
revoke all on public.avatar_items,public.child_avatar_items,public.child_avatar_equipment from anon,authenticated;
grant select on public.avatar_items,public.child_avatar_items,public.child_avatar_equipment to authenticated;

create function public.buy_avatar_item(p_child uuid,p_item uuid) returns void
language plpgsql security definer set search_path='' as $$
declare item public.avatar_items; available_points bigint; purchase_id uuid;
begin
  if not public.can_child(p_child) then raise exception 'Acesso não permitido.'; end if;
  -- Same lock as reward approvals and activity credits: never overspend.
  perform 1 from public.children where id=p_child for update;
  select * into item from public.avatar_items where id=p_item for share;
  if item.id is null or not item.active then raise exception 'Este item não está disponível.'; end if;
  if exists(select 1 from public.child_avatar_items where child_id=p_child and item_id=p_item)
    then raise exception 'Você já tem este item. Pode equipá-lo sem gastar pontos.'; end if;
  select coalesce(sum(amount),0) into available_points from public.points_transactions where child_id=p_child;
  if available_points<item.points_cost then raise exception 'Pontos insuficientes para comprar este item.'; end if;
  insert into public.child_avatar_items(child_id,item_id,points_paid) values(p_child,item.id,item.points_cost) returning id into purchase_id;
  insert into public.points_transactions(child_id,amount,type,description,reference_id)
    values(p_child,-item.points_cost,'avatar','Avatar: ' || item.name,purchase_id);
  insert into public.child_avatar_equipment(child_id,slot,item_id) values(p_child,item.slot,item.id)
    on conflict(child_id,slot) do update set item_id=excluded.item_id,updated_at=now();
end $$;

create function public.equip_avatar_item(p_child uuid,p_slot text,p_item uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.can_child(p_child) then raise exception 'Acesso não permitido.'; end if;
  if p_slot is null or p_slot not in ('shirt','pants','hat','accessory') then raise exception 'Categoria inválida.'; end if;
  perform 1 from public.children where id=p_child for update;
  -- Defaults are free and always available; clearing never deletes inventory.
  if p_item is null then
    delete from public.child_avatar_equipment where child_id=p_child and slot=p_slot;
    return;
  end if;
  if not exists(select 1 from public.child_avatar_items owned join public.avatar_items item on item.id=owned.item_id
    where owned.child_id=p_child and item.id=p_item and item.slot=p_slot)
    then raise exception 'Você precisa ter este item para equipá-lo nesta categoria.'; end if;
  insert into public.child_avatar_equipment(child_id,slot,item_id) values(p_child,p_slot,p_item)
    on conflict(child_id,slot) do update set item_id=excluded.item_id,updated_at=now();
end $$;

revoke execute on function public.buy_avatar_item(uuid,uuid),public.equip_avatar_item(uuid,text,uuid) from public,anon;
grant execute on function public.buy_avatar_item(uuid,uuid),public.equip_avatar_item(uuid,text,uuid) to authenticated;

insert into public.avatar_items(slug,name,description,slot,style,color,points_cost,sort_order) values
 ('shirt-ocean','Camiseta Oceano','Um azul para descobrir novos caminhos.','shirt','solid','#32a9c7',15,1),
 ('shirt-sunset','Camiseta Pôr do Sol','Um toque de laranja para a sua próxima aventura.','shirt','solid','#f68a58',20,2),
 ('shirt-forest','Camiseta Floresta','Verde para quem não para de explorar.','shirt','solid','#43a77e',20,3),
 ('pants-lilac','Calça Lilás','Um visual cheio de personalidade.','pants','solid','#a79be5',15,4),
 ('pants-sand','Calça Areia','Pronta para qualquer descoberta.','pants','solid','#dcb67f',20,5),
 ('cap-explorer','Boné Explorador','Seu novo companheiro de missões.','hat','cap','#4586dc',30,6),
 ('headphones-beat','Fone Ritmo','Entre no ritmo das suas conquistas.','hat','headphones','#a188ed',45,7),
 ('crown-star','Coroa Estelar','Uma conquista que merece brilhar.','hat','crown','#f6bd4f',80,8),
 ('glasses-sun','Óculos Solar','Um olhar diferente para o mundo.','accessory','glasses','#33415c',25,9),
 ('backpack-adventure','Mochila Aventura','Leve suas descobertas com você.','accessory','backpack','#f09562',50,10);

commit;

-- Run after 202610030001_avatar_shop.sql. Preserves existing inventory and points.
begin;
alter table public.avatar_items drop constraint avatar_items_slot_check;
alter table public.avatar_items drop constraint avatar_items_style_check;
alter table public.avatar_items drop constraint avatar_items_check;
alter table public.avatar_items add constraint avatar_items_slot_check check(slot in ('shirt','pants','hat','accessory','hair'));
alter table public.avatar_items add constraint avatar_items_style_check check(style in ('solid','cap','crown','headphones','glasses','backpack','hair_short','hair_long','hair_bob','hair_ponytail'));
alter table public.avatar_items add constraint avatar_items_check check(
 (slot in ('shirt','pants') and style='solid') or
 (slot='hat' and style in ('cap','crown','headphones')) or
 (slot='accessory' and style in ('glasses','backpack')) or
 (slot='hair' and style in ('hair_short','hair_long','hair_bob','hair_ponytail')));
create or replace function public.equip_avatar_item(p_child uuid,p_slot text,p_item uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.can_child(p_child) then raise exception 'Acesso não permitido.'; end if;
  if p_slot is null or p_slot not in ('shirt','pants','hat','accessory','hair') then raise exception 'Categoria inválida.'; end if;
  perform 1 from public.children where id=p_child for update;
  -- Defaults are free and always available; clearing never deletes inventory.
  if p_item is null then
    delete from public.child_avatar_equipment where child_id=p_child and slot=p_slot;
    return;
  end if;
  if not exists(select 1 from public.child_avatar_items owned join public.avatar_items item on item.id=owned.item_id
    where owned.child_id=p_child and item.id=p_item and item.slot=p_slot)
    then raise exception 'Você precisa ter este item para equipá-lo nesta categoria.'; end if;
  insert into public.child_avatar_equipment(child_id,slot,item_id) values(p_child,p_slot,p_item)
    on conflict(child_id,slot) do update set item_id=excluded.item_id,updated_at=now();
end $$;


insert into public.avatar_items(slug,name,description,slot,style,color,points_cost,sort_order) values
 ('hair-long-brown','Cabelo longo castanho','Fios compridos para criar o seu visual.','hair','hair_long','#51413f',15,11),
 ('hair-long-blonde','Cabelo longo dourado','Um toque dourado em fios compridos.','hair','hair_long','#d7a653',20,12),
 ('hair-bob-black','Cabelo chanel preto','Corte na altura do queixo.','hair','hair_bob','#292638',15,13),
 ('hair-ponytail-auburn','Rabo de cavalo ruivo','Cabelo preso com um laço lilás.','hair','hair_ponytail','#a45235',20,14),
 ('hair-short-blue','Cabelo curto azul','Uma cor divertida para seu cabelo.','hair','hair_short','#468cbe',15,15);
commit;

-- Existing projects: run this migration in the Supabase SQL Editor.
begin;
create function public.deduct_points(p_child uuid,p_amount integer,p_reason text,p_request uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare fid uuid; available bigint; tid uuid; previous public.points_transactions;
begin
  select family_id into fid from public.children where id=p_child for update;
  if fid is null or not public.is_parent(fid) then raise exception 'Acesso não permitido.'; end if;
  if p_amount is null or p_amount not between 1 and 100000 or p_reason is null or length(trim(p_reason)) not between 1 and 500 or p_request is null then
    raise exception 'Informe pontos válidos e um motivo de até 500 caracteres.';
  end if;
  select * into previous from public.points_transactions where type='adjustment' and reference_id=p_request;
  if found then
    if previous.child_id<>p_child or previous.amount<>-p_amount or previous.description<>trim(p_reason) then
      raise exception 'Este desconto já foi registrado com outros dados.';
    end if;
    return previous.id;
  end if;
  select coalesce(sum(amount),0) into available from public.points_transactions where child_id=p_child;
  if available<p_amount then raise exception 'O desconto não pode ultrapassar o saldo disponível.'; end if;
  insert into public.points_transactions(child_id,amount,type,description,reference_id)
    values(p_child,-p_amount,'adjustment',trim(p_reason),p_request) returning id into tid;
  return tid;
end $$;
revoke all on function public.deduct_points(uuid,integer,text,uuid) from public,anon;
grant execute on function public.deduct_points(uuid,integer,text,uuid) to authenticated;
commit;
