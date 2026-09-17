/// <reference types="vite/client" />
import 'leaflet/dist/leaflet.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Boundary from './Boundary';
import Planner from './Planner';
import './planner.css';
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Boundary>
      <Planner />
    </Boundary>
  </React.StrictMode>
);
