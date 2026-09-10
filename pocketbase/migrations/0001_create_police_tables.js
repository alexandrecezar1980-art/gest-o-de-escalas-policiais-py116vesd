migrate(
  (app) => {
    // 1. servidores
    const servidores = new Collection({
      name: 'servidores',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'cargo',
          type: 'select',
          required: true,
          values: ['Delegado', 'Escrivão', 'Agente/Investigador'],
          maxSelect: 1,
        },
        { name: 'telefone', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: false,
          values: ['Ativo', 'Inativo'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_servidores_cargo ON servidores (cargo)',
        'CREATE INDEX idx_servidores_status ON servidores (status)',
      ],
    })
    app.save(servidores)

    const servidoresId = servidores.id

    // 2. unidades
    const unidades = new Collection({
      name: 'unidades',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        {
          name: 'delegado',
          type: 'relation',
          required: true,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'escrivao1',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'escrivao2',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'agente1',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'agente2',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'agente3',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'agente4',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'agente5',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'agente6',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'agente7',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'agente8',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_unidades_delegado ON unidades (delegado)'],
    })
    app.save(unidades)

    // 3. ferias
    const ferias = new Collection({
      name: 'ferias',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'servidor',
          type: 'relation',
          required: true,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        { name: 'inicio', type: 'date', required: true },
        { name: 'fim', type: 'date', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_ferias_servidor ON ferias (servidor)',
        'CREATE INDEX idx_ferias_periodo ON ferias (inicio, fim)',
      ],
    })
    app.save(ferias)

    // 4. feriados
    const feriados = new Collection({
      name: 'feriados',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'data', type: 'date', required: true },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['Nacional', 'Estadual', 'Municipal'],
          maxSelect: 1,
        },
        { name: 'recorrente', type: 'bool', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_feriados_data ON feriados (data)'],
    })
    app.save(feriados)

    // 5. escalas
    const escalas = new Collection({
      name: 'escalas',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'mes', type: 'number', required: true },
        { name: 'ano', type: 'number', required: true },
        { name: 'dia', type: 'number', required: true },
        {
          name: 'tipo_dia',
          type: 'select',
          required: true,
          values: ['Dia Útil', 'Sexta-Feira', 'Sábado', 'Domingo', 'Feriado'],
          maxSelect: 1,
        },
        {
          name: 'delegado',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'escrivao',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'agente1',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'agente2',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        {
          name: 'agente3',
          type: 'relation',
          required: false,
          collectionId: servidoresId,
          maxSelect: 1,
        },
        { name: 'horarios_custom', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_escalas_mes_ano_dia ON escalas (mes, ano, dia)'],
    })
    app.save(escalas)

    // 6. atribuicoes
    const atribuicoes = new Collection({
      name: 'atribuicoes',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'mes', type: 'number', required: true },
        { name: 'ano', type: 'number', required: true },
        { name: 'conteudo', type: 'editor', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_atribuicoes_mes_ano ON atribuicoes (mes, ano)'],
    })
    app.save(atribuicoes)
  },
  (app) => {
    const colNames = ['atribuicoes', 'escalas', 'feriados', 'ferias', 'unidades', 'servidores']
    for (const name of colNames) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
