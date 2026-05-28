# Audio and asset attribution

Credits for background music, sound effects, and related assets used in this project. The in-game **Acknowledgements** modal (game menu) mirrors this information for players; maintain [`src/content/acknowledgements.ts`](../../src/content/acknowledgements.ts) when you add or change licensed material.

## Background music (Pixabay)

All listed tracks are by **nojisuma** on Pixabay ([profile](https://pixabay.com/users/nojisuma-23737290/)). **License:** [Pixabay Content License](https://pixabay.com/service/license/) (free for commercial use in games).

| File | Title | Used for |
|------|-------|----------|
| `music/default/ambient/nojisuma-night_dew-429962.mp3` | Night Dew | Intro, pause, game-over ambience |
| `music/default/fugitive/nojisuma-explore_at_night-242582.mp3` | Explore at Night | Fugitive turns |
| `music/default/detective/nojisuma-windless-160818.mp3` | Windless | Detective turns |

Additional Pixabay tracks are archived under `music/default/_unused/` (not wired into play). Active paths are listed in [`public/audio/music/manifest.json`](music/manifest.json).

## Sound effects

Move, UI, and dramatic stingers are picked at random from folders under `public/audio/sfx/`. See [`public/audio/sfx/manifest.json`](sfx/manifest.json) for the folder layout.

### QuickSounds.com

Many transport, fugitive reveal/hide, game-over, cancel, and UI effects. Filenames often include `QuickSounds.com`. **Attribution required** — see [QuickSounds.com](https://quicksounds.com/) terms.

### Mixkit

Selected taxi horn and vehicle drive-by effects (`mixkit-*` under `sfx/taxi/`). **License:** [Mixkit License](https://mixkit.co/license/#sfxFree).

### BBC Sound Effects

London bus and Underground ambience samples (`bbc_*` under `sfx/bus/` and `sfx/underground/`). **License:** BBC remArc / personal-use terms — **attribution required**. Source: [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/).

## Typography

| Font | Author | Used for | License |
|------|--------|----------|---------|
| Top Secret Stamp | Galdino Otten | Mr. X ticket backs | Free for personal use; commercial use requires author license — [1001fonts](https://www.1001fonts.com/top-secret-stamp-font.html) |

## Game and trademarks

**Scotland Yard** and related marks are trademarks of their respective owners (including Ravensburger, and for many vintage sets, Milton Bradley / Hasbro). This web adaptation is an independent fan project and is not affiliated with or endorsed by them.

Software and layout copyright year is set in [`src/game-board/constants.ts`](../../src/game-board/constants.ts). Classic board artwork and game rules remain the property of their respective copyright holders.
