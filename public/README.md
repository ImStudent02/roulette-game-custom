# Public Assets Directory

## Purpose

This directory contains **static assets** served directly by Next.js. Files here are accessible at the root URL path (e.g., `/mango.png`).

## Contents

### Images & Branding

| File                                             | Description                     |
| ------------------------------------------------ | ------------------------------- |
| `mango.png`, `mango.svg`                         | Primary mango logo/mascot       |
| `mango-juce.png`, `mango-juce.svg`               | Mango juice visual asset        |
| `rotten-mango.png`, `rotten-mango.svg`           | Rotten mango (loss/devil theme) |
| `rotten-mango-juce.png`, `rotten-mango-juce.svg` | Rotten mango juice asset        |
| `*-removebg-preview.png`                         | Transparent background versions |

### Icons & PWA

| File                                  | Description        |
| ------------------------------------- | ------------------ |
| `favicon.ico`                         | Browser tab icon   |
| `icon-192.png`, `icon-512.png`        | PWA app icons      |
| `next.svg`, `vercel.svg`              | Framework branding |
| `file.svg`, `globe.svg`, `window.svg` | UI icons           |

### Subdirectories

| Directory | Description                                         |
| --------- | --------------------------------------------------- |
| `img/`    | Story animation images (house, wheel, devil scenes) |

### Configuration

| File         | Description            |
| ------------ | ---------------------- |
| `_redirects` | Netlify redirect rules |

## Usage

```tsx
// In components, reference as:
<Image src="/mango.png" alt="Mango" />
```

## Related

- `app/manifest.ts` - PWA manifest configuration
- `app/layout.tsx` - Favicon/icon imports
