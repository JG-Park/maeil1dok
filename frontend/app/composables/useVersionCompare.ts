import { ref, computed } from 'vue';
import { VERSION_NAMES, VERSION_META } from './useBibleData';

export interface CompareState {
  enabled: boolean;
  primaryVersion: string;
  secondaryVersion: string;
}

const compareState = ref<CompareState>({
  enabled: false,
  primaryVersion: 'GAE',
  secondaryVersion: 'HEB',
});

export const useVersionCompare = () => {
  const isCompareMode = computed(() => compareState.value.enabled);
  
  const primaryVersion = computed({
    get: () => compareState.value.primaryVersion,
    set: (val: string) => { compareState.value.primaryVersion = val; }
  });
  
  const secondaryVersion = computed({
    get: () => compareState.value.secondaryVersion,
    set: (val: string) => { compareState.value.secondaryVersion = val; }
  });

  const primaryVersionName = computed(() => 
    VERSION_NAMES[compareState.value.primaryVersion] || compareState.value.primaryVersion
  );

  const secondaryVersionName = computed(() => 
    VERSION_NAMES[compareState.value.secondaryVersion] || compareState.value.secondaryVersion
  );

  const primaryMeta = computed(() => 
    VERSION_META[compareState.value.primaryVersion]
  );

  const secondaryMeta = computed(() => 
    VERSION_META[compareState.value.secondaryVersion]
  );

  const enableCompareMode = (primary?: string, secondary?: string) => {
    if (primary) compareState.value.primaryVersion = primary;
    if (secondary) compareState.value.secondaryVersion = secondary;
    compareState.value.enabled = true;
  };

  const disableCompareMode = () => {
    compareState.value.enabled = false;
  };

  const toggleCompareMode = () => {
    compareState.value.enabled = !compareState.value.enabled;
  };

  const swapVersions = () => {
    const temp = compareState.value.primaryVersion;
    compareState.value.primaryVersion = compareState.value.secondaryVersion;
    compareState.value.secondaryVersion = temp;
  };

  const setPrimaryVersion = (version: string) => {
    compareState.value.primaryVersion = version;
  };

  const setSecondaryVersion = (version: string) => {
    compareState.value.secondaryVersion = version;
  };

  const isVersionAvailableForBook = (version: string, bookId: string): boolean => {
    const meta = VERSION_META[version];
    if (!meta) return true;

    const OLD_TESTAMENT_BOOKS = new Set([
      'gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut', '1sa', '2sa',
      '1ki', '2ki', '1ch', '2ch', 'ezr', 'neh', 'est', 'job', 'psa', 'pro',
      'ecc', 'sng', 'isa', 'jer', 'lam', 'ezk', 'dan', 'hos', 'jol', 'amo',
      'oba', 'jnh', 'mic', 'nam', 'hab', 'zep', 'hag', 'zec', 'mal',
    ]);

    const isOT = OLD_TESTAMENT_BOOKS.has(bookId.toLowerCase());

    if (meta.testament === 'old') return isOT;
    if (meta.testament === 'new') return !isOT;
    return true;
  };

  return {
    isCompareMode,
    primaryVersion,
    secondaryVersion,
    primaryVersionName,
    secondaryVersionName,
    primaryMeta,
    secondaryMeta,
    enableCompareMode,
    disableCompareMode,
    toggleCompareMode,
    swapVersions,
    setPrimaryVersion,
    setSecondaryVersion,
    isVersionAvailableForBook,
  };
};
