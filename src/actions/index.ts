type Action = (args: string[]) => Promise<boolean>;

export const actionFactories: Record<string, () => Promise<Action>> = {
  update: () => import('./update').then((m) => m.main),
  extract: () => import('./extract').then((m) => m.main),
  inspect: () => import('./inspect').then((m) => m.main),
};
