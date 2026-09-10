import pb from '@/lib/pocketbase/client'
import type { Servidor, Unidade, Ferias, Feriado, Escala, Atribuicoes } from '@/types/police'

export const servidoresService = {
  async getAll(): Promise<Servidor[]> {
    return pb.collection('servidores').getFullList<Servidor>({
      sort: 'nome',
    })
  },

  async create(data: Omit<Servidor, 'id' | 'created' | 'updated'>): Promise<Servidor> {
    return pb.collection('servidores').create<Servidor>(data)
  },

  async update(id: string, data: Partial<Servidor>): Promise<Servidor> {
    return pb.collection('servidores').update<Servidor>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    // Check if servidor has associated escalas
    const inEscalas = await pb.collection('escalas').getList(1, 1, {
      filter: `delegado = "${id}" || escrivao = "${id}" || agente1 = "${id}" || agente2 = "${id}" || agente3 = "${id}"`,
    })
    if (inEscalas.totalItems > 0) {
      throw new Error(
        'Não é possível excluir este servidor pois ele possui escalas operacionais associadas.',
      )
    }

    // Check if in unidades
    const inUnidades = await pb.collection('unidades').getList(1, 1, {
      filter: `delegado = "${id}" || escrivao1 = "${id}" || escrivao2 = "${id}" || agente1 = "${id}" || agente2 = "${id}" || agente3 = "${id}" || agente4 = "${id}" || agente5 = "${id}" || agente6 = "${id}" || agente7 = "${id}" || agente8 = "${id}"`,
    })
    if (inUnidades.totalItems > 0) {
      throw new Error(
        'Não é possível excluir este servidor pois ele está lotado em uma Delegacia/Unidade.',
      )
    }

    await pb.collection('servidores').delete(id)
    return true
  },
}

export const unidadesService = {
  async getAll(): Promise<Unidade[]> {
    return pb.collection('unidades').getFullList<Unidade>({
      sort: 'nome',
      expand:
        'delegado,escrivao1,escrivao2,agente1,agente2,agente3,agente4,agente5,agente6,agente7,agente8',
    })
  },

  async create(data: Partial<Unidade>): Promise<Unidade> {
    return pb.collection('unidades').create<Unidade>(data)
  },

  async update(id: string, data: Partial<Unidade>): Promise<Unidade> {
    return pb.collection('unidades').update<Unidade>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    await pb.collection('unidades').delete(id)
    return true
  },
}

export const feriasService = {
  async getAll(): Promise<Ferias[]> {
    return pb.collection('ferias').getFullList<Ferias>({
      sort: '-inicio',
      expand: 'servidor',
    })
  },

  async create(data: { servidor: string; inicio: string; fim: string }): Promise<Ferias> {
    // Validate overlap for this servidor
    const existing = await pb.collection('ferias').getFullList<Ferias>({
      filter: `servidor = "${data.servidor}"`,
    })

    const newStart = new Date(data.inicio).getTime()
    const newEnd = new Date(data.fim).getTime()

    for (const f of existing) {
      const eStart = new Date(f.inicio).getTime()
      const eEnd = new Date(f.fim).getTime()
      if (newStart <= eEnd && newEnd >= eStart) {
        throw new Error(
          'Já existe um período de férias cadastrado para este servidor que sobrepõe as datas selecionadas.',
        )
      }
    }

    return pb.collection('ferias').create<Ferias>(data)
  },

  async update(
    id: string,
    data: { servidor: string; inicio: string; fim: string },
  ): Promise<Ferias> {
    const existing = await pb.collection('ferias').getFullList<Ferias>({
      filter: `servidor = "${data.servidor}" && id != "${id}"`,
    })

    const newStart = new Date(data.inicio).getTime()
    const newEnd = new Date(data.fim).getTime()

    for (const f of existing) {
      const eStart = new Date(f.inicio).getTime()
      const eEnd = new Date(f.fim).getTime()
      if (newStart <= eEnd && newEnd >= eStart) {
        throw new Error('Já existe um período de férias cadastrado que sobrepõe estas datas.')
      }
    }

    return pb.collection('ferias').update<Ferias>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    await pb.collection('ferias').delete(id)
    return true
  },

  isServidorEmFerias(feriasList: Ferias[], servidorId: string, dataTarget: Date): Ferias | null {
    if (!servidorId) return null
    const targetTime = new Date(
      dataTarget.getFullYear(),
      dataTarget.getMonth(),
      dataTarget.getDate(),
    ).getTime()

    for (const f of feriasList) {
      if (f.servidor !== servidorId) continue
      const start = new Date(f.inicio)
      const startTime = new Date(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        start.getUTCDate(),
      ).getTime()
      const end = new Date(f.fim)
      const endTime = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()).getTime()

      if (targetTime >= startTime && targetTime <= endTime) {
        return f
      }
    }
    return null
  },
}

export const feriadosService = {
  async getAll(): Promise<Feriado[]> {
    return pb.collection('feriados').getFullList<Feriado>({
      sort: 'data',
    })
  },

  async create(data: Partial<Feriado>): Promise<Feriado> {
    return pb.collection('feriados').create<Feriado>(data)
  },

  async update(id: string, data: Partial<Feriado>): Promise<Feriado> {
    return pb.collection('feriados').update<Feriado>(id, data)
  },

  async delete(id: string): Promise<boolean> {
    await pb.collection('feriados').delete(id)
    return true
  },
}

export const escalasService = {
  async getByMesAno(mes: number, ano: number): Promise<Escala[]> {
    return pb.collection('escalas').getFullList<Escala>({
      filter: `mes = ${mes} && ano = ${ano}`,
      sort: 'dia',
      expand: 'delegado,escrivao,agente1,agente2,agente3',
    })
  },

  async upsertDia(data: {
    mes: number
    ano: number
    dia: number
    tipo_dia: string
    delegado?: string | null
    escrivao?: string | null
    agente1?: string | null
    agente2?: string | null
    agente3?: string | null
  }): Promise<Escala> {
    // Check if exists
    const list = await pb.collection('escalas').getFullList<Escala>({
      filter: `mes = ${data.mes} && ano = ${data.ano} && dia = ${data.dia}`,
    })

    const payload = {
      mes: data.mes,
      ano: data.ano,
      dia: data.dia,
      tipo_dia: data.tipo_dia,
      delegado: data.delegado || null,
      escrivao: data.escrivao || null,
      agente1: data.agente1 || null,
      agente2: data.agente2 || null,
      agente3: data.agente3 || null,
    }

    if (list.length > 0) {
      return pb.collection('escalas').update<Escala>(list[0].id, payload, {
        expand: 'delegado,escrivao,agente1,agente2,agente3',
      })
    }

    return pb.collection('escalas').create<Escala>(payload, {
      expand: 'delegado,escrivao,agente1,agente2,agente3',
    })
  },

  async deleteDia(id: string): Promise<boolean> {
    await pb.collection('escalas').delete(id)
    return true
  },
}

export const atribuicoesService = {
  async getByMesAno(mes: number, ano: number): Promise<Atribuicoes | null> {
    const list = await pb.collection('atribuicoes').getFullList<Atribuicoes>({
      filter: `mes = ${mes} && ano = ${ano}`,
    })
    return list[0] || null
  },

  async save(mes: number, ano: number, conteudo: string): Promise<Atribuicoes> {
    const existing = await this.getByMesAno(mes, ano)
    if (existing) {
      return pb.collection('atribuicoes').update<Atribuicoes>(existing.id, { conteudo })
    }
    return pb.collection('atribuicoes').create<Atribuicoes>({ mes, ano, conteudo })
  },
}
