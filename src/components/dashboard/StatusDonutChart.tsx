import { Card, Title, DonutChart, Legend, Flex, Metric } from '@tremor/react';

const statusData = [
  { name: 'Apto', value: 1093, color: 'emerald' },
  { name: 'Apto con restricciones', value: 60, color: 'yellow' },
  { name: 'No apto', value: 21, color: 'rose' },
  { name: 'Pendiente', value: 63, color: 'orange' },
  { name: 'No evaluado', value: 11, color: 'slate' },
];

export default function StatusDonutChart() {
  return (
    <Card>
      <Title>DISTRIBUCIÓN DE EXÁMENES POR ESTADO</Title>
      <Flex className="mt-6">
        <div className="relative h-48 w-48 mx-auto">
          <DonutChart
            className="h-48"
            data={statusData}
            category="value"
            index="name"
            colors={['emerald', 'yellow', 'rose', 'orange', 'slate']}
            showTooltip={true}
            showLabel={false}
            showAnimation={true}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <Metric className="text-xl">1.248</Metric>
             <p className="text-tremor-default text-tremor-content">Total</p>
          </div>
        </div>
        <Legend
          categories={statusData.map(d => d.name)}
          colors={['emerald', 'yellow', 'rose', 'orange', 'slate']}
          className="max-w-xs ml-4"
        />
      </Flex>
    </Card>
  );
}
