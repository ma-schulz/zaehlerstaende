# Zählerstand

PWA zum Erfassen und Auswerten von Zählerständen (Strom, Wasser, Pellets, …).
React + Vite + Mantine, Daten in Supabase, gehostet auf GitHub Pages.

## Funktionen

- **Zähler verwalten** – Name, Einheit, Icon, Nachkommastellen, Kosten pro Einheit.
- **Zählerstände** – erfassen, bearbeiten, löschen (mit Datum & Uhrzeit, Dezimal-Validierung).
- **Auswertung** – Verbrauch/Tag, Verbrauch/Jahr, Kosten/Tag, Kosten/Jahr; tabellarisch + Graphen.
  Der erste Stand gilt als Anfangsstand und zählt nicht als Verbrauch.
- **Dashboard** – Kurzübersicht je Zähler + Schnellzugriff zur Eingabe.
- **PWA** – installierbar auf dem Handy, dunkles Farbschema.

## Architektur

GitHub Pages ist Static-Hosting – kein eigenes Backend möglich. Die App ist eine reine
React-SPA; Datenhaltung & Auth übernimmt **Supabase** (Postgres + Auth, abgesichert per Row
Level Security). Der Supabase *anon key* darf im Client stehen; der Datenschutz wird über RLS
erzwungen (jeder Nutzer sieht nur eigene Daten).

## Einrichtung

### 1. Supabase

1. Projekt auf [supabase.com](https://supabase.com) anlegen.
2. Im SQL-Editor `supabase/schema.sql` ausführen (Tabellen + RLS-Policies).
3. Unter *Project Settings → API* `Project URL` und `anon public key` notieren.

### 2. Lokal entwickeln

```bash
cp .env.example .env   # URL und anon key eintragen
npm install
npm run dev
```

### 3. Tests & Build

```bash
npm run test    # Unit-Tests der Berechnungslogik
npm run build   # Type-Check + Produktions-Build
```

### 4. Deployment auf GitHub Pages

1. Repo-Secrets setzen: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   (*Settings → Secrets and variables → Actions*).
2. *Settings → Pages → Source* auf **GitHub Actions** stellen.
3. Push auf `main` → Workflow `.github/workflows/deploy.yml` baut & deployt.
4. Erreichbar unter `https://<user>.github.io/zaehlerstaende/`.

> Heißt das Repo nicht `zaehlerstaende`, nur den Wert `base` in `vite.config.ts` anpassen –
> Icon- und Manifest-Pfade folgen automatisch der `base`.

## PWA-Icons neu erzeugen

Quelle ist `public/favicon.svg`. Nach Änderungen:

```bash
node scripts/generate-icons.mjs
```
