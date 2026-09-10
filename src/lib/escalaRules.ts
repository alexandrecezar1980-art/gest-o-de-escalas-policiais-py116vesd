import type { TipoDiaEscala } from '@/types/police'

export interface HorariosPlantao {
  plantaoDesc: string
  agente1: string
  agente2: string
  agente3?: string
}

/**
 * Calcula os horários dos agentes conforme as regras prescritivas do PRD:
 *
 * a) Dias Úteis (Segunda a Quinta — plantão de 14h, das 18h às 08h do dia seguinte):
 *    - Composição padrão 2 agentes: "DAS 18HS ÀS 01HS" e "DAS 01HS ÀS 08HS".
 *    - Regra flexível: Se adicionar 3º agente no dia útil, muda automaticamente para a divisão da Sexta-Feira!
 *
 * b) Sextas-Feiras (plantão de 14h, das 18h às 08h do dia seguinte):
 *    - 3 agentes: "DAS 18HS ÀS 24HS", "DAS 24HS ÀS 04HS", "DAS 04HS ÀS 08HS".
 *
 * c) Sábados, Domingos e Feriados (plantão de 24h, das 08h às 08h):
 *    - 3 agentes: "DAS 08HS ÀS 16HS", "DAS 16HS ÀS 24HS", "DAS 24HS ÀS 08HS".
 */
export function calcularHorariosAgentes(
  tipoDia: TipoDiaEscala,
  temAgente3: boolean,
): HorariosPlantao {
  if (tipoDia === 'Sábado' || tipoDia === 'Domingo' || tipoDia === 'Feriado') {
    return {
      plantaoDesc: 'Plantão 24h (08h às 08h)',
      agente1: 'DAS 08HS ÀS 16HS',
      agente2: 'DAS 16HS ÀS 24HS',
      agente3: 'DAS 24HS ÀS 08HS',
    }
  }

  if (tipoDia === 'Sexta-Feira') {
    return {
      plantaoDesc: 'Plantão 14h (18h às 08h)',
      agente1: 'DAS 18HS ÀS 24HS',
      agente2: 'DAS 24HS ÀS 04HS',
      agente3: 'DAS 04HS ÀS 08HS',
    }
  }

  // Dia Útil (Segunda a Quinta)
  if (temAgente3) {
    // Regra flexível PRD: 3º agente em dia útil adota divisões de sexta
    return {
      plantaoDesc: 'Plantão 14h (18h às 08h) - Composição Tripla',
      agente1: 'DAS 18HS ÀS 24HS',
      agente2: 'DAS 24HS ÀS 04HS',
      agente3: 'DAS 04HS ÀS 08HS',
    }
  }

  return {
    plantaoDesc: 'Plantão 14h (18h às 08h)',
    agente1: 'DAS 18HS ÀS 01HS',
    agente2: 'DAS 01HS ÀS 08HS',
    agente3: undefined,
  }
}

export function formatarTelefone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (!digits) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function formatarDataBr(isoDate: string | Date | undefined): string {
  if (!isoDate) return '-'
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return '-'
  const day = String(d.getUTCDate()).padStart(2, '0')
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const year = d.getUTCFullYear()
  return `${day}/${month}/${year}`
}

export function formatarDataIsoBr(dateStr: string): string {
  // receives YYYY-MM-DD or ISO string
  if (!dateStr) return ''
  const parts = dateStr.slice(0, 10).split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

/**
 * Converte qualquer formato de telefone brasileiro para E.164 limpo para wa.me (55 + DDD + número)
 * Ex: (83) 98888-7777 -> 5583988887777
 */
export function formatarNumeroWhatsapp(telefone: string): string {
  const digits = (telefone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits
  }
  return `55${digits}`
}

export interface ServidorInfoContato {
  cargo: string
  nome: string
  telefone: string
  horario?: string
}

export interface DadosMensagemWhatsapp {
  dataStr: string // ex: 15/04/2025
  diaSemana: string // ex: TERÇA-FEIRA ou Terça-Feira
  delegado?: ServidorInfoContato | null
  escrivao?: ServidorInfoContato | null
  agente1?: ServidorInfoContato | null
  agente2?: ServidorInfoContato | null
  agente3?: ServidorInfoContato | null
}

/**
 * Gera mensagem formatada para WhatsApp:
 *
 * *PLANTÃO POLICIAL - [DATA] ([DIA DA SEMANA])*
 * • Delegado: [Nome] (Tel: [Telefone])
 * • Escrivão: [Nome] (Tel: [Telefone])
 * • Agente 1 ([Horário]): [Nome] (Tel: [Telefone])
 * • Agente 2 ([Horário]): [Nome] (Tel: [Telefone])
 * • Agente 3 ([Horário]): [Nome] (Tel: [Telefone])
 */
export function gerarTextoWhatsappPlantao(dados: DadosMensagemWhatsapp): string {
  const linhas: string[] = []
  const diaSemanaUpper = dados.diaSemana.toUpperCase()

  linhas.push(`*PLANTÃO POLICIAL - ${dados.dataStr} (${diaSemanaUpper})*`)

  const delNome = dados.delegado?.nome ? dados.delegado.nome : 'A definir'
  const delTel = dados.delegado?.telefone
    ? formatarTelefone(dados.delegado.telefone)
    : 'Não informado'
  linhas.push(`• Delegado: ${delNome} (Tel: ${delTel})`)

  const escNome = dados.escrivao?.nome ? dados.escrivao.nome : 'A definir'
  const escTel = dados.escrivao?.telefone
    ? formatarTelefone(dados.escrivao.telefone)
    : 'Não informado'
  linhas.push(`• Escrivão: ${escNome} (Tel: ${escTel})`)

  const ag1Nome = dados.agente1?.nome ? dados.agente1.nome : 'A definir'
  const ag1Tel = dados.agente1?.telefone
    ? formatarTelefone(dados.agente1.telefone)
    : 'Não informado'
  const ag1Horario = dados.agente1?.horario ? ` (${dados.agente1.horario})` : ''
  linhas.push(`• Agente 1${ag1Horario}: ${ag1Nome} (Tel: ${ag1Tel})`)

  const ag2Nome = dados.agente2?.nome ? dados.agente2.nome : 'A definir'
  const ag2Tel = dados.agente2?.telefone
    ? formatarTelefone(dados.agente2.telefone)
    : 'Não informado'
  const ag2Horario = dados.agente2?.horario ? ` (${dados.agente2.horario})` : ''
  linhas.push(`• Agente 2${ag2Horario}: ${ag2Nome} (Tel: ${ag2Tel})`)

  if (dados.agente3) {
    const ag3Nome = dados.agente3.nome || 'A definir'
    const ag3Tel = dados.agente3.telefone
      ? formatarTelefone(dados.agente3.telefone)
      : 'Não informado'
    const ag3Horario = dados.agente3.horario ? ` (${dados.agente3.horario})` : ''
    linhas.push(`• Agente 3${ag3Horario}: ${ag3Nome} (Tel: ${ag3Tel})`)
  }

  return linhas.join('\n')
}
