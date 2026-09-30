import { Card, Title, Subtitle, BarList, Bold, Flex, Text } from '@tremor/react';

const data = [
  { name: 'Trastornos músculo esqueléticos', value: 142 },
  { name: 'Hipoacusia neurosensorial', value: 89 },
  { name: 'Alteraciones visuales', value: 68 },
  { name: 'Hipertensión arterial', value: 54 },
  { name: 'Síndrome del túnel carpiano', value: 41 },
];

export default function HallazgosBarChart() {
  return (
    <Card>
      <Title>HALLAZGOS DE SALUD MÁS FRECUENTES</Title>
      <Subtitle>(Top 5)</Subtitle>
      <Flex className="mt-4">
        <Text><Bold>Diagnóstico</Bold></Text>
        <Text><Bold>Casos</Bold></Text>
      </Flex>
      <BarList data={data} className="mt-2" color="red" />
    </Card>
  );
}
