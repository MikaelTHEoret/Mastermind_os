declare module 'electron' {
  interface OpenDialogReturnValue {
    canceled: boolean;
    filePaths: string[];
  }

  interface Dialog {
    showOpenDialog(options: {
      properties?: Array<'openFile'|'openDirectory'|'multiSelections'|'showHiddenFiles'|'createDirectory'|'promptToCreate'|'noResolveAliases'|'treatPackageAsDirectory'>;
      filters?: Array<{ name: string; extensions: string[] }>;
    }): Promise<OpenDialogReturnValue> | string[];
  }

  const dialog: Dialog;
}

interface Window {
  electron: {
    openFileDialog: (options: {
      properties: string[];
      filters: { name: string; extensions: string[] }[];
    }) => Promise<{
      canceled: boolean;
      filePaths: string[];
    }>;
  };
}
