import { Card, Title, BarChart, Subtitle } from '@tremor/react';

const chartdata = [
  {
    name: 'Ingreso',
    'Cobertura (%)': 96.1,
  },
  {
    name: 'Periódico',
    'Cobertura (%)': 95.4,
  },
  {
    name: 'Egreso',
    'Cobertura (%)': 94.7,
  },
  {
    name: 'Reincorporación',
    'Cobertura (%)': 98.0,
  },
  {
    name: 'Cambio de Puesto',
    'Cobertura (%)': 93.5,
  },
  {
    name: 'Post Incapacidad',
    'Cobertura (%)': 91.2,
  },
];

const valueFormatter = (number: number) => `${number.toString()}%`;

export default function CoverageBarChart() {
  return (
    <Card>
      <Title>COBERTURA DE EXÁMENES MÉDICOS OCUPACIONALES</Title>
      <Subtitle>% de cumplimiento por tipo de examen</Subtitle>
      <BarChart
        className="mt-6 h-72"
        data={chartdata}
        index="name"
        categories={['Cobertura (%)']}
        colors={['emerald']}
        valueFormatter={valueFormatter}
        yAxisWidth={48}
        layout="vertical"
        showAnimation={true}
      />
    </Card>
  );
}
