-- =====================================================================
-- Beauty Tasha Salón — Datos iniciales (seed)
-- =====================================================================

-- Horarios de atención por defecto (Lun-Sáb 9-19:30, Domingo cerrado)
insert into business_hours (day_of_week, is_open, morning_open, morning_close, afternoon_open, afternoon_close, evening_open, evening_close)
values
  (0, false, null, null, null, null, null, null),                                      -- Domingo: cerrado
  (1, true, '09:00', '12:00', '13:00', '17:00', '18:00', '19:30'),                      -- Lunes
  (2, true, '09:00', '12:00', '13:00', '17:00', '18:00', '19:30'),                      -- Martes
  (3, true, '09:00', '12:00', '13:00', '17:00', '18:00', '19:30'),                      -- Miércoles
  (4, true, '09:00', '12:00', '13:00', '17:00', '18:00', '19:30'),                      -- Jueves
  (5, true, '09:00', '12:00', '13:00', '17:00', '18:00', '19:30'),                      -- Viernes
  (6, true, '09:00', '12:00', '13:00', '17:00', null, null);                            -- Sábado (sin noche)

-- Servicios iniciales (los 11 que ya tenemos en lib/services.ts)
insert into services (slug, name, category, price, duration_minutes, short_description, long_description, images, featured, sort_order) values
  (
    'manicure', 'Manicure', 'manicure', 8000, 45,
    'Manicure clásica para mantener tus uñas saludables y elegantes.',
    'Incluye limado, cuidado de cutícula, hidratación y esmaltado tradicional. La opción perfecta para un cuidado regular impecable.',
    array['https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400','https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400','https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=400'],
    false, 10
  ),
  (
    'pedicure', 'Pedicure', 'pedicure', 10000, 60,
    'Pedicure clásica con limado, cuidado de cutícula y esmaltado.',
    'Tratamiento completo para tus pies: exfoliación suave, limado, cuidado de cutícula, hidratación y esmaltado tradicional.',
    array['https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=400','https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=400'],
    false, 20
  ),
  (
    'manicure-spa', 'Manicure Spa', 'spa', 12000, 60,
    'Experiencia spa premium para tus manos. Relajación total.',
    'Manicure completo + exfoliación con sales, masaje relajante con aceites esenciales, mascarilla hidratante y parafina. Para mimar tus manos.',
    array['https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=400','https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400'],
    true, 30
  ),
  (
    'pedicure-spa', 'Pedicure Spa', 'spa', 15000, 75,
    'Ritual de relajación profunda para tus pies cansados.',
    'Pedicure completo + remojo con sales aromáticas, exfoliación profunda, mascarilla nutritiva, masaje con piedras y parafina hidratante.',
    array['https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=400','https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=400'],
    true, 40
  ),
  (
    'semipermanente', 'Esmaltado Semipermanente', 'semipermanente', 12000, 60,
    'Manos o pies. Brillo y color que dura hasta 3 semanas.',
    'Esmaltado semipermanente de larga duración con acabado brillante. Mantén tus uñas perfectas hasta 3 semanas sin retoques.',
    array['https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400','https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400'],
    false, 50
  ),
  (
    'rubber-base', 'Semipermanente + Rubber Base', 'semipermanente', 14000, 75,
    'Mayor resistencia y flexibilidad. Ideal para uñas frágiles.',
    'Semipermanente con base de goma reforzada que aporta flexibilidad y dureza. Perfecto para uñas delgadas o que se rompen fácilmente.',
    array['https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400','https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400'],
    false, 60
  ),
  (
    'gel-calcio', 'Semipermanente + Gel Calcio', 'semipermanente', 15000, 75,
    'Fortalece y nutre la uña natural mientras luce hermosa.',
    'Tratamiento con gel de calcio que fortalece la uña natural mientras aporta brillo y color duradero. Ideal para recuperar la salud de tus uñas.',
    array['https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400','https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=400'],
    false, 70
  ),
  (
    'luminary', 'Semipermanente + Luminary', 'semipermanente', 16000, 90,
    'Acabado luminoso con tecnología de última generación.',
    'Sistema Luminary que combina la durabilidad del gel con un acabado luminoso espectacular. Tu look más radiante.',
    array['https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400','https://images.unsplash.com/photo-1571290274554-6a2eaa771e5f?w=400'],
    true, 80
  ),
  (
    'gel-x', 'Set de Gel X', 'extensiones', 20000, 120,
    'Extensiones premium pre-formadas. Sin daño a tu uña natural.',
    'Sistema de extensiones Gel X con tips suaves y flexibles que se adhieren con gel curado en UV. Resultado natural, resistente y sin daño.',
    array['https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=400','https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=400'],
    true, 90
  ),
  (
    'polly-gel', 'Polly Gel (uña natural)', 'extensiones', 18000, 105,
    'Recubrimiento ligero y resistente sobre tu uña natural.',
    'Aplicación de Polly Gel que refuerza y embellece la uña natural sin extensión. Resistente, flexible y de larga duración.',
    array['https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400','https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400'],
    false, 100
  ),
  (
    'mini-ninas', 'Mini Manicura Niñas', 'ninas', 5000, 30,
    'Experiencia divertida y delicada para las princesas de casa.',
    'Mini manicura suave con esmaltes seguros y libres de tóxicos para niñas. Incluye limado, brillo y diseño simple a elección.',
    array['https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=400','https://images.unsplash.com/photo-1571290274554-6a2eaa771e5f?w=400'],
    false, 110
  );

-- Galería inicial
insert into gallery (image_url, alt_text, sort_order) values
  ('https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800', 'Diseño de uñas elegante', 10),
  ('https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=800', 'Manicure rosa pastel', 20),
  ('https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=800', 'Uñas con acabado brillante', 30),
  ('https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800', 'Pedicure con flores', 40),
  ('https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=800', 'Manicure spa', 50),
  ('https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=800', 'Pedicure con detalles', 60),
  ('https://images.unsplash.com/photo-1612817288484-6f916006741a?w=800', 'Diseño semipermanente', 70),
  ('https://images.unsplash.com/photo-1571290274554-6a2eaa771e5f?w=800', 'Uñas con diseño artístico', 80);

-- Testimonios iniciales (visibles)
insert into testimonials (customer_name, customer_role, customer_avatar, rating, text, visible, sort_order) values
  ('María Rodríguez', 'Clienta hace 2 años', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200', 5,
    'El mejor lugar para hacerte las uñas en San José. Tasha es una artista y el ambiente es súper relajante. ¡Mi cita favorita del mes!',
    true, 10),
  ('Andrea Jiménez', 'Clienta nueva', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200', 5,
    'Probé el Gel X y quedé fascinada. Llevo 3 semanas y siguen impecables. Calidad premium a precio justo. 100% recomendado.',
    true, 20),
  ('Sofía Vargas', 'Clienta fiel', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', 5,
    'El pedicure spa es una experiencia completa. Salí sintiéndome renovada. Tasha pone atención a cada detalle. Una belleza.',
    true, 30);

-- Site settings iniciales (CMS lite)
insert into site_settings (key, value) values
  ('contact', '{"phone": "+506 8888-8888", "whatsapp": "+50688888888", "email": "hola@beautytashasalon.com", "address": "San José, Costa Rica", "instagram": "", "facebook": "", "google_maps_url": ""}'::jsonb),
  ('hero', '{"badge": "Nail Studio Premium · Costa Rica", "title_part1": "El arte de unas", "title_part2": "uñas perfectas", "description": "En Beauty Tasha Salón cuidamos cada detalle. Manicure, pedicure y diseños únicos en un ambiente elegante y relajante, hechos a tu medida.", "image_url": "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=80"}'::jsonb),
  ('about', '{"title_part1": "Pasión, técnica y un", "title_part2": "toque personal", "paragraph_1": "Beauty Tasha Salón nace de la pasión por el arte de las uñas y el deseo de crear un espacio donde cada clienta se sienta cuidada, escuchada y especial.", "paragraph_2": "Especializada en técnicas modernas como Gel X, Rubber Base y Luminary, Tasha combina precisión técnica con creatividad para lograr diseños únicos que reflejan tu personalidad.", "image_url": "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800", "quote": "Cada cliente es única y merece sentirse especial.", "stats": [{"label": "Clientas felices", "value": "200+"}, {"label": "Años de experiencia", "value": "5+"}, {"label": "Diseños únicos", "value": "1000+"}, {"label": "Reseñas 5★", "value": "98%"}]}'::jsonb);
