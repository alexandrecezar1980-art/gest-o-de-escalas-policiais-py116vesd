migrate(
  (app) => {
    // 1. Atualizar a coleção 'unidades' para conter campos JSON de escrivaes e agentes dinâmicos
    const unidades = app.findCollectionByNameOrId('unidades')

    if (!unidades.fields.getByName('escrivaes')) {
      unidades.fields.add(
        new JSONField({
          name: 'escrivaes',
          required: false,
        }),
      )
    }

    if (!unidades.fields.getByName('agentes')) {
      unidades.fields.add(
        new JSONField({
          name: 'agentes',
          required: false,
        }),
      )
    }

    app.save(unidades)

    // 2. Migrar dados existentes em 'unidades': preencher escrivaes e agentes a partir dos slots fixos se vazios
    try {
      const records = app.findRecordsByFilter('unidades', '', 'created', 100, 0)
      for (const rec of records) {
        let mudou = false
        const escExistentes = rec.get('escrivaes')
        if (!escExistentes || !Array.isArray(escExistentes) || escExistentes.length === 0) {
          const escList = []
          const e1 = rec.getString('escrivao1')
          const e2 = rec.getString('escrivao2')
          if (e1) escList.push(e1)
          if (e2 && !escList.includes(e2)) escList.push(e2)
          rec.set('escrivaes', escList)
          mudou = true
        }

        const agExistentes = rec.get('agentes')
        if (!agExistentes || !Array.isArray(agExistentes) || agExistentes.length === 0) {
          const agList = []
          for (let i = 1; i <= 8; i++) {
            const ag = rec.getString('agente' + i)
            if (ag && !agList.includes(ag)) agList.push(ag)
          }
          rec.set('agentes', agList)
          mudou = true
        }

        if (mudou) {
          app.save(rec)
        }
      }
    } catch (e) {
      console.log('Erro ao migrar dados existentes de unidades:', e)
    }

    // 3. Atualizar a coleção 'servidores' para suportar multifunção / cargos secundários
    const servidores = app.findCollectionByNameOrId('servidores')

    if (!servidores.fields.getByName('cargos_secundarios')) {
      servidores.fields.add(
        new JSONField({
          name: 'cargos_secundarios',
          required: false,
        }),
      )
    }

    app.save(servidores)

    // 4. Atualizar o cadastro do servidor "Francisco Alysson Albuquerque de saboia"
    // para ter Agente e Escrivão simultaneamente
    try {
      const alysson = app.findFirstRecordByData(
        'servidores',
        'nome',
        'Francisco Alysson Albuquerque de saboia',
      )
      alysson.set('cargo', 'Agente/Investigador')
      alysson.set('cargos_secundarios', ['Escrivão'])
      app.save(alysson)
    } catch (_) {
      try {
        // Tenta busca case-insensitive ou por id se conhecido
        const alyssonRecs = app.findRecordsByFilter(
          'servidores',
          "nome ~ 'Francisco Alysson'",
          '',
          1,
          0,
        )
        if (alyssonRecs.length > 0) {
          const rec = alyssonRecs[0]
          rec.set('cargo', 'Agente/Investigador')
          rec.set('cargos_secundarios', ['Escrivão'])
          app.save(rec)
        }
      } catch (err2) {
        console.log('Aviso: servidor Francisco Alysson não localizado para update:', err2)
      }
    }
  },
  (app) => {
    try {
      const unidades = app.findCollectionByNameOrId('unidades')
      const fEsc = unidades.fields.getByName('escrivaes')
      if (fEsc) unidades.fields.removeById(fEsc.id)
      const fAg = unidades.fields.getByName('agentes')
      if (fAg) unidades.fields.removeById(fAg.id)
      app.save(unidades)
    } catch (_) {}

    try {
      const servidores = app.findCollectionByNameOrId('servidores')
      const fSec = servidores.fields.getByName('cargos_secundarios')
      if (fSec) servidores.fields.removeById(fSec.id)
      app.save(servidores)
    } catch (_) {}
  },
)
