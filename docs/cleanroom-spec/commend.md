# Deadlock Commend 2.0.0: Verhaltens- und Design-Spezifikation (Clean Room)

Ziel: Ein Implementierer, der den alten Code nie gesehen hat, baut eine Mod, die sich im Spiel
identisch zu Deadlock Commend 2.0.0 verhält und identisch aussieht.

Gemessen an: installiertem pak16 auf lea, sha256 `7a706fc1570ea03f2ad2a62f109e82802ce8c7aeb6ec68e5e9073686ae97abff`,
dekompiliert mit Source 2 Viewer 21.1. Valve-Vergleich: Deadlock ClientVersion 6864 (18.11.2026),
Valve-Layouts aus `game/citadel/pak01_dir.vpk`. Die Valve-Layouts in `deadlock-commend/vanilla/` sind
byte-gleich (bis auf Kommentarzeile) mit Build 6864.

Herkunftslabels in dieser Spec:
- **[Valve]** Valve-Datei, -Klasse, -ID, -Asset oder -Event. Darf verwendet werden.
- **[Kai]** Kais eigener Code oder Text (Addon Settings Library, Strings, Schema). Darf übernommen werden.
- **[neu]** Muss frei neu geschrieben werden. Nur das Verhalten ist vorgegeben, nicht die Umsetzung.

Alle Namen, die du für eigene Klassen, IDs, Funktionen und Dateien vergibst, wählst du selbst.
Vorgeschlagene Präfixe: `Dc` (CSS/IDs), `deadlock_commend_` (Dateien). Namen aus dem alten Code
kommen in dieser Spec absichtlich nicht vor.

---

## 1. Dateien im pak

### 1.1 Überschriebene Valve-Layouts

| Valve-Datei (Pfad im pak) | Änderung |
|---|---|
| `panorama/layout/post_game/citadel_db_page_post_game_new.xml` [Valve] | + 1 Style-Include, + Script-Includes (Logik, Settings), + je 1 Button-Reihe in 3 Screens |
| `panorama/layout/post_game/citadel_db_post_game_progress_mvp.xml` [Valve] | + 1 Style-Include, + Script-Includes (Logik, Settings), + 1 Button-Reihe |
| `panorama/layout/hud_join_team.xml` [Valve] | nur ein neuer `<scripts>`-Block mit dem HUD-Registrar [Kai-Muster] |

Basis ist jeweils Valves Original aus Build 6864, unverändert bis auf die genannten Ergänzungen.
Die Include-Pfade der Valve-Styles und -Scripts bleiben wie im Original (das pak verweist auf die
kompilierten Endungen `.vcss_c` / `.vts_c`).

**Einfügepunkte (Valve-Struktur, Build 6864):**

`citadel_db_page_post_game_new.xml`, innerhalb `CitadelPostGameNew > AsyncDataPanel.Body >
Panel.AsyncSuccessContainer > Carousel#ScreensCarousel`:

| Screen-Panel [Valve] | Reihe wird eingefügt als |
|---|---|
| `#Team1Screen` | letztes Kind, nach `CitadelPostGameTeam#Team1` |
| `#Team2Screen` | letztes Kind, nach `CitadelPostGameTeam#Team2` |
| `#ScoreboardScreen` | letztes Kind, nach `CitadelPostGameScoreboardNew#Scoreboard` |
| `#GraphsScreen` | keine Reihe |

`citadel_db_post_game_progress_mvp.xml`: Reihe ist das letzte Kind des Wurzel-Panels
`CitadelPostGameProgressMVP`, nach `Panel#HonorableMentions`.

Jede Reihe braucht eine eindeutige ID, aus der man ablesen kann, zu welchem Screen sie gehört
(MVP, Team1, Team2, Scoreboard). Die Reihen-Sichtbarkeit hängt davon ab (Abschnitt 3.2).

### 1.2 Neue Dateien

| Pfad | Inhalt | Label |
|---|---|---|
| `panorama/styles/post_game/<dein_name>.css` | Stil der Reihe und der vier Buttons | [neu] |
| `panorama/layout/post_game/<dein_name>.css.xml` | Hülle, die nur das Stylesheet einbindet (installiertes pak hat so eine Datei; optional) | [neu] |
| `panorama/scripts/<logik>.js` | Commend-Logik (Abschnitt 3) | [neu] |
| `panorama/scripts/deadlock_commend_settings.js` | Addon Settings + Schema + Strings + Settings-Glue | [Kai], Glue [neu] |
| `panorama/scripts/deadlock_commend_register.js` | Addon Settings + Schema + Strings + HUD-Registrar | [Kai] |
| `resource/localization/deadlock_commend/deadlock_commend_<sprache>.txt` | 18 Sprachen (Liste 5.2) | [Kai] |

Reihenfolge der Script-Includes in beiden Post-Game-Layouts: zuerst Valves eigenes Script,
dann die Logik, dann `deadlock_commend_settings`. Die Settings-Datei muss nach der Logik laden,
weil sie beim Laden den Schalter auf die Buttons anwendet.

Addon-Name beim Kompilieren: `deadlock-commend` (Suchpfad `citadel_addons/deadlock-commend`).

---

## 2. Sichtbares Design

Alle Werte gemessen aus dem kompilierten Stylesheet in pak16. Schriftfamilie wird nicht gesetzt,
es gilt der Label-Default aus Valves `citadel_base_styles` [Valve].

Farbkonstante: `offWhite` = `#FFEFD7` [Valve, definiert in `citadel_base_styles.css`].
Schreibweise `offWhite + Alpha 0xNN` heisst: Farbe #FFEFD7 mit Alpha-Byte NN.

### 2.1 Reihe

| Eigenschaft | Wert |
|---|---|
| Breite | passt sich den Kindern an |
| Höhe | 28 px |
| Anordnung der Kinder | waagrecht, links nach rechts |
| Ausrichtung im Screen | unten links |
| Abstand links | 200 px |
| Abstand unten | 16 px |
| Ebene (z-index) | 90 |
| Hintergrund | keiner |

### 2.2 Button (Pille), gemeinsam für alle vier

| Eigenschaft | Wert |
|---|---|
| Höhe | 28 px |
| Breite | passt sich Icon + Text an |
| Innenabstand | oben 0, rechts 12 px, unten 0, links 10 px |
| Aussenabstand | links 4 px, rechts 4 px (zwischen zwei Pillen also 8 px) |
| Eckenradius | 60 px (bei 28 px Höhe: voll rund, Kapselform) |
| Hintergrund Ruhe | offWhite + Alpha 0x05 (≈ 2 %) |
| Hintergrund Hover | offWhite + Alpha 0x15 (≈ 8 %) |
| Skalierung Hover | 1.08 (vor dem Layout, `pre-transform-scale2d`) |
| Skalierung gedrückt (`:active`) | 0.92 |
| Sound beim Drücken | `UI.CommendConfirmation` [Valve-Soundevent], ausgelöst über den `:active`-Zustand |
| Übergänge | Skalierung, Hintergrundfarbe, Deckkraft, je 0.1 s, Standard-Easing |
| Deckkraft | 1 |
| Rahmen | keiner |

Ein "erledigt"-Zustand mit Deckkraft 0.35 ist im Stylesheet vorhanden, wird aber in 2.0.0 nie auf
die eigenen Buttons gesetzt. Sichtbar: Die Buttons dimmen nach einem Klick **nicht**.

### 2.3 Icon

| Eigenschaft | Wert |
|---|---|
| Grösse | 14 × 14 px |
| Abstand rechts zum Text | 6 px |
| Vertikal | mittig |
| Bild | `s2r://panorama/images/icons/icon_thumbsup.vsvg` [Valve-Asset] |
| Bild-Skalierung | contain, nicht wiederholt, zentriert |
| Einfärbung (wash-color) | Buttonfarbe (Tabelle 2.5) |
| Übergang | Einfärbung 0.1 s |

Kein Dritt-Asset. Nichts neu zu zeichnen.

### 2.4 Text

| Eigenschaft | Wert |
|---|---|
| Schriftgrösse | 14 px |
| Gewicht | Default |
| Ausrichtung | links, vertikal mittig |
| Farbe | Buttonfarbe (Tabelle 2.5) |

### 2.5 Reihenfolge, Text und Farbe

Von links nach rechts:

| # | Text (fest, Englisch) | Farbe Icon + Text | Aktion |
|---|---|---|---|
| 1 | `Team` | `#8fdf8a` | eigenes Team commenden |
| 2 | `Enemy` | `#e88989` | Gegner commenden |
| 3 | `All` | offWhite + Alpha 0xcc (≈ 80 %) | alle commenden, danach Reihen weg |
| 4 | `Return` | `#8ee0b0` | erhaltene Commends zurückgeben |

Die Texte sind im installierten pak fest im Layout eingetragen und **nicht** lokalisiert, auch
wenn die Sprachdateien Tokens für Team/Gegner/Alle/Zurück enthalten. Identisch heisst: fest
Englisch. (Offene Frage O-C7.)

Das Stylesheet enthält eine fünfte Farbe `#e6c36a` für einen "Unmuted"-Button. Diesen Button gibt es
in keinem Layout. Nicht bauen.

Schematische Darstellung (gerendert aus diesen Massen, kein Screenshot):
`assets/commend-row-normal.png`, `assets/commend-row-hover-team.png`, `assets/commend-row-active-team.png`.

---

## 3. Verhalten

### 3.1 Begriffe [Valve]

- **Post-Game-Wurzel**: das Panel mit ID `CitadelPostGameNew` (Valves CSS selektiert `#CitadelPostGameNew`).
- **Darf commenden**: Valve setzt die Klasse `CanCommendPlayers` auf der Post-Game-Wurzel oder einem
  Nachfahren. Fehlt sie überall, darf der Spieler nicht commenden.
- **Aktueller Screen**: Klasse auf der Post-Game-Wurzel: `SelectedScreen_MVP`, `SelectedScreen_Team1`,
  `SelectedScreen_Team2`, `SelectedScreen_Scoreboard` (weitere: `_Graphs`, `_LocalPlayer`, `_Ranked`,
  `_HeroReleaseVoteResults`, ohne Reihe). Diese Klassen stehen nicht in Valves CSS/JS von Build 6864;
  sie kommen vermutlich aus C++. (O-C1)
- **Match-ID**: Text des ersten Labels mit ID `MatchID` unter der UI-Wurzel, in Suchreihenfolge (3.3).
  Es gibt fünf solche Labels (vier im Post-Game-Layout, eins im MVP-Layout); sie zeigen dieselbe ID.
- **UI-Wurzel**: oberster Vorfahr des Kontextpanels (so weit nach oben laufen, wie es Eltern gibt).

### 3.2 Wann die Reihen sichtbar sind

**Lebensdauer des Zustands (SG-C4):** Jede geladene Instanz eines der beiden Layouts beginnt mit
leerer "zuletzt gesehener Match-ID". Die erste Prüfung nach dem Laden ist deshalb immer ein Reset
(Schritt 1), auch wenn es dasselbe Match ist: Reihen wieder sichtbar, "Alle erledigt" gelöscht
(auch die Klasse an der Post-Game-Wurzel), Markierungen gelöscht. Wird ein Layout neu geladen,
kommen die Reihen also zurück. Kein Speicher über die Lebensdauer der Layout-Instanz hinaus.
Die Klasse an der Post-Game-Wurzel dient nur dazu, dass die zweite, gleichzeitig geladene
Instanz das "Alle erledigt" der ersten sieht.

Prüfung alle **0.25 s**, solange eines der beiden Post-Game-Layouts geladen ist (also auch, wenn das
Post-Game für ein Match aus der Match History geöffnet wird):

1. Neue Match-ID (nicht leer, anders als zuletzt gesehen): Zustand zurücksetzen. Alle Reihen wieder
   sichtbar machen, "Alle erledigt" löschen, alle "schon geklickt"-Markierungen (3.4) löschen.
2. Wenn "Alle erledigt" für dieses Match gesetzt ist: alle Reihen versteckt. Fertig.
3. Sonst für jede Reihe: sichtbar genau dann, wenn **darf commenden** UND der aktuelle Screen
   gleich dem Screen der Reihe ist. Sonst versteckt.
4. Danach den Settings-Schalter auf die einzelnen Buttons anwenden (3.5).

"Versteckt" heisst: Deckkraft 0, `visibility: collapse`, nicht klickbar (`enabled` false, `hittest`
false). "Sichtbar" heisst das Gegenteil (Deckkraft 1, `visible`, klickbar).

Folgen, die im Spiel sichtbar sein müssen:
- Graphs-Screen: nie Buttons.
- Altes Match aus der Match History (kein `CanCommendPlayers`): nie Buttons.
- Beim Blättern im Karussell erscheint die Reihe nur auf dem gerade gewählten Screen, spätestens
  nach 0.25 s.

### 3.3 Was als Commend-Ziel zählt

Gesucht wird im **ganzen** Baum unter der UI-Wurzel (alle Karussell-Screens, nicht nur der sichtbare).

**Suchreihenfolge (SG-C3), gilt für jede Suche in dieser Spec:** Tiefensuche, ein Panel vor seinen
Kindern, Kinder in Layout-Reihenfolge (Kind 0 zuerst). Keine Obergrenze für die Zahl der besuchten
Panels: Der Baum unter der UI-Wurzel kann sehr gross sein, ein Abbruch nach N Panels verliert still
Ziele. "Erster Treffer" heisst immer: erster in dieser Reihenfolge.
Ziele sind Valve-Panels:

| Valve-Element | Art |
|---|---|
| ID `CommendPlayerButton` (Scoreboard) | Knopf |
| Klasse `CommendButton` oder ID `MVPCommendButton` | Knopf |
| ID `HeroScenePanelMask` (Team-Screen, MVP-Ehrenerwähnung) oder `MVPHeroScenePanelMask` (MVP) | Maske |
| ID `ReturnButton` oder Klasse `CanReturnCommend` | Zurückgeben |

Eigene Buttons der Mod sind nie Ziele.

Zu jedem Ziel gehört ein **Besitzer**: der nächste Vorfahr mit Klasse `MVPHonorableMention`,
`CanReturnCommend`, `Player` oder `MVPDetails`; fehlt der, das Panel `MVPHeroScenePanelMask`
(falls Vorfahr), sonst das Ziel selbst.

**Spielername des Besitzers (SG-C1)**: erster **Nachfahre** (beliebig tief, Suchreihenfolge) mit ID
`PlayerName`, sonst erster Nachfahre mit ID `MVPPlayerName`, sonst erster Nachfahre mit Klasse
`PlayerName`. Valve legt diese Namen als `CitadelUserName`-Panels an, die selbst keinen Text haben;
der Name steht in einem Kind-Label, oft zwei bis vier Ebenen unter dem Besitzer. Deshalb: im
gefundenen Panel und seinem Teilbaum den ersten Text nehmen, der nicht leer ist (in Suchreihenfolge).
Davon HTML-Tags entfernen, aussen trimmen, klein schreiben. Leerraum im Innern bleibt.

Beispiele, die für die Entdopplung (3.4) stimmen müssen: Scoreboard-Zeile `.Player` → Name aus dem
tief liegenden `#PlayerName`; MVP-Maske `#MVPHeroScenePanelMask` → Besitzer ist der Vorfahr
`.MVPDetails` (nicht die Maske selbst), Name aus dessen `#MVPPlayerName`. So bekommt derselbe
Spieler auf Scoreboard, Team-Screen und MVP-Screen denselben Namen und wird pro Klick nur einmal
geklickt.

**Ausgeschlossen** (gilt für Team, Enemy, All):
- Eigener Spieler: Ziel oder Besitzer hat einen Vorfahren (bis 50 Ebenen) mit Klasse
  `IsLocalPlayer`, `LocalPlayer`, `local_player`, `IsLocal` oder `TotalsRow`, oder mit ID
  `LocalPlayerIdentifier`.
- Schon commendet: Vorfahr (bis 40 Ebenen) von Ziel oder Besitzer mit Klasse `CommendedPlayer`,
  `AlreadyCommended`, `CommendReturned`, `CantCommend` oder `MVPCantCommend`.
- MVP-Maske, wenn ein Vorfahr die Klasse `MVPAlreadyCommended` hat.
- Ziel trägt die "schon geklickt"-Markierung dieser Mod (3.4).

**Team-Zuordnung** eines Panels: erster Vorfahr, dessen ID `Team1`/`Team2` ist oder damit beginnt
(z. B. `Team1Screen`, `Team1Players`), oder der Klasse `Team1`/`team1` bzw. `Team2`/`team2` hat.

**Eigenes Team**: Team-Zuordnung des ersten Panels mit Klasse `PlayerActionContainer` [Valve, Team-Screen],
das als eigener Spieler gilt (siehe oben). Sonst Team-Zuordnung des ersten Panels mit Klasse
`LocalPlayer`, `Local`, `IsLocalPlayer` oder `local_player`. Sonst unbekannt.

**Beleg der Klassennamen** (gesucht in den extrahierten Valve-Layouts, -Styles und -Scripts von
Build 6864 zu Post-Game und Profil): gefunden `IsLocalPlayer`, `local_player`, `TotalsRow`,
`LocalPlayerIdentifier`, `CommendedPlayer`, `AlreadyCommended`, `MVPCantCommend`, `MVPAlreadyCommended`,
`MVPHonorableMention`, `MVPDetails`, `PlayerActionContainer`. Nicht gefunden: `LocalPlayer`, `IsLocal`,
`CommendReturned`, `CantCommend`, `CanReturnCommend`, `CommendButton`, `MVPCommendButton`, `ReturnButton`.
Die nicht gefundenen sind defensiv und schaden nicht; für identisches Verhalten trotzdem mitprüfen,
weil Valve sie per C++ setzen könnte (O-C2).

### 3.4 Klick auf einen Button

Allgemein: Ist **darf commenden** nicht erfüllt, passiert nichts.

Ziele werden sortiert: erst Knöpfe, dann Masken, dann Zurückgeben. Dann der Reihe nach:

| Button | Ziel wird geklickt, wenn |
|---|---|
| Team | jede Art (Knopf, Maske, Zurückgeben), nicht ausgeschlossen, Team-Zuordnung bekannt, eigenes Team bekannt, gleich |
| Enemy | jede Art (Knopf, Maske, Zurückgeben), nicht ausgeschlossen, beide bekannt, verschieden |
| All | jede Art (Knopf, Maske, Zurückgeben), nicht ausgeschlossen (Team egal) |
| Return | Art "Zurückgeben" und (ID `ReturnButton` oder Klasse `CanReturnCommend` auf Ziel oder Besitzer); eigener Spieler ausgeschlossen; "schon commendet" und Markierung werden ignoriert |

(SG-C2) Team, Enemy und All filtern **nicht** nach Art. Ein Zurückgeben-Ziel wird von ihnen wie
jedes andere behandelt (Ausschlüsse oben, Team-Regel, Entdopplung). Nur Return beschränkt auf die
Art Zurückgeben.

Die Team-Zuordnung eines Ziels ist die Team-Zuordnung seines **Besitzers**.

Doppelte vermeiden (nur Team, Enemy, All): pro Klick wird jeder Spielername höchstens einmal geklickt.
Der erste Treffer in Sortierreihenfolge gewinnt. Ziele ohne Namen werden nicht entdoppelt.

"Klicken" eines Valve-Ziels heisst: nacheinander die Panorama-Events `Activated` (Quelle "mouse"),
`MouseActivate` (Quelle "mouse") und `onactivate` an das Ziel schicken, jeweils fehlertolerant.
Bei Art Maske oder Zurückgeben zusätzlich das Valve-Event `CitadelPostGameCommendPlayer` mit dem Ziel.

Danach: Team/Enemy/All setzen eine unsichtbare "schon geklickt"-Markierung auf das Valve-Ziel
(wirkt nur auf spätere Klicks in diesem Match). Return entfernt sie.

Nach **All**: "Alle erledigt" setzen (auch als Klasse auf der Post-Game-Wurzel, damit der Zustand
das Neuladen eines Layouts übersteht) und sofort alle Reihen verstecken. Bis zur nächsten Match-ID
bleiben sie weg, auf allen Screens.

Nach Team, Enemy, Return bleiben die Reihen sichtbar. Keine Bestätigung, kein Toast, kein Dimmen.
Valves eigene Rückmeldung (Partikel `ui_commend`, Commend-Icon an der Zeile, Benachrichtigung)
kommt von Valve.

### 3.5 Settings-Schalter

| Feld | Wert |
|---|---|
| Addon-ID | `deadlock_commend` (gleich lassen, sonst gehen gespeicherte Werte verloren) |
| Gespeichert als | Key `deadlock_commend_settings` auf deadlockconfig.com (Addon Settings Library) |
| Platzierung | `addons` (eigener Block im ADDONS-Fenster des Esc-Menüs) |
| Autor | `luxus` |
| Hauptschalter | Key `on`, Typ Toggle, Default **an** |
| Weitere Controls | keine |

Wirkung: `on` aus → alle vier Buttons in allen Reihen versteckt (Regeln wie 3.2 "versteckt").
`on` an → alle vier sichtbar, sofern die Reihe sichtbar ist. Die Wirkung gilt beim Laden der
Post-Game-Layouts und live, wenn der Schalter im offenen Esc-Menü umgelegt wird.

Der HUD-Registrar in `hud_join_team.xml` meldet dasselbe Schema an, ohne Logik, damit der Block im
ADDONS-Fenster schon im Hauptmenü/Hideout und in Matches erscheint. Beide Registrierungen
nutzen dieselbe Schema-Definition [Kai, `schema.js`].

Addon Settings Library: [Kai] Version 1.2.3, Build 9, unverändert eingebettet, MIT.
Die Library zeichnet den ADDONS-Block selbst. Erwartetes Bild (Referenz Kai, 22.11.2026):
`assets/addons-menu-reference-2026-11-22.png`, Block "Commend":
- Titel `Commend`, darunter klein `by luxus`, Schalter rechts.
- Keine Unterzeilen, kein Reset sichtbar (nur ein Schalter, kai-design Regel 3).
- Tooltip auf dem Schalter: Beschreibungstext (5.1).

### 3.6 Nebenwirkungen des alten pak, die NICHT sichtbar sind

Das installierte pak schickt zusätzlich JSON-Nachrichten über das Panorama-Event `ClientUI_FireOutput`
(eine Menü-Anmeldung und 16 Anfragen nach einer Mute-Liste im Abstand von 0.25 s) und liest optional
Attribute einer anderen Mod von der UI-Wurzel. Keine installierte Mod antwortet darauf. Kein
sichtbarer Effekt. Empfehlung: weglassen. (O-C6)

---

## 4. Edge-Cases

| Situation | Erwartet |
|---|---|
| Bot-Spieler im Match | wird wie ein Mensch behandelt, falls Valve ein klickbares Commend-Ziel anbietet; sonst nichts |
| Eigener Spieler | nie geklickt, auch nicht bei All |
| Spieler schon commendet (vor oder nach Mod-Klick) | übersprungen |
| Eigenes Team nicht bestimmbar | Team und Enemy tun nichts; All und Return funktionieren |
| Kein `CanCommendPlayers` (Zuschauer, altes Match) | keine Reihen; Klicks wären wirkungslos |
| Gleiches Match, Layout bleibt geladen | gleiche Match-ID: kein Reset, "Alle erledigt" bleibt |
| Gleiches Match, Layout wird neu geladen | Reset wie bei neuer Match-ID (3.2, Lebensdauer) |
| Neues Match | Reset (3.2 Schritt 1) |
| Spieler ohne Namen | nicht entdoppelt |
| Valve-Layout-Drift (IDs fehlen) | still nichts tun, keine Fehler ins Log |
| Schalter aus | Reihen leer (keine Buttons), Logik läuft weiter |

---

## 5. Texte und Lokalisierung [Kai]

### 5.1 Tokens

Präfix `Dc_`. Englisch:

| Token | Text |
|---|---|
| `Dc_Tab` | Commend |
| `Dc_Reset` | Reset Commend |
| `Dc_Section` | Commend |
| `Dc_Commend` | Commend buttons |
| `Dc_Commend_Desc` | On the post-game screens, buttons to commend your team, the enemy, everyone, or to return commends. |
| `Dc_Team` | Team |
| `Dc_Enemy` | Enemy |
| `Dc_All` | All |
| `Dc_Return` | Return |

Alle Sprachen 1:1 aus Kais `paks/commend-split/src/strings.js` übernehmen (Kais eigener Text).
Deutsch in Schweizer Schreibung (ss, kein ß).

### 5.2 Sprachdateien

18 Dateien `deadlock_commend_<sprache>.txt`: brazilian, czech, english, french, german, indonesian,
italian, japanese, koreana, latam, polish, russian, schinese, spanish, tchinese, thai, turkish,
ukrainian. Format: Valve-KeyValues `"lang" { "Language" "<sprache>" "Tokens" { … } }`.

---

## 6. Log-Lines zum Verifizieren

In `game/citadel/console.log` (Präfix `[PanoramaScript]`):

| Zeile | Wann |
|---|---|
| `DC-diag register hud` | HUD geladen (Hauptmenü), vom Registrar |
| `Deadlock Commend: 2.0.0 loaded (<sprache>)` | je Post-Game-Layout, das geladen wird (also bis zu 2× pro Post-Game) |
| `Addon Settings: addon: deadlock_commend` | beim Öffnen des ADDONS-Fensters |
| `Addon Settings: open: … addons=…deadlock_commend…` | beim Öffnen des ADDONS-Fensters |

Fehlerzeilen (dürfen nicht vorkommen):
- `Deadlock Commend: hud register error <fehler>`
- `Deadlock Commend: settings <fehler>`

Bekannte harmlose Warnungen (kommen auch mit dem alten pak):
- `[Localization System] CLocalize::ConstructString failed to localize: '#Dc_Commend'` und `'#Dc_Commend_Desc'`
  (die Library fällt auf die eigene Tabelle zurück).
- `[Particles] WARNING: Particle system 'particles/ui/ui_commend_persistent.vpcf' was not precached` (Valve).

Die alten Diagnosezeilen `DC-diag load` / `DC-diag register` (ohne `hud`) gehören zu 1.0.x und
kommen in 2.0.0 nicht vor.

---

## 7. Abnahme-Checkliste (im Spiel abhaken)

Vorbereitung: nur das neue pak statt pak16, sonst gleicher Mod-Stand. Ein normales Match zu Ende
spielen (nicht Sandbox), mit mindestens einem anderen Menschen im Team und im Gegnerteam.

**ADDONS / Settings**
- [ ] C1 Hauptmenü, Esc → ADDONS: Block "Commend" mit "by luxus" und Schalter, an.
- [ ] C2 Kein Reset, keine Unterzeile, keine doppelte Überschrift im Block.
- [ ] C3 Hover über den Schalter zeigt den Tooltip-Text aus `Dc_Commend_Desc` (Spielsprache).
- [ ] C4 Native Esc-Menüeinträge stehen unverändert (Screenshot vorher/nachher).
- [ ] C5 Im Log `DC-diag register hud` nach dem Start.

**Post-Game, Schalter an**
- [ ] C6 MVP-Screen: Reihe unten links, 200 px vom linken Rand, 16 px über dem unteren Rand.
- [ ] C7 Reihenfolge Team, Enemy, All, Return; Farben grün, rot, hell, mintgrün; Daumen-Icon links.
- [ ] C8 Pillen 28 px hoch, Kapselform, kaum sichtbarer heller Hintergrund, 8 px Abstand.
- [ ] C9 Hover: Pille wird leicht grösser (1.08) und heller; zurück beim Verlassen, 0.1 s.
- [ ] C10 Drücken: Pille schrumpft kurz (0.92), Commend-Sound `UI.CommendConfirmation` hörbar.
- [ ] C11 Team-1-Screen und Team-2-Screen: je eine Reihe, gleiche Position und Optik.
- [ ] C12 Scoreboard-Screen: eine Reihe, gleiche Position und Optik.
- [ ] C13 Graphs-Screen: keine Reihe.
- [ ] C14 Beim Blättern erscheint die Reihe nur auf dem aktiven Screen (nie zwei gleichzeitig).
- [ ] C15 Im Log `Deadlock Commend: 2.0.0 loaded (<sprache>)`, keine Fehlerzeilen.

**Aktionen**
- [ ] C16 Team: alle Mitspieler ausser dir bekommen ein Commend (Valve-Icon an ihrer Zeile), Gegner nicht.
- [ ] C17 Enemy: alle Gegner bekommen ein Commend, Mitspieler nicht.
- [ ] C18 Ein zweiter Team-Klick schickt nichts doppelt.
- [ ] C19 Return: wer dich commendet hat und noch kein Commend von dir hat, bekommt es zurück.
- [ ] C20 Nach Team/Enemy/Return bleiben die Buttons sichtbar und werden nicht gedimmt.
- [ ] C21 All (frisches Match): alle ausser dir bekommen ein Commend, danach verschwinden die
      Reihen auf allen Screens.
- [ ] C22 Nach All, Screen wechseln: Reihen bleiben weg.
- [ ] C23 Du selbst bekommst nie ein Commend von der Mod.

**Schalter aus**
- [ ] C24 Esc → ADDONS → Commend aus, im Post-Game: keine Buttons auf keinem Screen.
- [ ] C25 Schalter wieder an, ohne Neustart: Buttons erscheinen wieder (spätestens 0.25 s).
- [ ] C26 Neustart des Spiels: Schalterstellung bleibt erhalten.

**Kein Commend möglich**
- [ ] C27 Altes Match aus der Match History öffnen: keine Commend-Reihen, Seite sonst wie Valve.
- [ ] C28 Nächstes Match: Reihen sind wieder da (Reset über neue Match-ID).

**Sprache**
- [ ] C29 Spielsprache Deutsch: ADDONS-Texte deutsch ("Commend-Tasten" im Tooltip), Button-Texte
      bleiben Englisch (Team, Enemy, All, Return).

Summe: **29 Punkte**.

---

## 8. Offene Fragen, die nur ein Ingame-Check klärt

- **O-C1** Setzt Valve die Klassen `SelectedScreen_*` wirklich auf `#CitadelPostGameNew`? Sie stehen in
  keiner Valve-CSS/JS von Build 6864. Wenn nicht, zeigt auch das alte pak nie Reihen.
  Es gibt keinen Konsolenbeleg für 2.0.0 auf einem echten Post-Game, nur für 1.0.2.
- **O-C2** Wo entsteht das Valve-Element `ReturnButton` bzw. die Klasse `CanReturnCommend`? Nicht in den
  Layouts. Return ist ohne diesen Beleg ungeprüft.
- **O-C3** Reicht das Event-Trio aus 3.4 auf den Masken des Team-Screens, oder zählt nur
  `CitadelPostGameCommendPlayer`? Danach prüfen, ob ein Commend pro Spieler genau einmal ankommt.
- **O-C4** Gibt Valve ein Limit an Commends pro Match vor? Wenn ja: was passiert bei All mit mehr
  Zielen als erlaubt?
- **O-C5** Liegt die Reihe auf dem MVP-Screen über Valves Ehrenerwähnungen oder dem Requeue-Knopf?
  Ebene 90, unten links mit 200 px Einzug.
- **O-C6** Wird die `ClientUI_FireOutput`-Anmeldung (3.6) irgendwo gebraucht, z. B. von einem
  QoL-Lite-Mod-Menü? Wenn nein, weglassen.
- **O-C7** Kai entscheiden lassen: Button-Texte fest Englisch (identisch) oder über `Dc_Team` usw.
  lokalisiert (Tokens existieren schon).
