import { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'bankZarciaData';

const CATEGORIES = [
  {
    name: 'Duże dania',
    description: 'Główne posiłki, zwykle obiady lub większe jedzenie.',
  },
  {
    name: 'Małe dania',
    description: 'Coś większego niż przekąska, ale nie pełny obiad.',
  },
  {
    name: 'Przekąski kupne',
    description: 'Kupuję, otwieram, jem.',
  },
  {
    name: 'Przekąski do zrobienia',
    description: 'Parę składników, mała akcja i gotowe.',
  },
  {
    name: 'Bazy',
    description: 'Produkty, wokół których często buduje się dania.',
  },
];

const CATEGORY_NAMES = CATEGORIES.map((category) => category.name);

const DEFAULT_PREFERENCES = {
  michal:
    'Michał nie lubi: grzyby, marchew, papryka, brokuły, bakłażan, cukinia, większość warzyw.',
  blanka: 'Blanka nie je mięsa.',
};

const SAMPLE_ENTRIES = [
  {
    name: 'Jajecznica',
    category: 'Małe dania',
    ingredients: 'jajka, masło, sól, pieprz, pieczywo',
    description: 'Usmażyć jajka na maśle, doprawić i podać z pieczywem.',
    michalVariant: '',
    blankaVariant: '',
  },
  {
    name: 'Pomidor z mozzarellą',
    category: 'Przekąski do zrobienia',
    ingredients: 'pomidor, mozzarella, oliwa, przyprawa sałatkowa, pieczywo',
    description:
      'Pokroić pomidora i mozzarellę, polać oliwą, posypać przyprawą i podać z pieczywem.',
    michalVariant: '',
    blankaVariant: '',
  },
  {
    name: 'Makaron z serem i sosem',
    category: 'Duże dania',
    ingredients: 'makaron, ser, śmietanka, przyprawy, opcjonalnie kurczak',
    description:
      'Ugotować makaron, zrobić prosty sos ze śmietanki i sera, wymieszać.',
    michalVariant: 'Można dodać kurczaka.',
    blankaVariant: 'Bez mięsa, ewentualnie więcej sera albo wege dodatek.',
  },
  {
    name: 'Chipsy',
    category: 'Przekąski kupne',
    ingredients: 'chipsy',
    description: 'Kupić, otworzyć, zjeść.',
    michalVariant: '',
    blankaVariant: '',
  },
  {
    name: 'Makaron',
    category: 'Bazy',
    ingredients: 'makaron',
    description: 'Baza do wielu dań, np. z sosem, serem, kurczakiem, mozzarellą.',
    michalVariant: '',
    blankaVariant: '',
  },
];

const EMPTY_FORM = {
  name: '',
  category: 'Duże dania',
  ingredients: '',
  description: '',
  michalVariant: '',
  blankaVariant: '',
};

const MEAT_TERMS = [
  'mięso',
  'mieso',
  'kurczak',
  'wołowina',
  'wolowina',
  'wieprzowina',
  'boczek',
  'szynka',
  'szynke',
  'kiełbasa',
  'kielbasa',
  'salami',
  'indyk',
  'ryba',
  'tuńczyk',
  'tunczyk',
  'łosoś',
  'losos',
];

function generateId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `entry-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function createEntry(entry) {
  const timestamp = nowIso();

  return {
    id: generateId(),
    name: entry.name,
    category: entry.category,
    ingredients: entry.ingredients || '',
    description: entry.description || '',
    michalVariant: entry.michalVariant || '',
    blankaVariant: entry.blankaVariant || '',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createDefaultData() {
  return {
    entries: SAMPLE_ENTRIES.map(createEntry),
    preferences: { ...DEFAULT_PREFERENCES },
  };
}

function isValidData(data) {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.entries) &&
    data.preferences &&
    typeof data.preferences === 'object'
  );
}

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return createDefaultData();
  }

  try {
    const parsed = JSON.parse(saved);

    if (!isValidData(parsed)) {
      return createDefaultData();
    }

    return {
      entries: parsed.entries.map(normalizeImportedEntry),
      preferences: {
        michal:
          typeof parsed.preferences.michal === 'string'
            ? parsed.preferences.michal
            : DEFAULT_PREFERENCES.michal,
        blanka:
          typeof parsed.preferences.blanka === 'string'
            ? parsed.preferences.blanka
            : DEFAULT_PREFERENCES.blanka,
      },
    };
  } catch {
    return createDefaultData();
  }
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeImportedEntry(entry) {
  return {
    id: typeof entry.id === 'string' && entry.id.trim() ? entry.id : generateId(),
    name: String(entry.name || '').trim(),
    category: String(entry.category || '').trim(),
    ingredients: String(entry.ingredients || ''),
    description: String(entry.description || entry.recipe || ''),
    michalVariant: String(entry.michalVariant || entry.michal || ''),
    blankaVariant: String(entry.blankaVariant || entry.blanka || ''),
    createdAt: entry.createdAt || nowIso(),
    updatedAt: entry.updatedAt || entry.createdAt || nowIso(),
  };
}

function validateBackup(rawData) {
  if (!isValidData(rawData)) {
    throw new Error('Plik nie wygląda jak kopia Banku Żarcia.');
  }

  const entries = rawData.entries.map((entry) => {
    const normalized = normalizeImportedEntry(entry);

    if (!normalized.name || !CATEGORY_NAMES.includes(normalized.category)) {
      throw new Error('Każdy wpis musi mieć nazwę i poprawną kategorię.');
    }

    return normalized;
  });

  return {
    entries,
    preferences: {
      michal:
        typeof rawData.preferences.michal === 'string'
          ? rawData.preferences.michal
          : DEFAULT_PREFERENCES.michal,
      blanka:
        typeof rawData.preferences.blanka === 'string'
          ? rawData.preferences.blanka
          : DEFAULT_PREFERENCES.blanka,
    },
  };
}

function makeBackupName() {
  return `bank-zarcia-backup-${new Date().toISOString().slice(0, 10)}.json`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('pl-PL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateValue));
  } catch {
    return '';
  }
}

function getSearchText(entry) {
  return normalizeText(
    [
      entry.name,
      entry.category,
      entry.ingredients,
      entry.description,
      entry.michalVariant,
      entry.blankaVariant,
    ].join(' '),
  );
}

function getPreview(entry) {
  const source = entry.ingredients || entry.description;

  if (!source) {
    return 'Bez szczegółów, ale brzmi jak plan.';
  }

  return source.length > 130 ? `${source.slice(0, 130).trim()}...` : source;
}

function extractPreferenceKeywords(text) {
  const normalized = normalizeText(text);
  const afterColon = normalized.includes(':')
    ? normalized.split(':').slice(1).join(':')
    : normalized;

  return afterColon
    .split(',')
    .map((item) => item.trim().replace(/\.$/, ''))
    .filter((item) => item && !item.includes('wiekszosc'));
}

function findTermMatches(text, terms) {
  const normalized = normalizeText(text);

  return terms.filter((term) => {
    const normalizedTerm = normalizeText(term);
    return normalized.includes(normalizedTerm);
  });
}

function getEntryWarnings(entry, preferences) {
  const warnings = [];
  const disliked = extractPreferenceKeywords(preferences.michal);
  const michalMatches = findTermMatches(entry.ingredients, disliked);
  const meatMatches = findTermMatches(
    `${entry.ingredients} ${entry.blankaVariant}`,
    MEAT_TERMS,
  );

  if (michalMatches.length) {
    warnings.push(
      `Michał może kręcić nosem: ${michalMatches.slice(0, 4).join(', ')}.`,
    );
  }

  if (meatMatches.length) {
    warnings.push(
      `Dla Blanki sprawdź mięso w składnikach lub wariancie: ${[
        ...new Set(meatMatches),
      ]
        .slice(0, 4)
        .join(', ')}.`,
    );
  }

  return warnings;
}

function App() {
  const [data, setData] = useState(loadData);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(CATEGORY_NAMES[0]);
  const [toast, setToast] = useState('');
  const importInputRef = useRef(null);

  useEffect(() => {
    document.title = 'Bank Żarcia';
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const sortedEntries = useMemo(
    () =>
      [...data.entries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data.entries],
  );

  const visibleEntries = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim());

    return sortedEntries.filter((entry) => {
      const matchesCategory =
        !categoryFilter || entry.category === categoryFilter;
      const matchesQuery =
        !normalizedQuery || getSearchText(entry).includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [categoryFilter, query, sortedEntries]);

  const selectedEntry = data.entries.find((entry) => entry.id === selectedId);

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2800);
  }

  function askConfirmation(config) {
    setConfirmDialog(config);
  }

  function closeConfirmDialog() {
    setConfirmDialog(null);
  }

  function goHome() {
    setSelectedId('');
    setEditingEntry(null);
  }

  function startAdding() {
    setSelectedId('');
    setEditingEntry({ ...EMPTY_FORM });
  }

  function startEditing(entry) {
    setEditingEntry({ ...entry });
  }

  function saveEntry(formData) {
    const trimmedName = formData.name.trim();

    if (!trimmedName) {
      showToast('Nazwa jest obowiązkowa. Żarcie bez nazwy ucieka z lodówki.');
      return false;
    }

    if (formData.id) {
      const timestamp = nowIso();
      const updatedEntry = {
        ...formData,
        name: trimmedName,
        updatedAt: timestamp,
      };

      setData((current) => ({
        ...current,
        entries: current.entries.map((entry) =>
          entry.id === formData.id ? updatedEntry : entry,
        ),
      }));
      setSelectedId(formData.id);
      setEditingEntry(null);
      showToast('Zapisane. Lodówkowa pamięć odświeżona.');
      return true;
    }

    const newEntry = createEntry({ ...formData, name: trimmedName });

    setData((current) => ({
      ...current,
      entries: [newEntry, ...current.entries],
    }));
    setSelectedId(newEntry.id);
    setEditingEntry(null);
    showToast('Dodane. Bank przyjął depozyt.');
    return true;
  }

  function deleteEntry(entry) {
    if (!entry) {
      return;
    }

    askConfirmation({
      title: 'Usunąć to żarcie?',
      message: `„${entry.name}” zniknie z bazy. Tego nie da się cofnąć.`,
      confirmLabel: 'Usuń',
      onConfirm: () => {
        setData((current) => ({
          ...current,
          entries: current.entries.filter((item) => item.id !== entry.id),
        }));
        goHome();
        showToast('Usunięte. Bez dramatu, ale z lekkim żalem.');
      },
    });
  }

  function deleteCategory(categoryName) {
    const count = data.entries.filter(
      (entry) => entry.category === categoryName,
    ).length;

    if (!count) {
      showToast('Ta kategoria jest już pusta. Kurz, okruszki i nic więcej.');
      return;
    }

    askConfirmation({
      title: 'Usunąć kategorię?',
      message: `Usunąć ${count} wpisów z kategorii „${categoryName}”? Sama kategoria zostanie na przyszłość, znikną tylko jej wpisy.`,
      confirmLabel: 'Usuń kategorię',
      onConfirm: () => {
        setData((current) => ({
          ...current,
          entries: current.entries.filter(
            (entry) => entry.category !== categoryName,
          ),
        }));
        if (categoryFilter === categoryName) {
          setCategoryFilter('');
        }
        setSelectedId('');
        showToast(`Kategoria „${categoryName}” wyczyszczona.`);
      },
    });
  }

  function deleteAllData() {
    askConfirmation({
      title: 'Usunąć całą bazę?',
      message:
        'Znikną wszystkie wpisy z Banku Żarcia. Przykładowe dane nie wrócą po odświeżeniu.',
      confirmLabel: 'Usuń całą bazę',
      onConfirm: () => {
        setData({
          entries: [],
          preferences: { ...DEFAULT_PREFERENCES },
        });
        setPendingImport(null);
        setQuery('');
        setCategoryFilter('');
        goHome();
        showToast('Baza wyczyszczona. Lodówka świeci pustkami.');
      },
    });
  }

  function exportData() {
    const payload = JSON.stringify(data, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = makeBackupName();
    link.click();
    URL.revokeObjectURL(url);
    showToast('Eksport gotowy. Kopia poszła w świat.');
  }

  function handleImportFile(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const backup = validateBackup(parsed);
        setPendingImport(backup);
        showToast(`Plik wygląda dobrze: ${backup.entries.length} wpisów.`);
      } catch (error) {
        setPendingImport(null);
        showToast(error.message || 'Nie udało się wczytać pliku JSON.');
      }
    };

    reader.onerror = () => {
      setPendingImport(null);
      showToast('Nie udało się odczytać pliku.');
    };

    reader.readAsText(file);
    event.target.value = '';
  }

  function replaceWithImport() {
    if (!pendingImport) {
      return;
    }

    setData(pendingImport);
    setPendingImport(null);
    goHome();
    showToast('Import zakończony. Obecne dane zastąpione.');
  }

  function mergeImport() {
    if (!pendingImport) {
      return;
    }

    setData((current) => {
      const usedIds = new Set(current.entries.map((entry) => entry.id));
      const importedEntries = pendingImport.entries.map((entry) => {
        if (!usedIds.has(entry.id)) {
          usedIds.add(entry.id);
          return entry;
        }

        const newId = generateId();
        usedIds.add(newId);

        return {
          ...entry,
          id: newId,
        };
      });

      return {
        ...current,
        entries: [...importedEntries, ...current.entries],
      };
    });

    setPendingImport(null);
    goHome();
    showToast('Import zakończony. Nowe wpisy dorzucone do banku.');
  }

  if (editingEntry) {
    return (
      <Shell
        toast={toast}
        confirmDialog={confirmDialog}
        onCloseConfirm={closeConfirmDialog}
      >
        <EntryForm
          initialEntry={editingEntry}
          onCancel={() => {
            setEditingEntry(null);
            if (!editingEntry.id) {
              goHome();
            }
          }}
          onSave={saveEntry}
        />
      </Shell>
    );
  }

  if (selectedEntry) {
    return (
      <Shell
        toast={toast}
        confirmDialog={confirmDialog}
        onCloseConfirm={closeConfirmDialog}
      >
        <EntryDetails
          entry={selectedEntry}
          warnings={getEntryWarnings(selectedEntry, data.preferences)}
          onBack={goHome}
          onEdit={() => startEditing(selectedEntry)}
          onDelete={() => deleteEntry(selectedEntry)}
        />
      </Shell>
    );
  }

  return (
    <Shell
      toast={toast}
      confirmDialog={confirmDialog}
      onCloseConfirm={closeConfirmDialog}
    >
      <main className="home">
        <section className="hero" aria-labelledby="app-title">
          <div className="brand-row">
            <div className="app-mark" aria-hidden="true">
              BŻ
            </div>
            <div>
              <h1 id="app-title">Bank Żarcia</h1>
              <p>Twoja prywatna baza jedzenia, żeby nie wymyślać od zera.</p>
            </div>
          </div>
        </section>

        <section className="quick-actions" aria-label="Szukaj i dodawaj">
          <label className="search-label" htmlFor="search">
            <span>Szybkie szukanie</span>
            <input
              id="search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Wpisz danie albo składnik, np. makaron, jajka, mozzarella…"
            />
          </label>
          <button className="primary-button" type="button" onClick={startAdding}>
            + Dodaj żarcie
          </button>
        </section>

        <section className="category-grid" aria-label="Kategorie">
          {CATEGORIES.map((category) => {
            const count = data.entries.filter(
              (entry) => entry.category === category.name,
            ).length;
            const isActive = categoryFilter === category.name;

            return (
              <button
                className={`category-card ${isActive ? 'active' : ''}`}
                key={category.name}
                type="button"
                onClick={() =>
                  setCategoryFilter(isActive ? '' : category.name)
                }
              >
                <span>{category.name}</span>
                <small>{category.description}</small>
                <b>{count}</b>
              </button>
            );
          })}
        </section>

        {(query || categoryFilter) && (
          <div className="active-filter">
            <span>
              {query ? `Co z tego skleić? „${query}”` : categoryFilter}
            </span>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategoryFilter('');
              }}
            >
              Wyczyść
            </button>
          </div>
        )}

        <EntryList
          entries={visibleEntries}
          query={query}
          hasAnyEntries={data.entries.length > 0}
          onAdd={startAdding}
          onOpen={(entry) => setSelectedId(entry.id)}
        />

        <section className="utility-grid">
          <BackupPanel
            pendingImport={pendingImport}
            importInputRef={importInputRef}
            onExport={exportData}
            onImportFile={handleImportFile}
            onReplace={replaceWithImport}
            onMerge={mergeImport}
            onCancelImport={() => setPendingImport(null)}
          />

          <CleanupPanel
            categoryToDelete={categoryToDelete}
            onCategoryChange={setCategoryToDelete}
            onDeleteCategory={() => deleteCategory(categoryToDelete)}
            onDeleteAllData={deleteAllData}
          />
        </section>
      </main>
    </Shell>
  );
}

function Shell({ children, toast, confirmDialog, onCloseConfirm }) {
  function confirmAndClose() {
    const action = confirmDialog?.onConfirm;
    onCloseConfirm();
    action?.();
  }

  return (
    <div className="app-shell">
      {children}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          onCancel={onCloseConfirm}
          onConfirm={confirmAndClose}
        />
      )}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}

function ConfirmDialog({ title, message, confirmLabel, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title">{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="ghost-button" type="button" onClick={onCancel}>
            Anuluj
          </button>
          <button className="danger-button" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function EntryList({ entries, query, hasAnyEntries, onAdd, onOpen }) {
  if (!hasAnyEntries) {
    return (
      <section className="empty-state">
        <h2>Pusto tu jak w lodówce przed zakupami.</h2>
        <button className="primary-button" type="button" onClick={onAdd}>
          Dodaj pierwsze żarcie
        </button>
      </section>
    );
  }

  if (!entries.length) {
    return (
      <section className="empty-state">
        <h2>Nie znaleziono nic pasującego.</h2>
        <p>Może pora dodać nowe żarcie?</p>
        <button className="primary-button" type="button" onClick={onAdd}>
          + Dodaj żarcie
        </button>
      </section>
    );
  }

  return (
    <section className="entries-section" aria-labelledby="entries-heading">
      <div className="section-heading">
        <h2 id="entries-heading">
          {query ? 'Pasujące wpisy' : 'Ostatnio dodane'}
        </h2>
        <span>{entries.length}</span>
      </div>

      <div className="entry-list">
        {entries.map((entry) => (
          <button
            className="entry-card"
            key={entry.id}
            type="button"
            onClick={() => onOpen(entry)}
          >
            <span className="entry-category">{entry.category}</span>
            <strong>{entry.name}</strong>
            <p>{getPreview(entry)}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function EntryDetails({ entry, warnings, onBack, onEdit, onDelete }) {
  return (
    <main className="detail-view">
      <button className="ghost-button back-button" type="button" onClick={onBack}>
        Wróć
      </button>

      <article className="detail-card">
        <span className="entry-category">{entry.category}</span>
        <h1>{entry.name}</h1>

        {!!warnings.length && (
          <div className="warnings" role="note">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}

        <DetailBlock title="Składniki" value={entry.ingredients} />
        <DetailBlock title="Przepis / opis" value={entry.description} />
        <DetailBlock title="Wariant dla Michała" value={entry.michalVariant} />
        <DetailBlock title="Wariant dla Blanki" value={entry.blankaVariant} />

        <div className="date-row">
          <span>Dodano: {formatDate(entry.createdAt)}</span>
          <span>Edytowano: {formatDate(entry.updatedAt)}</span>
        </div>

        <div className="button-row">
          <button className="primary-button" type="button" onClick={onEdit}>
            Edytuj
          </button>
          <button className="danger-button" type="button" onClick={onDelete}>
            Usuń
          </button>
        </div>
      </article>
    </main>
  );
}

function DetailBlock({ title, value }) {
  return (
    <section className="detail-block">
      <h2>{title}</h2>
      <p>{value || 'Brak. Jeszcze nikt tego nie rozpisał.'}</p>
    </section>
  );
}

function EntryForm({ initialEntry, onSave, onCancel }) {
  const [formData, setFormData] = useState(initialEntry);

  function updateField(field, value) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function submit(event) {
    event.preventDefault();
    onSave(formData);
  }

  return (
    <main className="form-view">
      <form className="entry-form" onSubmit={submit}>
        <div className="form-heading">
          <span>{formData.id ? 'Edycja wpisu' : 'Nowe żarcie'}</span>
          <h1>{formData.id ? formData.name : 'Co wpada do banku?'}</h1>
        </div>

        <label>
          Nazwa
          <input
            autoFocus
            required
            value={formData.name}
            onChange={(event) => updateField('name', event.target.value)}
          />
        </label>

        <label>
          Kategoria
          <select
            value={formData.category}
            onChange={(event) => updateField('category', event.target.value)}
          >
            {CATEGORY_NAMES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Składniki
          <textarea
            rows="4"
            value={formData.ingredients}
            onChange={(event) => updateField('ingredients', event.target.value)}
          />
        </label>

        <label>
          Przepis / opis
          <textarea
            rows="5"
            value={formData.description}
            onChange={(event) => updateField('description', event.target.value)}
          />
        </label>

        <label>
          Wariant dla Michała
          <textarea
            rows="3"
            value={formData.michalVariant}
            onChange={(event) => updateField('michalVariant', event.target.value)}
          />
        </label>

        <label>
          Wariant dla Blanki
          <textarea
            rows="3"
            value={formData.blankaVariant}
            onChange={(event) => updateField('blankaVariant', event.target.value)}
          />
        </label>

        <div className="button-row">
          <button className="primary-button" type="submit">
            Zapisz
          </button>
          <button className="ghost-button" type="button" onClick={onCancel}>
            Anuluj
          </button>
        </div>
      </form>
    </main>
  );
}

function BackupPanel({
  pendingImport,
  importInputRef,
  onExport,
  onImportFile,
  onReplace,
  onMerge,
  onCancelImport,
}) {
  return (
    <section className="utility-panel" aria-labelledby="backup-heading">
      <div className="section-heading">
        <h2 id="backup-heading">Kopia danych</h2>
      </div>

      <div className="button-stack">
        <button className="secondary-button" type="button" onClick={onExport}>
          Eksportuj dane
        </button>

        <button
          className="secondary-button"
          type="button"
          onClick={() => importInputRef.current?.click()}
        >
          Importuj dane
        </button>
      </div>

      <input
        ref={importInputRef}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={onImportFile}
      />

      {pendingImport && (
        <div className="import-choice">
          <p>Znaleziono {pendingImport.entries.length} wpisów w kopii.</p>
          <div className="button-stack">
            <button className="primary-button" type="button" onClick={onReplace}>
              Zastąp obecne dane
            </button>
            <button className="secondary-button" type="button" onClick={onMerge}>
              Dodaj do obecnych danych
            </button>
            <button className="ghost-button" type="button" onClick={onCancelImport}>
              Anuluj import
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function CleanupPanel({
  categoryToDelete,
  onCategoryChange,
  onDeleteCategory,
  onDeleteAllData,
}) {
  return (
    <section className="utility-panel" aria-labelledby="cleanup-heading">
      <div className="section-heading">
        <h2 id="cleanup-heading">Porządki</h2>
      </div>

      <div className="cleanup-form">
        <label>
          Kategoria do wyczyszczenia
          <select
            value={categoryToDelete}
            onChange={(event) => onCategoryChange(event.target.value)}
          >
            {CATEGORY_NAMES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <button className="danger-button" type="button" onClick={onDeleteCategory}>
          Usuń kategorię
        </button>
      </div>

      <div className="wipe-zone">
        <p>Opcja awaryjna, kiedy lodówka mentalna ma zacząć od zera.</p>
        <button className="danger-button" type="button" onClick={onDeleteAllData}>
          Usuń całą bazę danych
        </button>
      </div>
    </section>
  );
}

export default App;
