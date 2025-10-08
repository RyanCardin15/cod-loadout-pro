import React from 'react';
import ReactDOM from 'react-dom/client';
import MetaTierList from './MetaTierList';
import LoadoutCard from './LoadoutCard';
import CounterSuggestions from './CounterSuggestions';
import MyLoadouts from './MyLoadouts';
import PlaystyleProfile from './PlaystyleProfile';
import WeaponList from './WeaponList';

// Export all components as a global object
export const CODLoadoutComponents = {
  React,
  ReactDOM,
  MetaTierList,
  LoadoutCard,
  CounterSuggestions,
  MyLoadouts,
  PlaystyleProfile,
  WeaponList,
};

// Attach to window for UMD usage
if (typeof window !== 'undefined') {
  (window as any).CODLoadoutComponents = CODLoadoutComponents;
}

export default CODLoadoutComponents;
