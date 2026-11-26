import type { TranslationStrings } from '../types';

const demo: TranslationStrings = {
  // The welcome dialog a demo instance opens with (components/Demo/DemoWelcome).
  'demo.welcome.eyebrow': 'Live demo',
  'demo.welcome.title': 'Welcome to YOUYA',
  'demo.welcome.tagline':
    'The travel planner you share: plan together on the map in real time, from the first idea to the photo book after the trip.',
  'demo.welcome.resetTitle': 'Everything resets every hour',
  'demo.welcome.resetBody':
    'Explore, edit and create as much as you like. On the hour the demo returns to its starting state for the next visitor.',
  'demo.welcome.resetIn': 'Next reset in',
  'demo.welcome.tryTitle': 'Try it right now',
  'demo.feature.planner.title': 'Trip planner',
  'demo.feature.planner.body':
    'Days, places and routes on the map, with flights, hotels, restaurants, bookings and shared costs.',
  'demo.feature.tours.title': 'Tours and hikes',
  'demo.feature.tours.body':
    'Plan a hike along the trail network and follow it over 3D terrain with its elevation profile.',
  'demo.feature.studio.title': 'Photo books in YOUYA Studio',
  'demo.feature.studio.body': 'Turn a journey into a designed photo book, page by page.',
  'demo.feature.collab.title': 'Plan together live',
  'demo.feature.collab.body':
    'Everyone on the trip sees each change the moment it happens, with chat, notes and polls.',
  'demo.feature.journey.title': 'Journey travel journal',
  'demo.feature.journey.body': 'Entries, photos, moods, pros and cons for every day on the road.',
  'demo.feature.atlas.title': 'Atlas world map',
  'demo.feature.atlas.body': 'The countries and regions you have visited, with your travel statistics.',
  'demo.feature.vacay.title': 'Vacay holiday planner',
  'demo.feature.vacay.body': 'Plan your days off around public holidays and see when everyone is free.',
  'demo.feature.collections.title': 'Collections',
  'demo.feature.collections.body': 'Save places across trips in lists of your own and copy them into any plan.',
  'demo.feature.offline.title': 'Works offline',
  'demo.feature.offline.body': 'Install YOUYA as an app and keep your plans, maps and lists without a connection.',
  'demo.welcome.limitsTitle': 'Not part of the demo',
  'demo.limit.uploads': 'Uploading photos, documents and covers',
  'demo.limit.account': 'Changing the account, its password or 2FA',
  'demo.limit.apiKeys': 'Creating API keys',
  'demo.limit.mcp': 'Connecting MCP clients',
  'demo.limit.ai': 'Connecting your own AI model',
  'demo.welcome.fullTitle': 'The full version adds',
  'demo.full.sso': 'Sign in with OIDC and SSO',
  'demo.full.backups': 'Automatic backups',
  'demo.full.plugins': 'Plugins for new features',
  'demo.full.assistant': 'The AI assistant on your own model',
  'demo.full.admin': 'An admin panel for users, addons and permissions',
  'demo.welcome.repo': 'Source code on GitHub',
  'demo.welcome.start': 'Start exploring',
  'demo.welcome.credits': 'Photo credits',
  // The photo credits, the welcome dialog's second view (components/Demo/DemoCredits).
  'demo.credits.title': 'Photo credits',
  'demo.credits.intro':
    'The photos in this demo come from Wikimedia Commons, each under the license named with it. That license applies to the photo only, not to YOUYA or the rest of the demo.',
  'demo.credits.by': 'by {author}',
  'demo.credits.publicDomain': 'Public domain',
  'demo.credits.back': 'Back',
  // The lock over a section the shared demo account may not change (components/Demo/DemoLock).
  'demo.lock.badge': 'Demo mode',
  'demo.lock.apiKeys': 'API keys cannot be created in the demo.',
  'demo.lock.mcp': 'MCP clients cannot be connected in the demo.',
  'demo.lock.ai': 'Your own AI connection cannot be added in the demo.',
  'demo.lock.aiTitle': 'Connect your own AI model',
  'demo.lock.account': 'The shared demo account cannot be changed.',
  'demo.lock.language': 'The demo always runs in English.',
};

export default demo;
