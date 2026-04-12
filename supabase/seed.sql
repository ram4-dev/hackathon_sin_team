-- Seed data for BuilderMap MVP
-- Run this after creating tables to have demo content

-- ============================================================
-- MOCK AUTH USERS (required for profiles FK constraint)
-- ============================================================
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
) VALUES
  ('a1000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'lucas.martinez@example.com', '$2a$10$PID3DaFakeHashedPasswordPadding', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'sofia.gonzalez@example.com', '$2a$10$PID3DaFakeHashedPasswordPadding', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'martin.rodriguez@example.com', '$2a$10$PID3DaFakeHashedPasswordPadding', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'valentina.lopez@example.com', '$2a$10$PID3DaFakeHashedPasswordPadding', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'nicolas.fernandez@example.com', '$2a$10$PID3DaFakeHashedPasswordPadding', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'camila.perez@example.com', '$2a$10$PID3DaFakeHashedPasswordPadding', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'andres.garcia@example.com', '$2a$10$PID3DaFakeHashedPasswordPadding', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'florencia.sanchez@example.com', '$2a$10$PID3DaFakeHashedPasswordPadding', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000', 'mateo.ramirez@example.com', '$2a$10$PID3DaFakeHashedPasswordPadding', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000000', 'agustina.torres@example.com', '$2a$10$PID3DaFakeHashedPasswordPadding', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000000', 'ignacio.vargas@example.com', '$2a$10$PID3DaFakeHashedPasswordPadding', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000000', 'julieta.morales@example.com', '$2a$10$PID3DaFakeHashedPasswordPadding', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- MOCK BUILDER PROFILES — Buenos Aires
-- ============================================================
INSERT INTO profiles (
  id, username, full_name, bio, location_city, location_country,
  location_lat, location_lng, stack, roles, status, modality,
  github_url, linkedin_url, x_url, website_url, email_contact,
  avatar_url
) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  'lucasmdev', 'Lucas Martínez',
  'Full-stack dev con 5 años de experiencia. Apasionado por Web3 y DeFi. Busco equipo para hackathons de blockchain.',
  'Buenos Aires', 'Argentina', -34.5973, -58.3731,
  ARRAY['TypeScript', 'React', 'Node.js', 'Solidity', 'Ethers.js'],
  ARRAY['frontend', 'fullstack'],
  'looking_for_team', 'in-person',
  'https://github.com/lucasmdev', 'https://linkedin.com/in/lucasmdev', NULL, NULL,
  'lucas.martinez@example.com',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=lucasmdev'
),
(
  'a1000000-0000-0000-0000-000000000002',
  'sofiagonzalez', 'Sofía González',
  'Diseñadora UX/UI y frontend developer. Me interesa crear productos que tengan impacto social. Hackathons de salud y educación.',
  'Buenos Aires', 'Argentina', -34.6140, -58.4340,
  ARRAY['Figma', 'React', 'CSS', 'Next.js', 'Tailwind'],
  ARRAY['frontend', 'design'],
  'available', 'both',
  'https://github.com/sofgonzalez', 'https://linkedin.com/in/sofiagonzalez',
  'https://x.com/sofiagdev', 'https://sofigonzalez.design',
  'sofia.gonzalez@example.com',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=sofiagonzalez'
),
(
  'a1000000-0000-0000-0000-000000000003',
  'martinrod', 'Martín Rodríguez',
  'Ingeniero de datos y ML. Especialista en modelos de lenguaje y computer vision. Busco proyectos con impacto real.',
  'Buenos Aires', 'Argentina', -34.5890, -58.3960,
  ARRAY['Python', 'PyTorch', 'TensorFlow', 'FastAPI', 'PostgreSQL'],
  ARRAY['backend', 'ml_ai'],
  'available', 'remote',
  'https://github.com/martinrod', 'https://linkedin.com/in/martinrodriguez', NULL, NULL,
  'martin.rodriguez@example.com',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=martinrod'
),
(
  'a1000000-0000-0000-0000-000000000004',
  'vlopez_dev', 'Valentina López',
  'Mobile developer iOS/Android. Creé 3 apps con más de 10k usuarios. Interesada en FinTech y healthtech para LATAM.',
  'Buenos Aires', 'Argentina', -34.6250, -58.4044,
  ARRAY['Swift', 'Kotlin', 'React Native', 'Firebase'],
  ARRAY['mobile', 'fullstack'],
  'available', 'in-person',
  'https://github.com/vlopezdev', NULL, 'https://x.com/vlopezdev', NULL,
  'valentina.lopez@example.com',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=vlopez'
),
(
  'a1000000-0000-0000-0000-000000000005',
  'nicofernandez', 'Nicolás Fernández',
  'Blockchain developer. Contribuyo a varios proyectos open source de Ethereum. Ganador de ETHGlobal 2024.',
  'Buenos Aires', 'Argentina', -34.6083, -58.3699,
  ARRAY['Solidity', 'Rust', 'TypeScript', 'Hardhat', 'IPFS'],
  ARRAY['blockchain', 'backend', 'fullstack'],
  'looking_for_team', 'in-person',
  'https://github.com/nicofernandez', 'https://linkedin.com/in/nicofernandez',
  'https://x.com/nicofernandez', 'https://nicofernandez.dev',
  NULL,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=nicofernandez'
),
(
  'a1000000-0000-0000-0000-000000000006',
  'camilaperez', 'Camila Pérez',
  'Backend engineer enfocada en sistemas distribuidos y APIs. Experiencia en startups de fintech y logística.',
  'Buenos Aires', 'Argentina', -34.6018, -58.4197,
  ARRAY['Go', 'Rust', 'PostgreSQL', 'Redis', 'Kubernetes'],
  ARRAY['backend', 'devops'],
  'networking', 'both',
  'https://github.com/camilaperez', 'https://linkedin.com/in/camilaperez', NULL, NULL,
  'camila.perez@example.com',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=camilaperez'
),
(
  'a1000000-0000-0000-0000-000000000007',
  'andresg', 'Andrés García',
  'Game developer indie. Trabajo con Unity y Godot. Fanático de los game jams y el pixel art. 5 juegos publicados.',
  'Buenos Aires', 'Argentina', -34.5755, -58.4280,
  ARRAY['Unity', 'C#', 'Godot', 'GDScript', 'Blender'],
  ARRAY['other'],
  'available', 'in-person',
  'https://github.com/andresg', NULL, 'https://x.com/andresgdev', 'https://andresgames.itch.io',
  NULL,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=andresg'
),
(
  'a1000000-0000-0000-0000-000000000008',
  'florisanchez', 'Florencia Sánchez',
  'Product manager técnica con background en desarrollo. Lidero equipos en hackathons y llevo 3 proyectos a fase seed.',
  'Buenos Aires', 'Argentina', -34.6317, -58.3891,
  ARRAY['Product Strategy', 'Figma', 'SQL', 'Python'],
  ARRAY['product', 'design'],
  'looking_for_team', 'both',
  'https://github.com/florisanchez', 'https://linkedin.com/in/floriciasanchez',
  NULL, NULL,
  'florencia.sanchez@example.com',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=florisanchez'
),
(
  'a1000000-0000-0000-0000-000000000009',
  'mateoramirez', 'Mateo Ramírez',
  'DevOps y cloud architect. Experto en AWS y GCP. Me interesan los proyectos de infraestructura open source.',
  'Buenos Aires', 'Argentina', -34.5876, -58.4150,
  ARRAY['AWS', 'GCP', 'Terraform', 'Docker', 'Python'],
  ARRAY['devops', 'backend'],
  'available', 'remote',
  'https://github.com/mateoramirez', 'https://linkedin.com/in/mateoramirez', NULL, NULL,
  NULL,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=mateoramirez'
),
(
  'a1000000-0000-0000-0000-000000000010',
  'agustinatorres', 'Agustina Torres',
  'Full-stack developer especializada en EdTech. Creo plataformas de aprendizaje accesibles e inclusivas.',
  'Buenos Aires', 'Argentina', -34.6099, -58.3561,
  ARRAY['Vue.js', 'Laravel', 'MySQL', 'TypeScript'],
  ARRAY['frontend', 'fullstack'],
  'available', 'both',
  'https://github.com/agustinatorres', 'https://linkedin.com/in/agustinatorres',
  'https://x.com/agustinatorres', NULL,
  'agustina.torres@example.com',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=agustinatorres'
),
(
  'a1000000-0000-0000-0000-000000000011',
  'ignavargas', 'Ignacio Vargas',
  'Security researcher y pentester. Especialista en smart contract auditing. Hackathons de Web3 y ciberseguridad.',
  'Buenos Aires', 'Argentina', -34.5936, -58.4080,
  ARRAY['Rust', 'Solidity', 'Python', 'C++'],
  ARRAY['blockchain', 'backend'],
  'looking_for_team', 'in-person',
  'https://github.com/ignavargas', NULL, 'https://x.com/ignavargas', 'https://ignavargas.dev',
  NULL,
  'https://api.dicebear.com/7.x/avataaars/svg?seed=ignavargas'
),
(
  'a1000000-0000-0000-0000-000000000012',
  'julietamorales', 'Julieta Morales',
  'Data scientist con foco en NLP y análisis de datos sociales. Busco equipos para hackathons de IA y sustentabilidad.',
  'Buenos Aires', 'Argentina', -34.6200, -58.4320,
  ARRAY['Python', 'R', 'Pandas', 'Hugging Face', 'Streamlit'],
  ARRAY['ml_ai', 'backend'],
  'available', 'remote',
  'https://github.com/julietamorales', 'https://linkedin.com/in/julietamorales', NULL, NULL,
  'julieta.morales@example.com',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=julietamorales'
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  full_name = EXCLUDED.full_name,
  bio = EXCLUDED.bio,
  location_city = EXCLUDED.location_city,
  location_country = EXCLUDED.location_country,
  location_lat = EXCLUDED.location_lat,
  location_lng = EXCLUDED.location_lng,
  stack = EXCLUDED.stack,
  roles = EXCLUDED.roles,
  status = EXCLUDED.status,
  modality = EXCLUDED.modality,
  github_url = EXCLUDED.github_url,
  linkedin_url = EXCLUDED.linkedin_url,
  x_url = EXCLUDED.x_url,
  website_url = EXCLUDED.website_url,
  email_contact = EXCLUDED.email_contact,
  avatar_url = EXCLUDED.avatar_url;

-- ============================================================
-- HACKATHONS
-- ============================================================
INSERT INTO hackathons (name, organizer, description, start_date, end_date, registration_deadline, modality, location_city, location_country, location_lat, location_lng, category, tags, prize_pool, official_url, is_featured, status) VALUES
(
  'ETHGlobal Brussels',
  'ETHGlobal',
  'The largest Ethereum hackathon in Europe. Build decentralized applications, smart contracts, and Web3 infrastructure with 1500+ hackers.',
  '2026-07-12', '2026-07-14', '2026-07-01',
  'in-person', 'Brussels', 'Belgium', 50.8503, 4.3517,
  'Web3/Blockchain', ARRAY['ethereum', 'solidity', 'defi', 'nft'],
  '$500,000', 'https://ethglobal.com',
  true, 'upcoming'
),
(
  'AI Builders Hackathon',
  'Anthropic x Vercel',
  'Build the next generation of AI-powered applications. Use Claude, GPT, and open-source models to create innovative tools and products.',
  '2026-05-20', '2026-05-22', '2026-05-10',
  'remote', NULL, NULL, NULL, NULL,
  'AI/ML', ARRAY['ai', 'llm', 'claude', 'agents', 'vercel'],
  '$250,000', 'https://aibuilders.dev',
  true, 'upcoming'
),
(
  'HackMIT 2026',
  'MIT',
  'Annual hackathon at MIT. Open to all college students. Build anything that excites you.',
  '2026-10-15', '2026-10-17', '2026-09-15',
  'in-person', 'Cambridge', 'United States', 42.3601, -71.0942,
  'General', ARRAY['students', 'innovation', 'open-ended'],
  '$50,000', 'https://hackmit.org',
  false, 'upcoming'
),
(
  'Climate Hack Global',
  'Climate Tech Foundation',
  'Use technology to fight climate change. Projects focused on carbon tracking, renewable energy, sustainable agriculture, and environmental monitoring.',
  '2026-06-01', '2026-06-03', '2026-05-20',
  'hybrid', 'London', 'United Kingdom', 51.5074, -0.1278,
  'Climate', ARRAY['climate', 'sustainability', 'carbon', 'greentech'],
  '$100,000', 'https://climatehack.global',
  true, 'upcoming'
),
(
  'GameJam Buenos Aires',
  'Game Dev Argentina',
  'Create a game in 48 hours. All engines and platforms welcome. Theme revealed at kickoff.',
  '2026-04-25', '2026-04-27', '2026-04-20',
  'in-person', 'Buenos Aires', 'Argentina', -34.6037, -58.3816,
  'Gaming', ARRAY['gamedev', 'unity', 'godot', 'pixel-art'],
  '$10,000', 'https://gamejamba.ar',
  false, 'upcoming'
),
(
  'FinTech Disrupt 2026',
  'Stripe x Plaid',
  'Reimagine financial services. Build payment solutions, banking tools, lending platforms, or financial literacy apps.',
  '2026-08-08', '2026-08-10', '2026-07-25',
  'remote', NULL, NULL, NULL, NULL,
  'Fintech', ARRAY['payments', 'banking', 'defi', 'stripe'],
  '$200,000', 'https://fintechdisrupt.io',
  false, 'upcoming'
),
(
  'Health Hack LATAM',
  'Digital Health Alliance',
  'Build solutions for healthcare in Latin America. Telemedicine, health records, AI diagnostics, mental health tools.',
  '2026-09-05', '2026-09-07', '2026-08-20',
  'hybrid', 'Mexico City', 'Mexico', 19.4326, -99.1332,
  'Health', ARRAY['healthtech', 'telemedicine', 'ai-diagnostics'],
  '$75,000', 'https://healthhacklatam.org',
  false, 'upcoming'
),
(
  'Open Source Sprint',
  'GitHub',
  'Contribute to major open source projects. Mentored by maintainers. Best contributions win prizes and recognition.',
  '2026-06-15', '2026-06-17', '2026-06-10',
  'remote', NULL, NULL, NULL, NULL,
  'Open Source', ARRAY['opensource', 'github', 'contributions', 'community'],
  '$30,000', 'https://opensourcesprint.dev',
  false, 'upcoming'
),
(
  'EdTech Innovators',
  'Khan Academy x Coursera',
  'Transform education through technology. Build tools for personalized learning, accessibility, and skill development.',
  '2026-11-01', '2026-11-03', '2026-10-15',
  'remote', NULL, NULL, NULL, NULL,
  'Education', ARRAY['education', 'learning', 'accessibility', 'ai-tutor'],
  '$60,000', 'https://edtechinnovators.org',
  false, 'upcoming'
),
(
  'DevTools Con Hack',
  'Vercel x Supabase x Netlify',
  'Build developer tools that make other developers more productive. CLIs, extensions, libraries, and platforms welcome.',
  '2026-05-10', '2026-05-12', '2026-05-05',
  'remote', NULL, NULL, NULL, NULL,
  'Developer Tools', ARRAY['devtools', 'dx', 'cli', 'api'],
  '$150,000', 'https://devtoolscon.dev/hack',
  true, 'upcoming'
),
(
  'Hack LATAM AI 2026',
  'Hugging Face x MercadoLibre',
  'Construí soluciones de IA para el mercado latinoamericano. Procesamiento de lenguaje natural, recomendaciones y automatización.',
  '2026-05-30', '2026-06-01', '2026-05-15',
  'in-person', 'Buenos Aires', 'Argentina', -34.5990, -58.3760,
  'AI/ML', ARRAY['nlp', 'ml', 'python', 'huggingface', 'latam'],
  '$80,000', 'https://hacklatamai.dev',
  true, 'upcoming'
),
(
  'StartupWeekend BA Tech',
  'Techstars',
  '54 horas para crear una startup desde cero. Mentores, inversores y recursos para validar tu idea de negocio.',
  '2026-06-20', '2026-06-22', '2026-06-10',
  'in-person', 'Buenos Aires', 'Argentina', -34.6057, -58.3921,
  'General', ARRAY['startup', 'entrepreneurship', 'mvp', 'business'],
  '$25,000', 'https://startupweekend.org/events/buenosaires',
  false, 'upcoming'
),
(
  'Hack4Climate Buenos Aires',
  'UNDP Argentina',
  'Hackatón de impacto ambiental. Soluciones tecnológicas para cambio climático, energía renovable y economía circular en Argentina.',
  '2026-07-05', '2026-07-07', '2026-06-25',
  'hybrid', 'Buenos Aires', 'Argentina', -34.6172, -58.4345,
  'Climate', ARRAY['clima', 'sustentabilidad', 'energia', 'iot', 'datos'],
  '$40,000', 'https://hack4climate.ar',
  true, 'upcoming'
),
(
  'FinHack Argentina',
  'Banco Galicia x Naranja X',
  'Reinventá los servicios financieros para Argentina. Pagos, crédito, inversión y educación financiera para todos.',
  '2026-08-22', '2026-08-24', '2026-08-10',
  'in-person', 'Buenos Aires', 'Argentina', -34.5912, -58.3808,
  'Fintech', ARRAY['fintech', 'pagos', 'credito', 'open-banking', 'argentina'],
  '$60,000', 'https://finhack.com.ar',
  false, 'upcoming'
),
(
  'SaludTech Hackathon BA',
  'Hospital Italiano x Fundación Barceló',
  'Tecnología para mejorar la salud en Argentina. Telemedicina, IA diagnóstica, gestión hospitalaria y salud mental.',
  '2026-09-13', '2026-09-15', '2026-09-01',
  'in-person', 'Buenos Aires', 'Argentina', -34.6033, -58.4152,
  'Health', ARRAY['healthtech', 'telemedicina', 'ia', 'salud-mental', 'argentina'],
  '$35,000', 'https://saludteckhackba.com',
  false, 'upcoming'
),
(
  'HackCivic BA',
  'Gobierno de la Ciudad de Buenos Aires',
  'Soluciones de tecnología cívica para mejorar la ciudad. Transporte, residuos, accesibilidad, participación ciudadana.',
  '2026-10-03', '2026-10-05', '2026-09-20',
  'in-person', 'Buenos Aires', 'Argentina', -34.6082, -58.3708,
  'General', ARRAY['civic-tech', 'ciudad', 'open-data', 'transporte'],
  '$20,000', 'https://hackcivicba.gob.ar',
  true, 'upcoming'
),
(
  'GameJam BA: Indie Roots',
  'Argentina Game Devs',
  'Hacé un videojuego con temática argentina en 72 horas. Folklore, historia y cultura como inspiración.',
  '2026-05-08', '2026-05-11', '2026-05-01',
  'in-person', 'Buenos Aires', 'Argentina', -34.6148, -58.4023,
  'Gaming', ARRAY['gamedev', 'unity', 'godot', 'argentina', 'indie'],
  '$15,000', 'https://argentinagamedevs.org/gamejam',
  false, 'upcoming'
)
ON CONFLICT DO NOTHING;
