/**
 * Šablona „příběh tvůrce" — sdílená mezi editací (profile/edit) a veřejným
 * zobrazením (profile). Pořadí klíčů = pořadí odstavců ve složeném příběhu.
 *
 * Text otázek a placeholderů žije v i18n (klíče `story.q.<key>` a
 * `story.q.<key>.ph`), ať se překládá. Odpovědi (text uživatele) se neukládají
 * s otázkou — na profilu se zobrazí jen souvislé odstavce, bez otázek.
 */
export const STORY_QUESTION_KEYS = [
  "start",
  "craft",
  "unique",
  "inspiration",
  "customer",
  "dream",
] as const;

export type StoryQuestionKey = (typeof STORY_QUESTION_KEYS)[number];

/** Složí odpovědi do pole odstavců v pořadí otázek; vynechá prázdné. */
export function buildStory(answers?: Record<string, string>): string[] {
  if (!answers) return [];
  return STORY_QUESTION_KEYS.map((k) => (answers[k] ?? "").trim()).filter(Boolean);
}

/**
 * Nabídka citátů pro motto — pro ty, kdo nevědí, co napsat. Web má usnadňovat
 * kreativní procesy, tak pomáháme i tady. Uživatel si klidně napíše vlastní.
 */
export const CURATED_QUOTES: string[] = [
  "Tvořit znamená žít dvakrát. — Albert Camus",
  "Každé dílo nese kus duše svého tvůrce.",
  "Co je vyrobené s láskou, je cítit na dálku.",
  "Krása se skrývá v nedokonalosti.",
  "Nejde o dokonalost, jde o poctivost.",
  "Detail dělá rozdíl.",
  "Trpělivost je materiál, který se nedá koupit.",
  "Ruce, které tvoří, nikdy nejsou prázdné.",
  "Z malých věcí vznikají ty, na kterých záleží.",
  "Tvoř to, co bys sám chtěl vlastnit.",
  "Příběh prodává víc než cena.",
  "Řemeslo je umění, do kterého vložíš srdce.",
];
