-- =============================================================================
-- Resgate de Alimentos — dados da demonstração
--
-- Rode DEPOIS de supabase/schema.sql (SQL Editor > colar > Run).
-- Para reiniciar a demo, rode este arquivo de novo: ele APAGA todas as doações
-- e coletas e recarrega os dados iniciais.
--
-- Os nomes de estabelecimentos e ONGs são fictícios; as coordenadas são de
-- bairros reais de São Paulo. As datas das doações são relativas a "hoje" no
-- fuso de São Paulo, para a demo nunca aparecer vencida.
-- Arquivo gerado a partir de lib/data/*.json (mesmos dados do modo local).
-- =============================================================================

truncate coletas, doacoes, ongs, estabelecimentos;

insert into estabelecimentos (id, nome, tipo, endereco, bairro, lat, lng) values
  ('est-1', 'Padaria Pão da Vila', 'padaria', 'Rua Harmonia, 300', 'Vila Madalena', -23.553, -46.6912),
  ('est-2', 'Mercado Bom Preço Pinheiros', 'mercado', 'Rua dos Pinheiros, 820', 'Pinheiros', -23.5666, -46.6922),
  ('est-3', 'Restaurante Sabor de Casa', 'restaurante', 'Av. Ibirapuera, 2100', 'Moema', -23.6006, -46.6656),
  ('est-4', 'Hortifruti Verde Fresco', 'hortifruti', 'Rua da Mooca, 1500', 'Mooca', -23.5587, -46.5996),
  ('est-5', 'Supermercado Leste', 'mercado', 'Rua Tuiuti, 900', 'Tatuapé', -23.5404, -46.5763),
  ('est-6', 'Padaria Estrela do Norte', 'padaria', 'Rua Voluntários da Pátria, 2400', 'Santana', -23.5025, -46.6253),
  ('est-7', 'Restaurante Oriente', 'restaurante', 'Rua Galvão Bueno, 150', 'Liberdade', -23.5587, -46.6353),
  ('est-8', 'Cantina Bela Massa', 'restaurante', 'Rua 13 de Maio, 600', 'Bela Vista', -23.5614, -46.6497),
  ('est-9', 'Mercadinho da Lapa', 'mercado', 'Rua Doze de Outubro, 400', 'Lapa', -23.5269, -46.7036),
  ('est-10', 'Padaria Doce Mariana', 'padaria', 'Rua Domingos de Morais, 1800', 'Vila Mariana', -23.5893, -46.6346);

insert into ongs (id, nome, endereco, bairro, lat, lng) values
  ('ong-1', 'Cozinha Comunitária Mãos Unidas', 'Praça da Sé, 100', 'Sé', -23.5505, -46.6333),
  ('ong-2', 'Instituto Prato Cheio', 'Rua do Gasômetro, 300', 'Brás', -23.5436, -46.6155),
  ('ong-3', 'Associação Sopa Solidária', 'Av. Vital Brasil, 500', 'Butantã', -23.5719, -46.7083);

-- "hoje" em São Paulo
with hoje as (select (now() at time zone 'America/Sao_Paulo')::date as d)
insert into doacoes (estabelecimento_id, categoria, descricao, quantidade_kg, validade,
                     janela_inicio, janela_fim, endereco, bairro, lat, lng)
select v.est, v.cat, v.descr, v.kg, hoje.d + v.validade_dias,
       (hoje.d + v.janela_dias) + v.inicio::time, (hoje.d + v.janela_dias) + v.fim::time,
       e.endereco, e.bairro, e.lat, e.lng
from hoje, (values
  ('est-1', 'paes', 'Pães franceses e de forma do dia', 12, 1, 0, '19:00', '21:00'),
  ('est-2', 'hortifruti', 'Frutas e legumes com pequenas imperfeições', 35, 3, 0, '16:00', '18:00'),
  ('est-3', 'refeicoes_prontas', 'Marmitas de arroz, feijão e frango (refrigeradas)', 18, 1, 0, '15:00', '16:30'),
  ('est-4', 'hortifruti', 'Verduras folhosas e tomates', 40, 2, 1, '08:00', '10:00'),
  ('est-5', 'laticinios', 'Iogurtes e queijos próximos do vencimento', 22, 4, 1, '09:00', '12:00'),
  ('est-6', 'paes', 'Bolos e salgados assados', 9, 1, 0, '20:00', '21:30'),
  ('est-7', 'refeicoes_prontas', 'Arroz e legumes refogados (porções)', 15, 1, 0, '14:30', '16:00'),
  ('est-8', 'refeicoes_prontas', 'Massas e molhos preparados no almoço', 14, 1, 0, '15:00', '17:00'),
  ('est-9', 'graos', 'Arroz e feijão com embalagem avariada (íntegros)', 50, 60, 2, '10:00', '17:00'),
  ('est-10', 'paes', 'Pães doces e croissants', 8, 1, 0, '18:30', '20:00')
) as v (est, cat, descr, kg, validade_dias, janela_dias, inicio, fim)
join estabelecimentos e on e.id = v.est;

-- Histórico de coletas das semanas anteriores (painel de impacto)
insert into coletas (estabelecimento_id, ong_id, categoria, kg, data) values
  ('est-1', 'ong-3', 'paes', 23, '2026-10-04'),
  ('est-4', 'ong-1', 'hortifruti', 12, '2026-10-05'),
  ('est-10', 'ong-2', 'paes', 8, '2026-10-06'),
  ('est-2', 'ong-1', 'hortifruti', 20, '2026-10-07'),
  ('est-9', 'ong-1', 'graos', 40, '2026-10-08'),
  ('est-4', 'ong-2', 'hortifruti', 43, '2026-10-09'),
  ('est-5', 'ong-1', 'laticinios', 16, '2026-10-09'),
  ('est-6', 'ong-2', 'paes', 15, '2026-10-10'),
  ('est-4', 'ong-2', 'hortifruti', 12, '2026-10-10'),
  ('est-7', 'ong-1', 'refeicoes_prontas', 28, '2026-10-11'),
  ('est-10', 'ong-2', 'paes', 8, '2026-10-12'),
  ('est-8', 'ong-3', 'refeicoes_prontas', 13, '2026-10-12'),
  ('est-2', 'ong-3', 'hortifruti', 24, '2026-10-13'),
  ('est-10', 'ong-2', 'paes', 42, '2026-10-13'),
  ('est-2', 'ong-1', 'hortifruti', 20, '2026-10-14'),
  ('est-2', 'ong-1', 'hortifruti', 12, '2026-10-15'),
  ('est-7', 'ong-2', 'refeicoes_prontas', 35, '2026-10-15'),
  ('est-3', 'ong-2', 'refeicoes_prontas', 28, '2026-10-16'),
  ('est-4', 'ong-3', 'hortifruti', 23, '2026-10-16'),
  ('est-10', 'ong-3', 'paes', 16, '2026-10-17'),
  ('est-4', 'ong-1', 'hortifruti', 35, '2026-10-18'),
  ('est-7', 'ong-2', 'refeicoes_prontas', 41, '2026-10-18'),
  ('est-4', 'ong-3', 'hortifruti', 26, '2026-10-18'),
  ('est-4', 'ong-1', 'hortifruti', 26, '2026-10-19'),
  ('est-5', 'ong-1', 'laticinios', 19, '2026-10-20'),
  ('est-10', 'ong-3', 'paes', 26, '2026-10-20'),
  ('est-8', 'ong-2', 'refeicoes_prontas', 35, '2026-10-21'),
  ('est-5', 'ong-1', 'laticinios', 21, '2026-10-22'),
  ('est-9', 'ong-3', 'graos', 22, '2026-10-23'),
  ('est-10', 'ong-2', 'paes', 43, '2026-10-23'),
  ('est-7', 'ong-2', 'refeicoes_prontas', 20, '2026-10-23'),
  ('est-9', 'ong-2', 'graos', 11, '2026-10-24'),
  ('est-2', 'ong-1', 'hortifruti', 16, '2026-10-25'),
  ('est-7', 'ong-3', 'refeicoes_prontas', 10, '2026-10-26'),
  ('est-7', 'ong-2', 'refeicoes_prontas', 44, '2026-10-26'),
  ('est-8', 'ong-3', 'refeicoes_prontas', 22, '2026-10-26'),
  ('est-1', 'ong-3', 'paes', 13, '2026-10-27'),
  ('est-9', 'ong-2', 'graos', 27, '2026-10-27'),
  ('est-2', 'ong-2', 'hortifruti', 33, '2026-10-27'),
  ('est-8', 'ong-1', 'refeicoes_prontas', 22, '2026-10-28'),
  ('est-3', 'ong-3', 'refeicoes_prontas', 12, '2026-10-29'),
  ('est-5', 'ong-3', 'laticinios', 38, '2026-10-29'),
  ('est-10', 'ong-1', 'paes', 15, '2026-10-29'),
  ('est-3', 'ong-3', 'refeicoes_prontas', 39, '2026-10-30'),
  ('est-1', 'ong-3', 'paes', 26, '2026-10-30'),
  ('est-1', 'ong-1', 'paes', 29, '2026-10-31'),
  ('est-5', 'ong-1', 'laticinios', 9, '2026-10-31'),
  ('est-10', 'ong-1', 'paes', 11, '2026-11-01'),
  ('est-8', 'ong-1', 'refeicoes_prontas', 40, '2026-11-01'),
  ('est-3', 'ong-3', 'refeicoes_prontas', 36, '2026-11-02'),
  ('est-9', 'ong-1', 'graos', 22, '2026-11-02'),
  ('est-4', 'ong-3', 'hortifruti', 18, '2026-11-03'),
  ('est-5', 'ong-2', 'laticinios', 29, '2026-11-03'),
  ('est-8', 'ong-3', 'refeicoes_prontas', 34, '2026-11-03'),
  ('est-2', 'ong-1', 'hortifruti', 20, '2026-11-03'),
  ('est-6', 'ong-1', 'paes', 43, '2026-11-04'),
  ('est-10', 'ong-1', 'paes', 6, '2026-11-05'),
  ('est-2', 'ong-3', 'hortifruti', 9, '2026-11-05'),
  ('est-2', 'ong-1', 'hortifruti', 27, '2026-11-06'),
  ('est-2', 'ong-3', 'hortifruti', 21, '2026-11-06'),
  ('est-8', 'ong-1', 'refeicoes_prontas', 40, '2026-11-07'),
  ('est-3', 'ong-3', 'refeicoes_prontas', 42, '2026-11-07'),
  ('est-10', 'ong-2', 'paes', 21, '2026-11-07'),
  ('est-7', 'ong-1', 'refeicoes_prontas', 12, '2026-11-08'),
  ('est-2', 'ong-3', 'hortifruti', 33, '2026-11-08'),
  ('est-6', 'ong-2', 'paes', 32, '2026-11-08'),
  ('est-8', 'ong-3', 'refeicoes_prontas', 9, '2026-11-08'),
  ('est-1', 'ong-2', 'paes', 27, '2026-11-09'),
  ('est-4', 'ong-1', 'hortifruti', 18, '2026-11-10'),
  ('est-3', 'ong-2', 'refeicoes_prontas', 17, '2026-11-11'),
  ('est-5', 'ong-2', 'laticinios', 21, '2026-11-11'),
  ('est-2', 'ong-2', 'hortifruti', 41, '2026-11-11'),
  ('est-2', 'ong-1', 'hortifruti', 40, '2026-11-11'),
  ('est-2', 'ong-1', 'hortifruti', 16, '2026-11-12'),
  ('est-8', 'ong-2', 'refeicoes_prontas', 19, '2026-11-13'),
  ('est-7', 'ong-1', 'refeicoes_prontas', 16, '2026-11-13'),
  ('est-7', 'ong-1', 'refeicoes_prontas', 30, '2026-11-13'),
  ('est-5', 'ong-2', 'laticinios', 24, '2026-11-13'),
  ('est-9', 'ong-3', 'graos', 37, '2026-11-14'),
  ('est-3', 'ong-1', 'refeicoes_prontas', 24, '2026-11-14'),
  ('est-4', 'ong-1', 'hortifruti', 43, '2026-11-14'),
  ('est-9', 'ong-1', 'graos', 26, '2026-11-14');
