export interface BrowserFeature {
  name: string;
  check: () => boolean;
}

export const requiredFeatures: BrowserFeature[] = [
  {
    name: 'Crypto UUID',
    check: () => typeof crypto !== 'undefined' && 'randomUUID' in crypto,
  },
  {
    name: 'IndexedDB',
    check: () => 'indexedDB' in window,
  },
  {
    name: 'Web Workers',
    check: () => 'Worker' in window,
  },
  {
    name: 'localStorage',
    check: () => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    },
  },
  {
    name: 'ES2020 Features',
    check: () => {
      try {
        // Test for some ES2020 features
        eval('Promise.allSettled([]);');
        eval('const obj = {}; obj?.prop;');
        return true;
      } catch {
        return false;
      }
    },
  },
];

export function checkBrowserCompatibility(): {
  isCompatible: boolean;
  missingFeatures: string[];
} {
  const missingFeatures = requiredFeatures
    .filter(feature => !feature.check())
    .map(feature => feature.name);

  return {
    isCompatible: missingFeatures.length === 0,
    missingFeatures,
  };
}
