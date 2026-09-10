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
