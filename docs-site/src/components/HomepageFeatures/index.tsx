import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Dashboard y Métricas',
    description: (
      <>
        Muestra el total de exámenes médicos por sede, cuántos están al día o vencidos y el porcentaje de trabajadores observados.
      </>
    ),
  },
  {
    title: 'Catálogo de Hallazgos',
    description: (
      <>
        Permite clasificar diagnósticos, agrupar sinónimos, asignar niveles de riesgo (Crítico, Alto, Medio, Bajo) y ordenar por categorías.
      </>
    ),
  },
  {
    title: 'Ficha del Paciente',
    description: (
      <>
        Permite revisar los datos de cada trabajador, sus diagnósticos asignados, historial de exámenes y su condición de aptitud.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.featureCol)}>
      <div className={styles.featureCard}>
        <Heading as="h3" className={styles.featureTitle}>{title}</Heading>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
