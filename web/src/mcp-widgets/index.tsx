import React from 'react';
import ReactDOM from 'react-dom/client';
import MetaTierListBase from './MetaTierList';
import LoadoutCardBase from './LoadoutCard';
import CounterSuggestionsBase from './CounterSuggestions';
import MyLoadoutsBase from './MyLoadouts';
import PlaystyleProfileBase from './PlaystyleProfile';
import WeaponListBase from './WeaponList';
import { MotionProvider } from './components/MotionProvider';

// Wrap components with MotionProvider for LazyMotion optimization
const withMotionProvider = <P extends object>(Component: React.ComponentType<P>) => {
  const WrappedComponent = (props: P) => (
    <MotionProvider>
      <Component {...props} />
    </MotionProvider>
  );
  WrappedComponent.displayName = `withMotionProvider(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
};

// Export wrapped components for optimized bundle size
export const MetaTierList = withMotionProvider(MetaTierListBase);
export const LoadoutCard = withMotionProvider(LoadoutCardBase);
export const CounterSuggestions = withMotionProvider(CounterSuggestionsBase);
export const MyLoadouts = withMotionProvider(MyLoadoutsBase);
export const PlaystyleProfile = withMotionProvider(PlaystyleProfileBase);
export const WeaponList = withMotionProvider(WeaponListBase);

// Re-export React and ReactDOM for compatibility
export { React, ReactDOM };
