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
