import { Card, Title, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, Text, Badge } from '@tremor/react';

const protocolos = [
  { protocolo: 'TMERT', riesgo: 'Ruido', pais: 'CL/PE', realizados: 312, cobertura: '96,6%', meta: '≥ 95%', cumplimiento: 'ok' },
  { protocolo: 'PREXOR', riesgo: 'Sílice', pais: 'CL/PE', realizados: 210, cobertura: '95,2%', meta: '≥ 95%', cumplimiento: 'ok' },
  { protocolo: 'Metales y Metaloides', riesgo: 'Plomo, Arsénico...', pais: 'CL/PE', realizados: 186, cobertura: '94,1%', meta: '≥ 95%', cumplimiento: 'warning' },
  { protocolo: 'Agentes Químicos', riesgo: 'Solventes, Gases...', pais: 'CL/PE', realizados: 278, cobertura: '96,8%', meta: '≥ 95%', cumplimiento: 'ok' },
  { protocolo: 'Plaguicidas', riesgo: 'Organofosforados...', pais: 'CL/PE', realizados: 64, cobertura: '93,8%', meta: '≥ 95%', cumplimiento: 'warning' },
  { protocolo: 'Ergonómico', riesgo: 'Carga física, Posturas', pais: 'CL/PE', realizados: 142, cobertura: '97,3%', meta: '≥ 95%', cumplimiento: 'ok' },
  { protocolo: 'Vibración', riesgo: 'Vibración Mano-Brazo', pais: 'CL/PE', realizados: 56, cobertura: '94,9%', meta: '≥ 95%', cumplimiento: 'warning' }
];

export default function ProtocolosTable() {
  return (
    <Card>
      <Title>CUMPLIMIENTO DE PROTOCOLOS MINSAL (Chile) / ALINEADOS A PERÚ</Title>
      <Table className="mt-4">
        <TableHead>
          <TableRow>
            <TableHeaderCell>Protocolo</TableHeaderCell>
            <TableHeaderCell>Agente de Riesgo</TableHeaderCell>
            <TableHeaderCell>País</TableHeaderCell>
            <TableHeaderCell>Exámenes Realizados</TableHeaderCell>
            <TableHeaderCell>Cobertura (%)</TableHeaderCell>
            <TableHeaderCell>Meta</TableHeaderCell>
            <TableHeaderCell>Cumplimiento</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {protocolos.map((item) => (
            <TableRow key={item.protocolo}>
              <TableCell><Text className="font-medium">{item.protocolo}</Text></TableCell>
              <TableCell><Text>{item.riesgo}</Text></TableCell>
              <TableCell><Text>{item.pais}</Text></TableCell>
              <TableCell><Text>{item.realizados}</Text></TableCell>
              <TableCell><Text>{item.cobertura}</Text></TableCell>
              <TableCell><Text>{item.meta}</Text></TableCell>
              <TableCell>
                <Badge color={item.cumplimiento === 'ok' ? 'emerald' : 'yellow'} size="sm">
                  {item.cumplimiento === 'ok' ? '✅' : '⚠️'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
