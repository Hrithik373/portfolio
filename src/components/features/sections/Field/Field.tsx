export function Field({
  id,
  label,
  children,
  theme = 'night',
}: {
  id: string
  label: string
  children: React.ReactNode
  theme?: 'night' | 'day'
}) {
  const labelTone =
    theme === 'night' ? 'text-parchment/70' : 'text-[color:var(--dawn-muted)]'
  return (
    <label className={`flex flex-col gap-1 text-xs ${labelTone}`} htmlFor={id}>
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}
