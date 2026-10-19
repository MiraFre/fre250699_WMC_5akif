# Schriftliche Antworten — Lektion 03 · Async/Await Bestell-Pipeline

Zu `lesson.html` Abschnitt 4 (Mitarbeit) und Abschnitt 7 (Aufgabe), Code in [`claim.ts`](./claim.ts).

---

## Aufgabe 1 — Vorhersage: `pipelineAlsGanzes` mit `menge: 0`

**Frage:** Rufe `pipelineAlsGanzes` mit `menge: 0` auf. Welche Konsole entsteht, bevor du ausführst? Warum wird in `bestellen` erst *nach* der `simulate`-Wartezeit geworfen (Blick auf die Reihenfolge im Funktionskörper)?

**Vorhergesagte Konsole:**

```
🛑 Stufe bestellen: Ungültige Bestellung: 0x "Monitor"
— Pipeline-Lauf beendet (…)
```

**Was fehlt gegenüber Lauf 1 (alles ok):** Alle Erfolgszeilen fehlen — kein `✓ Bestellung`, kein `✓ Bezahlung ok`, kein `✓ Lieferung an …`, kein `✅ Pipeline fertig`. Es erscheint nur die Fehlerzeile der Stufe `bestellen` plus das `finally`-Log.

**Warum erst nach der Wartezeit geworfen wird:** Der Funktionskörper prüft die Reihenfolge

```ts
async function bestellen(artikel: string, menge: number): Promise<Bestellung> {
    const bestellNr = await simulate(300, { nr: 4711, artikel, menge }); // 1. warten
    if (menge <= 0) {                                                   // 2. erst dann prüfen
        throw new ValidationError(artikel, menge);
    }
    console.log(`✓ Bestellung ${bestellNr.nr}: ${menge}x ${artikel}`);
    return bestellNr;
}
```

Das `await simulate(300, …)` steht **vor** dem `if (menge <= 0)`. Der `await` gibt die Kontrolle an die Event-Loop ab, die ca. 300 ms vergehen lässt, und erst danach wird die Validierung ausgeführt und die Exception geworfen. Der Fehler entsteht also asynchron „nach dem Warten", nicht sofort beim Aufruf.

---

## Aufgabe 2 — `ClaimError` & Stufe `reclamieren`: Fangen in eigener try/catch-Stufe oder der Pipeline?

**Frage:** Baue eine vierte Stufe „reclamieren" mit eigenem Error-Typ `ClaimError`. Fangen in einer eigenen try/catch-Stufe oder der Pipeline?

**Antwort:** In einer **eigenen try/catch-Stufe** innerhalb von `pipelineGranular` (Variante B). Begründung:

- Eine Reklamation ist eine **nachgelagerte, optionale** Stufe. Scheitert sie, ist die Bestellung an sich (bestellt, bezahlt, geliefert) weiterhin gültig — die Pipeline kann danach sinnvoll weiterarbeiten (z. B. Kulanz/Fallback anbieten).
- Mit einstufigem try/catch (Variante A) würde ein `ClaimError` die gesamte Pipeline abbrechen, obwohl nur der letzte, unkritische Schritt fehlschlug.
- So bleibt die Fehlerbehandlung granular: `instanceof ClaimError` ist hier gar nicht nötig, weil jedes `try` genau eine Stufe umschließt.

Ergänzend (Bonus): In Variante A wird `ClaimError` zusätzlich per `instanceof` in der Verzweigungskette gefangen.

---

## Aufgabe 3 — Interleaving zum 18.9.: Message-Queue-Callbacks und Promise-Zustände

**Frage:** Wie hängt die Message-Queue-Callback-Logik mit Promise-Zuständen (pending → settled) zusammen? 2–3 Sätze.

**Antwort:** Die Message-Queue-Callbacks sind der Mechanismus *unter* den Promise-Zuständen: `simulate` erzeugt über `new Promise` ein Promise, das zunächst `pending` ist; das `setTimeout`-Callback liegt in der Message-Queue und ruft später `resolve(wert)` auf. Erst wenn die Event-Loop dieses Callback abarbeitet, wechselt das Promise von `pending` zu `settled` (`resolved` bzw. bei `reject`/`throw` `rejected`). `await` hängt die Fortsetzung als Mikrotask genau an diesen Übergang — deshalb „wartet" der Code, ohne den Haupt-Thread zu blockieren.

---

## Aufgabe 4 — Definition of Done (Abschnitt 7)

- [x] Kopie `claim.ts` erstellt, läuft mit `deno run claim.ts` (Typ-Prüfung `deno check claim.ts`)
- [x] Vorhersage zu `menge: 0` dokumentiert (siehe oben)
- [x] `ClaimError`-Klasse + Stufe `reclamieren` (wirft bei `grund === "kaputt"`, sonst Stornierungs-Bestätigung)
- [x] `finally` in `pipelineGranular`, loggt `— Granularer Lauf beendet` — läuft auch im Re-Throw-Fall
- [x] Bonus: `ClaimError` in Variante A per `instanceof` gefangen
- [x] Antwort zum Interleaving (oben)
