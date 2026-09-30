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
    title: 'Vigilancia y Métricas EMO',
    description: (
      <>
        Consolidación de evaluaciones periódicas, indicadores de cobertura por sede, porcentaje de vigencia y control de trabajadores observados.
      </>
    ),
  },
  {
    title: 'Clasificación y Triaje de Hallazgos',
    description: (
      <>
        Normalización de diagnósticos mediante sinónimos, matriz de riesgo ponderado (Crítico, Alto, Medio, Bajo) y administración de categorías.
      </>
    ),
  },
  {
    title: 'Protocolos y Ficha Médica',
    description: (
      <>
        Seguimiento de programas de vigilancia ocupacional (PREXOR, Altura, Ergonómicos), gestión de aptitud laboral y trazabilidad por paciente.
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
