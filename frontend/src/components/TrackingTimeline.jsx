import { Package, RefreshCw, CheckCircle2, Clock, Truck, MapPin, XCircle } from 'lucide-react';

const STATUS_META = {
  pending:           { icon: Clock,     color: 'text-yellow-600', bg: 'bg-yellow-100', line: 'bg-yellow-300' },
  confirmed:         { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-100',   line: 'bg-blue-300' },
  processing:        { icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-100', line: 'bg-purple-300' },
  shipped:           { icon: Package,   color: 'text-indigo-600', bg: 'bg-indigo-100', line: 'bg-indigo-300' },
  out_for_delivery:  { icon: Truck,     color: 'text-orange-600', bg: 'bg-orange-100', line: 'bg-orange-300' },
  delivered:         { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100', line: 'bg-green-300' },
  cancelled:         { icon: XCircle,   color: 'text-red-600',   bg: 'bg-red-100',    line: 'bg-red-300' },
};

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

export default function TrackingTimeline({ updates = [], orderStatus, compact = false }) {
  const sorted = [...updates].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (sorted.length === 0) {
    const meta = STATUS_META[orderStatus] || STATUS_META.pending;
    const Icon = meta.icon;
    return (
      <div className="tracking-empty">
        <Icon size={24} className={meta.color} />
        <div>
          <p className="tracking-empty-title">No tracking updates yet</p>
          <p className="tracking-empty-sub">Updates will appear here as the order progresses</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`tracking-timeline ${compact ? 'tracking-compact' : ''}`}>
      {sorted.map((update, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === sorted.length - 1;
        const meta = STATUS_META[update.status] || STATUS_META.pending;
        const Icon = meta.icon;

        return (
          <div key={idx} className="tracking-step">
            {/* Connector line */}
            {!isLast && <div className={`tracking-line ${meta.line}`} />}

            {/* Icon circle */}
            <div className={`tracking-dot ${meta.bg} ${meta.color} ${isFirst ? 'tracking-dot-current' : ''}`}>
              <Icon size={compact ? 12 : 14} />
            </div>

            {/* Content */}
            <div className="tracking-content">
              <div className="tracking-content-header">
                <span className={`tracking-status-label ${meta.color}`}>
                  {update.status.replace(/_/g, ' ')}
                </span>
                <span className="tracking-time">{formatDateTime(update.timestamp)}</span>
              </div>
              {update.note && <p className="tracking-note">{update.note}</p>}
              {update.location && (
                <p className="tracking-location">
                  <MapPin size={12} /> {update.location}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
