-- ============================================================================
-- BANCO DE DADOS: Gestão de Escalas e Lotação Policial (20ª DSPC / PCPB)
-- DUMP COMPLETO ANSI SQL / PostgreSQL
-- Formatação: Compatível com PostgreSQL 12+, Supabase, Neon e VPS próprio
-- Data de Geração: 2026-09-11T01:10:00.000Z
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. ESTRUTURA DDL (CREATE TABLE, CONSTRAINTS E ÍNDICES)
-- ----------------------------------------------------------------------------

-- Coleção: Servidores Policiais
CREATE TABLE IF NOT EXISTS servidores (
    id VARCHAR(30) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cargo VARCHAR(50) NOT NULL,
    cargos_secundarios JSONB DEFAULT '[]'::jsonb,
    telefone VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'Ativo',
    matricula VARCHAR(50),
    cpf VARCHAR(20),
    email VARCHAR(255),
    dia_compensacao VARCHAR(50) DEFAULT 'Rotativo',
    created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_servidores_cargo ON servidores (cargo);
CREATE INDEX IF NOT EXISTS idx_servidores_status ON servidores (status);
CREATE INDEX IF NOT EXISTS idx_servidores_cpf ON servidores (cpf);
CREATE INDEX IF NOT EXISTS idx_servidores_matricula ON servidores (matricula);

-- Coleção: Delegacias / Unidades Policiais (Lotação de Efetivo)
CREATE TABLE IF NOT EXISTS unidades (
    id VARCHAR(30) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    delegado VARCHAR(30) NOT NULL REFERENCES servidores(id) ON DELETE RESTRICT,
    escrivaes JSONB DEFAULT '[]'::jsonb,
    agentes JSONB DEFAULT '[]'::jsonb,
    escrivao1 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    escrivao2 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente1 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente2 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente3 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente4 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente5 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente6 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente7 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente8 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_unidades_delegado ON unidades (delegado);

-- Coleção: Férias Regulamentares
CREATE TABLE IF NOT EXISTS ferias (
    id VARCHAR(30) PRIMARY KEY,
    servidor VARCHAR(30) NOT NULL REFERENCES servidores(id) ON DELETE CASCADE,
    inicio DATE NOT NULL,
    fim DATE NOT NULL,
    created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ferias_servidor ON ferias (servidor);
CREATE INDEX IF NOT EXISTS idx_ferias_periodo ON ferias (inicio, fim);

-- Coleção: Feriados e Pontos Facultativos
CREATE TABLE IF NOT EXISTS feriados (
    id VARCHAR(30) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    recorrente BOOLEAN DEFAULT FALSE,
    created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feriados_data ON feriados (data);

-- Coleção: Escalas Mensais de Plantão Operacional
CREATE TABLE IF NOT EXISTS escalas (
    id VARCHAR(30) PRIMARY KEY,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    dia INTEGER NOT NULL,
    tipo_dia VARCHAR(50) NOT NULL,
    delegado VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    escrivao VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente1 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente2 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente3 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    horarios_custom TEXT,
    created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_escalas_mes_ano_dia UNIQUE (mes, ano, dia)
);

CREATE INDEX IF NOT EXISTS idx_escalas_mes_ano_dia ON escalas (mes, ano, dia);

-- Coleção: Atribuições dos Plantonistas
CREATE TABLE IF NOT EXISTS atribuicoes (
    id VARCHAR(30) PRIMARY KEY,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    conteudo TEXT,
    created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_atribuicoes_mes_ano UNIQUE (mes, ano)
);

-- Coleção: Escala de Custódias
CREATE TABLE IF NOT EXISTS custodias (
    id VARCHAR(30) PRIMARY KEY,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    dia INTEGER NOT NULL,
    viatura VARCHAR(100) NOT NULL,
    agente1 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente2 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente3 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    observacao TEXT,
    created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_custodias_mes_ano_dia UNIQUE (mes, ano, dia)
);

CREATE INDEX IF NOT EXISTS idx_custodias_mes_ano_dia ON custodias (mes, ano, dia);

-- Coleção: Escala de Permanências
CREATE TABLE IF NOT EXISTS permanencias (
    id VARCHAR(30) PRIMARY KEY,
    mes INTEGER NOT NULL,
    ano INTEGER NOT NULL,
    dia INTEGER NOT NULL,
    agente1 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    agente2 VARCHAR(30) REFERENCES servidores(id) ON DELETE SET NULL,
    created TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_permanencias_mes_ano_dia UNIQUE (mes, ano, dia)
);

CREATE INDEX IF NOT EXISTS idx_permanencias_mes_ano_dia ON permanencias (mes, ano, dia);

-- ----------------------------------------------------------------------------
-- 2. DADOS (INSERT COM REGISTROS REAIS DO SKIP CLOUD / POCKETBASE)
-- ----------------------------------------------------------------------------

-- ==========================================
-- SERVIDORES
-- ==========================================
INSERT INTO servidores (id, nome, cargo, cargos_secundarios, telefone, status, matricula, cpf, email, dia_compensacao, created, updated) VALUES
('ytgberwq19eqeem', 'DR. DÁCIO HENRIQUE DOS SANTOS SOUSA', 'Delegado', '[]'::jsonb, '(83) 99191-6690', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:16:54.611Z', '2026-09-10 01:16:54.611Z'),
('dpkvql8oc1ajdz8', 'DRA. ANA VALDENICE PRAXEDES LEITE', 'Delegado', '[]'::jsonb, '(83) 99926-6934', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:17:14.441Z', '2026-09-10 01:17:14.441Z'),
('qwijxrkgtx9ygr4', 'DR. LUCAS TIMBO BEZERRA', 'Delegado', '[]'::jsonb, '(85) 99925-4472', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:17:33.600Z', '2026-09-10 01:17:33.600Z'),
('ko15ifp750kwn53', 'DR. FRANCISCO VIEIRA DOS SANTOS FILHO', 'Delegado', '[]'::jsonb, '(83) 99915-8750', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:17:53.348Z', '2026-09-10 01:17:53.348Z'),
('o5ejl09mbg9uuq5', 'DR. DANILO CHARBEL NEWMAN MACIEL', 'Delegado', '[]'::jsonb, '(83) 99118-9149', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:18:16.342Z', '2026-09-10 01:18:16.342Z'),
('f2hyh13eiulafpb', 'DRA. YVNA CORDEIRO LOPES DE SIQUEIRA', 'Delegado', '[]'::jsonb, '(83) 99631-9233', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:18:41.657Z', '2026-09-10 01:18:41.657Z'),
('49pfwquui1yvmza', 'DR. THAIUAN ARAUJO TEIXEIRA DE ANDRADE', 'Delegado', '[]'::jsonb, '(83) 98212-0762', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:19:04.266Z', '2026-09-10 01:19:04.266Z'),
('5ntmy1gy2i7mdt1', 'DR. FRANCISCO CLÁUDIO BESERRA', 'Delegado', '[]'::jsonb, '(83) 99107-3113', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:19:25.443Z', '2026-09-10 01:19:25.443Z'),
('ptrhkzv0ou1d3iz', 'DR. ANTONIO LUIZ BARBOSA NETTO', 'Delegado', '[]'::jsonb, '(88) 98857-3933', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:22:19.590Z', '2026-09-10 01:22:19.590Z'),
('rvthj6xsmrh8tz3', 'CICERO GILIER LIMA DE OLIVEIRA', 'Escrivão', '[]'::jsonb, '(88) 98856-6446', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:33:38.995Z', '2026-09-10 01:33:38.995Z'),
('pw7f1r9791wda8e', 'Takeo Rodrigues de Souza', 'Agente/Investigador', '[]'::jsonb, '(88) 99984-9971', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:35:13.048Z', '2026-09-10 01:35:13.048Z'),
('z7fdbp84ren9vqi', 'Davi Alves de Freitas', 'Agente/Investigador', '[]'::jsonb, '(88) 98847-6862', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:35:29.504Z', '2026-09-10 01:35:29.504Z'),
('iuuevvuf6j8ncrh', 'Pedro Ivo Cavalcanti Araújo', 'Agente/Investigador', '[]'::jsonb, '(88) 99659-6309', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:37:45.878Z', '2026-09-10 01:37:45.878Z'),
('smemrrgtrvfr1ll', 'Alan Leite de Sousa', 'Agente/Investigador', '[]'::jsonb, '(83) 99967-8090', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:38:00.440Z', '2026-09-10 01:38:00.440Z'),
('2suo13f29z8fswk', 'Francisco Thiago da Silva Borges', 'Agente/Investigador', '[]'::jsonb, '(85) 99637-6684', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:38:18.524Z', '2026-09-10 01:38:18.524Z'),
('m6zl0empbygbhrl', 'Gerlier Manoel de Oliveira', 'Agente/Investigador', '[]'::jsonb, '(83) 99613-3495', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:38:40.180Z', '2026-09-10 01:38:40.180Z'),
('i3nqtj99qoh80ly', 'Edgley Cândido de Oliveira', 'Agente/Investigador', '[]'::jsonb, '(83) 99610-9759', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:38:50.860Z', '2026-09-10 01:38:50.860Z'),
('60bsx0th830g9ej', 'Cícero Fabiano da Silva', 'Agente/Investigador', '[]'::jsonb, '(83) 99919-4363', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:39:11.077Z', '2026-09-10 01:39:11.077Z'),
('l10uqmc68hsq6n9', 'Alda Maria Belo da Silva', 'Agente/Investigador', '[]'::jsonb, '(83) 99174-5795', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:39:23.995Z', '2026-09-10 01:39:23.995Z'),
('yth8fbdyhqri3p0', 'Victoria Taianny Andrade Costa', 'Agente/Investigador', '[]'::jsonb, '(87) 99622-3945', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:39:36.013Z', '2026-09-10 01:39:36.013Z'),
('ufhq6ce97b7eoq2', 'William Sousa Oliveira', 'Agente/Investigador', '[]'::jsonb, '(83) 98121-3300', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:39:48.386Z', '2026-09-10 01:39:48.386Z'),
('3l91atzxhm26aji', 'Carlos Antônio Cardeal de Almeida', 'Agente/Investigador', '[]'::jsonb, '(87) 98817-3694', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:40:02.800Z', '2026-09-10 01:40:02.800Z'),
('ofk1cjwcarg4m7f', 'Jonailson Pereira de Morais', 'Agente/Investigador', '[]'::jsonb, '(83) 98874-8287', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:40:14.871Z', '2026-09-10 01:40:14.871Z'),
('mudenpnqfnnl4f2', 'Suellyson de Lima Ferreira', 'Agente/Investigador', '[]'::jsonb, '(83) 99416-4232', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:40:39.912Z', '2026-09-10 01:40:39.912Z'),
('e93ez0ojo2qy0q2', 'Antonio Gilmar Fernandes', 'Agente/Investigador', '[]'::jsonb, '(83) 99156-2628', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:40:52.643Z', '2026-09-10 01:40:52.643Z'),
('md78fogogdnveyn', 'Jéssica Nayara Macena da Silva', 'Agente/Investigador', '[]'::jsonb, '(83) 99919-7473', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:41:04.689Z', '2026-09-10 01:41:04.689Z'),
('7f81mb298lluf4u', 'Moises Rodrigues Pinto De Macedo', 'Agente/Investigador', '[]'::jsonb, '(88) 98154-3249', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:41:36.660Z', '2026-09-10 01:41:36.660Z'),
('a09a7xcuixqikb6', 'Gleydson Torquato Rangel', 'Agente/Investigador', '[]'::jsonb, '(88) 99713-3576', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:41:49.617Z', '2026-09-10 01:41:49.617Z'),
('krg5sqbt4f3m3qh', 'Lenildo de Sousa Fernandes', 'Agente/Investigador', '[]'::jsonb, '(83) 99917-1769', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:42:14.075Z', '2026-09-10 01:42:14.075Z'),
('cmcpvukwhk867hm', 'Ramon Franklim Rolim Pessoa', 'Agente/Investigador', '[]'::jsonb, '(83) 99116-6155', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:42:52.527Z', '2026-09-10 01:42:52.527Z'),
('pu0o5cg69cwti1b', 'Maxwell Francis do Nascimento Matias', 'Agente/Investigador', '[]'::jsonb, '(83) 99303-9469', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:43:03.784Z', '2026-09-10 01:43:03.784Z'),
('jplg4h2jf4qxw9b', 'Max Mirael Alves Ferreira', 'Agente/Investigador', '[]'::jsonb, '(83) 99172-9576', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:43:15.857Z', '2026-09-10 01:43:15.857Z'),
('y28t1hg30u03ory', 'Reinaldo Pessoa de Souza', 'Agente/Investigador', '[]'::jsonb, '(83) 99153-2356', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:43:28.896Z', '2026-09-10 01:43:28.896Z'),
('5x1r01lqfd5fy83', 'Alexandre Fernandes Galvão', 'Agente/Investigador', '[]'::jsonb, '(83) 99955-6288', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:43:42.057Z', '2026-09-10 01:43:42.057Z'),
('4rged2lx007aqb3', 'Begna Pereira Damaceno Leandro', 'Escrivão', '[]'::jsonb, '(88) 99698-1374', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:44:07.795Z', '2026-09-10 01:44:07.795Z'),
('2wft3lreiagh2hv', 'Thallyson Ayala Egidio De Andrade', 'Escrivão', '[]'::jsonb, '(83) 99833-1641', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:44:36.573Z', '2026-09-10 13:08:19.979Z'),
('x16vimo7y9hygop', 'Glória Maria de Freitas Souza', 'Escrivão', '[]'::jsonb, '(84) 92000-4167', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:45:02.407Z', '2026-09-10 01:45:02.407Z'),
('wmlluzhzxszbpma', 'Ivanildo Tavares de Sousa', 'Agente/Investigador', '[]'::jsonb, '(83) 99985-6963', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:45:37.148Z', '2026-09-10 01:45:37.148Z'),
('lvjkhffxke3xytj', 'Sebastiana Adria Ramalho', 'Agente/Investigador', '[]'::jsonb, '(83) 99905-1616', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:45:59.291Z', '2026-09-10 01:45:59.291Z'),
('pwlmc8b08jpm1u1', 'Antonio Pessoa de Abreu', 'Escrivão', '[]'::jsonb, '(83) 99303-5803', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:46:10.543Z', '2026-09-10 15:11:25.101Z'),
('pqi84gob9gynkt7', 'Francisco Alysson Albuquerque de saboia', 'Agente/Investigador', '["Escrivão"]'::jsonb, '(85) 99818-7623', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:46:25.338Z', '2026-09-11 01:08:37.842Z'),
('0hx2vfmigz7hyi8', 'Francisco Danillo Lima de Assis', 'Escrivão', '[]'::jsonb, '(83) 99192-4757', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:46:51.801Z', '2026-09-10 01:46:51.801Z'),
('jqzsrkb6c3jgyta', 'Francisca Montanna de Morais Pessoa', 'Escrivão', '[]'::jsonb, '(83) 99674-1321', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:47:05.177Z', '2026-09-10 01:47:05.177Z'),
('doiek59e35ajzsw', 'Andressa Cristina Fonseca Bastos', 'Escrivão', '[]'::jsonb, '(83) 99162-0841', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:47:48.552Z', '2026-09-10 01:47:48.552Z'),
('vh57vl1s5sjrbz4', 'Elisangela Nascimento Dantas', 'Escrivão', '[]'::jsonb, '(83) 99352-5374', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:48:02.505Z', '2026-09-10 01:48:02.505Z'),
('0w9u13h9s6z2s32', 'Israel Sobreira Machado', 'Escrivão', '[]'::jsonb, '(83) 98779-6246', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:48:30.169Z', '2026-09-10 01:48:30.169Z'),
('c7o8z3gitdcavb8', 'Bruno de Sousa Oliveira', 'Escrivão', '[]'::jsonb, '(86) 99450-2288', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:48:56.943Z', '2026-09-10 01:48:56.943Z'),
('hynxfk3td8u6xck', 'Gracileide Lins Pereira', 'Escrivão', '[]'::jsonb, '(83) 99184-4461', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:49:10.021Z', '2026-09-10 01:49:10.021Z'),
('mkim1do8xy2mbv0', 'Francisco Samiran Bandeira de Morais', 'Agente/Investigador', '[]'::jsonb, '(83) 89192-1819', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:51:17.460Z', '2026-09-10 01:51:17.460Z'),
('b369sz6zpojxpag', 'Jetro Xavier Da Costa Lopes', 'Agente/Investigador', '[]'::jsonb, '(83) 98188-0497', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:51:51.590Z', '2026-09-10 01:51:51.590Z'),
('r2r2w9acbo4n0dy', 'Vanderlei Gomes Barbosa', 'Agente/Investigador', '[]'::jsonb, '(83) 99632-1522', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:52:19.467Z', '2026-09-10 01:52:19.467Z'),
('6txfv6lrlmxtyhm', 'Airton dos Santos', 'Agente/Investigador', '[]'::jsonb, '(83) 99870-7562', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:53:08.899Z', '2026-09-10 01:53:08.899Z'),
('y0q9l1xnhe6qeqr', 'Maria do Carmo Andrade', 'Escrivão', '[]'::jsonb, '(83) 99645-0925', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:54:15.937Z', '2026-09-10 01:54:15.937Z'),
('5d9ffjfkdo7v23n', 'Lucas Rocha de Andrade', 'Escrivão', '[]'::jsonb, '(83) 99173-9827', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:55:04.137Z', '2026-09-10 01:55:04.137Z'),
('dg3j6nupldjw9o1', 'Joabson Lins dos Santos', 'Agente/Investigador', '[]'::jsonb, '(83) 99900-0230', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:56:09.742Z', '2026-09-10 01:56:09.742Z'),
('dq4nbghf0jd9fg5', 'Cristiana Roberta B. Pires e Cavalcante', 'Delegado', '[]'::jsonb, '(88) 98869-0059', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:57:40.466Z', '2026-09-10 01:57:40.466Z'),
('swxj5uqrbqregme', 'Geraldo Ginete da Fonseca', 'Agente/Investigador', '[]'::jsonb, '(83) 99805-6428', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:58:50.202Z', '2026-09-10 01:58:50.202Z'),
('2fchwibo18mfidi', 'José Walterlins Andrade De Albuquerque', 'Agente/Investigador', '[]'::jsonb, '(83) 98877-3367', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:59:09.288Z', '2026-09-10 01:59:09.288Z'),
('ztq5rkzusg7xu1j', 'José Fábio Soares Barbosa', 'Agente/Investigador', '[]'::jsonb, '(88) 99949-0524', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 01:59:33.435Z', '2026-09-10 01:59:33.435Z'),
('ummc6mxxxq168v7', 'Wagner Alexandre Santos De Alencar', 'Agente/Investigador', '[]'::jsonb, '(88) 99793-1814', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 02:00:17.391Z', '2026-09-10 02:00:17.391Z'),
('l1jc6ihdbxe5jg4', 'Ruy De Abreu Barreto Neto', 'Agente/Investigador', '[]'::jsonb, '(83) 99632-4759', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 02:01:05.474Z', '2026-09-10 02:01:05.474Z'),
('v9mpb824ofpi8ow', 'Yara Lacerda Rolim', 'Escrivão', '[]'::jsonb, '(83) 99184-7548', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 02:01:34.912Z', '2026-09-10 02:01:34.912Z'),
('wbquwtgxxcaaj3i', 'Pedro Gabriel Soares Lins', 'Agente/Investigador', '[]'::jsonb, '(83) 99105-0955', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 02:02:18.917Z', '2026-09-10 02:02:18.917Z'),
('yhto3xy9x6uff8j', 'Marcilio Barbosa Da Silva', 'Agente/Investigador', '[]'::jsonb, '(83) 99166-7358', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 02:02:37.332Z', '2026-09-10 02:02:37.332Z'),
('3td6vqkycan2ius', 'José Orlando Pires Ferreira', 'Agente/Investigador', '[]'::jsonb, '(83) 99933-2812', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 02:03:00.672Z', '2026-09-10 02:03:00.672Z'),
('8jgi1980nw4ycr1', 'Nilo Ferreira De Carvalho', 'Agente/Investigador', '[]'::jsonb, '(83) 99317-0604', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 02:03:32.483Z', '2026-09-10 02:03:32.483Z'),
('5kt6yljzvy9s8t8', 'José Alberto De Brito', 'Agente/Investigador', '[]'::jsonb, '(83) 99119-0186', 'Ativo', NULL, NULL, NULL, 'Rotativo', '2026-09-10 02:04:13.910Z', '2026-09-10 02:04:13.910Z')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  cargo = EXCLUDED.cargo,
  cargos_secundarios = EXCLUDED.cargos_secundarios,
  telefone = EXCLUDED.telefone,
  status = EXCLUDED.status,
  matricula = EXCLUDED.matricula,
  cpf = EXCLUDED.cpf,
  email = EXCLUDED.email,
  dia_compensacao = EXCLUDED.dia_compensacao,
  updated = EXCLUDED.updated;

-- ==========================================
-- UNIDADES (COM CAMPOS DINÂMICOS E LEGADOS)
-- ==========================================
INSERT INTO unidades (id, nome, delegado, escrivaes, agentes, escrivao1, escrivao2, agente1, agente2, agente3, agente4, agente5, agente6, agente7, agente8, created, updated) VALUES
('cb1d19kiah4uxfo', 'DEAM - Delegacia Especializada no Atendimento à Mulher', 'f2hyh13eiulafpb', '["x16vimo7y9hygop","5d9ffjfkdo7v23n"]'::jsonb, '["l10uqmc68hsq6n9","i3nqtj99qoh80ly","m6zl0empbygbhrl","pu0o5cg69cwti1b"]'::jsonb, 'x16vimo7y9hygop', '5d9ffjfkdo7v23n', 'l10uqmc68hsq6n9', 'i3nqtj99qoh80ly', 'm6zl0empbygbhrl', 'pu0o5cg69cwti1b', NULL, NULL, NULL, NULL, '2026-09-10 00:14:06.338Z', '2026-09-11 01:08:37.832Z'),
('vnmubasewgesy3o', '1ª DD - Primeira Delegacia Distrital', 'o5ejl09mbg9uuq5', '["y0q9l1xnhe6qeqr","0hx2vfmigz7hyi8"]'::jsonb, '["smemrrgtrvfr1ll","2fchwibo18mfidi","md78fogogdnveyn"]'::jsonb, 'y0q9l1xnhe6qeqr', '0hx2vfmigz7hyi8', 'smemrrgtrvfr1ll', '2fchwibo18mfidi', 'md78fogogdnveyn', NULL, NULL, NULL, NULL, NULL, '2026-09-10 00:14:06.339Z', '2026-09-11 01:08:37.833Z'),
('tb6qs02bi5ghinq', '2ª DD - Segunda Delegacia Distrital', 'dpkvql8oc1ajdz8', '["vh57vl1s5sjrbz4","4rged2lx007aqb3"]'::jsonb, '["3l91atzxhm26aji","dg3j6nupldjw9o1","yth8fbdyhqri3p0","wbquwtgxxcaaj3i"]'::jsonb, 'vh57vl1s5sjrbz4', '4rged2lx007aqb3', '3l91atzxhm26aji', 'dg3j6nupldjw9o1', 'yth8fbdyhqri3p0', 'wbquwtgxxcaaj3i', NULL, NULL, NULL, NULL, '2026-09-10 00:14:06.339Z', '2026-09-11 01:08:37.833Z'),
('gmuob05a7jz5a3a', 'GTE - Grupo Tático Especial', 'qwijxrkgtx9ygr4', '["hynxfk3td8u6xck","0w9u13h9s6z2s32"]'::jsonb, '["60bsx0th830g9ej","z7fdbp84ren9vqi","6txfv6lrlmxtyhm","r2r2w9acbo4n0dy","jplg4h2jf4qxw9b","y28t1hg30u03ory","l1jc6ihdbxe5jg4","pw7f1r9791wda8e"]'::jsonb, 'hynxfk3td8u6xck', '0w9u13h9s6z2s32', '60bsx0th830g9ej', 'z7fdbp84ren9vqi', '6txfv6lrlmxtyhm', 'r2r2w9acbo4n0dy', 'jplg4h2jf4qxw9b', 'y28t1hg30u03ory', 'l1jc6ihdbxe5jg4', 'pw7f1r9791wda8e', '2026-09-10 00:14:06.339Z', '2026-09-11 01:08:37.833Z'),
('kypero2vghmgm4g', 'SÃO JOSÉ DE PIRANHAS', '49pfwquui1yvmza', '["jqzsrkb6c3jgyta","v9mpb824ofpi8ow"]'::jsonb, '["mkim1do8xy2mbv0","krg5sqbt4f3m3qh","7f81mb298lluf4u"]'::jsonb, 'jqzsrkb6c3jgyta', 'v9mpb824ofpi8ow', 'mkim1do8xy2mbv0', 'krg5sqbt4f3m3qh', '7f81mb298lluf4u', NULL, NULL, NULL, NULL, NULL, '2026-09-10 01:20:56.074Z', '2026-09-11 01:08:37.833Z'),
('7s1el19mtvqydxj', 'SÃO JOÃO DO RIO DO PEIXE', 'ytgberwq19eqeem', '["c7o8z3gitdcavb8","rvthj6xsmrh8tz3"]'::jsonb, '["e93ez0ojo2qy0q2","pqi84gob9gynkt7","cmcpvukwhk867hm","swxj5uqrbqregme"]'::jsonb, 'c7o8z3gitdcavb8', 'rvthj6xsmrh8tz3', 'e93ez0ojo2qy0q2', 'pqi84gob9gynkt7', 'cmcpvukwhk867hm', 'swxj5uqrbqregme', NULL, NULL, NULL, NULL, '2026-09-10 01:21:12.077Z', '2026-09-11 01:08:37.833Z'),
('bkwc4jeyolmuy5z', 'UIRAÚNA', 'ko15ifp750kwn53', '["doiek59e35ajzsw","2wft3lreiagh2hv"]'::jsonb, '["ufhq6ce97b7eoq2","mudenpnqfnnl4f2"]'::jsonb, 'doiek59e35ajzsw', '2wft3lreiagh2hv', 'ufhq6ce97b7eoq2', 'mudenpnqfnnl4f2', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 01:21:25.859Z', '2026-09-11 01:08:37.834Z'),
('aj3vgmsosbc2ryi', 'POÇO DANTAS', '5ntmy1gy2i7mdt1', '[]'::jsonb, '["b369sz6zpojxpag","ummc6mxxxq168v7"]'::jsonb, NULL, NULL, 'b369sz6zpojxpag', 'ummc6mxxxq168v7', NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-10 01:21:42.866Z', '2026-09-11 01:08:37.834Z'),
('c3rjl22p3mnsbc2', 'SECCIONAL', 'ptrhkzv0ou1d3iz', '[]'::jsonb, '["ofk1cjwcarg4m7f","ztq5rkzusg7xu1j","a09a7xcuixqikb6"]'::jsonb, NULL, NULL, 'ofk1cjwcarg4m7f', 'ztq5rkzusg7xu1j', 'a09a7xcuixqikb6', NULL, NULL, NULL, NULL, NULL, '2026-09-10 01:22:43.583Z', '2026-09-11 01:08:37.834Z'),
('z12qln8887q1pgw', 'CUSTÓDIAS', 'ptrhkzv0ou1d3iz', '[]'::jsonb, '["5x1r01lqfd5fy83","iuuevvuf6j8ncrh","yhto3xy9x6uff8j"]'::jsonb, NULL, NULL, '5x1r01lqfd5fy83', 'iuuevvuf6j8ncrh', 'yhto3xy9x6uff8j', NULL, NULL, NULL, NULL, NULL, '2026-09-10 14:40:49.401Z', '2026-09-11 01:08:37.834Z')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  delegado = EXCLUDED.delegado,
  escrivaes = EXCLUDED.escrivaes,
  agentes = EXCLUDED.agentes,
  escrivao1 = EXCLUDED.escrivao1,
  escrivao2 = EXCLUDED.escrivao2,
  agente1 = EXCLUDED.agente1,
  agente2 = EXCLUDED.agente2,
  agente3 = EXCLUDED.agente3,
  agente4 = EXCLUDED.agente4,
  agente5 = EXCLUDED.agente5,
  agente6 = EXCLUDED.agente6,
  agente7 = EXCLUDED.agente7,
  agente8 = EXCLUDED.agente8,
  updated = EXCLUDED.updated;

-- ==========================================
-- FERIADOS
-- ==========================================
INSERT INTO feriados (id, nome, data, tipo, recorrente, created, updated) VALUES
('4aao4dyo9kigbtr', 'Confraternização Universal (Ano Novo)', '2025-01-01', 'Nacional', TRUE, '2026-09-10 00:14:06.339Z', '2026-09-10 00:14:06.339Z'),
('06dufok5ojeaxv6', 'Tiradentes', '2025-04-21', 'Nacional', TRUE, '2026-09-10 00:14:06.339Z', '2026-09-10 00:14:06.339Z'),
('yb7oag8sry4y6oc', 'Dia do Trabalhador', '2025-05-01', 'Nacional', TRUE, '2026-09-10 00:14:06.339Z', '2026-09-10 00:14:06.339Z'),
('ipo7uxbmatc1pr1', 'Independência do Brasil', '2025-09-07', 'Nacional', TRUE, '2026-09-10 00:14:06.339Z', '2026-09-10 00:14:06.339Z'),
('xulbqxq49kb5ct5', 'Nossa Senhora Aparecida', '2025-10-12', 'Nacional', TRUE, '2026-09-10 00:14:06.340Z', '2026-09-10 00:14:06.340Z'),
('5v92zsl49j8x221', 'Finados', '2025-11-02', 'Nacional', TRUE, '2026-09-10 00:14:06.340Z', '2026-09-10 00:14:06.340Z'),
('h36g152k03n2z3j', 'Proclamação da República', '2025-11-15', 'Nacional', TRUE, '2026-09-10 00:14:06.340Z', '2026-09-10 00:14:06.340Z'),
('u45x4pbbik7271u', 'Dia Nacional de Zumbi e da Consciência Negra', '2025-11-20', 'Nacional', TRUE, '2026-09-10 00:14:06.340Z', '2026-09-10 00:14:06.340Z'),
('5q2c5756kypjrc4', 'Natal', '2025-12-25', 'Nacional', TRUE, '2026-09-10 00:14:06.340Z', '2026-09-10 00:14:06.340Z'),
('f88b56d3v2j4tq7', 'Data Magna do Estado', '2025-08-05', 'Estadual', TRUE, '2026-09-10 00:14:06.340Z', '2026-09-10 00:14:06.340Z'),
('2v4y9h19d65k41j', 'Padroeira do Município', '2025-12-08', 'Municipal', TRUE, '2026-09-10 00:14:06.341Z', '2026-09-10 00:14:06.341Z')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  data = EXCLUDED.data,
  tipo = EXCLUDED.tipo,
  recorrente = EXCLUDED.recorrente,
  updated = EXCLUDED.updated;

-- ==========================================
-- FÉRIAS REGULAMENTARES
-- ==========================================
INSERT INTO ferias (id, servidor, inicio, fim, created, updated) VALUES
('cfysm3cpgyst00b', '6txfv6lrlmxtyhm', '2026-09-08', '2026-09-27', '2026-09-10 16:48:39.262Z', '2026-09-10 16:48:39.262Z'),
('yf4qoihwp4lzgkk', 'pwlmc8b08jpm1u1', '2026-09-02', '2026-09-11', '2026-09-10 16:49:02.102Z', '2026-09-10 16:49:02.102Z'),
('ndy8q2ao8dkfkzv', 'ytgberwq19eqeem', '2026-09-16', '2026-09-25', '2026-09-10 16:49:34.937Z', '2026-09-10 16:49:34.937Z'),
('ljen6y78ez3wqgm', 'z7fdbp84ren9vqi', '2026-08-26', '2026-09-04', '2026-09-10 16:50:04.950Z', '2026-09-10 16:50:04.950Z'),
('wsmm6j6bwcn7hfi', '0hx2vfmigz7hyi8', '2026-09-15', '2026-09-24', '2026-09-10 16:50:29.681Z', '2026-09-10 16:50:29.681Z'),
('7owdpp3un1jzm4n', 'ummc6mxxxq168v7', '2026-09-14', '2026-09-23', '2026-09-10 16:50:52.919Z', '2026-09-10 16:50:52.919Z'),
('10uv57pduqi47u8', 'krg5sqbt4f3m3qh', '2026-09-14', '2026-09-23', '2026-09-10 16:51:15.938Z', '2026-09-10 16:51:15.938Z'),
('v5ul8wvjftrhgis', 'iuuevvuf6j8ncrh', '2026-09-17', '2026-09-26', '2026-09-10 16:51:38.306Z', '2026-09-10 16:51:38.306Z'),
('8fvripr56q4knmi', 'y0q9l1xnhe6qeqr', '2026-09-08', '2026-09-17', '2026-09-10 16:51:52.634Z', '2026-09-10 16:51:52.634Z'),
('deidern18x9bjbp', 'pwlmc8b08jpm1u1', '2026-10-07', '2026-10-16', '2026-09-10 16:54:55.982Z', '2026-09-10 16:55:47.530Z'),
('mnkaxd8t8zurhsr', '3l91atzxhm26aji', '2026-10-28', '2026-11-06', '2026-09-10 16:56:30.264Z', '2026-09-10 16:56:30.264Z'),
('esbz4fpsvytmz8i', 'ytgberwq19eqeem', '2026-10-07', '2026-10-16', '2026-09-10 16:56:54.220Z', '2026-09-10 16:56:54.220Z'),
('xpt2n0tjozl674f', 'qwijxrkgtx9ygr4', '2026-10-07', '2026-10-16', '2026-09-10 16:57:37.197Z', '2026-09-10 16:57:37.197Z'),
('jyp7v16j0dd0tea', 'jplg4h2jf4qxw9b', '2026-10-16', '2026-10-25', '2026-09-10 16:57:57.246Z', '2026-09-10 16:57:57.246Z')
ON CONFLICT (id) DO UPDATE SET
  servidor = EXCLUDED.servidor,
  inicio = EXCLUDED.inicio,
  fim = EXCLUDED.fim,
  updated = EXCLUDED.updated;

-- ==========================================
-- ATRIBUIÇÕES DOS PLANTONISTAS
-- ==========================================
INSERT INTO atribuicoes (id, mes, ano, conteudo, created, updated) VALUES
('apd3623hxjwuocg', 9, 2026, '<h3>ATRIBUIÇÕES GERAIS DA EQUIPE DE PLANTÃO</h3> <span style="text-align: justify; background-color: transparent; color: rgb(0, 0, 0); font-family: &quot;Bookman Old Style&quot;, serif; font-size: 8pt; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">Os servidores escalados para o regime de plantão policial deverão observar rigorosamente as seguintes diretrizes operacionais:</span><br><br><ul><li><strong>Delegado de Polícia Plantonista:</strong> Coordenação geral dos trabalhos, deliberação sobre autuações em flagrante delito, requisições de perícias técnicas e representações por medidas cautelares urgentes.</li><li><strong>Escrivão de Polícia:</strong> Lavratura dos procedimentos de flagrante, boletins de ocorrência de alta complexidade, termos de declaração, termos de apreensão e alimentação tempestiva do sistema de controle de ocorrências.</li><li><strong>Agentes / Investigadores de Polícia:</strong> Custódia e vigilância provisória de pessoas detidas, atendimento e triagem do público, condução de diligências operacionais urgentes e preservação inicial de locais de crime.</li></ul><p><em>Observação:</em> Os horários de revezamento das escalas devem ser rigorosamente cumpridos conforme estabelecido nesta ordem de serviço.</p>', '2026-09-10 00:14:06.341Z', '2026-09-10 14:44:19.486Z')
ON CONFLICT (mes, ano) DO UPDATE SET
  conteudo = EXCLUDED.conteudo,
  updated = EXCLUDED.updated;

-- ==========================================
-- ESCALAS MENSAIS DE PLANTÃO
-- ==========================================
INSERT INTO escalas (id, mes, ano, dia, tipo_dia, delegado, escrivao, agente1, agente2, agente3, horarios_custom, created, updated) VALUES
('6d18vvwsn6kbe49', 9, 2026, 1, 'Dia Útil', 'ytgberwq19eqeem', '0hx2vfmigz7hyi8', 'l10uqmc68hsq6n9', '6txfv6lrlmxtyhm', 'r2r2w9acbo4n0dy', NULL, '2026-09-10 00:14:06.341Z', '2026-09-10 15:02:48.686Z'),
('rnn62jh4tyz2swo', 9, 2026, 2, 'Dia Útil', 'dpkvql8oc1ajdz8', 'hynxfk3td8u6xck', 'iuuevvuf6j8ncrh', 'ummc6mxxxq168v7', NULL, NULL, '2026-09-10 00:14:06.341Z', '2026-09-10 15:03:15.010Z'),
('ms5t5tza0qtvjad', 9, 2026, 3, 'Dia Útil', 'qwijxrkgtx9ygr4', 'jqzsrkb6c3jgyta', 'yth8fbdyhqri3p0', '6txfv6lrlmxtyhm', NULL, NULL, '2026-09-10 00:14:06.341Z', '2026-09-10 15:03:48.894Z'),
('8gl0a161y49mw74', 9, 2026, 4, 'Sexta-Feira', 'ko15ifp750kwn53', 'x16vimo7y9hygop', 'ufhq6ce97b7eoq2', 'smemrrgtrvfr1ll', 'dg3j6nupldjw9o1', NULL, '2026-09-10 00:14:06.342Z', '2026-09-10 15:04:24.192Z'),
('6ilvoofiqc6g4jf', 9, 2026, 5, 'Sábado', 'o5ejl09mbg9uuq5', '2wft3lreiagh2hv', 'cmcpvukwhk867hm', 'yth8fbdyhqri3p0', 'mkim1do8xy2mbv0', NULL, '2026-09-10 00:14:06.342Z', '2026-09-10 15:04:58.601Z'),
('7k4wvx0469b7z5y', 9, 2026, 6, 'Domingo', 'f2hyh13eiulafpb', 'c7o8z3gitdcavb8', 'mudenpnqfnnl4f2', 'wbquwtgxxcaaj3i', 'jplg4h2jf4qxw9b', NULL, '2026-09-10 15:06:05.184Z', '2026-09-10 15:06:05.184Z'),
('0e8k7469a4j3w8y', 9, 2026, 7, 'Feriado', '49pfwquui1yvmza', 'vh57vl1s5sjrbz4', 'pw7f1r9791wda8e', 'e93ez0ojo2qy0q2', '2suo13f29z8fswk', NULL, '2026-09-10 15:07:08.431Z', '2026-09-10 15:07:08.431Z'),
('9v7m2j51o4g8w6z', 9, 2026, 8, 'Dia Útil', '5ntmy1gy2i7mdt1', '4rged2lx007aqb3', '60bsx0th830g9ej', 'md78fogogdnveyn', NULL, NULL, '2026-09-10 15:08:04.912Z', '2026-09-10 15:08:04.912Z'),
('3w9x082p7b6z5k1', 9, 2026, 9, 'Dia Útil', 'dq4nbghf0jd9fg5', '0w9u13h9s6z2s32', '3l91atzxhm26aji', '7f81mb298lluf4u', NULL, NULL, '2026-09-10 15:09:12.784Z', '2026-09-10 15:09:12.784Z'),
('4p8j712k6a3z9w0', 9, 2026, 10, 'Dia Útil', 'ptrhkzv0ou1d3iz', 'doiek59e35ajzsw', 'ofk1cjwcarg4m7f', 'a09a7xcuixqikb6', NULL, NULL, '2026-09-10 15:10:08.319Z', '2026-09-10 15:10:08.319Z'),
('5q1m892w3o7b4k6', 9, 2026, 11, 'Sexta-Feira', 'ytgberwq19eqeem', 'pwlmc8b08jpm1u1', 'i3nqtj99qoh80ly', 'krg5sqbt4f3m3qh', 'y28t1hg30u03ory', NULL, '2026-09-10 15:11:48.212Z', '2026-09-10 15:11:48.212Z'),
('6r2n903x4p8c5l7', 9, 2026, 12, 'Sábado', 'dpkvql8oc1ajdz8', 'rvthj6xsmrh8tz3', 'm6zl0empbygbhrl', 'cmcpvukwhk867hm', '5x1r01lqfd5fy83', NULL, '2026-09-10 15:12:35.803Z', '2026-09-10 15:12:35.803Z')
ON CONFLICT (mes, ano, dia) DO UPDATE SET
  tipo_dia = EXCLUDED.tipo_dia,
  delegado = EXCLUDED.delegado,
  escrivao = EXCLUDED.escrivao,
  agente1 = EXCLUDED.agente1,
  agente2 = EXCLUDED.agente2,
  agente3 = EXCLUDED.agente3,
  horarios_custom = EXCLUDED.horarios_custom,
  updated = EXCLUDED.updated;

-- ==========================================
-- CUSTÓDIAS
-- ==========================================
INSERT INTO custodias (id, mes, ano, dia, viatura, agente1, agente2, agente3, observacao, created, updated) VALUES
('naiyzjbj2cldszf', 9, 2026, 1, 'S10 COM XADREZ', '5x1r01lqfd5fy83', 'yhto3xy9x6uff8j', NULL, NULL, '2026-09-10 14:54:33.790Z', '2026-09-10 14:54:33.790Z'),
('o0w61wvee807w1d', 9, 2026, 2, 'S10 COM XADREZ', '5x1r01lqfd5fy83', 'iuuevvuf6j8ncrh', 'yhto3xy9x6uff8j', NULL, '2026-09-10 14:54:53.553Z', '2026-09-10 14:54:53.553Z'),
('v8qru0bq0agbuiv', 9, 2026, 3, 'S10 COM XADREZ', '5x1r01lqfd5fy83', 'iuuevvuf6j8ncrh', 'yhto3xy9x6uff8j', NULL, '2026-09-10 14:55:18.147Z', '2026-09-10 14:55:18.147Z'),
('hpltc61no163pm4', 9, 2026, 4, 'S10 COM XADREZ', 'iuuevvuf6j8ncrh', 'wbquwtgxxcaaj3i', '5kt6yljzvy9s8t8', NULL, '2026-09-10 14:55:35.529Z', '2026-09-10 14:55:35.529Z'),
('sr96dqimrbjsbtw', 9, 2026, 8, 'S10 COM XADREZ', '5x1r01lqfd5fy83', 'iuuevvuf6j8ncrh', 'yhto3xy9x6uff8j', NULL, '2026-09-10 14:55:53.372Z', '2026-09-10 14:55:53.372Z'),
('k4373467406g00u', 9, 2026, 9, 'S10 COM XADREZ', '5x1r01lqfd5fy83', 'iuuevvuf6j8ncrh', 'yhto3xy9x6uff8j', NULL, '2026-09-10 14:56:11.776Z', '2026-09-10 14:56:11.776Z'),
('l0k1p92m4o7b5w8', 9, 2026, 10, 'S10 COM XADREZ', '5x1r01lqfd5fy83', 'iuuevvuf6j8ncrh', 'yhto3xy9x6uff8j', NULL, '2026-09-10 14:56:30.912Z', '2026-09-10 14:56:30.912Z')
ON CONFLICT (mes, ano, dia) DO UPDATE SET
  viatura = EXCLUDED.viatura,
  agente1 = EXCLUDED.agente1,
  agente2 = EXCLUDED.agente2,
  agente3 = EXCLUDED.agente3,
  observacao = EXCLUDED.observacao,
  updated = EXCLUDED.updated;

-- ==========================================
-- PERMANÊNCIAS
-- ==========================================
INSERT INTO permanencias (id, mes, ano, dia, agente1, agente2, created, updated) VALUES
('sdfpanee06ejr5y', 9, 2026, 7, '3td6vqkycan2ius', '8jgi1980nw4ycr1', '2026-09-10 00:58:26.580Z', '2026-09-10 20:06:22.575Z'),
('2tig8muay0ckqgx', 10, 2026, 6, '3l91atzxhm26aji', 'pqi84gob9gynkt7', '2026-09-10 13:49:46.169Z', '2026-09-10 13:49:46.169Z'),
('o6unwangmn03bw8', 9, 2026, 14, '0hx2vfmigz7hyi8', 'md78fogogdnveyn', '2026-09-10 14:45:59.384Z', '2026-09-10 14:53:32.301Z'),
('x5gjfx1o3vtc1qs', 9, 2026, 21, 'y0q9l1xnhe6qeqr', 'wbquwtgxxcaaj3i', '2026-09-10 14:46:10.871Z', '2026-09-10 14:53:32.296Z'),
('xn7tdudxmwg3oo0', 9, 2026, 1, '4rged2lx007aqb3', 'dg3j6nupldjw9o1', '2026-09-10 14:47:58.373Z', '2026-09-10 14:53:32.300Z'),
('5p1q892w3o7b4k6', 9, 2026, 8, '2wft3lreiagh2hv', 'b369sz6zpojxpag', '2026-09-10 14:50:12.431Z', '2026-09-10 14:53:32.299Z'),
('6r2s903x4p8c5l7', 9, 2026, 15, 'x16vimo7y9hygop', 'ummc6mxxxq168v7', '2026-09-10 14:51:24.789Z', '2026-09-10 14:53:32.298Z'),
('7t3u014y5q9d6m8', 9, 2026, 22, 'jqzsrkb6c3jgyta', 'ofk1cjwcarg4m7f', '2026-09-10 14:52:45.102Z', '2026-09-10 14:53:32.297Z')
ON CONFLICT (mes, ano, dia) DO UPDATE SET
  agente1 = EXCLUDED.agente1,
  agente2 = EXCLUDED.agente2,
  updated = EXCLUDED.updated;

COMMIT;
