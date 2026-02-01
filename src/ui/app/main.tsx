import React, { useEffect, useMemo, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';

type WorkItemSummary = {
  id: string;
  title: string;
  status: string | null;
  priority: string | null;
  task_type: string | null;
  created_at: string;
  updated_at: string;
};

type TimelineItem = {
  id: string;
  title: string;
  kind: string;
  status: string | null;
  priority: string | null;
  parent_id: string | null;
  level: number;
  not_before: string | null;
  not_after: string | null;
  estimate_minutes: number | null;
  actual_minutes: number | null;
  created_at: string;
};

type TimelineDependency = {
  id: string;
  from_id: string;
  to_id: string;
  kind: string;
};

type TimelineResponse = {
  items: TimelineItem[];
  dependencies: TimelineDependency[];
};

type WorkItemsResponse = {
  items: WorkItemSummary[];
};

function usePathname(): string {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const onPopState = (): void => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return path;
}

function WorkItemsListPage(): React.JSX.Element {
  const bootstrap = readBootstrap();

  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'loaded'; items: WorkItemSummary[] }
  >(() => {
    const items = bootstrap?.workItems;
    if (items && items.length > 0) return { kind: 'loaded', items };
    return { kind: 'loading' };
  });

  useEffect(() => {
    if (state.kind === 'loaded') return;

    let alive = true;

    async function run(): Promise<void> {
      try {
        const res = await fetch('/api/work-items', {
          headers: { accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`GET /api/work-items failed: ${res.status}`);

        const data = (await res.json()) as WorkItemsResponse;
        if (!alive) return;
        setState({ kind: 'loaded', items: data.items });
      } catch (err) {
        if (!alive) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setState({ kind: 'error', message });
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [state.kind]);

  return (
    <main style={{ padding: 16 }}>
      <h1>Work items</h1>

      {state.kind === 'loading' ? <p>Loading…</p> : null}
      {state.kind === 'error' ? <p style={{ color: 'crimson' }}>Error: {state.message}</p> : null}

      {state.kind === 'loaded' ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Title</th>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}>Priority</th>
              <th style={{ textAlign: 'left', padding: '6px 4px' }}></th>
            </tr>
          </thead>
          <tbody>
            {state.items.map((i) => (
              <tr key={i.id}>
                <td style={{ padding: '6px 4px' }}>
                  <a href={`/app/work-items/${encodeURIComponent(i.id)}`}>{i.title}</a>
                </td>
                <td style={{ padding: '6px 4px' }}>{i.status ?? '—'}</td>
                <td style={{ padding: '6px 4px' }}>{i.priority ?? '—'}</td>
                <td style={{ padding: '6px 4px' }}>
                  <a href={`/app/work-items/${encodeURIComponent(i.id)}/timeline`} style={{ fontSize: 11, color: '#6b7280' }}>timeline</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </main>
  );
}

type AppBootstrap = {
  route?: { kind?: string; id?: string };
  me?: { email?: string };
  workItems?: WorkItemSummary[];
  workItem?: { id?: string; title?: string } | null;
  participants?: Array<{ participant?: string; role?: string }>;
};

function readBootstrap(): AppBootstrap | null {
  const el = document.getElementById('app-bootstrap');
  if (!el) return null;
  const text = el.textContent;
  if (!text) return null;

  try {
    return JSON.parse(text) as AppBootstrap;
  } catch {
    return null;
  }
}

function WorkItemDetailPage(props: { id: string }): React.JSX.Element {
  const bootstrap = readBootstrap();
  const title = bootstrap?.workItem?.title;
  const participants = bootstrap?.participants ?? [];

  return (
    <main style={{ padding: 16 }}>
      <p>
        <a href="/app/work-items">← Back</a>
      </p>
      <h1>{title ? title : `Work item ${props.id}`}</h1>

      <h2>Participants</h2>
      {participants.length === 0 ? (
        <p>None</p>
      ) : (
        <ul>
          {participants.map((p, idx) => (
            <li key={idx}>
              {p.participant ?? 'unknown'} {p.role ? `(${p.role})` : ''}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function TimelinePage(props: { id: string }): React.JSX.Element {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'loaded'; data: TimelineResponse }
  >({ kind: 'loading' });

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let alive = true;

    async function run(): Promise<void> {
      try {
        const res = await fetch(`/api/work-items/${props.id}/timeline`, {
          headers: { accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`Failed to load timeline: ${res.status}`);
        const data = (await res.json()) as TimelineResponse;
        if (!alive) return;
        setState({ kind: 'loaded', data });
      } catch (err) {
        if (!alive) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setState({ kind: 'error', message });
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [props.id]);

  if (state.kind === 'loading') {
    return (
      <main style={{ padding: 16 }}>
        <p><a href="/app/work-items">← Back to Work items</a></p>
        <h1>Timeline</h1>
        <p>Loading...</p>
      </main>
    );
  }

  if (state.kind === 'error') {
    return (
      <main style={{ padding: 16 }}>
        <p><a href="/app/work-items">← Back to Work items</a></p>
        <h1>Timeline</h1>
        <p style={{ color: 'crimson' }}>Error: {state.message}</p>
      </main>
    );
  }

  const { items, dependencies } = state.data;

  // Compute date range
  const dates = items
    .flatMap((i) => [i.not_before, i.not_after])
    .filter((d): d is string => d !== null)
    .map((d) => new Date(d).getTime());

  const now = Date.now();
  let minDate = dates.length > 0 ? Math.min(...dates) : now;
  let maxDate = dates.length > 0 ? Math.max(...dates) : now + 30 * 24 * 60 * 60 * 1000;

  // Add padding
  const range = maxDate - minDate || 1;
  minDate -= range * 0.05;
  maxDate += range * 0.05;

  const chartWidth = 800;
  const rowHeight = 32;
  const labelWidth = 200;
  const chartHeight = items.length * rowHeight + 40;

  function dateToX(date: number): number {
    return labelWidth + ((date - minDate) / (maxDate - minDate)) * (chartWidth - labelWidth - 20);
  }

  const kindColors: Record<string, string> = {
    project: '#3b82f6',
    initiative: '#8b5cf6',
    epic: '#10b981',
    issue: '#6b7280',
  };

  // Build position map for dependencies
  const itemPositions: Record<string, { y: number }> = {};
  items.forEach((item, idx) => {
    itemPositions[item.id] = { y: idx * rowHeight + 20 };
  });

  return (
    <main style={{ padding: 16 }}>
      <p><a href="/app/work-items">← Back to Work items</a></p>
      <h1>Timeline / Gantt</h1>

      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <svg ref={svgRef} width={chartWidth} height={chartHeight} style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12 }}>
          {/* Background grid */}
          <rect x={labelWidth} y={0} width={chartWidth - labelWidth} height={chartHeight} fill="#f9fafb" />

          {/* Date axis markers */}
          {[0.25, 0.5, 0.75, 1].map((pct) => {
            const x = labelWidth + pct * (chartWidth - labelWidth - 20);
            const dateVal = minDate + pct * (maxDate - minDate);
            const label = new Date(dateVal).toLocaleDateString();
            return (
              <g key={pct}>
                <line x1={x} y1={0} x2={x} y2={chartHeight} stroke="#e5e7eb" strokeDasharray="4,4" />
                <text x={x} y={chartHeight - 5} textAnchor="middle" fill="#9ca3af" fontSize={10}>
                  {label}
                </text>
              </g>
            );
          })}

          {/* Items */}
          {items.map((item, idx) => {
            const y = idx * rowHeight + 20;
            const indent = item.level * 12;

            // Bar positioning
            const hasStart = item.not_before !== null;
            const hasEnd = item.not_after !== null;
            let barX = labelWidth + 10;
            let barWidth = 50;

            if (hasStart && hasEnd) {
              barX = dateToX(new Date(item.not_before!).getTime());
              barWidth = Math.max(8, dateToX(new Date(item.not_after!).getTime()) - barX);
            } else if (hasStart) {
              barX = dateToX(new Date(item.not_before!).getTime());
              barWidth = 50;
            } else if (hasEnd) {
              barX = dateToX(new Date(item.not_after!).getTime()) - 50;
              barWidth = 50;
            }

            const color = kindColors[item.kind] || '#6b7280';

            return (
              <g key={item.id}>
                {/* Label */}
                <text x={4 + indent} y={y + rowHeight / 2 + 4} fill="#1f2937" fontSize={11}>
                  {item.title.length > 20 ? item.title.slice(0, 18) + '…' : item.title}
                </text>

                {/* Bar */}
                <rect
                  x={barX}
                  y={y + 4}
                  width={barWidth}
                  height={rowHeight - 12}
                  rx={3}
                  fill={color}
                  opacity={item.status === 'done' || item.status === 'closed' ? 0.4 : 0.8}
                />

                {/* Kind badge */}
                <text x={barX + 4} y={y + rowHeight / 2 + 3} fill="white" fontSize={9}>
                  {item.kind.charAt(0).toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* Dependencies (arrows) */}
          {dependencies.map((dep) => {
            const fromPos = itemPositions[dep.from_id];
            const toPos = itemPositions[dep.to_id];
            if (!fromPos || !toPos) return null;

            const fromItem = items.find((i) => i.id === dep.from_id);
            const toItem = items.find((i) => i.id === dep.to_id);
            if (!fromItem || !toItem) return null;

            // Calculate positions
            const fromY = fromPos.y + rowHeight / 2;
            const toY = toPos.y + rowHeight / 2;

            let fromX = labelWidth + 30;
            let toX = labelWidth + 30;

            if (toItem.not_after) {
              toX = dateToX(new Date(toItem.not_after).getTime());
            }
            if (fromItem.not_before) {
              fromX = dateToX(new Date(fromItem.not_before).getTime());
            }

            return (
              <g key={dep.id}>
                <line
                  x1={toX + 4}
                  y1={toY}
                  x2={fromX - 4}
                  y2={fromY}
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#ef4444" />
            </marker>
          </defs>
        </svg>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, color: '#6b7280' }}>
        <strong>Legend:</strong>{' '}
        <span style={{ display: 'inline-block', width: 12, height: 12, background: '#3b82f6', borderRadius: 2, marginRight: 4 }}></span> Project{' '}
        <span style={{ display: 'inline-block', width: 12, height: 12, background: '#8b5cf6', borderRadius: 2, marginLeft: 12, marginRight: 4 }}></span> Initiative{' '}
        <span style={{ display: 'inline-block', width: 12, height: 12, background: '#10b981', borderRadius: 2, marginLeft: 12, marginRight: 4 }}></span> Epic{' '}
        <span style={{ display: 'inline-block', width: 12, height: 12, background: '#6b7280', borderRadius: 2, marginLeft: 12, marginRight: 4 }}></span> Issue
      </div>
    </main>
  );
}

function NotFoundPage(props: { path: string }): React.JSX.Element {
  return (
    <main style={{ padding: 16 }}>
      <h1>Not found</h1>
      <p>{props.path}</p>
      <p>
        <a href="/app/work-items">Go to work items</a>
      </p>
    </main>
  );
}

function App(): React.JSX.Element {
  const path = usePathname();

  const route = useMemo(() => {
    const list = /^\/app\/work-items\/?$/;
    const detail = /^\/app\/work-items\/([^/]+)\/?$/;
    const timeline = /^\/app\/work-items\/([^/]+)\/timeline\/?$/;

    if (list.test(path)) return { kind: 'list' as const };

    const t = path.match(timeline);
    if (t) return { kind: 'timeline' as const, id: t[1] };

    const d = path.match(detail);
    if (d) return { kind: 'detail' as const, id: d[1] };

    return { kind: 'not-found' as const, path };
  }, [path]);

  if (route.kind === 'list') return <WorkItemsListPage />;
  if (route.kind === 'timeline') return <TimelinePage id={route.id} />;
  if (route.kind === 'detail') return <WorkItemDetailPage id={route.id} />;
  return <NotFoundPage path={route.path} />;
}

const el = document.getElementById('root');
if (!el) throw new Error('Missing #root element');

createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
