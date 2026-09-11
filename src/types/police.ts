export type CargoServidor = 'Delegado' | 'Escrivão' | 'Agente/Investigador'
export type StatusServidor = 'Ativo' | 'Inativo'
export type DiaCompensacao =
  | 'Segunda-feira'
  | 'Terça-feira'
  | 'Quarta-feira'
  | 'Quinta-feira'
  | 'Sexta-feira'
  | 'Sábado'
  | 'Domingo'
  | 'Rotativo'

export interface Servidor {
  id: string
  nome: string
  cargo: CargoServidor
  cargos_secundarios?: CargoServidor[]
  telefone: string
  status: StatusServidor
  matricula?: string
  cpf?: string
  email?: string
  dia_compensacao?: DiaCompensacao | string
  created: string
  updated: string
}

export interface Unidade {
  id: string
  nome: string
  delegado: string
  escrivao1?: string | null
  escrivao2?: string | null
  escrivaes?: string[]
  agente1?: string | null
  agente2?: string | null
  agente3?: string | null
  agente4?: string | null
  agente5?: string | null
  agente6?: string | null
  agente7?: string | null
  agente8?: string | null
  agentes?: string[]
  created: string
  updated: string
  [key: string]: unknown
  expand?: {
    delegado?: Servidor
    escrivao1?: Servidor
    escrivao2?: Servidor
    agente1?: Servidor
    agente2?: Servidor
    agente3?: Servidor
    agente4?: Servidor
    agente5?: Servidor
    agente6?: Servidor
    agente7?: Servidor
    agente8?: Servidor
  }
}

/**
 * Retorna todos os cargos/funções de um servidor (cargo principal + cargos secundários)
 */
export function getCargosServidor(s: Servidor | undefined | null): CargoServidor[] {
  if (!s) return []
  const cargos: CargoServidor[] = [s.cargo]
  if (Array.isArray(s.cargos_secundarios)) {
    for (const c of s.cargos_secundarios) {
      if (c && !cargos.includes(c)) {
        cargos.push(c)
      }
    }
  }
  return cargos
}

/**
 * Verifica se o servidor possui determinado cargo (seja primário ou secundário)
 */
export function servidorTemCargo(s: Servidor | undefined | null, cargo: CargoServidor): boolean {
  if (!s) return false
  return getCargosServidor(s).includes(cargo)
}

/**
 * Helper para extrair a lista completa de IDs de escrivães de uma unidade
 */
export function getUnidadeEscrivaes(u: Unidade | undefined | null): string[] {
  if (!u) return []
  if (Array.isArray(u.escrivaes) && u.escrivaes.length > 0) {
    return u.escrivaes.filter(Boolean)
  }
  const list: string[] = []
  if (u.escrivao1) list.push(u.escrivao1)
  if (u.escrivao2 && !list.includes(u.escrivao2)) list.push(u.escrivao2)
  return list
}

/**
 * Helper para extrair a lista completa de IDs de agentes de uma unidade
 */
export function getUnidadeAgentes(u: Unidade | undefined | null): string[] {
  if (!u) return []
  if (Array.isArray(u.agentes) && u.agentes.length > 0) {
    return u.agentes.filter(Boolean)
  }
  const list: string[] = []
  for (let i = 1; i <= 8; i++) {
    const val = (u as Record<string, unknown>)[`agente${i}`] as string | undefined
    if (val && !list.includes(val)) list.push(val)
  }
  return list
}

export interface Ferias {
  id: string
  servidor: string
  inicio: string
  fim: string
  created: string
  updated: string
  expand?: {
    servidor?: Servidor
  }
}

export type TipoFeriado = 'Nacional' | 'Estadual' | 'Municipal'

export interface Feriado {
  id: string
  nome: string
  data: string // ISO date string
  tipo: TipoFeriado
  recorrente?: boolean
  created: string
  updated: string
}

export type TipoDiaEscala = 'Dia Útil' | 'Sexta-Feira' | 'Sábado' | 'Domingo' | 'Feriado'

export interface Escala {
  id: string
  mes: number
  ano: number
  dia: number
  tipo_dia: TipoDiaEscala
  delegado?: string
  escrivao?: string
  agente1?: string
  agente2?: string
  agente3?: string
  horarios_custom?: string
  created: string
  updated: string
  expand?: {
    delegado?: Servidor
    escrivao?: Servidor
    agente1?: Servidor
    agente2?: Servidor
    agente3?: Servidor
  }
}

export interface Atribuicoes {
  id: string
  mes: number
  ano: number
  conteudo?: string
  created: string
  updated: string
}

export interface Custodia {
  id: string
  mes: number
  ano: number
  dia: number
  viatura: string
  agente1?: string | null
  agente2?: string | null
  agente3?: string | null
  observacao?: string | null
  created: string
  updated: string
  expand?: {
    agente1?: Servidor
    agente2?: Servidor
    agente3?: Servidor
  }
}

export interface Permanencia {
  id: string
  mes: number
  ano: number
  dia: number
  agente1?: string | null
  agente2?: string | null
  created: string
  updated: string
  expand?: {
    agente1?: Servidor
    agente2?: Servidor
  }
}
