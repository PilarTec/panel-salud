import { Card, Title, Subtitle, Flex, Text } from '@tremor/react';

const sedes = [
  { name: 'Santiago', value: 97.8, status: 'ok' },
  { name: 'Antofagasta', value: 96.1, status: 'ok' },
  { name: 'Calama', value: 95.0, status: 'warning' },
  { name: 'Iquique', value: 93.6, status: 'error' },
  { name: 'Lima', value: 95.7, status: 'ok' },
  { name: 'Arequipa', value: 94.2, status: 'warning' },
  { name: 'Trujillo', value: 92.3, status: 'error' }
];

export default function SedeTable() {
  return (
    <Card>
      <Title>CUMPLIMIENTO POR SEDE / BASE</Title>
      <Subtitle>% de cobertura de exámenes</Subtitle>
      <Flex className="mt-4 border-b border-tremor-border pb-2">
        <Text>Sede / Base</Text>
        <Flex className="w-auto space-x-6">
           <Text>Cobertura (%)</Text>
           <Text>Estado</Text>
        </Flex>
      </Flex>
      
      <div className="mt-2 space-y-3">
        {sedes.map((sede) => (
           <Flex key={sede.name} className="items-center">
             <Text className="w-1/3 truncate">{sede.name}</Text>
             <div className="w-1/2 flex items-center pr-4">
                <div className="w-full bg-tremor-background-subtle h-3 rounded-tremor-full overflow-hidden mr-2">
                   <div 
                     className={`h-full rounded-tremor-full ${sede.status === 'error' ? 'bg-red-500' : sede.status === 'warning' ? 'bg-yellow-500' : 'bg-emerald-500'}`} 
                     style={{ width: `${sede.value}%` }} 
                   />
                </div>
                <Text className="text-xs">{sede.value}%</Text>
             </div>
             <div className="w-8 flex justify-center">
               <div className={`w-3 h-3 rounded-full ${sede.status === 'error' ? 'bg-red-500' : sede.status === 'warning' ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
             </div>
           </Flex>
        ))}
      </div>
    </Card>
  );
}
