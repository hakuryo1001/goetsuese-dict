/**
 * 吳林 - 詞典數據類型定義
 * Wulam - Dictionary Data Types
 *
 * @version 1.0.0
 */

/**
 * 詞條類型
 * - character: 單字
 * - word: 詞語（雙字及以上）
 * - phrase: 短語/俗語
 */
export type EntryType = "character" | "word" | "phrase";

/**
 * 參見類型
 * - word: 參見其他詞條（站內跳轉）
 * - section: 參見書中章節（顯示提示）
 */
export type RefType = "word" | "section";

/**
 * 語域類型
 */
export type RegisterType = "口语" | "书面" | "粗俗" | "文雅" | "中性";

/**
 * 詞性標籤
 */
export type PosLabel =
  | "名词"
  | "动词"
  | "形容词"
  | "副词"
  | "代词"
  | "量词"
  | "介词"
  | "连词"
  | "助词"
  | "叹词"
  | "象声词"
  | "语素"
  | "缩略语";

/**
 * 方言信息
 */
export interface Dialect {
  /** 方言名稱 */
  name: string;
  /** 地區代碼 (可選，用於可視化) */
  region_code?: string;
}

/**
 * 詞頭信息（處理異形詞、括號、推薦寫法）
 */
export interface Headword {
  /** 原書寫法（展示用） */
  display: string;
  /** 清洗後（搜索用），可能包含多個變體 */
  search: string;
  /** 推薦標準寫法 */
  normalized: string;
  /** 是否包含開天窗字 □ */
  is_placeholder: boolean;
}

/**
 * 標音信息
 */
export interface Phonetic {
  /** 原書注音（如吳語拼音、不規範拼音、IPA）
   * - string: 單個注音或多個注音的字符串表示
   * - string[]: 與 ngven 一一對應的注音數組
   */
  original: string | string[];
  /** ngven 羅馬字（數組支持多音） */
  ngven: string[];
  /** 變調信息（可選） */
  tone_sandhi?: string[];
}

/**
 * 例句/組詞
 */
export interface Example {
  /** 例句內容 */
  text: string;
  /** 例句拼音（可選） */
  ngven?: string;
  /** 翻譯（普通話/英文，可選） */
  translation?: string;
}

/**
 * 子義項（用於 A) B) C) 等分類）
 */
export interface SubSense {
  /** 標籤（A, B, C等） */
  label: string;
  /** 釋義內容 */
  definition: string;
  /** 例句/組詞數組 */
  examples?: Example[];
}

/**
 * 釋義單元（支持多義項）
 */
export interface Sense {
  /** 釋義內容 */
  definition: string;
  /** 詞性/分類標籤 */
  label?: string;
  /** 例句/組詞數組 */
  examples?: Example[];
  /** 子義項（用於 A) B) C) 等分類） */
  sub_senses?: SubSense[];
}

/**
 * 參見引用
 */
export interface Reference {
  /** 引用類型 */
  type: RefType;
  /** 目標文本 */
  target: string;
  /** 內部鏈接（構建時生成） */
  url?: string;
}

/**
 * 文獻引用（結構化）
 */
export interface LiteraryReference {
  /** 作者（包含朝代，如"清·黃石麟"） */
  author?: string | null;
  /** 作品名稱 */
  work?: string | null;
  /** 引文內容（～ 代表詞頭） */
  quote?: string | null;
  /** 出版/版本信息 */
  source?: string | null;
}

/**
 * 詞典特有元數據
 */
export interface DictionaryMeta {
  /** 分類 */
  category?: string;
  /** 子分類 */
  subcategories?: string[];
  /** 詞性 */
  pos?: PosLabel;
  /** 詞源說明 */
  etymology?: string;
  /** 文獻引用 */
  references?: LiteraryReference[];
  /** 首次記錄時間 */
  first_recorded?: string;
  /** 用法說明 */
  usage?: string;
  /** 地域變體信息 */
  region?: string;
  /** 語域 */
  register?: RegisterType;
  /** 備註/典故 */
  notes?: string;
  /** 允許任意其他擴展字段 */
  [key: string]: any;
}

/**
 * 運行時內容展示限制元數據
 */
export interface EntryModeration {
  /** 受限地區，使用 ISO 3166-1 alpha-2 國家/地區碼 */
  restricted_regions?: string[];
  /** 觸發限制的詞表策略 */
  policy?: string;
  /** 審計用命中詞；不應在公開 API 中展示給用戶 */
  matched_terms?: string[];
}

/**
 * 詞典條目（核心數據結構）
 */
export interface DictionaryEntry {
  /** 唯一ID */
  id: string;
  /** 來源詞典 */
  source_book: string;
  /** 原書編號（如有） */
  source_id?: string;

  /** 方言信息 */
  dialect: Dialect;

  /** 詞頭信息 */
  headword: Headword;
  /** 標音信息 */
  phonetic: Phonetic;

  /** 詞條類型 */
  entry_type: EntryType;

  /** 釋義數組（支持多義項） */
  senses: Sense[];

  /** 參見引用 */
  refs?: Reference[];

  /** 搜索關鍵詞（包含簡體、繁體、無聲調拼音等） */
  keywords: string[];

  /** 元數據 */
  meta: DictionaryMeta;

  /** 內容展示限制元數據 */
  moderation?: EntryModeration;

  /** 創建時間（ISO 8601） */
  created_at?: string;
  /** 更新時間（ISO 8601） */
  updated_at?: string;
}

/**
 * 數據來源類型
 */
export type SourceType =
  | "published_book"
  | "community_contributed"
  | "public_domain"
  | "scanned_from_internet";

/**
 * 詞典元數據（索引文件）
 */
export interface DictionaryInfo {
  id: string;
  name: string;
  dialect: string;
  entries_count: number;
  author?: string;
  publisher?: string;
  year?: number;
  file: string;
  version?: string;
  description?: string;
  source?: SourceType;
  license?: string;
  license_url?: string;
  usage_restriction?: string;
  attribution?: string;
  cover?: string;
}

/**
 * 詞典索引
 */
export interface DictionaryIndex {
  dictionaries: DictionaryInfo[];
  last_updated: string;
  schema_version: string;
}

/**
 * 搜索結果
 */
export interface SearchResult {
  entry: DictionaryEntry;
  score: number;
  match_fields?: string[];
  highlights?: Record<string, string[]>;
}

/**
 * 搜索選項
 */
export interface SearchOptions {
  query: string;
  dialect?: string;
  source_book?: string;
  entry_type?: EntryType;
  fuzzy?: number;
  limit?: number;
  page?: number;
}

/**
 * 搜索響應
 */
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  took: number;
}

/**
 * CSV 行數據（用於構建腳本）
 */
export interface CSVRow {
  id?: string;
  parent_id?: string;
  headword_display: string;
  headword_normalized: string;
  ngven: string;
  original_romanization?: string;
  entry_type: EntryType;
  definition: string;
  label?: string;
  examples?: string;
  example_ngven?: string;
  example_translation?: string;
  ref_word?: string;
  ref_section?: string;
  category?: string;
  usage?: string;
  etymology?: string;
  register?: RegisterType;
  notes?: string;
  [key: string]: any;
}

/**
 * 構建配置
 */
export interface BuildConfig {
  input_csv: string;
  output_json: string;
  dictionary_info: Omit<DictionaryInfo, "entries_count" | "file">;
  generate_index?: boolean;
  validate?: boolean;
}

/**
 * 驗證錯誤
 */
export interface ValidationError {
  row?: number;
  field?: string;
  type:
    | "missing_field"
    | "invalid_format"
    | "invalid_reference"
    | "encoding_error";
  message: string;
  severity: "error" | "warning";
}

/**
 * 驗證結果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  total_rows: number;
  valid_rows: number;
}
