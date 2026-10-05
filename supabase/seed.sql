-- Optional development fixture. Run after schema.sql. The UI invokes seed_demo()
-- as the signed-in parent; no service key or manually copied user ID is needed.
create or replace function public.seed_demo() returns void language plpgsql security definer set search_path='' as $$
declare fid uuid; cid uuid; math uuid; portuguese uuid; english uuid;
begin
  if auth.uid() is null or public.kid_id() is not null then raise exception 'Acesso não permitido.'; end if;
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
  if exists(select 1 from public.families where owner_id=auth.uid()) then raise exception 'Os exemplos só podem ser criados em uma conta sem família.'; end if;
  fid:=public.create_family('Família Silva');
  insert into public.children(family_id,name,avatar) values(fid,'Lucas','🦊') returning id into cid;
  insert into public.subjects(family_id,name,icon,color) values(fid,'Matemática','🔢','#6d5ce7') returning id into math;
  insert into public.subjects(family_id,name,icon,color) values(fid,'Português','📖','#d99a40') returning id into portuguese;
  insert into public.subjects(family_id,name,icon,color) values(fid,'Ciências','🔬','#43886b');
  insert into public.subjects(family_id,name,icon,color) values(fid,'Inglês','🌎','#537bc1') returning id into english;
  insert into public.activities(family_id,child_id,subject_id,title,points,requires_approval) values
    (fid,cid,math,'Resolver 10 questões de matemática',30,true),
    (fid,cid,portuguese,'Ler por 20 minutos',20,true),
    (fid,cid,english,'Revisar vocabulário de inglês',15,false);
  insert into public.rewards(family_id,name,points_cost) values(fid,'30 minutos de videogame',100),(fid,'Escolher o filme da noite',250),(fid,'Lanche favorito',400);
end $$;
revoke execute on function public.seed_demo() from public,anon;
grant execute on function public.seed_demo() to authenticated;
