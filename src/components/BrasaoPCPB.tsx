import React from 'react'
import brasaoImg from '@/assets/brasaopcpb-96006.png'
import { cn } from '@/lib/utils'

export interface BrasaoPCPBProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
}

const sizeClasses: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string> = {
  xs: 'w-4 h-auto',
  sm: 'w-7 h-auto',
  md: 'w-10 h-auto',
  lg: 'w-12 h-auto',
  xl: 'w-16 h-auto',
}

/**
 * BrasaoPCPB - Brasão oficial da Polícia Civil do Estado da Paraíba.
 * Substitui o antigo ícone genérico lucide shield em cabeçalhos, navbar, login e relatórios impressos.
 */
export const BrasaoPCPB: React.FC<BrasaoPCPBProps> = ({
  size = 'md',
  className,
  alt = 'Brasão da Polícia Civil da Paraíba',
  ...props
}) => {
  const sizeClass = typeof size === 'string' ? sizeClasses[size] : undefined
  const inlineStyle =
    typeof size === 'number' ? { width: `${size}px`, height: 'auto', ...props.style } : props.style

  return (
    <img
      src={brasaoImg}
      alt={alt}
      loading="eager"
      decoding="async"
      style={inlineStyle}
      className={cn(
        'object-contain drop-shadow-sm select-none shrink-0 pointer-events-none',
        sizeClass,
        className,
      )}
      {...props}
    />
  )
}

export default BrasaoPCPB
