// Script auxiliar Node.js para buscar todos os dados reais do PocketBase e montar o database_dump.sql
import fs from 'fs'

const PB_URL = 'https://gestao-de-escalas-policiais-44db3.shrd00.internal.goskip.dev'

async function fetchCollection(name) {
  let page = 1
  let all = []
  while (true) {
    const res = await fetch(`${PB_URL}/api/collections/${name}/records?page=${page}&perPage=500`)
    if (!res.ok) {
      console.error(`Erro ao buscar ${name}: ${res.status} ${res.statusText}`)
      break
    }
    const data = await res.json()
    all = all.concat(data.items || [])
    if (page >= data.totalPages) break
    page++
  }
  return all
}

function escapeSql(val) {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`
  }
  const str = String(val).replace(/'/g, "''")
  return `'${str}'`
}

async function main() {
  console.log('Buscando dados do PocketBase...')
  const [servidores, unidades, ferias, feriados, escalas, atribuicoes, custodias, permanencias] =
    await Promise.all([
      fetchCollection('servidores'),
      fetchCollection('unidades'),
      fetchCollection('ferias'),
      fetchCollection('feriados'),
      fetchCollection('escalas'),
      fetchCollection('atribuicoes'),
      fetchCollection('custodias'),
      fetchCollection('permanencias'),
    ])

  console.log(`Servidores: ${servidores.length}`)
  console.log(`Unidades: ${unidades.length}`)
  console.log(`Férias: ${ferias.length}`)
  console.log(`Feriados: ${feriados.length}`)
  console.log(`Escalas: ${escalas.length}`)
  console.log(`Atribuições: ${atribuicoes.length}`)
  console.log(`Custódias: ${custodias.length}`)
  console.log(`Permanências: ${permanencias.length}`)

  let sql = `-- ============================================================================
-- BANCO DE DADOS: Gestão de Escalas e Lotação Policial (20ª DSPC / PCPB)
-- DUMP COMPLETO ANSI SQL / PostgreSQL
-- Data de Geração: ${new Date().toISOString()}
-- ============================================================================

BEGIN;

-- 1. ESTRUTURA DDL (CREATE TABLE, CONSTRAINTS E ÍNDICES)

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

-- ============================================================================
-- 2. DADOS (INSERT COM REGISTROS REAIS DO SKIP CLOUD / POCKETBASE)
-- ============================================================================

-- INSERTS: servidores
`

  for (const s of servidores) {
    sql += `INSERT INTO servidores (id, nome, cargo, cargos_secundarios, telefone, status, matricula, cpf, email, dia_compensacao, created, updated) VALUES (${escapeSql(s.id)}, ${escapeSql(s.nome)}, ${escapeSql(s.cargo)}, ${escapeSql(s.cargos_secundarios || [])}, ${escapeSql(s.telefone)}, ${escapeSql(s.status || 'Ativo')}, ${escapeSql(s.matricula || null)}, ${escapeSql(s.cpf || null)}, ${escapeSql(s.email || null)}, ${escapeSql(s.dia_compensacao || 'Rotativo')}, ${escapeSql(s.created)}, ${escapeSql(s.updated)}) ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, cargo = EXCLUDED.cargo, cargos_secundarios = EXCLUDED.cargos_secundarios, telefone = EXCLUDED.telefone, status = EXCLUDED.status, matricula = EXCLUDED.matricula, cpf = EXCLUDED.cpf, email = EXCLUDED.email, dia_compensacao = EXCLUDED.dia_compensacao, updated = EXCLUDED.updated;\n`
  }

  sql += `\n-- INSERTS: unidades\n`
  for (const u of unidades) {
    sql += `INSERT INTO unidades (id, nome, delegado, escrivaes, agentes, escrivao1, escrivao2, agente1, agente2, agente3, agente4, agente5, agente6, agente7, agente8, created, updated) VALUES (${escapeSql(u.id)}, ${escapeSql(u.nome)}, ${escapeSql(u.delegado)}, ${escapeSql(u.escrivaes || [])}, ${escapeSql(u.agentes || [])}, ${escapeSql(u.escrivao1 || null)}, ${escapeSql(u.escrivao2 || null)}, ${escapeSql(u.agente1 || null)}, ${escapeSql(u.agente2 || null)}, ${escapeSql(u.agente3 || null)}, ${escapeSql(u.agente4 || null)}, ${escapeSql(u.agente5 || null)}, ${escapeSql(u.agente6 || null)}, ${escapeSql(u.agente7 || null)}, ${escapeSql(u.agente8 || null)}, ${escapeSql(u.created)}, ${escapeSql(u.updated)}) ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, delegado = EXCLUDED.delegado, escrivaes = EXCLUDED.escrivaes, agentes = EXCLUDED.agentes, escrivao1 = EXCLUDED.escrivao1, escrivao2 = EXCLUDED.escrivao2, agente1 = EXCLUDED.agente1, agente2 = EXCLUDED.agente2, agente3 = EXCLUDED.agente3, agente4 = EXCLUDED.agente4, agente5 = EXCLUDED.agente5, agente6 = EXCLUDED.agente6, agente7 = EXCLUDED.agente7, agente8 = EXCLUDED.agente8, updated = EXCLUDED.updated;\n`
  }

  sql += `\n-- INSERTS: feriados\n`
  for (const f of feriados) {
    sql += `INSERT INTO feriados (id, nome, data, tipo, recorrente, created, updated) VALUES (${escapeSql(f.id)}, ${escapeSql(f.nome)}, ${escapeSql(f.data ? f.data.slice(0, 10) : null)}, ${escapeSql(f.tipo)}, ${escapeSql(f.recorrente)}, ${escapeSql(f.created)}, ${escapeSql(f.updated)}) ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, data = EXCLUDED.data, tipo = EXCLUDED.tipo, recorrente = EXCLUDED.recorrente, updated = EXCLUDED.updated;\n`
  }

  sql += `\n-- INSERTS: ferias\n`
  for (const fe of ferias) {
    sql += `INSERT INTO ferias (id, servidor, inicio, fim, created, updated) VALUES (${escapeSql(fe.id)}, ${escapeSql(fe.servidor)}, ${escapeSql(fe.inicio ? fe.inicio.slice(0, 10) : null)}, ${escapeSql(fe.fim ? fe.fim.slice(0, 10) : null)}, ${escapeSql(fe.created)}, ${escapeSql(fe.updated)}) ON CONFLICT (id) DO UPDATE SET servidor = EXCLUDED.servidor, inicio = EXCLUDED.inicio, fim = EXCLUDED.fim, updated = EXCLUDED.updated;\n`
  }

  sql += `\n-- INSERTS: atribuicoes\n`
  for (const a of atribuicoes) {
    sql += `INSERT INTO atribuicoes (id, mes, ano, conteudo, created, updated) VALUES (${escapeSql(a.id)}, ${escapeSql(a.mes)}, ${escapeSql(a.ano)}, ${escapeSql(a.conteudo || null)}, ${escapeSql(a.created)}, ${escapeSql(a.updated)}) ON CONFLICT (mes, ano) DO UPDATE SET conteudo = EXCLUDED.conteudo, updated = EXCLUDED.updated;\n`
  }

  sql += `\n-- INSERTS: escalas\n`
  for (const e of escalas) {
    sql += `INSERT INTO escalas (id, mes, ano, dia, tipo_dia, delegado, escrivao, agente1, agente2, agente3, horarios_custom, created, updated) VALUES (${escapeSql(e.id)}, ${escapeSql(e.mes)}, ${escapeSql(e.ano)}, ${escapeSql(e.dia)}, ${escapeSql(e.tipo_dia)}, ${escapeSql(e.delegado || null)}, ${escapeSql(e.escrivao || null)}, ${escapeSql(e.agente1 || null)}, ${escapeSql(e.agente2 || null)}, ${escapeSql(e.agente3 || null)}, ${escapeSql(e.horarios_custom || null)}, ${escapeSql(e.created)}, ${escapeSql(e.updated)}) ON CONFLICT (mes, ano, dia) DO UPDATE SET tipo_dia = EXCLUDED.tipo_dia, delegado = EXCLUDED.delegado, escrivao = EXCLUDED.escrivao, agente1 = EXCLUDED.agente1, agente2 = EXCLUDED.agente2, agente3 = EXCLUDED.agente3, horarios_custom = EXCLUDED.horarios_custom, updated = EXCLUDED.updated;\n`
  }

  sql += `\n-- INSERTS: custodias\n`
  for (const c of custodias) {
    sql += `INSERT INTO custodias (id, mes, ano, dia, viatura, agente1, agente2, agente3, observacao, created, updated) VALUES (${escapeSql(c.id)}, ${escapeSql(c.mes)}, ${escapeSql(c.ano)}, ${escapeSql(c.dia)}, ${escapeSql(c.viatura)}, ${escapeSql(c.agente1 || null)}, ${escapeSql(c.agente2 || null)}, ${escapeSql(c.agente3 || null)}, ${escapeSql(c.observacao || null)}, ${escapeSql(c.created)}, ${escapeSql(c.updated)}) ON CONFLICT (mes, ano, dia) DO UPDATE SET viatura = EXCLUDED.viatura, agente1 = EXCLUDED.agente1, agente2 = EXCLUDED.agente2, agente3 = EXCLUDED.agente3, observacao = EXCLUDED.observacao, updated = EXCLUDED.updated;\n`
  }

  sql += `\n-- INSERTS: permanencias\n`
  for (const p of permanencias) {
    sql += `INSERT INTO permanencias (id, mes, ano, dia, agente1, agente2, created, updated) VALUES (${escapeSql(p.id)}, ${escapeSql(p.mes)}, ${escapeSql(p.ano)}, ${escapeSql(p.dia)}, ${escapeSql(p.agente1 || null)}, ${escapeSql(p.agente2 || null)}, ${escapeSql(p.created)}, ${escapeSql(p.updated)}) ON CONFLICT (mes, ano, dia) DO UPDATE SET agente1 = EXCLUDED.agente1, agente2 = EXCLUDED.agente2, updated = EXCLUDED.updated;\n`
  }

  sql += `\nCOMMIT;\n`

  fs.writeFileSync('public/database_dump.sql', sql, 'utf8')
  console.log('Dump gerado com sucesso em public/database_dump.sql')
}

main().catch(console.error)
