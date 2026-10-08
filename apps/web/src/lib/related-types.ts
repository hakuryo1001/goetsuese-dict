/** One related headword for the word-page sidebar section. */
export type RelatedItem = {
  headword: string;
  display: string;
  ngven: string;
};

export type RelatedGroups = {
  compounds: RelatedItem[];
  shared_characters: RelatedItem[];
  homophones: RelatedItem[];
};
