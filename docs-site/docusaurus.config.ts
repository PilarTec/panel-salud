import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Panel de Salud Ocupacional',
  tagline: 'Vigilancia médica, trazabilidad EMO y gestión inteligente de hallazgos',
  favicon: 'img/favicon.ico',

  url: 'https://pilartec.github.io',
  baseUrl: '/panel-salud/',
  trailingSlash: false,

  organizationName: 'PilarTec',
  projectName: 'panel-salud',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'es',
    locales: ['es'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        blog: {
          routeBasePath: 'versiones',
          blogTitle: 'Novedades y Registro de Versiones',
          blogDescription: 'Historial de versiones, avances y mejoras del Panel de Salud Ocupacional',
          blogSidebarTitle: 'Historial de Versiones',
          blogSidebarCount: 'ALL',
          showReadingTime: false,
          onInlineTags: 'ignore',
          onInlineAuthors: 'ignore',
          onUntruncatedBlogPosts: 'ignore',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Panel de Salud',
      logo: {
        alt: 'Logo Panel de Salud',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/versiones',
          label: '🚀 Registro de Versiones',
          position: 'left',
        },
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: '📖 Módulos y Documentación',
        },
        {
          href: 'https://github.com/PilarTec/panel-salud',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentación',
          items: [
            {
              label: 'Introducción al Sistema',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Actualizaciones',
          items: [
            {
              label: 'Todas las Versiones',
              to: '/versiones',
            },
          ],
        },
        {
          title: 'Proyecto',
          items: [
            {
              label: 'Repositorio GitHub',
              href: 'https://github.com/PilarTec/panel-salud',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Panel de Salud Ocupacional. Generado con Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
