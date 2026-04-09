import Badge from '@/components/ui/Badge'
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/utils'
import type { ReadingStatus } from '@/types'

interface StatusBadgeProps {
  status: ReadingStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge className={STATUS_COLOR[status]}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}
