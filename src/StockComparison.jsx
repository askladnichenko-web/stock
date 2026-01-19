import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = '/api';

const COMPANIES = [
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Полупроводники', color: '#76b900' },
  { symbol: 'INTC', name: 'Intel', sector: 'Полупроводники', color: '#0071c5' },
  { symbol: 'TSM', name: 'TSMC', sector: 'Foundry', color: '#c4122e' },
  { symbol: '005930.KS', displaySymbol: 'SSNLF', name: 'Samsung', sector: 'Foundry', color: '#1428a0' },
  { symbol: 'AMAT', name: 'Applied Materials', sector: 'Оборудование', color: '#ed1c24' },
  { symbol: 'KLAC', name: 'KLA Corporation', sector: 'Оборудование', color: '#00a651' },
  { symbol: 'AMZN', name: 'Amazon', sector: 'Техногиганты', color: '#ff9900' },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Техногиганты', color: '#4285f4' },
  { symbol: 'AVGO', name: 'Broadcom', sector: 'Полупроводники', color: '#cc0000' },
  { symbol: 'AMD', name: 'AMD', sector: 'Полупроводники', color: '#ed1c24' },
  { symbol: 'AAPL', name: 'Apple', sector: 'Техногиганты', color: '#555555' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Софт', color: '#00a4ef' },
  { symbol: 'META', name: 'Meta', sector: 'Техногиганты', color: '#0668e1' },
];

const MONEY_FLOWS = [
  { from: 'MSFT', to: 'NVDA', amount: 25, label: '~$25B', type: 'gpu', estimated: true, description: 'GPU для Azure AI' },
  { from: 'AMZN', to: 'NVDA', amount: 18, label: '~$18B', type: 'gpu', estimated: true, description: 'GPU для AWS' },
  { from: 'META', to: 'NVDA', amount: 15, label: '~$15B', type: 'gpu', estimated: true, description: 'GPU для AI' },
  { from: 'GOOGL', to: 'NVDA', amount: 12, label: '~$12B', type: 'gpu', estimated: true, description: 'GPU для Google Cloud' },
  { from: 'MSFT', to: 'AMD', amount: 4, label: '~$4B', type: 'gpu', estimated: true, description: 'MI300X для Azure' },
  { from: 'META', to: 'AMD', amount: 3, label: '~$3B', type: 'gpu', estimated: true, description: 'Альтернатива NVIDIA' },
  { from: 'AAPL', to: 'AVGO', amount: 8, label: '~$8B', type: 'components', estimated: true, description: 'Wi-Fi, Bluetooth чипы' },
  { from: 'AAPL', to: 'TSM', amount: 20, label: '~$20B', type: 'foundry', estimated: true, description: 'Чипы A/M-серии (22% TSMC)' },
  { from: 'NVDA', to: 'TSM', amount: 15, label: '~$15B', type: 'foundry', estimated: true, description: 'Производство GPU (11% TSMC)' },
  { from: 'AMD', to: 'TSM', amount: 8, label: '~$8B', type: 'foundry', estimated: true, description: 'CPU/GPU (7% TSMC)' },
  { from: 'AVGO', to: 'TSM', amount: 7, label: '~$7B', type: 'foundry', estimated: true, description: 'Чипы (7% TSMC)' },
  { from: 'INTC', to: 'TSM', amount: 6, label: '~$6B', type: 'foundry', estimated: true, description: 'Аутсорс (6% TSMC)' },
  { from: 'GOOGL', to: '005930.KS', amount: 3, label: '~$3B', type: 'foundry', estimated: true, description: 'Tensor для Pixel' },
  { from: 'TSM', to: 'AMAT', amount: 8, label: '~$8B', type: 'equipment', estimated: true, description: 'Оборудование TSMC' },
  { from: 'TSM', to: 'KLAC', amount: 4, label: '~$4B', type: 'equipment', estimated: true, description: 'Метрология TSMC' },
  { from: '005930.KS', to: 'AMAT', amount: 4, label: '~$4B', type: 'equipment', estimated: true, description: 'Оборудование Samsung' },
  { from: 'INTC', to: 'AMAT', amount: 3.5, label: '~$3.5B', type: 'equipment', estimated: true, description: 'Оборудование Intel' },
  { from: 'MSFT', to: 'INTC', amount: 5, label: '~$5B', type: 'cpu', estimated: true, description: 'Xeon для Azure' },
  { from: 'AMZN', to: 'INTC', amount: 4, label: '~$4B', type: 'cpu', estimated: true, description: 'CPU для AWS' },
];

const NODE_POSITIONS = {
  desktop: {
    'MSFT': { x: 120, y: 80 }, 'AMZN': { x: 300, y: 80 }, 'GOOGL': { x: 480, y: 80 }, 'META': { x: 660, y: 80 }, 'AAPL': { x: 840, y: 80 },
    'NVDA': { x: 180, y: 260 }, 'AMD': { x: 360, y: 260 }, 'AVGO': { x: 540, y: 260 }, 'INTC': { x: 720, y: 260 },
    'TSM': { x: 300, y: 440 }, '005930.KS': { x: 540, y: 440 },
    'AMAT': { x: 300, y: 600 }, 'KLAC': { x: 540, y: 600 },
  },
  mobile: {
    'MSFT': { x: 70, y: 50 }, 'AMZN': { x: 180, y: 50 }, 'GOOGL': { x: 290, y: 50 }, 'META': { x: 70, y: 120 }, 'AAPL': { x: 180, y: 120 },
    'NVDA': { x: 70, y: 220 }, 'AMD': { x: 180, y: 220 }, 'AVGO': { x: 290, y: 220 }, 'INTC': { x: 70, y: 300 },
    'TSM': { x: 180, y: 300 }, '005930.KS': { x: 290, y: 300 },
    'AMAT': { x: 130, y: 400 }, 'KLAC': { x: 250, y: 400 },
  }
};

const SECTOR_COLORS = {
  'Полупроводники': { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#10b981' },
  'Техногиганты': { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#6366f1' },
  'Софт': { bg: 'rgba(244, 63, 94, 0.15)', border: '#f43f5e', text: '#f43f5e' },
  'Оборудование': { bg: 'rgba(251, 191, 36, 0.15)', border: '#fbbf24', text: '#fbbf24' },
  'Foundry': { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#a855f7' },
};

const formatNumber = (n) => !n ? 'N/A' : n >= 1e12 ? `$${(n/1e12).toFixed(2)}T` : n >= 1e9 ? `$${(n/1e9).toFixed(2)}B` : `$${n.toFixed(2)}`;
const formatPercent = (n) => n == null ? 'N/A' : `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
const formatVolume = (n) => !n ? 'N/A' : n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n.toString();

const useIsMobile = () => {
  const [m, setM] = useState(false);
  useEffect(() => { const c = () => setM(window.innerWidth < 768); c(); window.addEventListener('resize', c); return () => window.removeEventListener('resize', c); }, []);
  return m;
};

const fetchStocksFromServer = async () => {
  const r = await fetch(`${API_BASE_URL}/stocks`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  return d.success ? { data: d.data, timestamp: d.timestamp } : (() => { throw new Error(d.error); })();
};

const checkServerHealth = async () => { try { return (await fetch(`${API_BASE_URL}/health`)).ok; } catch { return false; } };

const TargetPrice = ({ price, target, low, high }) => {
  if (!target || !price) return null;
  const upside = ((target - price) / price) * 100;
  return (
    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(99,102,241,0.1)', borderRadius: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>Целевая цена</span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: upside >= 0 ? '#10b981' : '#ef4444' }}>{upside >= 0 ? '↑' : '↓'} {Math.abs(upside).toFixed(1)}%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>${low?.toFixed(0)||'?'}</span>
        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '15%', right: '15%', top: 0, bottom: 0, background: 'rgba(99,102,241,0.3)', borderRadius: '3px' }} />
          <div style={{ position: 'absolute', left: `${Math.min(85, Math.max(15, ((price - (low||price*0.7)) / ((high||price*1.3) - (low||price*0.7))) * 100))}%`, top: '-2px', width: '3px', height: '10px', background: '#fff', borderRadius: '2px', transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', left: `${Math.min(85, Math.max(15, ((target - (low||price*0.7)) / ((high||price*1.3) - (low||price*0.7))) * 100))}%`, top: '-2px', width: '3px', height: '10px', background: '#6366f1', borderRadius: '2px', transform: 'translateX(-50%)' }} />
        </div>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>${high?.toFixed(0)||'?'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Сейчас: <b style={{ color: '#fff' }}>${price.toFixed(2)}</b></span>
        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Цель: <b style={{ color: '#6366f1' }}>${target.toFixed(2)}</b></span>
      </div>
    </div>
  );
};

const FlowNode = ({ company, position, isSelected, onSelect, totalIn, totalOut, isMobile }) => {
  const w = isMobile ? 80 : 110, h = isMobile ? 50 : 65;
  return (
    <g transform={`translate(${position.x - w/2}, ${position.y - h/2})`} onClick={() => onSelect(company.symbol)} style={{ cursor: 'pointer' }}>
      <rect width={w} height={h} rx="8" fill={isSelected ? '#1e1e2e' : '#0d0d14'} stroke={isSelected ? company.color : 'rgba(255,255,255,0.1)'} strokeWidth={isSelected ? 2 : 1} />
      <rect width={w} height="3" rx="2" fill={company.color} />
      <text x={w/2} y={isMobile ? 20 : 26} textAnchor="middle" fill="#fff" fontSize={isMobile ? 10 : 13} fontWeight="700" fontFamily="monospace">{company.displaySymbol || company.symbol}</text>
      <text x={w/2} y={isMobile ? 32 : 42} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={isMobile ? 7 : 8}>{company.name.slice(0, isMobile ? 9 : 12)}</text>
      {totalIn > 0 && <text x={w/2} y={isMobile ? 44 : 56} textAnchor="middle" fill="#10b981" fontSize={isMobile ? 7 : 9}>+${totalIn}B</text>}
    </g>
  );
};

const FlowArrow = ({ flow, from, to, hl, onHover, isMobile }) => {
  const sy = from.y + (isMobile ? 25 : 32), ey = to.y - (isMobile ? 25 : 32), my = (sy + ey) / 2;
  const colors = { gpu: '#76b900', cpu: '#0071c5', components: '#ff9900', equipment: '#fbbf24', foundry: '#a855f7' };
  const c = colors[flow.type] || '#6366f1';
  return (
    <g onMouseEnter={() => !isMobile && onHover(flow)} onMouseLeave={() => !isMobile && onHover(null)} style={{ cursor: 'pointer' }}>
      <path d={`M ${from.x} ${sy} C ${from.x} ${my}, ${to.x} ${my}, ${to.x} ${ey}`} fill="none" stroke={c} strokeWidth={hl ? 2.5 : 1} opacity={hl ? 1 : 0.25} strokeDasharray={flow.estimated ? "4,2" : ""} />
      <polygon points={`${to.x},${ey} ${to.x-4},${ey-7} ${to.x+4},${ey-7}`} fill={c} opacity={hl ? 1 : 0.25} />
      {hl && !isMobile && <><rect x={(from.x+to.x)/2-20} y={my-9} width="40" height="16" rx="3" fill="#1a1a2e" stroke={c} /><text x={(from.x+to.x)/2} y={my+2} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="600">{flow.label}</text></>}
    </g>
  );
};

const FlowDiagram = ({ selected, onSelect, hovered, setHovered }) => {
  const isMobile = useIsMobile();
  const pos = isMobile ? NODE_POSITIONS.mobile : NODE_POSITIONS.desktop;
  const totals = (s) => ({ in: MONEY_FLOWS.filter(f => f.to === s).reduce((a, f) => a + f.amount, 0), out: MONEY_FLOWS.filter(f => f.from === s).reduce((a, f) => a + f.amount, 0) });
  return (
    <div style={{ background: 'linear-gradient(135deg, #0d0d14, #12121a)', borderRadius: '14px', padding: isMobile ? '12px' : '20px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
      <h2 style={{ fontSize: isMobile ? '16px' : '20px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>💹 Денежные потоки</h2>
      <div style={{ overflowX: 'auto' }}>
        <svg width={isMobile ? 360 : 900} height={isMobile ? 460 : 660} viewBox={`0 0 ${isMobile ? 360 : 900} ${isMobile ? 460 : 660}`}>
          {MONEY_FLOWS.map((f, i) => { const fp = pos[f.from], tp = pos[f.to]; return fp && tp ? <FlowArrow key={i} flow={f} from={fp} to={tp} hl={hovered === f || selected === f.from || selected === f.to} onHover={setHovered} isMobile={isMobile} /> : null; })}
          {COMPANIES.map(c => { const p = pos[c.symbol], t = totals(c.symbol); return p ? <FlowNode key={c.symbol} company={c} position={p} isSelected={selected === c.symbol} onSelect={onSelect} totalIn={t.in} totalOut={t.out} isMobile={isMobile} /> : null; })}
        </svg>
      </div>
      {hovered && <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', fontSize: '12px' }}><b>{COMPANIES.find(c => c.symbol === hovered.from)?.name}</b> → <b>{COMPANIES.find(c => c.symbol === hovered.to)?.name}</b>: <span style={{ color: '#10b981' }}>{hovered.label}/год</span><br/><span style={{ color: 'rgba(255,255,255,0.6)' }}>{hovered.description}</span></div>}
    </div>
  );
};

const StockCard = ({ company, data, isSelected, onToggle, isLoading }) => {
  const isMobile = useIsMobile();
  const sc = SECTOR_COLORS[company.sector];
  const pos = (data?.changePercent || 0) >= 0;
  return (
    <div onClick={onToggle} style={{ background: isSelected ? 'linear-gradient(135deg, #1a1a2e, #16213e)' : 'linear-gradient(135deg, #0d0d14, #12121a)', border: isSelected ? `2px solid ${company.color}` : '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: isMobile ? '12px' : '16px', cursor: 'pointer', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '8px', right: '8px', width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${isSelected ? company.color : 'rgba(255,255,255,0.2)'}`, background: isSelected ? company.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isSelected && <svg width="8" height="8" viewBox="0 0 12 12"><path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" fill="none"/></svg>}</div>
      <div style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{ fontSize: isMobile ? '15px' : '17px', fontWeight: '800', color: '#fff' }}>{company.displaySymbol || company.symbol}</span>
          <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '8px', fontWeight: '600', background: sc.bg, color: sc.text }}>{company.sector}</span>
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{company.name}</div>
      </div>
      {isLoading ? <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: '20px', height: '20px', border: '2px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div> : data ? (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: isMobile ? '24px' : '28px', fontWeight: '700', color: '#fff' }}>${data.price?.toFixed(2)}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '4px', background: pos ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', color: pos ? '#10b981' : '#ef4444' }}>{formatPercent(data.changePercent)}</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
            <div><div style={{ color: 'rgba(255,255,255,0.4)' }}>Капитал.</div><div style={{ color: '#fff', fontWeight: '600' }}>{formatNumber(data.marketCap)}</div></div>
            <div><div style={{ color: 'rgba(255,255,255,0.4)' }}>P/E</div><div style={{ color: '#fff', fontWeight: '600' }}>{data.pe?.toFixed(1) || 'N/A'}</div></div>
            <div><div style={{ color: 'rgba(255,255,255,0.4)' }}>Дивид.</div><div style={{ color: '#fff', fontWeight: '600' }}>{data.dividendYield ? `${(data.dividendYield*100).toFixed(2)}%` : 'N/A'}</div></div>
            <div><div style={{ color: 'rgba(255,255,255,0.4)' }}>Объём</div><div style={{ color: '#fff', fontWeight: '600' }}>{formatVolume(data.volume)}</div></div>
          </div>
          <TargetPrice price={data.price} target={data.targetMeanPrice} low={data.targetLowPrice} high={data.targetHighPrice} />
          {data.week52Low && data.week52High && <div style={{ marginTop: '8px' }}><div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '3px' }}>52 недели</div><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>${data.week52Low.toFixed(0)}</span><div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}><div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${Math.min(100, Math.max(0, ((data.price - data.week52Low) / (data.week52High - data.week52Low)) * 100))}%`, background: company.color, borderRadius: '2px' }} /></div><span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>${data.week52High.toFixed(0)}</span></div></div>}
          {data.recommendationKey && <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>Рекомендация</span><span style={{ fontSize: '9px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', background: data.recommendationKey.includes('buy') ? 'rgba(16,185,129,0.2)' : 'rgba(251,191,36,0.2)', color: data.recommendationKey.includes('buy') ? '#10b981' : '#fbbf24', textTransform: 'uppercase' }}>{data.recommendationKey}</span></div>}
        </div>
      ) : <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>Ошибка</div>}
    </div>
  );
};

const ComparisonTable = ({ selected, data }) => {
  const isMobile = useIsMobile();
  if (selected.length < 2) return null;
  const items = selected.map(s => ({ c: COMPANIES.find(x => x.symbol === s), d: data[s] })).filter(x => x.d);
  if (items.length < 2) return null;
  const metrics = [
    { k: 'price', l: 'Цена', f: v => v ? `$${v.toFixed(2)}` : 'N/A' },
    { k: 'changePercent', l: 'Изм.', f: formatPercent },
    { k: 'marketCap', l: 'Капитал.', f: formatNumber },
    { k: 'pe', l: 'P/E', f: v => v?.toFixed(1) || 'N/A', lower: true },
    { k: 'targetMeanPrice', l: 'Цель', f: v => v ? `$${v.toFixed(0)}` : 'N/A' },
    { k: 'dividendYield', l: 'Дивид.', f: v => v ? `${(v*100).toFixed(2)}%` : 'N/A' },
  ];
  return (
    <div style={{ marginTop: '20px', background: 'linear-gradient(135deg, #0d0d14, #12121a)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: isMobile ? '12px' : '16px', overflowX: 'auto' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>📊 Сравнение</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '10px' : '12px' }}>
        <thead><tr><th style={{ padding: '6px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>Метрика</th>{items.map(({ c }) => <th key={c.symbol} style={{ padding: '6px', textAlign: 'right', color: c.color, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>{c.displaySymbol || c.symbol}</th>)}</tr></thead>
        <tbody>{metrics.map(m => { const vals = items.map(({ d }) => d?.[m.k]).filter(v => v != null); const best = vals.length ? (m.lower ? Math.min(...vals) : Math.max(...vals)) : null; return <tr key={m.k}><td style={{ padding: '6px', color: 'rgba(255,255,255,0.6)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{m.l}</td>{items.map(({ c, d }) => { const v = d?.[m.k]; const ib = v === best && vals.length > 1; return <td key={c.symbol} style={{ padding: '6px', textAlign: 'right', fontWeight: '600', color: ib ? '#10b981' : '#fff', background: ib ? 'rgba(16,185,129,0.1)' : '', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{m.f(v)}</td>; })}</tr>; })}</tbody>
      </table>
    </div>
  );
};

export default function StockComparison() {
  const [stockData, setStockData] = useState({});
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Все');
  const [updated, setUpdated] = useState(null);
  const [tab, setTab] = useState('cards');
  const [status, setStatus] = useState('checking');
  const [hovered, setHovered] = useState(null);
  const isMobile = useIsMobile();
  const sectors = ['Все', ...new Set(COMPANIES.map(c => c.sector))];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const online = await checkServerHealth();
      setStatus(online ? 'online' : 'offline');
      if (online) { const r = await fetchStocksFromServer(); setStockData(r.data); setUpdated(new Date(r.timestamp)); }
    } catch { setStatus('offline'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggle = (s) => setSelected(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);
  const filtered = filter === 'Все' ? COMPANIES : COMPANIES.filter(c => c.sector === filter);

  return (
    <div style={{ minHeight: '100vh', background: '#08080c', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}*{margin:0;padding:0;box-sizing:border-box}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.5);border-radius:3px}`}</style>
      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: isMobile ? '12px' : '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '800', marginBottom: '4px' }}>📊 Анализ акций</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', background: status === 'online' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', borderRadius: '12px', fontSize: '10px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: status === 'online' ? '#10b981' : '#ef4444' }} />
              <span style={{ color: status === 'online' ? '#10b981' : '#ef4444' }}>{status === 'online' ? 'Live' : 'Офлайн'}</span>
            </div>
            {updated && <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{updated.toLocaleTimeString('ru-RU')}</span>}
          </div>
        </div>
        {status === 'offline' && <div style={{ padding: '10px', marginBottom: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', fontSize: '12px', color: '#ef4444' }}>⚠️ Запустите: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 4px', borderRadius: '3px' }}>node server.js</code></div>}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {['cards', 'diagram'].map(t => <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: tab === t ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)', color: tab === t ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{t === 'cards' ? 'Карточки' : 'Схема'}</button>)}
          <button onClick={fetchData} disabled={loading || status === 'offline'} style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)', background: 'transparent', color: '#6366f1', fontSize: '12px', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>🔄 {loading ? '...' : ''}</button>
        </div>
        {tab === 'diagram' && <FlowDiagram selected={selected[0]} onSelect={s => setSelected(selected.includes(s) ? [] : [s])} hovered={hovered} setHovered={setHovered} />}
        {tab === 'cards' && <>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap', overflowX: 'auto' }}>
            {sectors.map(s => <button key={s} onClick={() => setFilter(s)} style={{ padding: '5px 10px', borderRadius: '6px', border: 'none', background: filter === s ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.05)', color: filter === s ? '#fff' : 'rgba(255,255,255,0.6)', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>{s}</button>)}
            {selected.length > 0 && <button onClick={() => setSelected([])} style={{ marginLeft: 'auto', padding: '5px 8px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '10px', cursor: 'pointer' }}>Сброс ({selected.length})</button>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {filtered.map((c, i) => <div key={c.symbol} style={{ animation: `fadeIn 0.3s ease-out ${i * 0.03}s both` }}><StockCard company={c} data={stockData[c.symbol]} isSelected={selected.includes(c.symbol)} onToggle={() => toggle(c.symbol)} isLoading={loading && status === 'online'} /></div>)}
          </div>
          <ComparisonTable selected={selected} data={stockData} />
        </>}
      </div>
    </div>
  );
}
