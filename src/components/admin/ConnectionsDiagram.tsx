import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export type ConnNodeType = 'person' | 'company' | 'property';

export interface ConnNode {
  id: string;
  label: string;
  type: ConnNodeType;
  role?: string;
  href?: string;
}

interface Props {
  center: { label: string; type: ConnNodeType };
  nodes: ConnNode[];
}

const STYLE: Record<ConnNodeType, { fill: string; stroke: string; text: string }> = {
  property: { fill: 'hsl(43 65% 92%)',  stroke: 'hsl(43 50% 50%)',  text: 'hsl(40 55% 24%)' },
  person:   { fill: 'hsl(210 65% 93%)', stroke: 'hsl(210 55% 50%)', text: 'hsl(212 60% 27%)' },
  company:  { fill: 'hsl(160 45% 90%)', stroke: 'hsl(162 45% 38%)', text: 'hsl(165 55% 20%)' },
};

function initials(label: string): string {
  return label
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Truncate a label for the SVG (no native ellipsis on <text>). */
function clip(label: string, max = 18): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/**
 * A simple "ego network" — the current entity in the middle with its immediate
 * people / companies / properties fanning out, each line labelled with the
 * relationship. Read-only and click-to-navigate, so a non-technical owner can
 * see at a glance who is connected to what. Uses only the connection data the
 * page already loaded (no extra fetch).
 */
export default function ConnectionsDiagram({ center, nodes }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (nodes.length === 0) return null;

  const W = 520;
  const cx = W / 2;
  const n = nodes.length;
  // Radius + height grow a little with node count so labels don't collide.
  const R = n <= 6 ? 130 : 160;
  const cy = R + 70;
  const H = cy + R + 70;
  const cR = 34; // center node radius
  const nR = 24; // neighbour node radius

  const placed = nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    const x = cx + R * Math.cos(angle);
    const y = cy + R * Math.sin(angle);
    const cos = Math.cos(angle);
    const anchor = cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle';
    const lx = x + (anchor === 'start' ? nR + 6 : anchor === 'end' ? -(nR + 6) : 0);
    const ly = y + (Math.sin(angle) >= 0 ? nR + 16 : -(nR + 12));
    return { node, x, y, anchor, lx, ly, mx: (cx + x) / 2, my: (cy + y) / 2 };
  });

  const cStyle = STYLE[center.type];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxWidth: W, minWidth: 320 }}
        role="img"
        aria-label={t('admin.relations.diagramAria', 'Connections map')}
      >
        {/* spokes + role labels */}
        {placed.map(({ node, x, y, mx, my }) => (
          <g key={`edge-${node.id}`}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="hsl(0 0% 82%)" strokeWidth={1.5} />
            {node.role && (
              <g>
                <rect
                  x={mx - node.role.length * 3.4 - 4}
                  y={my - 9}
                  width={node.role.length * 6.8 + 8}
                  height={16}
                  rx={4}
                  fill="hsl(0 0% 100%)"
                  opacity={0.92}
                />
                <text x={mx} y={my + 3} textAnchor="middle" fontSize={10.5} fill="hsl(0 0% 42%)">
                  {node.role}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* neighbour nodes */}
        {placed.map(({ node, x, y, anchor, lx, ly }) => {
          const s = STYLE[node.type];
          const clickable = !!node.href;
          return (
            <g
              key={node.id}
              style={{ cursor: clickable ? 'pointer' : 'default' }}
              onClick={() => node.href && navigate(node.href)}
            >
              <circle cx={x} cy={y} r={nR} fill={s.fill} stroke={s.stroke} strokeWidth={1.5} />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={500} fill={s.text}>
                {initials(node.label)}
              </text>
              <text
                x={lx}
                y={ly}
                textAnchor={anchor as 'start' | 'middle' | 'end'}
                fontSize={11.5}
                fill="hsl(0 0% 25%)"
                style={{ textDecoration: clickable ? 'none' : undefined }}
              >
                {clip(node.label)}
              </text>
            </g>
          );
        })}

        {/* center node */}
        <circle cx={cx} cy={cy} r={cR} fill={cStyle.fill} stroke={cStyle.stroke} strokeWidth={2} />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fontWeight={500} fill={cStyle.text}>
          {initials(center.label)}
        </text>
        <text x={cx} y={cy + cR + 16} textAnchor="middle" fontSize={11.5} fontWeight={500} fill="hsl(0 0% 20%)">
          {clip(center.label, 22)}
        </text>
      </svg>
    </div>
  );
}
