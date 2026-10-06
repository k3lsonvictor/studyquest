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
