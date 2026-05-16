import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';

function formatUptime(seconds) {
  if (!seconds || seconds < 0) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function LiveSystemIndicator() {
  const [state, setState] = useState({
    status: 'checking',
    latency: null,
    data: null,
    error: null,
  });
  const [showTooltip, setShowTooltip] = useState(false);
  const [checking, setChecking] = useState(true);
  const tooltipRef = useRef(null);
  const wrapperRef = useRef(null);
  const mountedRef = useRef(true);

  const checkHealth = useCallback(async () => {
    const start = performance.now();
    try {
      const { data } = await api.get('/health', { timeout: 5000 });
      if (!mountedRef.current) return;
      setState({
        status: data.database === 'connected' ? 'healthy' : 'degraded',
        latency: Math.round(performance.now() - start),
        data,
        error: null,
      });
    } catch {
      if (!mountedRef.current) return;
      setState(prev => ({
        ...prev,
        status: 'down',
        latency: Math.round(performance.now() - start),
        error: 'Backend unreachable',
        data: null,
      }));
    } finally {
      if (mountedRef.current) setChecking(false);
    }
  }, []);

  // Initial check + auto-poll every 30s
  useEffect(() => {
    mountedRef.current = true;
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [checkHealth]);

  // Close tooltip on outside click
  useEffect(() => {
    const handler = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowTooltip(false);
      }
    };
    if (showTooltip) {
      document.addEventListener('mousedown', handler);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [showTooltip]);

  const statusConfig = {
    healthy: { dotClass: 'live-dot-green', label: 'Live', pulse: true },
    degraded: { dotClass: 'live-dot-yellow', label: 'Degraded', pulse: true },
    down: { dotClass: 'live-dot-red', label: 'Down', pulse: false },
    checking: { dotClass: 'live-dot-gray', label: 'Checking...', pulse: true },
  };

  const current = statusConfig[state.status] || statusConfig.checking;

  const tooltipLines = [];
  if (state.status === 'healthy' || state.status === 'degraded') {
    tooltipLines.push(['Server', state.status === 'healthy' ? 'Healthy' : 'Degraded']);
    tooltipLines.push(['Response Time', `${state.latency}ms`]);
    tooltipLines.push(['Database', state.data?.database || '—']);
    if (state.data?.uptime) tooltipLines.push(['Uptime', formatUptime(state.data.uptime)]);
    if (state.data?.memory?.rss) tooltipLines.push(['Memory', formatBytes(state.data.memory.rss)]);
    tooltipLines.push(['Node', state.data?.node || '—']);
  } else if (state.status === 'down') {
    tooltipLines.push(['Status', 'Backend Offline']);
    if (state.latency) tooltipLines.push(['Response Time', `${state.latency}ms (timeout)`]);
  }

  return (
    <div className="live-system-wrapper" ref={wrapperRef}>
      <button
        className="live-system-pill"
        onClick={() => {
          setShowTooltip(!showTooltip);
          if (state.status !== 'checking') checkHealth();
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => {
          if (!tooltipRef.current?.matches(':hover')) setShowTooltip(false);
        }}
        disabled={checking}
      >
        <span
          className={`live-system-dot ${current.dotClass} ${current.pulse ? 'live-pulse' : ''}`}
        />
        <span className="live-system-label">{current.label}</span>
        {state.latency !== null && state.status !== 'checking' && (
          <span
            className={`live-system-latency ${state.status === 'down' ? 'live-latency-down' : ''}`}
          >
            {state.latency}ms
          </span>
        )}
      </button>

      {showTooltip && (
        <div
          className="live-system-tooltip"
          ref={tooltipRef}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="live-tooltip-header">
            <span className={`live-tooltip-dot ${current.dotClass}`} />
            <span className="live-tooltip-title">System Status</span>
          </div>
          <div className="live-tooltip-body">
            {tooltipLines.map(([key, val]) => (
              <div key={key} className="live-tooltip-row">
                <span className="live-tooltip-key">{key}</span>
                <span className="live-tooltip-val">{val}</span>
              </div>
            ))}
          </div>
          <div className="live-tooltip-footer">
            <span>Click to refresh · Polls every 30s</span>
          </div>
        </div>
      )}
    </div>
  );
}
