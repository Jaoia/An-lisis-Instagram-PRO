
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { InstagramAnalysis } from '../types';

interface ComparisonChartProps {
  competitors: InstagramAnalysis['competitors'];
  businessName: string;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ competitors, businessName }) => {
  const data = [
    { subject: 'Presencia', A: 7, ...Object.fromEntries(competitors.map((c, i) => [`Competidor ${i+1}`, c.metrics.presence])) },
    { subject: 'Consistencia', A: 6, ...Object.fromEntries(competitors.map((c, i) => [`Competidor ${i+1}`, c.metrics.consistency])) },
    { subject: 'Profesionalismo', A: 5, ...Object.fromEntries(competitors.map((c, i) => [`Competidor ${i+1}`, c.metrics.professionalism])) },
    { subject: 'Engagement', A: 4, ...Object.fromEntries(competitors.map((c, i) => [`Competidor ${i+1}`, c.metrics.engagement])) },
  ];

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 10]} />
          <Radar
            name={businessName}
            dataKey="A"
            stroke="#2563eb"
            fill="#2563eb"
            fillOpacity={0.6}
          />
          {competitors.map((comp, idx) => (
            <Radar
              key={idx}
              name={comp.name}
              dataKey={`Competidor ${idx + 1}`}
              stroke={['#94a3b8', '#64748b', '#475569'][idx]}
              fill={['#cbd5e1', '#94a3b8', '#64748b'][idx]}
              fillOpacity={0.3}
            />
          ))}
          <Legend />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ComparisonChart;
