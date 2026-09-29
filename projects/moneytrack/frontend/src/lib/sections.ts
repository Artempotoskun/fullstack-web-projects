export const sections = ['dashboard', 'accounts', 'transactions', 'budgets', 'analytics', 'goals', 'recurring', 'import', 'categories', 'settings', 'security'] as const;
export type Section = (typeof sections)[number];
