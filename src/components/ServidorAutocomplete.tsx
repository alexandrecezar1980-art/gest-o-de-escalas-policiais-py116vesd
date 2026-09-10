import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, Check, ChevronsUpDown, User, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Servidor, CargoServidor } from '@/types/police'
import { formatarCpf } from '@/lib/cpfValidation'

export interface ServidorAutocompleteProps {
  servidores: Servidor[]
  value?: string | null
  onChange: (servidorId: string) => void
  placeholder?: string
  filtroCargo?: CargoServidor | CargoServidor[]
  disabled?: boolean
  disabledIds?: string[]
  disabledMessage?: string
  className?: string
  allowClear?: boolean
  labelVazio?: string
  warningIds?: { id: string; motivo: string }[]
}

export function ServidorAutocomplete({
  servidores,
  value,
  onChange,
  placeholder = 'Buscar por nome, cargo ou matrícula...',
  filtroCargo,
  disabled = false,
  disabledIds = [],
  disabledMessage = 'Indisponível',
  className = '',
  allowClear = true,
  labelVazio = 'Nenhum servidor selecionado',
  warningIds = [],
}: ServidorAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [openUpwards, setOpenUpwards] = useState(false)
  const [busca, setBusca] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Servidor selecionado atualmente
  const selecionado = useMemo(() => {
    if (!value) return null
    return servidores.find((s) => s.id === value) || null
  }, [servidores, value])

  // Filtragem inicial por cargo (se houver restrição)
  const servidoresFiltradosPorCargo = useMemo(() => {
    if (!filtroCargo) return servidores
    const cargos = Array.isArray(filtroCargo) ? filtroCargo : [filtroCargo]
    return servidores.filter((s) => cargos.includes(s.cargo))
  }, [servidores, filtroCargo])

  // Filtragem pela digitação: NOME, CARGO ou MATRÍCULA (ou CPF)
  const listaFiltrada = useMemo(() => {
    const termo = busca.toLowerCase().trim()
    if (!termo) return servidoresFiltradosPorCargo

    const termoSemMascara = termo.replace(/\D/g, '')

    return servidoresFiltradosPorCargo.filter((s) => {
      const matchNome = s.nome.toLowerCase().includes(termo)
      const matchCargo = s.cargo.toLowerCase().includes(termo)
      const matchMatricula = !!(s.matricula && s.matricula.toLowerCase().includes(termo))
      const matchCpf = !!(
        s.cpf &&
        termoSemMascara.length >= 3 &&
        s.cpf.replace(/\D/g, '').includes(termoSemMascara)
      )
      return matchNome || matchCargo || matchMatricula || matchCpf
    })
  }, [servidoresFiltradosPorCargo, busca])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = () => {
    if (disabled) return

    // Verifica espaço na tela para abrir para cima se estiver no final do container/viewport
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      // Se tiver menos de 280px abaixo e houver mais espaço acima, abre para cima
      if (spaceBelow < 280 && rect.top > spaceBelow) {
        setOpenUpwards(true)
      } else {
        setOpenUpwards(false)
      }
    }

    setIsOpen(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  const handleSelect = (s: Servidor) => {
    if (disabledIds.includes(s.id)) return
    onChange(s.id)
    setIsOpen(false)
    setBusca('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setBusca('')
  }

  // Destaque visual do termo digitado
  const renderHighlighted = (texto: string, highlight: string) => {
    if (!highlight.trim()) return texto
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = texto.split(regex)
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-black px-0.5 rounded font-semibold">
              {part}
            </mark>
          ) : (
            part
          ),
        )}
      </span>
    )
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Gatilho / Visualização atual */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleOpen()
          }
        }}
        className={`w-full h-10 px-3 py-1.5 rounded-md border text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer select-none ${
          disabled
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : isOpen
              ? 'border-[#0B2545] ring-2 ring-[#0B2545]/20 bg-white'
              : selecionado
                ? 'border-[#D1D5DB] bg-white hover:border-[#0B2545]/50'
                : 'border-[#D1D5DB] bg-[#F9FAFB] hover:bg-white text-gray-500'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Search className="w-3.5 h-3.5 shrink-0 text-[#6B7280]" />
          {selecionado ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-[#0B2545] truncate">{selecionado.nome}</span>
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1 border-[#0B2545]/30 bg-blue-50/50 text-[#0B2545] shrink-0 font-normal"
              >
                {selecionado.cargo}
              </Badge>
              {selecionado.matricula && (
                <span className="text-[10px] text-gray-500 font-mono shrink-0">
                  Mat: {selecionado.matricula}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-400 italic truncate">{placeholder || labelVazio}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && selecionado && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
              title="Limpar seleção"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </div>

      {/* Popover flutuante com campo de busca e lista */}
      {isOpen && !disabled && (
        <div
          className={`absolute z-[9999] left-0 right-0 bg-white rounded-lg border border-[#D1D5DB] shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 min-w-[280px] ${
            openUpwards ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {/* Input de busca */}
          <div className="p-2 border-b border-[#E5E9F0] bg-[#F5F7FA]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                ref={inputRef}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Digite nome, cargo ou matrícula..."
                className="h-8 pl-8 pr-7 text-xs bg-white border-[#D1D5DB]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false)
                  }
                }}
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de servidores */}
          <div className="max-h-60 overflow-y-auto divide-y divide-[#F0F2F5] p-1">
            {listaFiltrada.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-[#6B7280]">
                <User className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                <p className="font-medium text-gray-600">Nenhum servidor encontrado</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Tente buscar por outros termos ou verifique a ortografia.
                </p>
              </div>
            ) : (
              listaFiltrada.map((s) => {
                const isSelected = s.id === value
                const isDisabled = disabledIds.includes(s.id)
                const warning = warningIds.find((w) => w.id === s.id)

                return (
                  <div
                    key={s.id}
                    onClick={() => !isDisabled && handleSelect(s)}
                    className={`p-2 rounded text-xs flex items-center justify-between gap-2 transition-colors ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-gray-50'
                        : isSelected
                          ? 'bg-[#0B2545]/10 text-[#0B2545] font-semibold cursor-pointer'
                          : 'hover:bg-[#F5F7FA] cursor-pointer text-[#1F2937]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium">{renderHighlighted(s.nome, busca)}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0B2545] shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#6B7280] flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1 border-gray-300 text-gray-700 bg-gray-50"
                        >
                          {renderHighlighted(s.cargo, busca)}
                        </Badge>
                        {s.matricula && (
                          <span className="font-mono">
                            Mat: {renderHighlighted(s.matricula, busca)}
                          </span>
                        )}
                        {s.cpf && (
                          <span className="font-mono text-gray-400">CPF: {formatarCpf(s.cpf)}</span>
                        )}
                      </div>
                      {warning && !isDisabled && (
                        <p className="text-[10px] text-amber-700 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{warning.motivo}</span>
                        </p>
                      )}
                    </div>

                    {isDisabled && (
                      <span className="text-[10px] text-red-600 shrink-0 font-medium">
                        {disabledMessage}
                      </span>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ServidorAutocomplete
