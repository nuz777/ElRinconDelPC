export interface AiAutocompleteResult {
  genre: string;
  tag: string;
  size: string;
  version: string;
  developer: string;
  description: string;
  minCpu: string;
  minRam: string;
  minStorage: string;
  minOs: string;
  minGpu: string;
}

export interface AiProviderStrategy {
  generateMetadata(
    apiKey: string,
    title: string,
    section?: string,
  ): Promise<AiAutocompleteResult>;
}
