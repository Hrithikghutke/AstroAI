export interface ReactProjectOutput {
  files: {
    [path: string]: string;
  };
  entryPoint: string;
  siteName: string;
  primaryColor: string;
}

export type GeneratedReactFiles = {
  [filePath: string]: string;
};
