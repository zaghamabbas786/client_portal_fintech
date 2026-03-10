import { Skeleton } from '@/components/ui/Skeleton'

export default function EducationLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton style={{ height: '22px', width: '150px', marginBottom: '8px' }} />
        <Skeleton style={{ height: '13px', width: '260px' }} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-[10px] overflow-hidden" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
            <Skeleton style={{ height: '80px', borderRadius: '0' }} />
            <div className="p-4 space-y-3">
              <Skeleton style={{ height: '14px', width: '70%' }} />
              <Skeleton style={{ height: '11px', width: '50%' }} />
              <Skeleton style={{ height: '6px', width: '100%', borderRadius: '4px' }} />
              <Skeleton style={{ height: '9px', width: '60px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
