// Card themes: a little weather over the scene at the top of each Learn card. Particles are
// fixed per theme (no randomness per render), drawn only on the card you're looking at.

// x%, delay s, duration s, size px
const SPOTS: [number, number, number, number][] = [
  [6, 0, 7, 4], [18, 2.4, 9, 3], [29, 1.1, 6.5, 5], [41, 3.3, 8, 3], [52, 0.6, 7.5, 4],
  [63, 2.9, 6, 3], [74, 1.7, 8.5, 5], [85, 3.8, 7, 3], [94, 0.9, 9, 4], [35, 4.6, 7, 3],
]

export function CardFx({ fx }: { fx: string }) {
  if (fx === 'none') return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {fx === 'fireflies' && SPOTS.map(([x, d, t, s], i) => (
        <span key={i} className="fx-particle fx-drift" style={{ left: `${x}%`, top: `${25 + ((i * 37) % 55)}%`, width: s + 1, height: s + 1, background: '#fff6b0', boxShadow: '0 0 8px 3px rgba(255,236,140,.75)', animationDuration: `${t / 2.5}s`, animationDelay: `${-d}s` }} />
      ))}
      {fx === 'snow' && [...SPOTS, ...SPOTS.map(([x, d, t, s]) => [x + 4, d + 2, t, s - 1] as const)].map(([x, d, t, s], i) => (
        <span key={i} className="fx-particle fx-fall" style={{ left: `${x}%`, top: 0, width: s, height: s, background: '#fff', opacity: 0.9, animationDuration: `${t}s`, animationDelay: `${-d}s` }} />
      ))}
      {fx === 'petals' && SPOTS.map(([x, d, t], i) => (
        <span key={i} className="fx-particle fx-fall" style={{ left: `${x}%`, top: 0, width: 9, height: 6, borderRadius: '70% 10% 70% 10%', background: i % 2 ? '#ffc4d6' : '#ff9fbf', animationDuration: `${t * 1.1}s`, animationDelay: `${-d}s` }} />
      ))}
      {fx === 'aurora' && (
        <>
          <span className="fx-ribbon" style={{ background: 'linear-gradient(100deg, transparent 20%, rgba(110,231,183,.55) 40%, rgba(96,165,250,.45) 55%, transparent 75%)' }} />
          <span className="fx-ribbon" style={{ background: 'linear-gradient(80deg, transparent 30%, rgba(167,139,250,.45) 50%, rgba(244,114,182,.35) 62%, transparent 80%)', animationDelay: '-4s', animationDuration: '11s' }} />
        </>
      )}
      {fx === 'starfall' && (
        <>
          {SPOTS.slice(0, 6).map(([x, d], i) => (
            <span key={`t${i}`} className="cq-twinkle fx-particle" style={{ left: `${(x * 1.3) % 100}%`, top: `${12 + ((i * 23) % 45)}%`, width: 3, height: 3, background: '#fff', animationDelay: `${-d}s` }} />
          ))}
          {[[85, 0], [60, 1.2], [95, 2.4]].map(([x, d], i) => (
            <span key={`s${i}`} className="fx-shoot fx-particle" style={{ left: `${x}%`, top: `${8 + i * 10}%`, width: 46, height: 2, borderRadius: 2, background: 'linear-gradient(90deg, #fff, rgba(255,255,255,0))', boxShadow: '0 0 6px #fff', animationDelay: `${d}s` }} />
          ))}
        </>
      )}
    </div>
  )
}
