/**
 * Reusable skeleton block with pulse animation matching the dark theme.
 */
export function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{ background: 'var(--bg-3)', ...style }}
    />
  )
}

export function SkeletonText({ width = '100%', height = '13px' }: { width?: string; height?: string }) {
  return <Skeleton style={{ width, height, borderRadius: '6px' }} />
}

export function SkeletonCard({ height = '80px', className = '' }: { height?: string; className?: string }) {
  return (
    <div
      className={`rounded-[10px] p-5 ${className}`}
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}
    >
      <Skeleton style={{ height }} />
    </div>
  )
}
