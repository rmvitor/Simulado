import { topics } from './topicos.js';
import { authoredQuestions } from './autorais.js';
import { officialQuestions, officialSources, officialReferences } from './oficiais.js';
export const catalog = {
  topics,
  questions: [...officialQuestions, ...authoredQuestions],
  rules: {
    minutes: 240, minimum: 48, alternatives: 5,
    parts: [
      { area: 'Língua Portuguesa', count: 5, points: 2 },
      { area: 'Noções de Informática', count: 5, points: 2 },
      { area: 'Conhecimentos Específicos', count: 30, points: 2 }
    ]
  },
  references: officialReferences,
  sources: officialSources
};
