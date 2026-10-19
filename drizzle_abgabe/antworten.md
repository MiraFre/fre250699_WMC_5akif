# Antworten — Aufgabe KM5-05 Drizzle ORM

Zur Lesson `lesson.html` (§Aufgabe) und [`aufgabe.md`](./aufgabe.md).
Geänderter Code: [`demoprojekt/demo.ts`](./demoprojekt/demo.ts).

---

## Aufgabe 1 — Vorhersage (vor dem Ausführen notiert)

**Frage:** Welches SQL erzeugen diese zwei Queries (Spaltenliste, WHERE-Klausel, Parameter)?

**a)** `db.select().from(artist).where(eq(artist.gruendungsjahr, 1999))`

**b)** `db.select({ n: count() }).from(album).where(eq(album.artistId, 1))`

**Vorhersage / Ergebnis (verifiziert mit `toSQL()`):**

```sql
-- a)
select "id", "name", "gruendungsjahr" from "artist" where "artist"."gruendungsjahr" = ?
-- params: [ 1999 ]

-- b)
select count(*) from "album" where "album"."artist_id" = ?
-- params: [ 1 ]
```

**Beobachtungen:**

- Drizzle listet die Spalten beim `select()` **immer explizit** auf (`"id", "name", "gruendungsjahr"`) — auch ohne Argumente.
- Der Wert steht **nicht** im SQL-Text, sondern in `params` → Parametrisierung by default.
- Die TS-Spalte `artistId` erscheint im SQL als DB-Name `"artist_id"`; die Tabelle bleibt `"album"`.
- **Fund:** Der Ausgabe-Alias `n` aus `select({ n: count() })` taucht im erzeugten SQL **nicht** auf — es steht schlicht `count(*)`. Der Alias existiert nur im TypeScript-Ergebnisobjekt (`{ n: 2 }`), nicht im SQL.

---

## Aufgabe 2 — Beispielprojekt erweitert (`demoprojekt/demo.ts`)

Drei Queries ergänzt (Import um `asc` erweitert):

1. **Ältestes Album** — `orderBy(asc(album.jahr)).limit(1)`:
   `select "id", "titel", "jahr", "artist_id" from "album" order by "album"."jahr" asc limit ?` · params `[1]` → **Night Ferry (2012)**.
2. **Tracks mit Titel-Anfang „Echo"** — `and` + `eq` + `like`:
   `select ... from "track" where (("track"."album_id" = ?) and ("track"."titel" like ?))` · params `[1, "Echo%"]` → **Echo Room**.
   *Wichtig:* Die Query steht **vor** dem `delete`, sonst wäre „Echo Room" bereits gelöscht.
3. **Anzahl Tracks je Album** — `count()` + `groupBy`:
   `select "album"."titel", count(*) from "track" inner join "album" on "track"."album_id" = "album"."id" group by "album"."id"` · params `[]` → **Silent Lines: 2**.

---

## Aufgabe 3 — SQL-Vergleich (Interleaving): „Tracks pro Album"

**Reines SQL:**

```sql
SELECT album.titel, COUNT(*) AS tracks
FROM track
INNER JOIN album ON track.album_id = album.id
GROUP BY album.id;
```

**Von Drizzle erzeugt (`toSQL().sql`):**

```sql
select "album"."titel", count(*) from "track"
inner join "album" on "track"."album_id" = "album"."id"
group by "album"."id"
```

**Zuordnung der Bausteine:**

| SQL-Baustein | im Drizzle-Query |
|---|---|
| `FROM track` | `.from(track)` |
| `INNER JOIN album ON track.album_id = album.id` | `.innerJoin(album, eq(track.albumId, album.id))` |
| `COUNT(*)` | `count()` im Select-Objekt |
| `GROUP BY album.id` | `.groupBy(album.id)` |

**Unterschiede:** Drizzle quotet alle Identifier (`"album"."titel"`) und qualifiziert sie mit dem Tabellennamen; die Aggregation erscheint ohne `AS`-Alias im SQL (der Alias `tracks` wird nur im TS-Ergebnisobjekt gesetzt). Die Join-Bedingung wird explizit übergeben — kein Autodetektieren wie bei anderen ORMs. Logik und Ergebnis sind identisch.

---

## Aufgabe 4 — Nachweis: `deno task demo` + `deno task test`

Runtime: Deno 2.9.7. Typprüfung: `deno check demo.ts` → ohne Fehler.

`deno task demo` (7 Ausgaben vorher → jetzt erweitert):

```
Lesen, erzeugtes SQL: select "id", "titel", "jahr", "artist_id" from "album" where "album"."artist_id" = ?
Lesen, Parameter: [ 1 ]
Lesen, Ergebnis: [ { id: 1, titel: "Silent Lines", jahr: 2015, artistId: 1 } ]
Neuestes Album: Silent Lines ( 2015 )
Aeltestes Album, erzeugtes SQL: select "id", "titel", "jahr", "artist_id" from "album" order by "album"."jahr" asc limit ?
Aeltestes Album, Parameter: [ 1 ]
Aeltestes Album: Night Ferry ( 2012 )
Echo-Tracks, erzeugtes SQL: select "id", "titel", "dauer_sek", "album_id" from "track" where (("track"."album_id" = ?) and ("track"."titel" like ?))
Echo-Tracks, Parameter: [ 1, "Echo%" ]
Echo-Tracks: [ { id: 2, titel: "Echo Room", dauerSek: 187, albumId: 1 } ]
Tracks pro Album, erzeugtes SQL: select "album"."titel", count(*) from "track" inner join "album" on "track"."album_id" = "album"."id" group by "album"."id"
Tracks pro Album, Parameter: []
Tracks pro Album: [ { titel: "Silent Lines", tracks: 2 } ]
Nach update: 220 Sekunden
Tracks nach delete: 1
```

`deno task test`:

```
running 9 tests from ./demo_test.ts
insert mit returning liefert die neue Zeile mit id ... ok
select mit where filtert typsicher ... ok
Fremdschlüssel verhindert Album ohne Artist ... ok
update aendert nur die gewaehlten Zeilen ... ok
delete entfernt nur die gewaehlte Zeile ... ok
orderBy + limit liefern das juengste Album ... ok
innerJoin verbindet Album und Artist ... ok
Drizzle parametrisiert: Werte stecken in params, nicht im SQL ... ok
assertThrows ist importiert und steht bereit ... ok

ok | 9 passed | 0 failed
```
