# Ashish Nandan Singh

[![Netlify Status](https://api.netlify.com/api/v1/badges/daed933a-3ea2-43a3-8a61-147b544b26fc/deploy-status)](https://app.netlify.com/projects/ashishsingh-blog/deploys)

Source for [promax.dev](https://promax.dev), my personal site and writing home.

The site is intentionally plain: fast pages, quiet typography, MDX writing, and a
small Mithila-inspired visual identity. I use it for essays, notes, project
writeups, and older writing I am slowly bringing back from Medium.

## What Is Here

- **Blogs**: polished essays about software internals, systems, physics, and the
  parts of programming that become clearer once you build them yourself.
- **Notes**: evolving idea maps for topics I expect to revisit, such as frontend
  platform work, Next.js microfrontends, Fluffy, and chess engines.
- **Projects**: small writeups for things I am building or studying.
- **Medium archive**: older articles that still deserve a home here while I
  decide which ones should become full local posts.

## Stack

- [Astro](https://astro.build/) for static rendering
- [MDX](https://mdxjs.com/) for long-form content
- [Tailwind CSS](https://tailwindcss.com/) for utility support
- [Mermaid](https://mermaid.js.org/) for diagrams inside posts
- [Giscus](https://giscus.app/) for GitHub Discussions-powered comments
- Google Analytics or Plausible for lightweight traffic/event tracking
- Netlify for hosting

## Commands

```sh
pnpm install
pnpm dev
pnpm build
pnpm preview
```

## Content

Content lives under `src/content`:

```text
src/content/
├── blog/
├── notes/
└── projects/
```

Draft blog posts are available in local development, but production builds only
ship entries where `draft` is not `true`.

Notes are sorted by their `order` frontmatter value first, then by title. This
keeps the homepage and `/notes` page stable without hard-coding every note into
the route.

## Analytics

The site includes a small provider-switching analytics hook in
`src/components/Analytics.astro`. Analytics only loads in production builds and
only when a provider-specific public environment variable is configured.

### Google Analytics

```sh
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Google Analytics is the default recommendation for this site because it is free
and provides traffic sources, geography, devices, pages, campaigns, and custom
events. The site also sends a small `outbound_link_click` event for external
links, plus explicit homepage note/blog click events.

For local verification without committing secrets:

```sh
cp .env.example .env
```

Then replace `G-XXXXXXXXXX` with the GA4 measurement ID from the web data stream.
For production, set the same `PUBLIC_GA_MEASUREMENT_ID` value in the hosting
provider's environment variables.

### Plausible

Plausible remains available if you decide the simpler dashboard and privacy
posture are worth paying for later:

```sh
PUBLIC_PLAUSIBLE_DOMAIN=promax.dev
PUBLIC_PLAUSIBLE_SRC=https://plausible.io/js/script.outbound-links.js
```

### Disable Analytics

```sh
PUBLIC_ANALYTICS_DISABLED=true
```

## Diagrams

Blog posts can render Mermaid diagrams through `src/components/Mermaid.astro`.
Use it from MDX posts like this:

```mdx
import Mermaid from '../../components/Mermaid.astro';

<Mermaid
  title="A package graph makes transitive impact visible."
  chart={`
graph LR
  Shared[shared-utils] --> UIKit[ui-kit]
  UIKit --> App[customer-app]
`}
/>
```

This keeps diagrams close to the explanation without adding React or another
content format.

## Comments

Blog posts support Giscus comments through `src/components/GiscusComments.astro`.
To enable them:

1. Enable GitHub Discussions on the site repository.
2. Install/enable the Giscus GitHub app for that repository.
3. Use https://giscus.app to generate the repository and category values.
4. Add these environment variables in Netlify:

```sh
PUBLIC_GISCUS_REPO=sirdarthvader/blog
PUBLIC_GISCUS_REPO_ID=R_kg...
PUBLIC_GISCUS_CATEGORY=General
PUBLIC_GISCUS_CATEGORY_ID=DIC_kw...
PUBLIC_GISCUS_MAPPING=pathname
PUBLIC_GISCUS_THEME=preferred_color_scheme
```

These values are public browser configuration, not secrets. If any required value
is missing, the comments block is not rendered.
