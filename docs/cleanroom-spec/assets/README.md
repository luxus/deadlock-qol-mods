# Assets zur Spec

| Datei | Was | Herkunft | Im Mod verwenden? |
|---|---|---|---|
| `commend-row-normal.png` | Commend-Reihe, Ruhe | schematisch gerendert aus den Massen in commend.md (`tools/mocks.py`), 2× | nein, nur Referenz |
| `commend-row-hover-team.png` | Team-Pille im Hover (1.08, Alpha 0x15) | schematisch, 2× | nein |
| `commend-row-active-team.png` | Team-Pille gedrückt (0.92) | schematisch, 2× | nein |
| `profile-links-page-name-row.png` | Profilseite, Namenszeile | schematisch, 2× | nein |
| `profile-links-card.png` | Profilkarte, Account-ID-Zeile + Text-Buttons | schematisch, 2× | nein |
| `profile-links-scoreboard-slot.png` | Scoreboard-Slot, Ruhe + Hover | schematisch, 2× | nein |
| `addons-menu-reference-2026-11-22.png` | Echter Screenshot ADDONS-Fenster (lea, 22.11.2026 11:43 CET) | Kais Addon Settings Library, Kais eigene UI | Referenz für den Ist-Zustand |
| `brand-statlocker-64.png` | Statlocker-Logo 64 × 64 RGBA | [Marke] statlocker.gg/logo-icon-192.png, Lanczos auf 64 | ja, neu von der Site beziehen; nicht aus Dritt-Mod |
| `brand-deadchaps-64.png` | DeadChaps-Logo 64 × 64 RGBA | [Marke] deadchaps.gg/logo.png, Lanczos auf 64 | ja, neu von der Site beziehen; nicht aus Dritt-Mod |

Daumen-Icon, Obscurus-Badge und Spinner sind Valve-Assets. Sie werden per `s2r://`-Pfad referenziert und
nicht mitgeliefert: `panorama/images/icons/icon_thumbsup.vsvg`, `panorama/images/ranked/badges/rank00_lg_psd.vtex`,
`panorama/images/control_icons/spinner_png.vtex`.

Neu zu zeichnen: **nichts**. Keines der im installierten pak verwendeten Bilder stammt aus QoL Lite,
Statlocker Integration (tanaee) oder Quick Commend (ThatOneSheriff). Gemessen: die beiden Logo-Texturen
in pak06 sind pixelgleich mit den verkleinerten Site-Logos.

Die Schemata nutzen DejaVu Sans als Platzhalter-Schrift und ein Ersatz-Daumen-Glyph. Im Spiel gelten
Valves Label-Schrift und Valves Icon.
