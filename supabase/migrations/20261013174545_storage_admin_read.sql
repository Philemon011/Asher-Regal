-- L'admin peut lire (et donc lister) les fichiers des produits.
-- Les visiteurs continuent de voir les images par leur adresse publique,
-- mais ne peuvent pas lister le contenu du stockage.
create policy "Admin lit les fichiers produit"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'product-images' and (select public.is_admin()));