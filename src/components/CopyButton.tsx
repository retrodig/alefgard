import { useEffect, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'

interface Props {
  text: string
  label: string
  icon?: ReactNode
}

export function CopyButton({ text, label, icon }: Props) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (status === 'idle') return
    const id = setTimeout(() => setStatus('idle'), 2000)
    return () => clearTimeout(id)
  }, [status])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus('copied')
    } catch {
      setStatus('failed')
    }
  }

  return (
    <button type="button" onClick={copy} aria-live="polite">
      {status === 'copied' ? <Check size={15} /> : (icon ?? <Copy size={15} />)}
      {status === 'copied' ? 'コピーしました' : status === 'failed' ? 'コピーできません' : label}
    </button>
  )
}
