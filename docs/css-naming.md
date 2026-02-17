# CSS/Hook Naming Convention

Diese Konvention gilt **modulweit** für UI-Hook-Klassen und Hook-IDs in `styles/`, `templates/` und `scripts/`.

## Präfix-Regel

- Verwende für Greybearded Token Frames UI-Hooks ausschließlich das Präfix `gbtf-`.

## Strukturregel

- Block: `gbtf-<feature>`
- Element: `gbtf-<feature>__<element>`

## Modulweite Beispiele (Soll)

- Dialog-/Form-IDs: `gbtf-<feature>-dialog`, `gbtf-<feature>-form`
- Wrapper-/Content-Klassen: `gbtf-frames`, `gbtf-colors`, `gbtf-nameplate`, `gbtf-token-tools`
- Elemente: `gbtf-token-tools__row`, `gbtf-token-tools__actions`, `gbtf-token-tools__size-field`

## Token-Tools Soll-Bezeichner

Für Token-Tools sind folgende Bezeichner verbindlich:

- `gbtf-token-tools-dialog`
- `gbtf-token-tools-form`
- `gbtf-token-tools`
- `gbtf-token-tools__row`
- `gbtf-token-tools__actions`
- `gbtf-token-tools__size-field`

## Nicht mehr zu verwenden

Folgende Altvarianten dürfen nicht mehr verwendet werden:

- `gb-*`
- `gbt-*`
- insbesondere `gbt-token-*` und `gbt-frames-tools-*`

## Statische Prüfung

Zum frühzeitigen Erkennen von Mischpräfixen kann die statische Prüfung ausgeführt werden:

```bash
node scripts/check-legacy-prefixes.js
```

Der Check durchsucht `styles/`, `templates/` und `scripts/` und meldet Treffer auf verbotene Altpräfixe.
