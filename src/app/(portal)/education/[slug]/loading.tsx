import { Skeleton } from '@/components/ui/Skeleton'

export default function ModuleLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-6 rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
      <div className="lg:w-[280px] p-4 space-y-4" style={{ borderRight: '1px solid var(--border)' }}>
        <Skeleton style={{ height: '16px', width: '80%' }} />
        <Skeleton style={{ height: '6px', width: '100%', borderRadius: '4px' }} />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} style={{ height: '36px', width: '100%', borderRadius: '8px' }} />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <Skeleton style={{ height: '20px', width: '70%', marginBottom: '16px' }} />
        <Skeleton style={{ height: '280px', width: '100%', borderRadius: '8px', marginBottom: '16px' }} />
        <Skeleton style={{ height: '80px', width: '100%', borderRadius: '8px' }} />
      </div>
    </div>
  )
}
