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
