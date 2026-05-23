# Bank Żarcia

Prywatna, statyczna baza dań, przekąsek, baz produktów i prostych przepisów. Dane zapisują się lokalnie w przeglądarce przez `localStorage`, a kopię można wyeksportować lub zaimportować jako JSON.

## Uruchomienie lokalnie

```bash
npm install
npm run dev
```

Build produkcyjny:

```bash
npm run build
```

Podgląd buildu:

```bash
npm run preview
```

## GitHub Pages

Projekt ma ustawione `base: './'` w `vite.config.js`, więc build działa poprawnie także z podścieżki GitHub Pages.

W repozytorium jest workflow `.github/workflows/deploy-pages.yml`, który po pushu na branch `main`:

1. instaluje zależności,
2. uruchamia `npm run build`,
3. publikuje katalog `dist` przez GitHub Pages.

W ustawieniach repozytorium GitHub wybierz:

- `Settings` -> `Pages`,
- `Source`: `GitHub Actions`.

## Dane

Aplikacja używa jednego klucza `localStorage`:

```text
bankZarciaData
```

W środku są:

- wpisy,
- preferencje Michała i Blanki.

Przykładowe dane startowe pojawiają się tylko wtedy, gdy `localStorage` jest pusty.
