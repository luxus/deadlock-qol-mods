# Deadlock Profile Links 2.0.0: Verhaltens- und Design-Spezifikation (Clean Room)

Ziel: Ein Implementierer, der den alten Code nie gesehen hat, baut eine Mod, die sich im Spiel
identisch zu Deadlock Profile Links 2.0.0 verhält und identisch aussieht.

Gemessen an: installiertem pak06 auf lea, sha256 `02348b549c554b3c3750b460673337abe2947f6e498b9dcfe4b0f22a15322bde`,
dekompiliert mit Source 2 Viewer 21.1. Valve-Vergleich: Deadlock ClientVersion 6864 (18.11.2026),
Valve-Layouts aus `game/citadel/pak01_dir.vpk`. Die Valve-Layouts in `deadlock-profile-links/vanilla/`
sind inhaltlich gleich mit Build 6864.

Herkunftslabels:
- **[Valve]** Valve-Datei, -Klasse, -ID, -Asset, -Binding oder -Event. Darf verwendet werden.
- **[Kai]** Kais eigener Code oder Text (Addon Settings Library, Strings, Schema, Settings-Glue). Darf übernommen werden.
- **[Marke]** Logo der jeweiligen Website. Stammt nicht aus einer Dritt-Mod (siehe 2.6).
- **[neu]** Muss frei neu geschrieben werden. Nur das Verhalten ist vorgegeben.

Eigene Klassen, IDs, Funktionen, Dateinamen und Panel-Attribute wählst du selbst. Vorschlag:
Präfix `Pl` bzw. `profile_links_`. Namen aus dem alten Code kommen hier absichtlich nicht vor.

Die Mod hat drei sichtbare Orte: **Profilseite** (Dashboard-Seite eines Spielers), **Profilkarte**
(Popup beim Hover bzw. Kontextmenü auf einen Spieler) und **Post-Game-Scoreboard** (auch aus der
Match History). Dazu der Block im ADDONS-Fenster.

---

## 1. Dateien im pak

### 1.1 Überschriebene Valve-Layouts

| Valve-Datei (Pfad im pak) | Änderung |
|---|---|
| `panorama/layout/citadel_db_page_profile.xml` [Valve] | + Style, + Scripts, Namenszeile mit 2 Logo-Buttons, versteckte ID-Labels, Rang-Block |
| `panorama/layout/profile_card.xml` [Valve] | + Style, + Scripts, Rang-Block in der Account-ID-Zeile, 2 Text-Buttons |
| `panorama/layout/post_game/citadel_db_post_game_scoreboard_new.xml` [Valve] | + Style, + Scripts, Commend-Spalten entpackt, versteckte ID-Labels, Link-Slot pro Spielerzeile |
| `panorama/layout/hud_match_start.xml` [Valve] | nur ein neuer `<scripts>`-Block mit dem HUD-Registrar [Kai-Muster] |

Basis: Valves Original aus Build 6864, nur um das Genannte ergänzt. Valve-Includes bleiben.

### 1.2 Neue Dateien

| Pfad | Inhalt | Label |
|---|---|---|
| `panorama/styles/<profil>.css` | Stil Profilseite + Profilkarte | [neu] |
| `panorama/styles/<scoreboard>.css` | Stil Scoreboard-Slot | [neu] |
| `panorama/scripts/<profil>.js` | Identität, Rang-Bild, Links (Seite + Karte) | [neu] |
| `panorama/scripts/<scoreboard>.js` | Links im Scoreboard | [neu] |
| `panorama/scripts/profile_links_settings.js` | Addon Settings + Schema + Strings + Settings-Glue | [Kai] |
| `panorama/scripts/profile_links_register.js` | Addon Settings + Schema + Strings + HUD-Registrar | [Kai] |
| `panorama/images/profile_links/statlocker.png` → vtex | Logo 64 × 64 RGBA | [Marke] |
| `panorama/images/profile_links/deadchaps.png` → vtex | Logo 64 × 64 RGBA | [Marke] |
| `resource/localization/deadlock_profile_links/deadlock_profile_links_{english,german}.txt` | Tokens | [Kai] |

Script-Reihenfolge: Profilseite und Profilkarte laden Profil-Script, dann `profile_links_settings`.
Scoreboard lädt Scoreboard-Script, dann `profile_links_settings`. Settings immer zuletzt.

Die eigenen Stylesheets werden in den drei Layouts **nach** Valves Stylesheets eingebunden.

Addon-Name beim Kompilieren: frei, das alte pak nutzte modlock. Hinweis: das alte Build-Skript
baute die Logo-Texturen mit einem aus QoL Lite kopierten RED2-Block. Für den Neubau Texturen mit
eigenem Werkzeug kompilieren (modlock-Texturpfad oder Valves Resource Compiler), nicht mit dieser Vorlage.

---

## 2. Design

Gemessen aus den kompilierten Stylesheets in pak06. Schriftfamilie wird nirgends gesetzt
(Label-Default aus Valves `citadel_base_styles`). Farben als Hex, Alpha als letztes Byte.

### 2.1 Profilseite: Namenszeile

In Valves `#ProfileInfo` [Valve] wird `CitadelUserName#SelfName` in eine neue Zeile gepackt:

```
[Statlocker-Logo] [DeadChaps-Logo] [SelfName]
```

| Element | Wert |
|---|---|
| Zeile | 420 × 36 px, Kinder waagrecht, Überlauf nicht abgeschnitten |
| Logo-Button | Höhe 24 px, Breite = Inhalt, links, vertikal mittig, Abstand rechts **6 px**, Innenabstand 0, Überlauf nicht abgeschnitten |
| Logo im Button | 24 × 24 px, vertikal mittig, Bild contain, nicht wiederholt, zentriert, nicht klickbar (Klick geht an den Button) |
| Button-Hintergrund | keiner, kein Rahmen |
| Hover | Helligkeit 1.15, Übergang 0.12 s |
| `SelfName` | unverändert Valve, aber nicht klickbar (`hittest` aus) |
| Tooltip Statlocker | `View Statlocker Profile` (fest Englisch), Valve `UIShowTextTooltip` / `UIHideTextTooltip`. Der Text ist im Event-String ein Literal in einfachen Anführungszeichen (im XML `&apos;…&apos;`), nicht nackt |
| Tooltip DeadChaps | `View DeadChaps Profile` (fest Englisch) |
| Startzustand Buttons | versteckt und deaktiviert, bis die Identität feststeht (3.3) |

Schema: `assets/profile-links-page-name-row.png`.

(Im alten Stylesheet steht für diesen Button zuerst ein Abstand rechts von 15 px; eine spätere Regel
setzt 6 px. Wirksam ist 6 px.)

### 2.2 Profilseite: Rang-Block

Unter Valves `#ForumButton`, als letztes Kind von `#ProfileInfo`:

| Element | Wert |
|---|---|
| Aussen-Container | 120 × 104 px, Abstand oben 12 px, vertikal mittig, Überlauf nicht abgeschnitten |
| Rang-Fläche | 120 × 104 px, ohne Abstände, abgeschnitten (Überlauf clip) |
| Platzhalter-Fläche | 110 × 92 px, zentriert, clip |
| Platzhalter-Slot | 110 × 88 px, zentriert |
| Platzhalter-Bild | Valve `s2r://panorama/images/ranked/badges/rank00_lg_psd.vtex` [Valve, Obscurus-Badge, 404 × 324], füllt den Slot, Skalierung "stretch-to-fit-preserve-aspect", Deckkraft 0.72, `pre-transform-scale2d` 0.92 |
| Spinner | 24 × 24 px, zentriert über dem Platzhalter (Ebene 3), Bild `s2r://panorama/images/control_icons/spinner_png.vtex` [Valve], contain, Einfärbung `#d9ffff`, Deckkraft 0.92, dreht 0° → 360° in 1.1 s linear, endlos, über die Eigenschaft `pre-transform-rotate2d` in den Keyframes (nicht `transform`) |
| Rang-Bild | 110 × 76 px Fläche, Bild darin 110 × 76, zentriert, clip, Skalierung "stretch-to-fit-preserve-aspect" |

### 2.3 Profilkarte: Account-ID-Zeile mit Rang

Valves Panel `#AccountID` [Valve] ist im Original nur mit Klasse `ShowAccountID` sichtbar.
Mit der Mod ist es **immer sichtbar** (auch wenn der Schalter aus ist, siehe 4).

| Element | Wert |
|---|---|
| `#AccountID` | Breite 100 %, Mindesthöhe 54 px, Kinder waagrecht, vertikal mittig, Hintergrund `#050708e8`, Innenabstand 3 px oben/unten, 8 px links/rechts |
| Valve-Label (Text `#Citadel_ProfileCard_AccountID`) | füllt die restliche Breite, vertikal mittig, Farbe `#9aa8ae`, 13 px. Valves eigener Aussenabstand 5 px / 10 px bleibt |
| Rang-Fläche rechts | 48 × 44 px, Abstand links 8 px, vertikal mittig, clip |
| Platzhalter- und Bildfläche | je 44 × 34 px, zentriert, clip |
| Platzhalter-Slot | 44 × 34 px |
| Platzhalter-Bild | wie 2.2, aber `pre-transform-scale2d` 1.15, Deckkraft 0.72 |
| Spinner | 20 × 20 px, sonst wie 2.2 |
| Rang-Bild | 44 × 32 px |
| Während Valve die Karte lädt (Klasse `Loading` auf `CitadelProfileCard`) | Rang-Fläche versteckt |

### 2.4 Profilkarte: Text-Buttons

Zwei Buttons in Valves `#ContentsMainForeground` [Valve], **nach** `#CardMain` und **vor** `#PartyInfo`,
Reihenfolge Statlocker, dann DeadChaps.

| Eigenschaft | Statlocker | DeadChaps |
|---|---|---|
| Text (fest Englisch) | `View Statlocker Profile` | `View DeadChaps Profile` |
| Grösse | Breite 100 %, Höhe 42 px | gleich |
| Innenabstand links | 12 px | gleich |
| Hintergrund Ruhe | `#0d1110` | gleich |
| Helligkeit Ruhe | 0.72 | gleich |
| Hintergrund Hover | `#19201d` | gleich |
| Helligkeit Hover | 1.25 | gleich |
| Übergang | Hintergrund und Helligkeit, 0.10 s | gleich |
| Rahmen unten | keiner | 1 px solid `#f0b35a` |
| Text: Abstand links | 8 px (zusätzlich zu 12 px Innenabstand) | gleich |
| Text: Ausrichtung | links, vertikal mittig | gleich |
| Text: Farbe | `#69e799` | `#f0b35a` |
| Text: Grösse | 16 px | gleich |
| Text: Gewicht | semi-bold | gleich |
| Text: Überlauf | schrumpfen (`text-overflow: shrink`) | gleich |
| Text: Unterstreichung | keine | keine |
| Tooltip | keiner | keiner |
| Startzustand | versteckt, deaktiviert, nicht klickbar | gleich |

Schema: `assets/profile-links-card.png` (zeigt den Ruhezustand bei Helligkeit 0.72).

### 2.5 Post-Game-Scoreboard: Link-Slot

Pro Spielerzeile (Valve-Snippet `Player` in `citadel_db_post_game_scoreboard_new.xml`) ein Slot als
**letztes Kind** von `.Player`, also rechts **nach** Valves `.PlayerRow` (nach Stats, Items, Fähigkeiten
und Copy-Build). Keine Valve-Spalte verschiebt sich gegenüber dem Tabellenkopf.

| Element | Wert |
|---|---|
| Slot | Höhe 48 px, vertikal mittig, Abstand links 8 px, Kinder waagrecht |
| Slot in der Summenzeile (Valve-Klasse `TotalsRow` an `.Player`) | versteckt |
| Button | 34 × 34 px, Kreis (Radius 50 %), Hintergrund `#07130fdd`, Abstand rechts 4 px, vertikal mittig |
| Hover | Helligkeit 1.5, `pre-transform-scale2d` 1.12 |
| Übergang | Skalierung und Helligkeit, 0.08 s, ease-in-out |
| Logo im Button | 30 × 30 px, zentriert, contain, nicht klickbar |
| Reihenfolge | Statlocker, DeadChaps |
| Tooltip | `View Statlocker Profile` / `View DeadChaps Profile` (fest Englisch), Literal in einfachen Anführungszeichen wie 2.1 |
| Sichtbarkeit | immer sichtbar (ausser Summenzeile und Settings), auch wenn keine gültige ID gelesen werden kann |

Schema: `assets/profile-links-scoreboard-slot.png`.

**Valve-Commend-Spalten im selben Snippet** (das installierte pak ändert sie, identisch nachbauen):
Valves Wrapper `Panel.CommendContainer` ist entfernt. Seine drei Kinder `Button#CommendPlayerButton`,
`Panel.GotCommendedIcon.CommendColumn` und `Panel#LocalPlayerIdentifier.CommendColumn` stehen direkt
in `.Player`, vor `.PlayerRow`, in derselben Reihenfolge, mit Valves Attributen. `#CommendPlayerButton`
bekommt ein leeres Kind-Panel mit ID `commendIcon`. Für `commendIcon` gibt es in Valves Build-6864-CSS
keine Regel. Sichtbarer Effekt gegenüber Vanilla: Valves Überlagerung der drei Spalten
(`flow-children: none` am Wrapper) und dessen Commend-Animation `CommendTrigger` fallen weg. (O-P1)

Ausserdem bekommt die Wurzel `CitadelPostGameScoreboardNew` eine eigene Klasse, damit das Script
weiss, dass es im Scoreboard läuft (Name frei).

### 2.6 Logos

| Datei | Quelle | Mass | Label |
|---|---|---|---|
| Statlocker | `https://statlocker.gg/logo-icon-192.png` (192 × 192 RGBA), auf 64 × 64 verkleinert (Lanczos) | 64 × 64 RGBA | [Marke] |
| DeadChaps | `https://deadchaps.gg/logo.png` (512 × 512, Palette), auf 64 × 64 verkleinert (Lanczos), RGBA | 64 × 64 RGBA | [Marke] |

Gemessen: die Texturen im installierten pak sind pixelgleich (mittlere Abweichung 0.0) mit den so
verkleinerten Site-Logos. Sie stammen **nicht** aus QoL Lite oder tanaees Mod (QoL Lite hatte ein
eigenes grünes Statlocker-Logo 128 × 234; das wird nicht verwendet). Nichts neu zu zeichnen. Offen ist
nur die Markenfreigabe der Sites (O-P8). Referenzkopien: `assets/brand-statlocker-64.png`,
`assets/brand-deadchaps-64.png`.

Alle anderen Bilder sind Valve: `rank00_lg_psd.vtex`, `spinner_png.vtex`.

---

## 3. Verhalten

### 3.1 Account-ID lesen

Die Mod arbeitet mit der 32-Bit-Steam-Account-ID (SteamID3 ohne `[U:1:…]`), dezimal ohne führende Nullen.
Gültig: 100000 bis 4294967295.

**Quellen** [Valve-Bindings] über versteckte Labels (0 × 0 px, `visibility: collapse`, nicht klickbar),
die in das jeweilige Valve-Layout eingefügt werden:

| Ort | Versteckte Labels mit Text-Binding | Weitere Quellen |
|---|---|---|
| Profilseite (in `#ProfileInfo`, nach `#ForumButton`) | `{i:r:account_id}`, `{i:account_id}`, `{i:friend_code}` | alle Texte unter `#SelfName`. **Nicht** Valves sichtbares Label `.FriendID` (SG-P6: das alte pak liest es nicht) |
| Profilkarte (in `#AccountID`, nach Valves Label) | `{i:r:account_id}` | Text von Valves Label `.AccountID` |
| Scoreboard (am Anfang von `.PlayerInfoContainer`) | `{i:r:account_id}`, `{i:account_id}`, `{i:player_account_id}`, `{i:r:player_account_id}` | Attribute `accountid`, `account_id`, `player_account_id` an `#PlayerName` und an der Zeile |

**Text → ID, Profilseite und Karte** (alle Quellen lesen, jede Quelle einzeln umwandeln):
1. HTML-Tags entfernen, Leerraum zusammenfassen, trimmen.
2. Leer, enthält `{` oder `}`, beginnt mit `#`, oder ist `nan` → keine ID.
3. Genau `[U:1:N]` → N.
4. Nur Ziffern, 1–10 Stellen → diese Zahl. Genau 17 Ziffern → SteamID64 minus `76561197960265728`.
5. Sonst im Text suchen: alle `[U:1:N]`, alle allein stehenden 17-stelligen Zahlen (als SteamID64).
   Wenn der Text eine der Wortgruppen "account id" oder "friend code" als ganze Wörter enthält
   (Gross/klein egal, zwischen den beiden Wörtern beliebiger Leerraum oder keiner, also auch
   "AccountID"): der Rest nach dem **ersten** Vorkommen, ohne einen direkt folgenden Doppelpunkt und
   Leerraum. Besteht dieser Rest nur aus Ziffern, Leerzeichen, Punkten, Kommas, Apostrophen (`'` und
   `’`), Unterstrichen oder Bindestrichen (und ist nicht leer): alle Nicht-Ziffern entfernen, führende
   Nullen weg, dann wie Schritt 4 (1–10 Stellen als ID, genau 17 Stellen als SteamID64). Dazu jede
   allein stehende Zahl mit 6–10 Stellen. (SG-P10)
6. Jede Kandidaten-ID muss im gültigen Bereich liegen. Pro Text genau ein eindeutiger Kandidat, sonst keine ID.

Danach über alle Quellen: genau eine eindeutige ID → das ist die ID. Mehrere verschiedene → **Konflikt**,
behandelt wie "keine ID". Keine → keine ID.

**Scoreboard-Quellen, genaue Reihenfolge (SG-P9):** die vier versteckten Labels in der Reihenfolge
der Tabelle (Text, sonst das Attribut `text`); dann an `#PlayerName` die Attribute `accountid`,
`account_id`, `player_account_id`, dann dieselben drei als JS-Eigenschaft des Panels; dann an der
Zeile `.Player` die Attribute `account_id`, `accountid`, `player_account_id`, dann die JS-Eigenschaften
`accountid`, `account_id`, `player_account_id`.

**Text → ID, Scoreboard**: Quellen in der Reihenfolge oben. HTML-Tags entfernen, alle
Nicht-Ziffern entfernen, 6–10 Ziffern verlangen, führende Nullen weg, Bereich prüfen. Die erste gültige gewinnt.

### 3.2 URLs

| Zweck | URL | Wann |
|---|---|---|
| Rang-Bild | `https://api.deadlock-api.com/v1/players/{id}/rank/image?format=webp` | automatisch, Profilseite und Karte |
| Statlocker | `https://statlocker.gg/profile/{id}` | nur bei Klick |
| DeadChaps | `https://www.deadchaps.gg/player/{id}/` (mit Schrägstrich am Ende) | nur bei Klick |

`{id}` URL-kodiert (praktisch nur Ziffern). Öffnen: Panorama-Event `ExternalBrowserGoToURL` mit der
URL (`$.DispatchEvent`). Wenn das scheitert: `SteamOverlayAPI.OpenURL(url)`. Sonst nichts.

Das Rang-Bild ist ein Bild-Abruf, kein Match-History-Aufruf. Pro ID höchstens ein Abruf in 10 Minuten (3.5).

### 3.3 Profilseite

**Ablauf beim Öffnen:**
1. Sofort: Rang-Fläche sichtbar im Zustand **Laden** (Platzhalter + Spinner). Logo-Buttons versteckt.
2. Alle 0.5 s (erste Prüfung nach 0.05 s) ID und Namen lesen (`#SelfName`-Text). Erst wenn ID ohne
   Konflikt da ist und zwei Lesungen hintereinander dieselbe ID + denselben Namen liefern und
   seit der ersten dieser Lesungen mindestens **2000 ms** vergangen sind: Identität steht.
3. Identität steht → Logo-Buttons sichtbar und klickbar (nur wenn die Statlocker-URL gebaut werden
   kann; die DeadChaps-Sichtbarkeit folgt immer der Statlocker-Sichtbarkeit). Rang-Bild anfragen (3.5).
4. Danach 8 s beobachten: in den ersten 2.5 s alle 0.2 s, danach alle 0.5 s. Ändert sich die ID → zurück
   auf Schritt 1 (Buttons weg, Laden). Nach 8 s keine weitere Prüfung.

Ohne ID (z. B. Binding leer, Konflikt): bleibt endlos im Zustand Laden (Spinner dreht), Buttons versteckt.

**Text eines Valve-Namens (SG-P1, gilt für `#SelfName`, `#UserName`, `#UserNickname`,
`#UserRichPresence`):** Diese Panels (`CitadelUserName`) haben selbst keinen Text. "Text von X" heisst
in dieser Spec: alle nicht-leeren Texte von X und seinem Teilbaum bis 8 Ebenen tief (ein Panel vor
seinen Kindern, Kinder in Layout-Reihenfolge), mit Leerzeichen verbunden, dann HTML-Tags entfernen,
Leerraum zusammenfassen, trimmen. Wer nur die eigene Text-Eigenschaft liest, bekommt immer leer.

**Hover:** Jedes Mal, wenn die Maus das Wurzel-Panel der Profilseite betritt (`onmouseover` an
`CitadelProfilePage`), beginnt der Ablauf neu ab Schritt 1: Buttons verschwinden, Spinner erscheint,
nach ~2 s wieder da. (O-P2)

(SG-P5) Identisch heisst: **jedes** `onmouseover`-Event an der Seitenwurzel startet neu, ohne
Entprellung, ohne Zeitfenster, ohne eigenen `onmouseout`-Handler. Feuert Panorama das Event auch bei
Bewegungen über Kinder, flackert es so oft wie im alten pak. Das ist gewollt, bis Kai anders entscheidet.

**Klick auf ein Logo:** Nur wenn die aktuell gelesene ID und der aktuelle Fingerabdruck (ID + Text von
Valves `UserName` + `UserNickname` + "eigener Spieler") noch genau die beim Anzeigen gespeicherten sind,
die Seite nicht lädt und kein Konflikt besteht: URL öffnen. Sonst nichts.

### 3.4 Profilkarte

Die Karte gibt es in zwei Formen:
- **Kontextmenü-Karte** (bleibt offen): ein Vorfahr innerhalb von 12 Ebenen hat ID oder Klasse
  `ContextMenuBody` [Valve].
- **Hover-Karte** (Tooltip): alles andere.

Unterschied: Die Text-Buttons erscheinen **nur** in der Kontextmenü-Karte. Der Rang erscheint in beiden.

**Ablauf beim Öffnen (Start 0.01 s nach dem Laden des Layouts, und bei jedem Hover über die Karte):**

Ein **Durchlauf** beginnt mit Schritt 1. Alle Zeiten unten (Wartezeit, 5000 ms, Frische) zählen ab
dem Beginn **dieses** Durchlaufs, nicht ab dem Laden der Karte (SG-P2). Die erste Lesung kommt
0.1 s nach Beginn des Durchlaufs (beim Laden also bei 0.11 s).
1. Rang-Fläche versteckt, Buttons versteckt.
2. Alle 0.1 s lesen: ID (3.1), Name = Text von `#UserName`, Status = Text von `#UserRichPresence`,
   "eigener Spieler" = Klasse `isLocalPlayer` an der Karte oder einem der 5 nächsten Vorfahren (O-P3),
   "lädt" = Klasse `Loading` an der Karte.
3. Die Lesung zählt als **frisch**, wenn: eigener Spieler, oder die Karte war seit Beginn dieses
   Durchlaufs (Zustand im Moment des Beginns eingeschlossen) einmal im Zustand
   "lädt" und ist es jetzt nicht mehr, oder der Fingerabdruck unterscheidet sich vom zuletzt bestätigten
   (die Karte wird von Valve für verschiedene Spieler wiederverwendet).
4. Identität steht, wenn: nicht lädt, kein Konflikt, ID und Name da, frisch, zwei gleiche Lesungen
   hintereinander (ID, Name, Status, Fingerabdruck, eigener Spieler), und seit der ersten mindestens
   **750 ms** (eigener Spieler oder Status nicht leer) bzw. **1500 ms** (Status leer).
   Ist bei einer Lesung eine der Bedingungen "nicht lädt, kein Konflikt, ID da, Name da, frisch"
   nicht erfüllt, beginnt die Zählung von vorn (die nächste passende Lesung ist wieder die erste).
5. Identität steht → Rang-Fläche sichtbar im Zustand Laden, Buttons sichtbar und klickbar (nur
   Kontextmenü-Karte), Rang-Bild anfragen (3.5).
6. Nach **5000 ms** ab Beginn des Durchlaufs ohne stehende Identität: Rang bleibt versteckt, Buttons
   bleiben versteckt. Danach beobachten wie Schritt 7 (Intervalle ab diesem Moment). Neustart (neuer
   Durchlauf mit neuer 5000-ms-Frist), sobald die Karte "lädt" oder eine ID da ist und der
   Fingerabdruck vom zuletzt bestätigten abweicht. Ein späterer Spieler auf derselben Karte muss also
   wieder normal nach 750/1500 ms erscheinen.
   Die Beobachtung (Schritt 7) läuft trotzdem; taucht später eine ID mit neuem Fingerabdruck auf,
   beginnt der Ablauf neu.
7. Beobachten: in den ersten 8 s **ab Beginn dieser Beobachtung** alle 0.016 s, danach alle 0.1 s,
   ohne Ende, solange die Karte lebt. Jede neu stehende Identität startet die 8 s neu.
   Wird die Karte "lädt", oder ändert sich ID oder Fingerabdruck: zurück auf Schritt 1.

**Hover während des Ablaufs:** Läuft gerade Schritt 2–4, wird der Hover ignoriert. Wird beobachtet und
die Identität ist unverändert, bleibt alles stehen; nur wenn das Rang-Bild für diese Identität vorher
fehlgeschlagen war, wird der Platzhalter ohne Spinner wieder gezeigt (Valve klappt Kinder einer
wiederverwendeten Karte sonst zusammen). Sonst Neustart ab Schritt 1.

**Klick auf einen Text-Button:** gleiche Prüfung wie 3.3, zusätzlich nur in der Kontextmenü-Karte.

### 3.5 Rang-Bild

Zustände der Rang-Fläche (sichtbar):

| Zustand | Platzhalter | Spinner | Rang-Bild |
|---|---|---|---|
| Aus | – (Fläche versteckt) | – | – |
| Laden | sichtbar | sichtbar | versteckt |
| Fertig | versteckt | – | sichtbar |
| Nicht verfügbar | sichtbar | versteckt | versteckt |

Ablauf:
1. Ist für diese ID in den letzten **15 s** ein Abruf fehlgeschlagen: sofort "Nicht verfügbar", Buttons
   trotzdem zeigen. Kein neuer Abruf.
2. Sonst URL aus dem Zwischenspeicher (gültig **10 Minuten**, Schlüssel ID + Format `webp`) oder neu
   bauen (3.2), Zeitstempel erneuern, Zustand Laden.
3. Altes Rang-Bild entfernen. Ein neues `Image`-Panel in der Bildfläche anlegen
   (`$.CreatePanel('Image', …)`), Skalierung "stretch-to-fit-preserve-aspect", unsichtbar, dann
   `SetImage(url)`.
4. Event `ImageLoaded` am Bild: im Moment des Events neu lesen. Nur wenn die Karte nicht lädt, kein
   Konflikt besteht, ID **und Fingerabdruck** noch die beim Anfragen sind (SG-P7) und kein
   neuerer Durchlauf läuft → Zustand Fertig, Bild sichtbar.
5. Event `ImageFailedLoad`: Bild verstecken, Fehlschlag für 15 s merken, Zustand "Nicht verfügbar",
   Bild-Panel löschen (`DeleteAsync(0)`), nachdem der Zustand gesetzt ist.
6. Wirft `SetImage` eine Ausnahme: Fehlschlag merken.

Der Zwischenspeicher gilt für alle Layouts gemeinsam (Profilseite und Karte teilen ihn). Ablage über
`GameUI.CustomUIConfig()`, sonst am globalen `$`-Objekt. Bei einer neuen Mod-Version neu anlegen.

Event-Registrierung: `$.RegisterEventHandler('ImageLoaded' | 'ImageFailedLoad', bild, …)`.

### 3.6 Scoreboard

Läuft nur im Scoreboard-Layout. Beim Laden und danach 8 weitere Male im Abstand von 0.15 s (also
9 Versuche über 1.2 s): alle Panels mit Klasse `Player` [Valve] bis 12 Ebenen tief suchen und den
beiden Buttons einen Klick-Handler geben (`SetPanelEvent('onactivate', …)`), jeden Button höchstens
einmal (Markierung über ein Panel-Attribut).

Klick: ID dieser Zeile lesen (3.1 Scoreboard). Gültig → URL öffnen (3.2). Ungültig (Bot, ID 0,
Binding leer) → nichts. Die Buttons bleiben dabei sichtbar.

Das Scoreboard prüft keine Identitätsstabilität und kein Rang-Bild.

Spielerzeilen, die erst nach 1.2 s entstehen, bekommen keinen Handler. (O-P4)

### 3.7 Settings

| Feld | Wert |
|---|---|
| Addon-ID | `deadlock_profile_links` (gleich lassen, sonst gehen gespeicherte Werte verloren) |
| Gespeichert als | Key `deadlock_profile_links_settings` auf deadlockconfig.com (Addon Settings Library) |
| Platzierung | `addons` |
| Autor | `luxus` |
| Controls | `on` Toggle (Hauptschalter, `#Pl_Enable`), Default **an** |
| | `statlocker` Toggle, Abschnitt `#Pl_Sites`, Default **an**, nur sichtbar wenn `on` |
| | `deadchaps` Toggle, Abschnitt `#Pl_Sites`, Default **an**, nur sichtbar wenn `on` |
| Reset-Label | `#Pl_Reset` |

Schema und Glue sind [Kai] (`paks/profile-links/src/schema.js`, `settings.js`, `register.js`) und dürfen
übernommen werden. Der Glue setzt drei Klassen auf das Kontextpanel des jeweiligen Layouts (Profilseite,
Profilkarte, Scoreboard): "aus", "ohne Statlocker", "ohne DeadChaps". Beim Laden zuerst alle drei mit
den Defaults (alles an) anwenden, dann gespeicherte Werte und Änderungen live.

Die eigenen Stylesheets müssen auf diese Klassen reagieren (Namen frei, Glue entsprechend anpassen):

| Klasse an der Layout-Wurzel | Versteckt (`visibility: collapse`) |
|---|---|
| "aus" | Rang-Fläche (Seite und Karte), alle Logo- und Text-Buttons, der ganze Scoreboard-Slot |
| "ohne Statlocker" | Statlocker-Button auf Seite, Karte und Scoreboard |
| "ohne DeadChaps" | DeadChaps-Button auf Seite, Karte und Scoreboard |

Nicht betroffen von "aus": die immer sichtbare Account-ID-Zeile der Karte, die Namenszeile (420 × 36),
die entpackten Commend-Spalten im Scoreboard und die versteckten ID-Labels.

Die Klassen setzt jeder Layout-Kontext **nur an seinem eigenen Kontextpanel**. Kein Durchsuchen des
UI-Baums, auch nicht für andere offene Layouts: jede Profilkarte, Profilseite und jedes Scoreboard
hat seine eigene Registrierung und bekommt die Änderung selbst (SG-P13).

HUD-Registrar in `hud_match_start.xml` [Valve-Layout, Kai-Muster]: meldet nur das Schema an, mit einem
Rückruf, der nichts tut (setzt keine Klassen), damit der
Block im ADDONS-Fenster im Hauptmenü und in Matches erscheint.

ADDONS-Block (gezeichnet von Kais Addon Settings Library 1.2.3, Build 9). Referenz:
`assets/addons-menu-reference-2026-11-22.png`, Block "Profile Links":
- Titel `Profile Links`, darunter `by luxus`, Hauptschalter rechts.
- Abschnitt `SITES` (Library schreibt Abschnitte in Grossbuchstaben), darunter Zeilen `Statlocker` und
  `DeadChaps` mit Schalter.
- Tooltips aus den `…Desc`-Tokens.
- Reset `Reset Profile Links` dezent rechts (Library-Verhalten).

---

## 4. Edge-Cases

| Situation | Profilseite | Profilkarte | Scoreboard |
|---|---|---|---|
| Eigenes Profil / eigener Spieler | wie fremdes Profil, Links und Rang erscheinen | erscheint schneller (750 ms, immer frisch) | eigene Zeile hat Buttons, Klick öffnet eigenes Profil |
| Bot | – | Valve zeigt meist keine Karte; ohne gültige ID nach 5 s nichts | Buttons sichtbar, Klick tut nichts (ID 0) |
| Keine ID lesbar | Spinner endlos, keine Links | nach 5 s nichts | Klick tut nichts |
| Zwei verschiedene IDs gelesen (Konflikt) | wie keine ID | wie keine ID | erste gültige gewinnt |
| Privates Profil / API kennt Spieler nicht | Links da; Rang endet in "Nicht verfügbar" (Obscurus-Platzhalter ohne Spinner) | gleich | – |
| API offline | wie privat; 15 s kein neuer Versuch | gleich | – |
| Gleicher Spieler innerhalb 10 min erneut | gleiche Bild-URL aus dem Speicher | gleich | – |
| Valve verwendet die Karte für anderen Spieler | – | Reset, neuer Ablauf | – |
| Hover-Karte | – | nur Rang, keine Buttons | – |
| Summenzeile im Scoreboard | – | – | kein Slot |
| Schalter "aus" | Name ohne Logos, kein Rang-Block | Account-ID-Zeile bleibt sichtbar, ohne Rang; keine Buttons | kein Slot |
| Altes Match aus Match History | – | – | Slot wie im frischen Post-Game |

---

## 5. Texte [Kai]

Settings-Tokens, Präfix `Pl_`:

| Token | Englisch | Deutsch |
|---|---|---|
| `Pl_Tab` | Profile Links | Profil-Links |
| `Pl_Reset` | Reset Profile Links | Profil-Links zurücksetzen |
| `Pl_Enable` | Profile links | Profil-Links |
| `Pl_EnableDesc` | Show profile links and the rank badge on profiles and the post-game screen. | Profil-Links und das Rangabzeichen auf Profilen und in der Nachspiel-Ansicht zeigen. |
| `Pl_Sites` | Sites | Seiten |
| `Pl_Statlocker` | Statlocker | Statlocker |
| `Pl_StatlockerDesc` | Show a Statlocker button on profiles and the post-game screen. | Einen Statlocker-Button auf Profilen und in der Nachspiel-Ansicht zeigen. |
| `Pl_Deadchaps` | DeadChaps | DeadChaps |
| `Pl_DeadchapsDesc` | Show a DeadChaps button on profiles and the post-game screen. | Einen DeadChaps-Button auf Profilen und in der Nachspiel-Ansicht zeigen. |

Sprachdateien: nur `english` und `german`. Andere Sprachen fallen auf Englisch zurück (Library).

Feste englische UI-Texte (nicht lokalisiert, identisch übernehmen): `View Statlocker Profile`,
`View DeadChaps Profile` (Tooltips auf Seite und Scoreboard, Button-Text auf der Karte).

---

## 6. Log-Lines zum Verifizieren

`game/citadel/console.log`, Präfix `[PanoramaScript]`:

| Zeile | Wann |
|---|---|
| `Deadlock Profile Links: 2.0.0 register hud` | HUD geladen (Hauptmenü, Match-Start) |
| `Deadlock Profile Links: 2.0.0 loaded (<sprache>)` | je geladenem Layout: Profilseite, jede Profilkarte, Scoreboard (mehrfach normal) |
| `Addon Settings: addon: deadlock_profile_links` | ADDONS-Fenster geöffnet |
| `Addon Settings: open: … addons=…deadlock_profile_links…` | ADDONS-Fenster geöffnet |

Fehlerzeile (darf nicht vorkommen): `Deadlock Profile Links: hud register error <fehler>`.

Das Profil-Script loggt im alten pak nichts (Debug aus). Keine weiteren Zeilen erwartet.

---

## 7. Abnahme-Checkliste (im Spiel abhaken)

Vorbereitung: neues pak statt pak06, sonst gleicher Mod-Stand. Englisch, dann einmal Deutsch.

**ADDONS / Settings**
- [ ] P1 Esc → ADDONS: Block "Profile Links", "by luxus", Hauptschalter an.
- [ ] P2 Darunter Abschnitt "SITES" mit "Statlocker" und "DeadChaps", beide an.
- [ ] P3 Tooltips auf den drei Schaltern zeigen die `…Desc`-Texte.
- [ ] P4 Hauptschalter aus: die Zeilen Statlocker/DeadChaps verschwinden aus dem Block.
- [ ] P5 Native Esc-Menüeinträge unverändert (Screenshot vorher/nachher).
- [ ] P6 Log: `Deadlock Profile Links: 2.0.0 register hud`.

**Profilseite (eigenes Profil und ein Freund)**
- [ ] P7 Links vom Spielernamen: Statlocker-Logo, DeadChaps-Logo, je 24 px, 6 px Abstand, Name danach.
- [ ] P8 Logos erscheinen erst etwa 2 s nach dem Öffnen; davor nur der Name.
- [ ] P9 Unter dem Forum-Button: Obscurus-Platzhalter halbtransparent mit drehendem Spinner.
- [ ] P10 Danach ersetzt das Rang-Bild (110 × 76) den Platzhalter.
- [ ] P11 Hover auf ein Logo: etwas heller, Tooltip "View Statlocker Profile" bzw. "View DeadChaps Profile".
- [ ] P12 Klick Statlocker öffnet `https://statlocker.gg/profile/<account-id>` im Steam-Browser.
- [ ] P13 Klick DeadChaps öffnet `https://www.deadchaps.gg/player/<account-id>/`.
- [ ] P14 Die geöffnete ID ist die Account-ID des angezeigten Spielers (mit Statlocker-Seite gegenprüfen).
- [ ] P15 Maus verlässt die Seite und kommt zurück: Logos verschwinden kurz, Spinner, nach ~2 s wieder da (Verhalten des alten pak, O-P2).
- [ ] P16 Log: `Deadlock Profile Links: 2.0.0 loaded (english)`.

**Profilkarte**
- [ ] P17 Hover über einen Freund in der Freundesliste: Karte zeigt oben die Account-ID-Zeile (dunkler Streifen, ID-Text grau 13 px), rechts Rang 44 × 32.
- [ ] P18 Hover-Karte: keine "View … Profile"-Buttons.
- [ ] P19 Kontextmenü-Karte (Klick auf Spieler): unter dem Kartenkörper "View Statlocker Profile" (grün) und darunter "View DeadChaps Profile" (orange, mit orangem Strich unten).
- [ ] P20 Buttons im Ruhezustand gedimmt, bei Hover heller mit etwas hellerem Hintergrund.
- [ ] P21 Klick öffnet dieselben URLs wie P12/P13 für diesen Spieler.
- [ ] P22 Schnell zwischen zwei Spielern wechseln: nie Rang oder Link des vorherigen Spielers.
- [ ] P23 Eigene Karte: Rang und Buttons erscheinen nach unter 1 s.
- [ ] P24 Spieler ohne Rang/privat: Obscurus-Platzhalter ohne Spinner, Buttons trotzdem da.

**Post-Game-Scoreboard (frisches Match und aus Match History)**
- [ ] P25 Jede Spielerzeile: rechts nach Copy-Build zwei runde Buttons 34 px mit Logos, 4 px Abstand.
- [ ] P26 Summenzeile: keine Buttons.
- [ ] P27 Stats-Spalten (Souls, KDA, Damage, Healing, Items) stehen genau unter ihren Kopfzeilen.
- [ ] P28 Hover: Button wächst (1.12) und wird heller, Tooltip.
- [ ] P29 Klick öffnet Statlocker/DeadChaps des Spielers dieser Zeile.
- [ ] P30 Bot-Zeile: Klick tut nichts, kein Fehler.
- [ ] P31 Commend-Spalten links (Commend-Knopf, erhaltenes Commend, eigener Pfeil) sehen aus wie mit dem alten pak (O-P1).
- [ ] P32 Log: `Deadlock Profile Links: 2.0.0 loaded (…)` beim Scoreboard.

**Schalter**
- [ ] P33 Statlocker aus: Statlocker-Button weg auf Seite, Karte, Scoreboard; DeadChaps bleibt.
- [ ] P34 DeadChaps aus: umgekehrt.
- [ ] P35 Hauptschalter aus: keine Logos, kein Rang-Block auf der Seite; Karte zeigt Account-ID-Zeile ohne Rang und ohne Buttons; Scoreboard ohne Slot.
- [ ] P36 Wieder an, ohne Neustart: alles zurück (ggf. Seite/Karte neu öffnen).
- [ ] P37 Spielneustart: Schalterstellungen bleiben.

**Sprache**
- [ ] P38 Deutsch: ADDONS-Texte deutsch ("Profil-Links", "SEITEN"); Tooltips und Kartenbuttons bleiben Englisch.

Summe: **38 Punkte**.

---

## 8. Offene Fragen, die nur ein Ingame-Check klärt

- **O-P1** Wie sehen die entpackten Commend-Spalten im Scoreboard wirklich aus? Ohne Valves Wrapper
  stehen drei 48 px breite Spalten nebeneinander statt übereinander, und die Commend-Animation fehlt.
  Erst mit dem alten pak fotografieren, dann identisch nachbauen (oder Kai entscheiden lassen, ob Vanilla).
- **O-P2** Feuert `onmouseover` an `CitadelProfilePage` bei jeder Bewegung über Kinder oder nur beim
  Betreten? Davon hängt ab, wie oft die Logos auf der Profilseite flackern. Identisch = nachbauen.
- **O-P3** Setzt Valve auf der Profilkarte die Klasse `isLocalPlayer` (kleines i)? In den Valve-Dateien
  von Build 6864 nicht gefunden. Wenn nein, gilt die eigene Karte nie als "eigener Spieler".
- **O-P4** Werden die Scoreboard-Zeilen innerhalb von 1.2 s nach Laden des Layouts erzeugt? Wenn nicht,
  hätten späte Zeilen tote Buttons (gilt auch für das alte pak).
- **O-P5** Liefern `{i:r:account_id}` und die anderen Bindings auf Profilseite, Karte und Scoreboard in
  Build 6864 Werte, oder kommt die ID nur aus Valves sichtbaren Texten (Friend Code, Account ID)?
- **O-P6** Ist `#AccountID` auf der Karte mit der Mod immer sichtbar, auch bei Valve-Karten ohne
  `ShowAccountID`? Optisch prüfen, ob die Zeile irgendwo Valve-Inhalt verdeckt.
- **O-P7** Öffnet `ExternalBrowserGoToURL` den Steam-Overlay-Browser oder den Systembrowser?
- **O-P8** Markenfreigabe: Dürfen die Site-Logos von Statlocker und DeadChaps in einer öffentlichen Mod
  liegen? Das ist eine Frage an die Site-Betreiber, nicht an QoL Lite.
