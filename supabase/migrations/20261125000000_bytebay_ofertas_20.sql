-- Byte Bay · 20 ofertas del plan comercial, vigentes del 25/11/2026 al 02/12/2026.
-- Idempotente: si la ventana ya existe, se actualiza en lugar de duplicarla.

insert into public.ofertas_producto
  (id_producto, nombre, precio_oferta, inicia_en, termina_en, limite_existencias, activa, creado_en, actualizado_en)
values
  (75,   $bb$Oferta 12% - Gimnasio de Actividades Fisher-Price$bb$,       201.52, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (17,   $bb$Oferta 20% - Set LEGO City Bomberos 60375$bb$,               143.20, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (183,  $bb$Oferta 12% - Sierra Caladora Bosch GST 700$bb$,              351.12, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (164,  $bb$Oferta 20% - Balón Spalding NBA Silver Size 7$bb$,           119.20, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (150,  $bb$Oferta 15% - Bloques Apilables Fisher-Price$bb$,              58.65, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (93,   $bb$Oferta 10% - Taladro Atornillador Bosch GSR 18V-60$bb$,      629.10, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (70,   $bb$Oferta 12% - Freidora de Aire Ninja Pro 4 L$bb$,             307.12, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (1292, $bb$Oferta 20% - Cama de madera Annibale Colombo$bb$,          4239.92, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (59,   $bb$Oferta 15% - Balón Spalding TF-1000 Precision Size 7$bb$,   211.65, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (1320, $bb$Oferta 15% - Samsung Galaxy S7$bb$,                         713.91, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (284,  $bb$Oferta 12% - Balón Spalding Outdoor Size 7$bb$,              87.12, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (24,   $bb$Oferta 12% - Smart TV Samsung Crystal UHD 4K 55" DU7000$bb$, 1671.12, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (20,   $bb$Oferta 15% - Sartén Tefal Extra 20 cm$bb$,                   67.15, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (62,   $bb$Oferta 10% - Set LEGO Technic Auto 42140$bb$,               314.10, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (147,  $bb$Oferta 10% - Zapatillas Adidas Gazelle Verdes$bb$,          359.10, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (155,  $bb$Oferta 20% - Sartén Tefal Day by Day 22 cm$bb$,              71.20, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (1266, $bb$Oferta 10% - Vestido azul para mujer$bb$,                    76.41, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (1326, $bb$Oferta 15% - Tablet Samsung Galaxy Tab S8+ Gris$bb$,       1444.91, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (18,   $bb$Oferta 15% - Taladro Percutor Bosch GSB 13 RE 650 W$bb$,    254.15, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now()),
  (1305, $bb$Oferta 15% - Cocina eléctrica de dos hornillas$bb$,         118.92, '2026-11-25T00:00:00Z', '2026-12-02T00:00:00Z', 50, true, now(), now())
on conflict (id_producto, inicia_en) do update set
  nombre = excluded.nombre,
  precio_oferta = excluded.precio_oferta,
  termina_en = excluded.termina_en,
  limite_existencias = excluded.limite_existencias,
  activa = true,
  actualizado_en = now();
