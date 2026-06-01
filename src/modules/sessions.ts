import type { BasisTheoryInstance } from '../types';

export const Sessions = (bt: BasisTheoryInstance) => {
  const create = async () => {
    try {
      const session = await bt.sessions.create();

      return session;
    } catch (error) {
      console.error(error);
    }
  };

  return {
    create,
  };
};
