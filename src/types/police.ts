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
  agente1?: string | null
  agente2?: string | null
  agente3?: string | null
  agente4?: string | null
  agente5?: string | null
  agente6?: string | null
  agente7?: string | null
  agente8?: string | null
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
