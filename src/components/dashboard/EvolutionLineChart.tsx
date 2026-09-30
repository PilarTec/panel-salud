import { Card, Title, LineChart, Subtitle } from '@tremor/react';

const chartdata = [
  { month: 'Abr 2025', Cobertura: 95.2 },
  { month: 'May 2025', Cobertura: 96.1 },
  { month: 'Jun 2025', Cobertura: 97.5 },
  { month: 'Jul 2025', Cobertura: 97.8 },
  { month: 'Ago 2025', Cobertura: 95.4 },
  { month: 'Sep 2025', Cobertura: 96.2 },
  { month: 'Oct 2025', Cobertura: 96.0 },
  { month: 'Nov 2025', Cobertura: 94.8 },
  { month: 'Dic 2025', Cobertura: 95.1 },
  { month: 'Ene 2026', Cobertura: 93.5 },
  { month: 'Feb 2026', Cobertura: 94.2 },
  { month: 'Mar 2026', Cobertura: 95.2 },
];

const valueFormatter = (number: number) => `${number}%`;

export default function EvolutionLineChart() {
  return (
    <Card>
      <Title>EVOLUCIÓN DE COBERTURA (%)</Title>
      <Subtitle>Últimos 12 meses</Subtitle>
      <LineChart
        className="mt-6 h-72"
        data={chartdata}
        index="month"
        categories={['Cobertura']}
        colors={['emerald']}
        valueFormatter={valueFormatter}
        yAxisWidth={40}
        showAnimation={true}
        minValue={85}
        maxValue={100}
      />
    </Card>
  );
}
