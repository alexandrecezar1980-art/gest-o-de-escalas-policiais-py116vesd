migrate(
  (app) => {
    const servidoresCol = app.findCollectionByNameOrId('servidores')
    const servidoresId = servidoresCol.id

    // 1. custodias
    const custodias = new Collection({
      name: 'custodias',
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
        { name: 'viatura', type: 'text', required: true },
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
        { name: 'observacao', type: 'text', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_custodias_mes_ano_dia ON custodias (mes, ano, dia)'],
    })
    app.save(custodias)

    // 2. permanencias
    const permanencias = new Collection({
      name: 'permanencias',
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
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_permanencias_mes_ano_dia ON permanencias (mes, ano, dia)'],
    })
    app.save(permanencias)
  },
  (app) => {
    const colNames = ['permanencias', 'custodias']
    for (const name of colNames) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
  },
)
