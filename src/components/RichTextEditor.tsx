import React, { useRef } from 'react'
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RichTextEditorProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null)

  // Sync value to innerHTML when value changes externally (not on every keypress)
  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const exec = (command: string, arg: string | undefined = undefined) => {
    if (disabled) return
    document.execCommand(command, false, arg)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  return (
    <div>
      {/* Visualização de Impressão (sempre estática, altura auto, sem scroll e sem barras) */}
      <div
        className="hidden print:block print:w-full print:p-2 print:border-none print:shadow-none print:bg-transparent text-[#1F2937] prose prose-sm max-w-none break-inside-avoid print:overflow-visible print:h-auto"
        dangerouslySetInnerHTML={{
          __html:
            value || '<p className="text-gray-400 italic">Nenhuma atribuição configurada.</p>',
        }}
      />

      {/* Visualização em tela */}
      <div className="print:hidden">
        {disabled ? (
          <div
            className="w-full min-h-[160px] p-4 bg-[#F9FAFB] border border-[#E5E9F0] rounded-lg text-sm text-[#1F2937] prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html:
                value || '<p className="text-gray-400 italic">Nenhuma atribuição configurada.</p>',
            }}
          />
        ) : (
          <div className="border border-[#D1D5DB] rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#1D4E89] focus-within:border-transparent">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-1.5 bg-[#F5F7FA] border-b border-[#E5E9F0]">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => exec('bold')}
                className="h-8 w-8 p-0 text-[#0B2545] hover:bg-white"
                title="Negrito"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => exec('italic')}
                className="h-8 w-8 p-0 text-[#0B2545] hover:bg-white"
                title="Itálico"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <div className="w-px h-5 bg-[#E5E9F0] mx-1" />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => exec('formatBlock', '<h3>')}
                className="h-8 w-8 p-0 text-[#0B2545] hover:bg-white font-bold text-xs"
                title="Título 1"
              >
                <Heading1 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => exec('formatBlock', '<h4>')}
                className="h-8 w-8 p-0 text-[#0B2545] hover:bg-white font-bold text-xs"
                title="Título 2"
              >
                <Heading2 className="w-4 h-4" />
              </Button>
              <div className="w-px h-5 bg-[#E5E9F0] mx-1" />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => exec('insertUnorderedList')}
                className="h-8 w-8 p-0 text-[#0B2545] hover:bg-white"
                title="Lista com Marcadores"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => exec('insertOrderedList')}
                className="h-8 w-8 p-0 text-[#0B2545] hover:bg-white"
                title="Lista Numerada"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
              <div className="w-px h-5 bg-[#E5E9F0] mx-1" />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => exec('removeFormat')}
                className="h-8 w-8 p-0 text-[#6B7280] hover:bg-white"
                title="Limpar Formatação"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Editable Area */}
            <div
              ref={editorRef}
              contentEditable={!disabled}
              onInput={handleInput}
              className="w-full min-h-[180px] max-h-[360px] overflow-y-auto p-4 text-sm text-[#1F2937] focus:outline-none prose prose-sm max-w-none"
            />
          </div>
        )}
      </div>
    </div>
  )
}
