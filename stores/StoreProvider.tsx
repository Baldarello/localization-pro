
import React from 'react';
import { RootStore } from './RootStore';

export const StoreContext = React.createContext<RootStore | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode; store: RootStore }> = ({ children, store }) => {
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

export const useStores = () => {
    const context = React.useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStores must be used within a StoreProvider');
    }
    return context;
};
