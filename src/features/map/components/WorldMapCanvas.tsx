import { useMemo } from 'react'
import { geoNaturalEarth1, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, MultiPolygon } from 'geojson'
import landTopo from 'world-atlas/land-110m.json'
import type { CityPoint } from '../geo'

const W = 390
const PAD_X = 12
const PAD_TOP = 28 // room for the tooltip above northern cities
const PAD_BOTTOM = 24 // sits under the bottom fade + stats strip overlap

/** Land outline without Antarctica (it eats a third of the frame for nothing). */
function buildLand(): Feature<MultiPolygon> {
  const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>
  const fc = feature(topo, topo.objects.land)
  const geom = fc.features[0].geometry as MultiPolygon
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPolygon',
      coordinates: geom.coordinates.filter((poly) => poly[0].some(([, lat]) => lat > -58)),
    },
  }
}

const LAND = buildLand()

/** Fit the land to the frame width; the frame height follows the land's
 *  aspect ratio so there is no empty ocean band above/below. */
function buildProjection() {
  const projection = geoNaturalEarth1().fitWidth(W - 2 * PAD_X, LAND)
  const [[x0, y0], [, y1]] = geoPath(projection).bounds(LAND)
  const [tx, ty] = projection.translate()
  projection.translate([tx - x0 + PAD_X, ty - y0 + PAD_TOP])
  return { projection, height: Math.ceil(y1 - y0) + PAD_TOP + PAD_BOTTOM }
}

const { projection: PROJECTION, height: H } = buildProjection()
const LAND_PATH = geoPath(PROJECTION)(LAND) ?? ''

export function WorldMapCanvas({
  points,
  selectedKey,
  onSelect,
  animationKey,
}: {
  points: CityPoint[]
  selectedKey: string | null
  onSelect: (key: string) => void
  /** Changing it replays the dot scale-in (e.g. on year change). */
  animationKey: string
}) {
  const max = Math.max(1, ...points.map((p) => p.count))
  const projected = useMemo(
    () =>
      points
        .map((p) => {
          const xy = PROJECTION([p.lng, p.lat])
          return xy ? { ...p, x: xy[0], y: xy[1], t: p.count / max } : null
        })
        .filter((p): p is NonNullable<typeof p> => p !== null),
    [points, max],
  )
  const selected = projected.find((p) => p.key === selectedKey) ?? null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="Map of the cities where you saw shows">
      <rect width={W} height={H} fill="#0a0c14" />
      <path d={LAND_PATH} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.8} />

      <g key={animationKey}>
        {/* Smaller cities on top so they stay tappable next to big ones. */}
        {[...projected].reverse().map((p, i) => (
          <g
            key={p.key}
            className="map-dot cursor-pointer"
            style={{ animationDelay: `${(projected.length - 1 - i) * 70}ms` }}
            onClick={() => onSelect(p.key)}
          >
            <circle cx={p.x} cy={p.y} r={4 + 4 * p.t} fill="#e8752a" opacity={0.22 + 0.08 * p.t} />
            <circle cx={p.x} cy={p.y} r={2.5 + 2.5 * p.t} fill="#e8752a" opacity={0.5 + 0.2 * p.t} />
            <circle cx={p.x} cy={p.y} r={2 + p.t} fill="#e8752a" />
            <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
          </g>
        ))}
      </g>

      {selected && <Tooltip x={selected.x} y={selected.y} r={4 + 4 * selected.t} label={`${selected.city} · ${selected.count} ${selected.count === 1 ? 'show' : 'shows'}`} />}
    </svg>
  )
}

function Tooltip({ x, y, r, label }: { x: number; y: number; r: number; label: string }) {
  const w = Math.round(label.length * 5.8 + 20)
  const h = 26
  const left = Math.min(Math.max(x - w / 2, 4), W - w - 4)
  const above = y - r - h - 4
  const top = above >= 4 ? above : y + r + 4
  return (
    <g pointerEvents="none">
      <rect x={left} y={top} width={w} height={h} rx={8} fill="#0d0c16" stroke="rgba(232,117,42,0.4)" strokeWidth={1} />
      <text
        x={left + w / 2}
        y={top + 17}
        textAnchor="middle"
        fontFamily="'DM Sans', sans-serif"
        fontWeight={600}
        fontSize={10}
        fill="#e8752a"
      >
        {label}
      </text>
    </g>
  )
}
