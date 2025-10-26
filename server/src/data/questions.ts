import { QuestionCategory } from '../../../shared/types.js';

// Adjectifs par catégorie
export const adjectives: Record<QuestionCategory, string[]> = {
  'soft': [
    'gentil',
    'drôle',
    'créatif',
    'intelligent',
    'courageux',
    'généreux',
    'souriant',
    'positif',
    'sportif',
    'artistique',
    'sympathique',
    'sage',
    'organisé',
    'patient',
    'aventureux',
    'rêveur',
    'sociable',
    'calme',
    'enthousiaste',
    'serviable'
  ],
  'classique': [
    'bavard',
    'timide',
    'têtu',
    'gourmand',
    'paresseux',
    'stressé',
    'distrait',
    'maladroit',
    'romantique',
    'jaloux',
    'fêtard',
    'dépensier',
    'râleur',
    'sensible',
    'bordélique',
    'susceptible',
    'accro aux réseaux sociaux',
    'retardataire',
    'menteur',
    'égoïste'
  ],
  'humour-noir': [
    'susceptible de finir en prison',
    'susceptible de survivre à une apocalypse zombie',
    'susceptible de mourir en premier dans un film d\'horreur',
    'susceptible de devenir dictateur',
    'susceptible de trahir ses amis pour de l\'argent',
    'susceptible de rejoindre une secte',
    'susceptible de faire un pacte avec le diable',
    'susceptible de disparaître sans laisser de traces',
    'susceptible de devenir un serial killer',
    'susceptible d\'être possédé',
    'susceptible de se faire larguer par SMS',
    'susceptible de finir seul avec 50 chats',
    'susceptible de ruiner sa vie sur un coup de tête',
    'susceptible de se faire virer le premier jour',
    'susceptible de provoquer la fin du monde'
  ],
  'hard': [
    'chaud au lit',
    'infidèle',
    'pervers',
    'susceptible de faire un plan à 3',
    'susceptible d\'avoir le plus de conquêtes',
    'kinky',
    'susceptible d\'envoyer des nudes',
    'obsédé',
    'susceptible de regarder du porno en public',
    'susceptible de coucher le premier soir',
    'exhibitionniste',
    'susceptible d\'avoir des fantasmes bizarres',
    'accro au sexe',
    'susceptible d\'utiliser des sex-toys',
    'susceptible de tromper son partenaire'
  ],
  'politiquement-incorrect': [
    'raciste sans le savoir',
    'susceptible de faire une blague déplacée',
    'sexiste',
    'homophobe',
    'susceptible de se faire cancel sur Twitter',
    'susceptible d\'insulter sans s\'en rendre compte',
    'susceptible de voter pour un parti extrême',
    'intolérant',
    'susceptible de faire un scandale public',
    'susceptible d\'offenser tout le monde',
    'complotiste',
    'susceptible de tenir des propos choquants',
    'irrespectueux',
    'susceptible de discriminer',
    'provocateur'
  ]
};

// Fonction pour générer des questions aléatoires
export function getRandomQuestions(
  categories: QuestionCategory[],
  count: number
): Array<{ adjective: string; category: QuestionCategory }> {
  const questions: Array<{ adjective: string; category: QuestionCategory }> = [];
  const availableAdjectives: Array<{ adjective: string; category: QuestionCategory }> = [];

  // Collecter tous les adjectifs des catégories sélectionnées
  categories.forEach(category => {
    adjectives[category].forEach(adjective => {
      availableAdjectives.push({ adjective, category });
    });
  });

  // Mélanger et sélectionner
  const shuffled = availableAdjectives.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
