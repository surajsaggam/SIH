import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/**
 * Shared bar chart for EuroSAT class probabilities.
 * @param {{ classProbs: Record<string,number>, topN?: number }} props
 *   classProbs — { "AnnualCrop": 42.1, "Forest": 31.2, ... }  already %-scaled
 *   topN — how many classes to render (3 for overview, 10 for deep analysis)
 */
export default function ClassBarChart({ classProbs, topN = 10 }) {
  if (!classProbs || typeof classProbs !== 'object') return null;

  const entries = Object.entries(classProbs)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  const data = entries.map(([name, score]) => ({
    name: name.replace(/([a-z])([A-Z])/g, '$1 $2'), // "AnnualCrop" → "Annual Crop"
    score: parseFloat(score),
  }));

  const cyanHex = '#00D9FF';
  const orangeHex = '#FF6B35';

  return (
    <ResponsiveContainer width="100%" height={topN <= 3 ? 160 : 340}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 30, left: topN <= 3 ? 100 : 130, bottom: 4 }}
        barCategoryGap="18%"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          width={topN <= 3 ? 95 : 120}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0, 217, 255, 0.06)' }}
          contentStyle={{
            background: '#111827',
            border: '1px solid rgba(0, 217, 255, 0.3)',
            borderRadius: '2px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            color: '#d1d5db',
          }}
          formatter={(value) => [`${value}%`, 'Confidence']}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="score" radius={[0, 3, 3, 0]} animationDuration={800}>
          {data.map((entry, idx) => (
            <Cell
              key={entry.name}
              fill={idx === 0 ? cyanHex : `rgba(0, 217, 255, ${Math.max(0.15, 0.7 - idx * 0.06)})`}
              stroke={idx === 0 ? cyanHex : 'transparent'}
              strokeWidth={idx === 0 ? 1 : 0}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
