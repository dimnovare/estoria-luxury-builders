import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export type ConnNodeType = 'person' | 'company' | 'property' | 'deal';

export interface GraphNode {
  id: string;
  type: ConnNodeType;
  label: string;
  isCenter?: boolean;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  role?: string | null;
  /** property-contact | property-company | contact-company | deal-property | deal-contact */
  kind: string;
}

interface Props {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const STYLE: Record<ConnNodeType, { fill: string; stroke: string; text: string }> = {
  property: { fill: 'hsl(43 65% 92%)',  stroke: 'hsl(43 50% 50%)',  text: 'hsl(40 55% 24%)' },
  person:   { fill: 'hsl(210 65% 93%)', stroke: 'hsl(210 55% 50%)', text: 'hsl(212 60% 27%)' },
  company:  { fill: 'hsl(160 45% 90%)', stroke: 'hsl(162 45% 38%)', text: 'hsl(165 55% 20%)' },
  deal:     { fill: 'hsl(265 50% 93%)', stroke: 'hsl(265 45% 55%)', text: 'hsl(265 50% 30%)' },
};

const HREF: Record<ConnNodeType, (id: string) => string> = {
  person:   (id) => `/admin/contacts/${id}`,
  company:  (id) => `/admin/companies/${id}`,
  property: (id) => `/admin/properties/${id}/edit`,
  deal:     (id) => `/admin/deals/${id}`,
};

function initials(label: string): string {
  return label.split(/\s+/).map((p) => p[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();
}
function clip(label: string, max = 18): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

/**
 * Relationship map: the centre entity with its people / companies / properties /
 * deals around it, AND the links between those neighbours (e.g. a person who works
 * at a linked company), each line labelled with the relationship. Click any node to
 * open it — its own page re-centres the map there, so the whole web can be explored
 * by clicking. Read-only; fed by the /relationships/graph endpoint.
 */
export default function ConnectionsDiagram({ nodes, edges }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (nodes.length <= 1) return null;

  const center = nodes.find((n) => n.isCenter) ?? nodes[0];
  const others = nodes.filter((n) => n.id !== center.id);
  const n = others.length;

  const W = 560;
  const cx = W / 2;
  const R = n <= 6 ? 150 : n <= 10 ? 185 : 215;
  const cy = R + 80;
  const H = cy + R + 80;
  const cR = 33;
  const nR = 23;

  const pos = new Map<string, { x: number; y: number; angle: number }>();
  pos.set(center.id, { x: cx, y: cy, angle: 0 });
  others.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    pos.set(node.id, { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle), angle });
  });

  const roleLabel = (e: GraphEdge): string => {
    if (!e.role) return '';
    const ns =
      e.kind === 'property-contact' ? 'propertyContact' :
      e.kind === 'property-company' ? 'propertyCompany' :
      e.kind === 'contact-company' ? 'contactCompany' : null;
    return ns ? t(`admin.relations.roles.${ns}.${e.role}`) : '';
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxWidth: W, minWidth: 340 }}
        role="img"
        aria-label={t('admin.relations.diagramAria', 'Connections map')}
      >
        {/* edges */}
        {edges.map((e, i) => {
          const a = pos.get(e.fromId);
          const b = pos.get(e.toId);
          if (!a || !b) return null;
          const spoke = e.fromId === center.id || e.toId === center.id;
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const label = roleLabel(e);
          return (
            <g key={`e-${i}`}>
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={spoke ? 'hsl(0 0% 75%)' : 'hsl(0 0% 84%)'}
                strokeWidth={spoke ? 1.5 : 1.25}
                strokeDasharray={spoke ? undefined : '4 3'}
              />
              {label && (
                <g>
                  <rect x={mx - label.length * 3.2 - 4} y={my - 8} width={label.length * 6.4 + 8} height={15} rx={4} fill="hsl(0 0% 100%)" opacity={0.92} />
                  <text x={mx} y={my + 3} textAnchor="middle" fontSize={10} fill="hsl(0 0% 42%)">{label}</text>
                </g>
              )}
            </g>
          );
        })}

        {/* neighbour nodes */}
        {others.map((node) => {
          const p = pos.get(node.id)!;
          const s = STYLE[node.type];
          const cos = Math.cos(p.angle);
          const anchor = cos > 0.35 ? 'start' : cos < -0.35 ? 'end' : 'middle';
          const lx = p.x + (anchor === 'start' ? nR + 6 : anchor === 'end' ? -(nR + 6) : 0);
          const ly = p.y + (Math.sin(p.angle) >= 0 ? nR + 16 : -(nR + 12));
          return (
            <g key={node.id} style={{ cursor: 'pointer' }} onClick={() => navigate(HREF[node.type](node.id))}>
              <circle cx={p.x} cy={p.y} r={nR} fill={s.fill} stroke={s.stroke} strokeWidth={1.5} />
              <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={12} fontWeight={500} fill={s.text}>{initials(node.label)}</text>
              <text x={lx} y={ly} textAnchor={anchor as 'start' | 'middle' | 'end'} fontSize={11.5} fill="hsl(0 0% 25%)">{clip(node.label)}</text>
            </g>
          );
        })}

        {/* center node */}
        <circle cx={cx} cy={cy} r={cR} fill={STYLE[center.type].fill} stroke={STYLE[center.type].stroke} strokeWidth={2.5} />
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={13} fontWeight={500} fill={STYLE[center.type].text}>{initials(center.label)}</text>
        <text x={cx} y={cy + cR + 16} textAnchor="middle" fontSize={11.5} fontWeight={500} fill="hsl(0 0% 20%)">{clip(center.label, 24)}</text>
      </svg>
    </div>
  );
}
