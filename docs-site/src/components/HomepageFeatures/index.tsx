import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Monitoreo Epidemiológico en Tiempo Real',
    icon: '📊',
    description: (
      <>
        Indicadores clave (KPIs) de cobertura de EMOs, vigencia, colaboradores observados y detección automática de hallazgos críticos por sede y periodo.
      </>
    ),
  },
  {
    title: 'Matriz Dinámica de Hallazgos y Triaje',
    icon: '🧪',
    description: (
      <>
        Ponderación configurable de riesgos (Crítico, Alto, Medio, Bajo), normalización con diccionario de sinónimos y creación de nuevas categorías médicas.
      </>
    ),
  },
  {
    title: 'Vigilancia Médica por Protocolo',
    icon: '🩺',
    description: (
      <>
        Control de agentes de riesgo (PREXOR, Altura Física, Cargas), ficha médica integrada de exámenes auxiliares y cambio seguro de condición de aptitud.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <div className={styles.featureIconContainer}>
          <span className={styles.featureIcon}>{icon}</span>
        </div>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
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
