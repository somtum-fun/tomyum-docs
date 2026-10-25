import { defineConfig } from 'vitepress'

// The docs for TomYum-OSS, served at docs.somtum.fun. Links stay relative, so nothing else here names the host.
export default defineConfig({
  title: 'TomYum',
  description: 'How to run TomYum-OSS, an osu! server written in C# for lazer, stable and older clients.',
  lang: 'en-GB',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: 'https://docs.somtum.fun' },
  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],
    ['link', { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }],
  ],
  themeConfig: {
    logo: { light: '/logo.png', dark: '/logo-dark.png', alt: 'TomYum' },
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Reference', link: '/reference/configuration' },
      { text: 'Roadmap', link: '/reference/roadmap' },
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'What is TomYum?', link: '/guide/introduction' },
          { text: 'Features', link: '/guide/features' },
          { text: 'Requirements', link: '/guide/requirements' },
          { text: 'Community and help', link: '/guide/community' },
        ],
      },
      {
        text: 'Getting started',
        items: [
          { text: 'Try it locally', link: '/guide/local-testing' },
          { text: 'Production with Docker Compose', link: '/guide/production' },
          { text: 'Setting up your domain', link: '/guide/domain-setup' },
          { text: 'Domains, DNS and Caddy', link: '/guide/domains' },
          { text: 'The website (osu-web)', link: '/guide/osu-web' },
          { text: 'Moving from bancho.py', link: '/guide/migrating' },
          { text: 'Updating', link: '/guide/updating' },
        ],
      },
      {
        text: 'Clients',
        items: [
          { text: 'lazer', link: '/clients/lazer' },
          { text: 'stable', link: '/clients/stable' },
          { text: 'Old clients (2008-2015)', link: '/clients/old-clients' },
        ],
      },
      {
        text: 'Features',
        items: [
          { text: 'Spectating', link: '/features/spectating' },
          { text: 'Tournaments', link: '/features/tournaments' },
          { text: 'IRC', link: '/features/irc' },
          { text: 'Bots', link: '/features/bots' },
          { text: 'Custom beatmaps', link: '/features/custom-beatmaps' },
          { text: 'Achievements', link: '/features/achievements' },
          { text: 'Loved', link: '/features/loved' },
          { text: 'pp reworks', link: '/features/pp-reworks' },
          { text: 'Custom rulesets', link: '/features/custom-rulesets' },
          { text: 'Tickets', link: '/features/tickets' },
          { text: 'BNs and the NAT', link: '/features/bn' },
        ],
      },
      {
        text: 'Running it',
        items: [
          { text: 'Plugins', link: '/operations/plugins' },
          { text: 'Monitoring', link: '/operations/monitoring' },
          { text: 'Backups', link: '/operations/backups' },
          { text: 'Gateway', link: '/operations/gateway' },
          { text: 'Troubleshooting', link: '/operations/troubleshooting' },
        ],
      },
      {
        text: 'Developers',
        items: [
          { text: 'Project structure', link: '/develop/project-structure' },
          { text: 'Contributing and code style', link: '/develop/contributing' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Configuration', link: '/reference/configuration' },
          { text: 'Roadmap', link: '/reference/roadmap' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/somtum-fun/TomYum-OSS' },
      { icon: 'discord', link: 'https://discord.gg/U6Ztb3mRyz' },
    ],
    editLink: {
      pattern: 'https://github.com/somtum-fun/tomyum-docs/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },
    search: { provider: 'local' },
    footer: {
      message: 'TomYum is MIT licensed. Not affiliated with ppy Pty Ltd; osu! is a trademark of ppy Pty Ltd.',
      copyright: 'Copyright © 2026 blueskychan-dev, somtum.fun & sundeiii',
    },
  },
})
