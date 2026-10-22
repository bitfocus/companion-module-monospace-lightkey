## Lightkey

This module is for controlling Lightkey 4.

### Live feedback (optional)

Lightkey sends no state back over OSC or MIDI. To get feedbacks, variables and presets, run [lightkey-api](https://github.com/huntrw6/lightkey-api) on the Lightkey computer and enter its address in **lightkey-api address** (for example `10.30.0.211`). The agent reads Lightkey's DMX output and reports what each fixture does now, whatever caused it: cue, override or effect. Leave the address empty to use only the actions.

**Requirements:** lightkey-api 0.4.3 or newer on the Lightkey computer (macOS). Install it with the one-line command in its README. To let this computer reach it, add `--allow <network interface>` (for example `en0`) to that command. The agent has no password, so allow only a network you trust. Without the agent, or with the address left empty, everything else in this module works as before.

**Feedbacks**

- **lightkey-api is connected**
- **Fixture is lit**
- **Fixture brightness** (compare with a level, 0 to 100)
- **Fixture color as button color**

**Variables**, for each fixture: `$(lightkey:NAME_level)` (0 to 100), `$(lightkey:NAME_lit)` (1 or 0) and `$(lightkey:NAME_color)` (`#rrggbb`). Characters other than letters, digits, `-` and `_` in a fixture name become `_`.

**Presets**: one color button and one on/off button per fixture, and a status button.
