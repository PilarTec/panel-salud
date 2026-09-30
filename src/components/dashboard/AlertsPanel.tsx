import { Card, Title, Text, List, ListItem, Grid } from '@tremor/react';

export default function AlertsPanel() {
  return (
    <Grid numItemsSm={1} numItemsLg={3} className="gap-6 mt-6">
      <Card decoration="left" decorationColor="red">
        <Title className="text-red-500">⚠️ ALERTAS PRINCIPALES</Title>
        <List className="mt-4 text-xs">
          <ListItem>Cobertura baja meta en 3 sedes / bases.</ListItem>
          <ListItem>Protocolo Metales y Metaloides bajo meta (94,1%).</ListItem>
          <ListItem className="text-red-600 font-semibold">7 hallazgos críticos requieren seguimiento médico.</ListItem>
        </List>
        <div className="mt-4 flex justify-end">
          <Text className="text-red-500 text-xs cursor-pointer hover:underline">Ver todas las alertas {'>'}</Text>
        </div>
      </Card>
      
      <Card decoration="left" decorationColor="emerald">
        <Title className="text-emerald-500">📝 ACCIONES EN CURSO</Title>
        <List className="mt-4 text-xs">
          <ListItem>✅ Plan de mejora cobertura exámenes periódicos en Iquique y Trujillo.</ListItem>
          <ListItem>✅ Programa de vigilancia de exposición a sílice (PREXOR).</ListItem>
          <ListItem>✅ Seguimiento médico a casos críticos y aptos con restricciones.</ListItem>
        </List>
        <div className="mt-4 flex justify-end">
          <Text className="text-emerald-500 text-xs cursor-pointer hover:underline">Ver plan de acciones {'>'}</Text>
        </div>
      </Card>

      <Card>
        <Title className="text-blue-500">ℹ️ NOTAS</Title>
        <div className="mt-4 text-xs text-tremor-content space-y-2">
          <p>• Indicadores calculados según definiciones MINSAL (Chile) DS 594 y alineados a normativa peruana RM 312-2011-MINSA y modificatorias.</p>
          <p>• Cobertura = (Exámenes realizados / Exámenes programados) x 100.</p>
          <p>• Metas definidas por estándar corporativo de Salud en el Trabajo.</p>
        </div>
      </Card>
    </Grid>
  );
}
