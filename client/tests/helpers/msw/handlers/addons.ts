import { http, HttpResponse } from 'msw';

export const addonHandlers = [
  // Whose AI model reads images: off unless a test says otherwise, so no photo picker shows by default.
  http.get('/api/llm/capabilities', () => HttpResponse.json({ images: false })),
  http.get('/api/addons', () => {
    return HttpResponse.json({
      bagTracking: false,
      addons: [
        { id: 'vacay', name: 'Vacay', type: 'feature', icon: 'calendar', enabled: true },
        { id: 'atlas', name: 'Atlas', type: 'feature', icon: 'map', enabled: true },
      ],
    });
  }),
];
