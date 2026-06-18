export const window = {
  showInputBox: jest.fn(),
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
};

export const commands = {
  registerCommand: jest.fn(),
  executeCommand: jest.fn(),
};

export const workspace = {
  registerTextDocumentContentProvider: jest.fn(),
};

export const extensions = {
  getExtension: jest.fn(),
};

export const EventEmitter = jest.fn().mockImplementation(() => ({
  event: jest.fn(),
  fire: jest.fn(),
  dispose: jest.fn(),
}));

export const Uri = {
  parse: jest.fn((str: string) => ({
    toString: () => str,
    scheme: str.split(':')[0],
    authority: '',
    path: '',
  })),
  from: jest.fn((parts: { scheme: string; authority: string; path: string }) => ({
    toString: () => `${parts.scheme}://${parts.authority}${parts.path}`,
    scheme: parts.scheme,
    authority: parts.authority,
    path: parts.path,
  })),
};
