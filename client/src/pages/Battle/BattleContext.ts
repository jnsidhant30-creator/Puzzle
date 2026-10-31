import React, { createContext, useContext } from 'react';
import type { BattleData } from '../../../../functions/src/types';

export const BattleContext = createContext<{ battle: BattleData | null }>({ battle: null });

export const useBattleContext = () => useContext(BattleContext);
