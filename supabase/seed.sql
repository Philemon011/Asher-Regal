-- DONNÉES D'EXEMPLE : développement uniquement.
-- Ne JAMAIS exécuter ce fichier sur la base de production.

insert into public.categories (name, slug, position)
values ('Gâteaux', 'gateaux', 1)
on conflict (slug) do nothing;

insert into public.products
  (category_id, name, slug, description, price, tint, is_published, is_available, position)
select
  (select id from public.categories where slug = 'gateaux'),
  v.name, v.slug, v.description, v.price, v.tint, true, v.is_available, v.position
from (values
  ('Gâteau chocolat', 'gateau-chocolat', 'Biscuit moelleux au cacao intense et ganache onctueuse.', 2000, 'rose', true, 1),
  ('Fraisier', 'fraisier', 'Crème légère à la vanille, fraises fraîches et génoise.', 2500, 'peach', true, 2),
  ('Red velvet', 'red-velvet', 'Biscuit rouge velouté et glaçage au fromage frais.', 2500, 'lavender', false, 3),
  ('Cake vanille', 'cake-vanille', 'Un classique doux et parfumé, parfait pour toutes les occasions.', 1500, 'sage', true, 4),
  ('Tarte citron meringuée', 'tarte-citron-meringuee', 'Crème de citron acidulée sous une meringue légère et dorée.', 3000, 'vanilla', true, 5)
) as v(name, slug, description, price, tint, is_available, position)
on conflict (slug) do nothing;

insert into public.product_images (product_id, storage_path, alt, position)
select p.id, v.path, v.alt, v.position
from (values
  ('gateau-chocolat', 'seed/1.png', 'Gâteau chocolat', 0),
  ('gateau-chocolat', 'seed/2.png', 'Gâteau chocolat, vue de côté', 1),
  ('fraisier', 'seed/2.png', 'Fraisier', 0),
  ('red-velvet', 'seed/3.png', 'Red velvet', 0),
  ('cake-vanille', 'seed/4.png', 'Cake vanille', 0),
  ('tarte-citron-meringuee', 'seed/5.png', 'Tarte citron meringuée', 0)
) as v(slug, path, alt, position)
join public.products p on p.slug = v.slug
where not exists (
  select 1 from public.product_images i
  where i.product_id = p.id and i.storage_path = v.path
);