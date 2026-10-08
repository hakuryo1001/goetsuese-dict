export type LocalizedString = string | Record<string, string>;

export interface DictionaryMeta {
  id: string;
  name: LocalizedString;
  dialect: LocalizedString;
  entries_count: number;
  author?: LocalizedString;
  publisher?: LocalizedString;
  year?: number;
  file?: string;
  description?: LocalizedString;
  license?: LocalizedString;
  cover?: string;
  chunked?: boolean;
  chunk_dir?: string;
  source?: string;
}

export interface DictionaryIndex {
  dictionaries: DictionaryMeta[];
  last_updated?: string;
  schema_version?: string;
}
