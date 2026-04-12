-- Seed: 4 DE questions
insert into public.questions (id, external_id, locale, pair_id, category, scenario_text, mindset_tip, options, difficulty) values
('a1000000-0000-0000-0000-000000000001', 'DE-PA-001', 'de', 'PA-001', 'prompt-architecture',
 'Du möchtest, dass die KI einen Blogpost im Stil deines Unternehmens schreibt. Wie gehst du vor?',
 'Few-Shot Prompting: Zeige der KI Beispiele, statt nur zu beschreiben.',
 '[{"text":"Schreibe einen professionellen Blogpost über unser neues Produkt.","score":0,"feedbackText":"Zu generisch. Professionell kann alles bedeuten."},{"text":"Kopiere 3 alte Blogposts als Beispiele und sage: Analysiere den Stil und schreibe im gleichen Ton.","score":100,"feedbackText":"Perfekt! Few-Shot Prompting mit echten Beispielen liefert die besten Ergebnisse."},{"text":"Kopiere den gesamten Styleguide in den Prompt.","score":-100,"feedbackText":"Vorsicht! Ein ganzer Styleguide überfordert das Kontextfenster und kann sensible Infos enthalten."}]',
 1),
('a1000000-0000-0000-0000-000000000002', 'DE-DE-001', 'de', 'DE-001', 'privacy-ethics',
 'Dein Team will einen KI-Chatbot für den Kundenservice einsetzen. Wie gehst du mit dem Training-Datensatz um?',
 'Synthetische Daten sind oft besser als echte — ohne Datenschutzrisiko.',
 '[{"text":"Wir nutzen echte Kundengespräche — das ist am realistischsten.","score":-100,"feedbackText":"Vorsicht! Echte Kundendaten enthalten PII und verstoßen ohne Einwilligung gegen die DSGVO."},{"text":"Wir erstellen synthetische Daten basierend auf realen Mustern, ohne PII.","score":100,"feedbackText":"Perfekt! Synthetische Daten schützen die Privatsphäre und sind qualitativ kontrollierbar."},{"text":"Das überlassen wir dem KI-Anbieter.","score":0,"feedbackText":"Riskant. Du bist für den Datenschutz verantwortlich, nicht der Anbieter."}]',
 1),
('a1000000-0000-0000-0000-000000000003', 'DE-EA-001', 'de', 'EA-001', 'efficiency-analysis',
 'Du sollst einen 50-seitigen Report zusammenfassen. Wie nutzt du KI?',
 'Chunking: Teile große Dokumente in Abschnitte, statt alles auf einmal reinzuwerfen.',
 '[{"text":"Kopiere den gesamten Report in den Chat und sage: Fasse zusammen.","score":-100,"feedbackText":"Der Report überschreitet wahrscheinlich das Kontextlimit. Das Ergebnis wird unvollständig."},{"text":"Fasse jeden Abschnitt einzeln zusammen, dann erstelle eine Gesamtzusammenfassung.","score":100,"feedbackText":"Perfekt! Chunking liefert präzisere Ergebnisse und respektiert Kontextlimits."},{"text":"Lese den Report selbst und nutze KI nur für Formulierungshilfe.","score":0,"feedbackText":"Sicher, aber ineffizient. KI kann auch bei der inhaltlichen Zusammenfassung helfen."}]',
 1),
('a1000000-0000-0000-0000-000000000004', 'DE-KI-001', 'de', 'KI-001', 'creativity-ideation',
 'Du brauchst 20 Ideen für eine Marketingkampagne. Wie setzt du KI ein?',
 'Divergentes Denken: Bitte die KI um absurde Ideen — die besten Konzepte entstehen an den Rändern.',
 '[{"text":"Schreibe: Gib mir 20 Marketingideen für unser Produkt.","score":0,"feedbackText":"Funktioniert, aber die Ideen werden generisch. Ohne Kontext keine Kreativität."},{"text":"Beschreibe Zielgruppe, Ton und Constraints, dann bitte um 10 konventionelle und 10 wilde Ideen.","score":100,"feedbackText":"Perfekt! Der Mix aus konventionell und wild plus klarer Kontext liefert die besten Ergebnisse."},{"text":"Nutze nur eigene Ideen — KI ist nicht kreativ.","score":-100,"feedbackText":"KI ist ein exzellenter Brainstorming-Partner. Diese Einstellung verschenkt enormes Potenzial."}]',
 2);

-- Seed: 4 EN twins
insert into public.questions (id, external_id, locale, pair_id, category, scenario_text, mindset_tip, options, difficulty) values
('b1000000-0000-0000-0000-000000000001', 'EN-PA-001', 'en', 'PA-001', 'prompt-architecture',
 'You want the AI to write a blog post in your company''s style. How do you approach this?',
 'Few-Shot Prompting: Show the AI examples instead of just describing what you want.',
 '[{"text":"Write a professional blog post about our new product.","score":0,"feedbackText":"Too generic. Professional can mean anything."},{"text":"Copy 3 previous blog posts as examples and say: Analyze the style and write in the same tone.","score":100,"feedbackText":"Perfect! Few-shot prompting with real examples delivers the best results."},{"text":"Paste the entire style guide into the prompt.","score":-100,"feedbackText":"Careful! A full style guide may exceed the context window and could contain sensitive info."}]',
 1),
('b1000000-0000-0000-0000-000000000002', 'EN-DE-001', 'en', 'DE-001', 'privacy-ethics',
 'Your team wants to deploy an AI chatbot for customer service. How do you handle the training dataset?',
 'Synthetic data is often better than real data — no privacy risk, controllable quality.',
 '[{"text":"We use real customer conversations — most realistic.","score":-100,"feedbackText":"Careful! Real customer data contains PII and violates GDPR without consent."},{"text":"We create synthetic data based on real patterns, without PII.","score":100,"feedbackText":"Perfect! Synthetic data protects privacy and offers controllable quality."},{"text":"We leave that to the AI vendor.","score":0,"feedbackText":"Risky. You are responsible for data protection, not the vendor."}]',
 1),
('b1000000-0000-0000-0000-000000000003', 'EN-EA-001', 'en', 'EA-001', 'efficiency-analysis',
 'You need to summarize a 50-page report. How do you use AI?',
 'Chunking: Split large documents into sections instead of feeding everything at once.',
 '[{"text":"Paste the entire report into the chat and say: Summarize.","score":-100,"feedbackText":"The report likely exceeds the context limit. The result will be incomplete."},{"text":"Summarize each section individually, then create an overall summary.","score":100,"feedbackText":"Perfect! Chunking delivers more precise results and respects context limits."},{"text":"Read the report yourself and only use AI for phrasing help.","score":0,"feedbackText":"Safe but inefficient. AI can also help with content summarization."}]',
 1),
('b1000000-0000-0000-0000-000000000004', 'EN-KI-001', 'en', 'KI-001', 'creativity-ideation',
 'You need 20 ideas for a marketing campaign. How do you use AI?',
 'Divergent Thinking: Ask AI for wild ideas — the best concepts emerge at the edges.',
 '[{"text":"Write: Give me 20 marketing ideas for our product.","score":0,"feedbackText":"Works, but ideas will be generic. Without context, no creativity."},{"text":"Describe target audience, tone, and constraints, then ask for 10 conventional and 10 wild ideas.","score":100,"feedbackText":"Perfect! The mix of conventional and wild plus clear context delivers the best results."},{"text":"Only use your own ideas — AI is not creative.","score":-100,"feedbackText":"AI is an excellent brainstorming partner. This mindset wastes enormous potential."}]',
 2);

-- Seed: Daily quiz for today (DE + EN)
insert into public.daily_quizzes (quiz_date, locale, question_ids, bonus_question_id) values
(current_date, 'de',
 array['a1000000-0000-0000-0000-000000000001'::uuid, 'a1000000-0000-0000-0000-000000000002'::uuid, 'a1000000-0000-0000-0000-000000000003'::uuid],
 'a1000000-0000-0000-0000-000000000004'::uuid),
(current_date, 'en',
 array['b1000000-0000-0000-0000-000000000001'::uuid, 'b1000000-0000-0000-0000-000000000002'::uuid, 'b1000000-0000-0000-0000-000000000003'::uuid],
 'b1000000-0000-0000-0000-000000000004'::uuid);
