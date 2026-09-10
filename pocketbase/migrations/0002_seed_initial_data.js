migrate(
  (app) => {
    // 1. Seed Admin User: alexandrecezar1980@gmail.com / Skip@Pass
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let adminUserId = ''
    try {
      const existing = app.findAuthRecordByEmail('_pb_users_auth_', 'alexandrecezar1980@gmail.com')
      adminUserId = existing.id
    } catch (_) {
      const adminRecord = new Record(users)
      adminRecord.setEmail('alexandrecezar1980@gmail.com')
      adminRecord.setPassword('Skip@Pass')
      adminRecord.setVerified(true)
      adminRecord.set('name', 'Administrador da Escala')
      app.save(adminRecord)
      adminUserId = adminRecord.id
    }

    // 2. Seed Servidores
    const colServidores = app.findCollectionByNameOrId('servidores')
    const servidoresList = [
      // Delegados
      {
        nome: 'Dr. Carlos Eduardo Andrade',
        cargo: 'Delegado',
        telefone: '(83) 99811-2001',
        status: 'Ativo',
      },
      {
        nome: 'Dra. Patrícia Helena Silveira',
        cargo: 'Delegado',
        telefone: '(83) 99811-2002',
        status: 'Ativo',
      },
      {
        nome: 'Dr. Rodrigo Barreto Marinho',
        cargo: 'Delegado',
        telefone: '(83) 99811-2003',
        status: 'Ativo',
      },
      {
        nome: 'Dr. Gustavo Fontes de Moura',
        cargo: 'Delegado',
        telefone: '(83) 99811-2004',
        status: 'Ativo',
      },
      {
        nome: 'Dra. Luiza Valença Castro',
        cargo: 'Delegado',
        telefone: '(83) 99811-2005',
        status: 'Ativo',
      },

      // Escrivães
      {
        nome: 'Mariana Souza Guimarães',
        cargo: 'Escrivão',
        telefone: '(83) 99822-3001',
        status: 'Ativo',
      },
      {
        nome: 'Thiago Mendes Albuquerque',
        cargo: 'Escrivão',
        telefone: '(83) 99822-3002',
        status: 'Ativo',
      },
      {
        nome: 'Camila Ribeiro Sampaio',
        cargo: 'Escrivão',
        telefone: '(83) 99822-3003',
        status: 'Ativo',
      },
      {
        nome: 'Felipe Santana Nogueira',
        cargo: 'Escrivão',
        telefone: '(83) 99822-3004',
        status: 'Ativo',
      },
      {
        nome: 'Juliana Pires de Carvalho',
        cargo: 'Escrivão',
        telefone: '(83) 99822-3005',
        status: 'Ativo',
      },
      {
        nome: 'Marcelo Queiroz Farias',
        cargo: 'Escrivão',
        telefone: '(83) 99822-3006',
        status: 'Ativo',
      },

      // Agentes / Investigadores
      {
        nome: 'João Pedro da Silva Ramos',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4001',
        status: 'Ativo',
      },
      {
        nome: 'Lucas Ferreira Vasconcelos',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4002',
        status: 'Ativo',
      },
      {
        nome: 'Ana Costa Linhares',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4003',
        status: 'Ativo',
      },
      {
        nome: 'Marcos Vinicius Bezerra',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4004',
        status: 'Ativo',
      },
      {
        nome: 'Rafael Gomes Bittencourt',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4005',
        status: 'Ativo',
      },
      {
        nome: 'Bruno Tavares Meireles',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4006',
        status: 'Ativo',
      },
      {
        nome: 'Larissa Dantas Pontes',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4007',
        status: 'Ativo',
      },
      {
        nome: 'Diego Macedo Carneiro',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4008',
        status: 'Ativo',
      },
      {
        nome: 'André Luiz Aragão',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4009',
        status: 'Ativo',
      },
      {
        nome: 'Priscila Cavalcante Melo',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4010',
        status: 'Ativo',
      },
      {
        nome: 'Guilherme Toledo Neves',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4011',
        status: 'Ativo',
      },
      {
        nome: 'Renata Albuquerque Lins',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4012',
        status: 'Ativo',
      },
      {
        nome: 'Wagner de Holanda Couto',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4013',
        status: 'Ativo',
      },
      {
        nome: 'Leandro Batista Morais',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4014',
        status: 'Ativo',
      },
      {
        nome: 'Vanessa Correa Rocha',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4015',
        status: 'Ativo',
      },
      {
        nome: 'Henrique Vianna Peixoto',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4016',
        status: 'Ativo',
      },
      {
        nome: 'Sérgio Murilo Fontoura',
        cargo: 'Agente/Investigador',
        telefone: '(83) 99833-4017',
        status: 'Inativo',
      },
    ]

    const servidorIds = {}
    for (const s of servidoresList) {
      let rec
      try {
        rec = app.findFirstRecordByData('servidores', 'nome', s.nome)
      } catch (_) {
        rec = new Record(colServidores)
        rec.set('nome', s.nome)
        rec.set('cargo', s.cargo)
        rec.set('telefone', s.telefone)
        rec.set('status', s.status)
        app.save(rec)
      }
      servidorIds[s.nome] = rec.id
    }

    // 3. Seed Unidades Policiais (DEAM, 1ª DD, 2ª DD, GTE)
    const colUnidades = app.findCollectionByNameOrId('unidades')
    const unidadesList = [
      {
        nome: 'DEAM - Delegacia Especializada no Atendimento à Mulher',
        delegado: servidorIds['Dra. Patrícia Helena Silveira'],
        escrivao1: servidorIds['Mariana Souza Guimarães'],
        escrivao2: servidorIds['Juliana Pires de Carvalho'],
        agente1: servidorIds['Ana Costa Linhares'],
        agente2: servidorIds['Larissa Dantas Pontes'],
        agente3: servidorIds['Priscila Cavalcante Melo'],
        agente4: servidorIds['Vanessa Correa Rocha'],
        agente5: null,
        agente6: null,
        agente7: null,
        agente8: null,
      },
      {
        nome: '1ª DD - Primeira Delegacia Distrital',
        delegado: servidorIds['Dr. Carlos Eduardo Andrade'],
        escrivao1: servidorIds['Thiago Mendes Albuquerque'],
        escrivao2: null,
        agente1: servidorIds['João Pedro da Silva Ramos'],
        agente2: servidorIds['Lucas Ferreira Vasconcelos'],
        agente3: servidorIds['Marcos Vinicius Bezerra'],
        agente4: servidorIds['Rafael Gomes Bittencourt'],
        agente5: null,
        agente6: null,
        agente7: null,
        agente8: null,
      },
      {
        nome: '2ª DD - Segunda Delegacia Distrital',
        delegado: servidorIds['Dr. Rodrigo Barreto Marinho'],
        escrivao1: servidorIds['Camila Ribeiro Sampaio'],
        escrivao2: servidorIds['Marcelo Queiroz Farias'],
        agente1: servidorIds['Bruno Tavares Meireles'],
        agente2: servidorIds['Diego Macedo Carneiro'],
        agente3: servidorIds['André Luiz Aragão'],
        agente4: servidorIds['Guilherme Toledo Neves'],
        agente5: null,
        agente6: null,
        agente7: null,
        agente8: null,
      },
      {
        nome: 'GTE - Grupo Tático Especial',
        delegado: servidorIds['Dr. Gustavo Fontes de Moura'],
        escrivao1: servidorIds['Felipe Santana Nogueira'],
        escrivao2: null,
        agente1: servidorIds['Renata Albuquerque Lins'],
        agente2: servidorIds['Wagner de Holanda Couto'],
        agente3: servidorIds['Leandro Batista Morais'],
        agente4: servidorIds['Henrique Vianna Peixoto'],
        agente5: null,
        agente6: null,
        agente7: null,
        agente8: null,
      },
    ]

    for (const u of unidadesList) {
      try {
        app.findFirstRecordByData('unidades', 'nome', u.nome)
      } catch (_) {
        const rec = new Record(colUnidades)
        rec.set('nome', u.nome)
        rec.set('delegado', u.delegado)
        if (u.escrivao1) rec.set('escrivao1', u.escrivao1)
        if (u.escrivao2) rec.set('escrivao2', u.escrivao2)
        if (u.agente1) rec.set('agente1', u.agente1)
        if (u.agente2) rec.set('agente2', u.agente2)
        if (u.agente3) rec.set('agente3', u.agente3)
        if (u.agente4) rec.set('agente4', u.agente4)
        app.save(rec)
      }
    }

    // 4. Seed Feriados Nacionais, Estaduais e Municipais
    const colFeriados = app.findCollectionByNameOrId('feriados')
    const feriadosList = [
      {
        nome: 'Confraternização Universal (Ano Novo)',
        data: '2025-01-01 00:00:00.000Z',
        tipo: 'Nacional',
        recorrente: true,
      },
      { nome: 'Tiradentes', data: '2025-04-21 00:00:00.000Z', tipo: 'Nacional', recorrente: true },
      {
        nome: 'Dia do Trabalhador',
        data: '2025-05-01 00:00:00.000Z',
        tipo: 'Nacional',
        recorrente: true,
      },
      {
        nome: 'Independência do Brasil',
        data: '2025-09-07 00:00:00.000Z',
        tipo: 'Nacional',
        recorrente: true,
      },
      {
        nome: 'Nossa Senhora Aparecida',
        data: '2025-10-12 00:00:00.000Z',
        tipo: 'Nacional',
        recorrente: true,
      },
      { nome: 'Finados', data: '2025-11-02 00:00:00.000Z', tipo: 'Nacional', recorrente: true },
      {
        nome: 'Proclamação da República',
        data: '2025-11-15 00:00:00.000Z',
        tipo: 'Nacional',
        recorrente: true,
      },
      {
        nome: 'Dia Nacional de Zumbi e da Consciência Negra',
        data: '2025-11-20 00:00:00.000Z',
        tipo: 'Nacional',
        recorrente: true,
      },
      { nome: 'Natal', data: '2025-12-25 00:00:00.000Z', tipo: 'Nacional', recorrente: true },
      {
        nome: 'Data Magna do Estado',
        data: '2025-08-05 00:00:00.000Z',
        tipo: 'Estadual',
        recorrente: true,
      },
      {
        nome: 'Padroeira do Município',
        data: '2025-12-08 00:00:00.000Z',
        tipo: 'Municipal',
        recorrente: true,
      },
    ]

    for (const f of feriadosList) {
      try {
        app.findFirstRecordByData('feriados', 'nome', f.nome)
      } catch (_) {
        const rec = new Record(colFeriados)
        rec.set('nome', f.nome)
        rec.set('data', f.data)
        rec.set('tipo', f.tipo)
        rec.set('recorrente', f.recorrente)
        app.save(rec)
      }
    }

    // 5. Seed Férias para servidor de teste de alerta
    const colFerias = app.findCollectionByNameOrId('ferias')
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // 1-12
    const monthStr = currentMonth < 10 ? '0' + currentMonth : '' + currentMonth

    const feriasTargetId = servidorIds['Lucas Ferreira Vasconcelos']
    if (feriasTargetId) {
      try {
        app.findFirstRecordByData('ferias', 'servidor', feriasTargetId)
      } catch (_) {
        const rec = new Record(colFerias)
        rec.set('servidor', feriasTargetId)
        rec.set('inicio', `${currentYear}-${monthStr}-05 00:00:00.000Z`)
        rec.set('fim', `${currentYear}-${monthStr}-25 00:00:00.000Z`)
        app.save(rec)
      }
    }

    // 6. Seed Atribuições dos Plantonistas para o mês corrente
    const colAtribuicoes = app.findCollectionByNameOrId('atribuicoes')
    try {
      app.findRecordsByFilter(
        'atribuicoes',
        `mes = ${currentMonth} && ano = ${currentYear}`,
        '',
        1,
        0,
      )
    } catch (_) {}

    let hasAtrib = false
    try {
      const list = app.findRecordsByFilter(
        'atribuicoes',
        `mes = ${currentMonth} && ano = ${currentYear}`,
        '',
        1,
        0,
      )
      if (list && list.length > 0) hasAtrib = true
    } catch (_) {}

    if (!hasAtrib) {
      const defaultTexto = `<h3>ATRIBUIÇÕES GERAIS DA EQUIPE DE PLANTÃO</h3>
<p>Os servidores escalados para o regime de plantão policial deverão observar rigorosamente as seguintes diretrizes operacionais:</p>
<ul>
  <li><strong>Delegado de Polícia Plantonista:</strong> Coordenação geral dos trabalhos, deliberação sobre autuações em flagrante delito, requisições de perícias técnicas e representações por medidas cautelares urgentes.</li>
  <li><strong>Escrivão de Polícia:</strong> Lavratura dos procedimentos de flagrante, boletins de ocorrência de alta complexidade, termos de declaração, termos de apreensão e alimentação tempestiva do sistema de controle de ocorrências.</li>
  <li><strong>Agentes / Investigadores de Polícia:</strong> Custódia e vigilância provisória de pessoas detidas, atendimento e triagem do público, condução de diligências operacionais urgentes e preservação inicial de locais de crime.</li>
</ul>
<p><em>Observação:</em> Os horários de revezamento das escalas devem ser rigorosamente cumpridos conforme estabelecido nesta ordem de serviço.</p>`

      const rec = new Record(colAtribuicoes)
      rec.set('mes', currentMonth)
      rec.set('ano', currentYear)
      rec.set('conteudo', defaultTexto)
      app.save(rec)
    }

    // 7. Seed de alguns dias de escala para o mês atual
    const colEscalas = app.findCollectionByNameOrId('escalas')
    const delegatedId = servidorIds['Dr. Carlos Eduardo Andrade']
    const escrivaoId = servidorIds['Mariana Souza Guimarães']
    const ag1Id = servidorIds['João Pedro da Silva Ramos']
    const ag2Id = servidorIds['Marcos Vinicius Bezerra']
    const ag3Id = servidorIds['Rafael Gomes Bittencourt']

    for (let d = 1; d <= 5; d++) {
      try {
        const existingEscala = app.findRecordsByFilter(
          'escalas',
          `mes = ${currentMonth} && ano = ${currentYear} && dia = ${d}`,
          '',
          1,
          0,
        )
        if (existingEscala && existingEscala.length > 0) continue
      } catch (_) {}

      const rec = new Record(colEscalas)
      rec.set('mes', currentMonth)
      rec.set('ano', currentYear)
      rec.set('dia', d)
      rec.set('tipo_dia', d === 5 ? 'Sexta-Feira' : 'Dia Útil')
      rec.set('delegado', delegatedId)
      rec.set('escrivao', escrivaoId)
      rec.set('agente1', ag1Id)
      rec.set('agente2', ag2Id)
      if (d === 5) {
        rec.set('agente3', ag3Id)
      }
      app.save(rec)
    }
  },
  (app) => {
    // down rollback
  },
)
