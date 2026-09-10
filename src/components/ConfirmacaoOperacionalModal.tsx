import React from 'react'
import { AlertCircle, AlertTriangle, HelpCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export interface ConfirmacaoOperacionalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  consequencia?: string
  tituloPadrao?: string
  variant?: 'warning' | 'danger' | 'info'
  confirmText?: string
  cancelText?: string
}

/**
 * Modal de Confirmação Inteligente para Alteração de Regras Operacionais e Quantitativos Policiais.
 * Texto padrão requerido:
 * "Você realmente confirma essa inclusão/alteração fora do padrão?"
 * com subtítulo contextual explicando a consequência e opções "Sim, confirmar" e "Cancelar".
 * Ou para o item de quantitativo padrão:
 * "Atenção: Esta unidade já atingiu a quantidade padrão recomendada. Você realmente deseja inserir mais um servidor?"
 */
export function ConfirmacaoOperacionalModal({
  open,
  onOpenChange,
  onConfirm,
  title = 'Você realmente confirma essa inclusão/alteração fora do padrão?',
  consequencia,
  variant = 'warning',
  confirmText = 'Sim, confirmar',
  cancelText = 'Cancelar',
}: ConfirmacaoOperacionalModalProps) {
  const Icon = variant === 'danger' ? AlertCircle : variant === 'info' ? HelpCircle : AlertTriangle

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white max-w-md border border-[#E5E9F0]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base font-bold text-[#0B2545] flex items-start gap-2.5 leading-snug">
            <Icon
              className={`w-5 h-5 shrink-0 mt-0.5 ${
                variant === 'danger'
                  ? 'text-red-600'
                  : variant === 'info'
                    ? 'text-blue-600'
                    : 'text-[#C9A227]'
              }`}
            />
            <span>{title}</span>
          </AlertDialogTitle>
          {consequencia && (
            <AlertDialogDescription className="text-xs text-[#4B5563] pt-2 leading-relaxed bg-[#F5F7FA] p-3 rounded-lg border border-[#E5E9F0] mt-2">
              <strong className="text-[#0B2545] block mb-0.5 font-semibold">
                Impacto Operacional:
              </strong>
              {consequencia}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-2">
          <AlertDialogCancel className="border-[#D1D5DB] text-xs h-9">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
              onOpenChange(false)
            }}
            className="bg-[#0B2545] hover:bg-[#081A33] text-white text-xs h-9 font-medium"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default ConfirmacaoOperacionalModal
