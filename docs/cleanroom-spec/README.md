# Clean-Room-Spec: Deadlock Commend 2.0.0 und Deadlock Profile Links 2.0.0

Dirty-Room-Ergebnis. Der Implementierer bekommt nur diesen Ordner, nicht den alten Code.

- `commend.md`: Commend, 29 Abnahme-Punkte, 7 offene Fragen
- `profile-links.md`: Profile Links, 38 Abnahme-Punkte, 8 offene Fragen
- `assets/`: Schemata, ADDONS-Referenzscreenshot, Site-Logos (siehe `assets/README.md`)
- `overlap-check.txt`: Ergebnis des Zeilenvergleichs gegen die übernommenen Dateien
  (erneut ausführen: `python3 /workspace/cleanroom/tools/overlap_check.py`)

Quellen (gelesen im Dirty Room, nicht weitergeben): installierte paks auf lea (pak06 sha256 02348b54…,
pak16 sha256 7a706fc1…), deren Quellen in luxus/deadlock-qol-mods (Commits 3edccce, a861c8b),
QoL Lite upstream f7a5c69, Valve-Layouts aus Deadlock Build 6864.

Darf der Implementierer direkt nutzen: Valve-Layouts als Basis, Kais Addon Settings Library 1.2.3
(Build 9, MIT), Kais Strings/Schema/Registrar aus `paks/*/src/{strings,schema,register,settings}.js`.
