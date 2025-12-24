# Story Images Directory

## Purpose

This directory contains **story animation images** for "The House of the Mango Devil" backstory experience.

## Contents

| File               | Description                          |
| ------------------ | ------------------------------------ |
| `house.png`        | The mysterious casino house exterior |
| `door.png`         | The ominous entrance door            |
| `man.png`          | The protagonist/gambler character    |
| `gambler.png`      | Gambler at the wheel scene           |
| `wheel.png`        | The cursed roulette wheel            |
| `mango.png`        | The golden mango symbol              |
| `eyes.png`         | The devil's watching eyes            |
| `devil_reveal.png` | The Mango Devil reveal moment        |
| `consequence.png`  | The consequence/aftermath scene      |

## Usage

These images are used in:

- `/story` - Static story page
- `/story-animated` - Animated story with TTS narration

```tsx
// In story components:
<Image src="/img/house.png" alt="The House" fill />
```

## Art Style

Chinese watercolor animation style with:

- Muted, mysterious color palette
- Ethereal lighting effects
- Dreamlike, atmospheric quality

## Related

- `app/story/page.tsx` - Static story page
- `app/story-animated/page.tsx` - Animated story experience
