export default {
  randomUUID: () => 'mock-uuid',
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    digest: async () => new ArrayBuffer(32),
    importKey: async () => ({}),
    sign: async () => new ArrayBuffer(64),
    verify: async () => true
  }
};
