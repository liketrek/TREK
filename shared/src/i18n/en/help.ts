import type { TranslationStrings } from '../types';

const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // ── Help center (the contextual panel behind the ? in the navbar) ──────────
  'help.center.button': 'Help for this screen',
  'help.center.title': 'Help',
  'help.center.onThisScreen': 'On this screen',
  'help.center.screens': 'Screens',
  'help.center.thisScreen': 'This screen',
  'help.center.subScreens': '{count} sub-screens',
  'help.center.subScreensLabel': 'Sub-screens',
  'help.center.guidesCount': '{count} guides',
  'help.center.goToScreen': 'Go to {screen}',
  'help.center.overview': 'Overview',
  'help.center.howTo': 'How do I…',
  'help.center.searchPlaceholder': 'Search guides and docs…',
  'help.center.searchEmpty': 'Nothing found for “{query}”.',
  'help.center.searchGuides': 'Guides',
  'help.center.searchDocs': 'Docs',
  'help.center.searchError': 'Search is unavailable right now.',
  'help.center.back': 'Back',
  'help.center.close': 'Close help',
  'help.center.steps': '{count} steps',
  'help.center.step': 'Step {n}',
  'help.center.stepsLabel': 'Steps',
  'help.center.stepOf': 'Step {n} of {total}',
  'help.center.screenshot': 'Screenshot',
  'help.center.result': 'What you get',
  'help.center.tips': 'Good to know',
  'help.center.related': 'Related',
  'help.center.openDocs': 'Open in Help & Docs',
  'help.center.docsSection': 'In the docs',
  'help.center.noContext': 'No guide for this screen yet.',
  'help.center.noContextHint': 'Search the docs, or tell us what you were looking for.',
  'help.center.feedback': 'Missing something?',
  'help.center.feedbackLink': 'Tell us on GitHub',
  'help.center.discord': 'Ask on Discord',
  'help.center.quick': 'Quick',
  'help.center.guide': 'Guide',
  'help.center.tour': 'Walkthrough',
  'help.center.imageAlt': 'Step {n} of “{title}”',

  // ── Screen: dashboard ──────────────────────────────────────────────────────
  'help.ctx.dashboard.title': 'Dashboard',
  'help.ctx.dashboard.summary':
    'Your dashboard is the front door to every trip. The boarding pass at the top spotlights the trip that is running or coming up next, the row below it counts what you have travelled so far, and the cards list everything you are planning, have archived or already finished.',
  'help.ctx.dashboard.bullet.1':
    'Boarding pass: the running or next trip with its dates, travellers, places and a countdown. Click it to open the trip.',
  'help.ctx.dashboard.bullet.2':
    'Travel stats: countries visited, trips, days on the road and distance flown, across all your trips.',
  'help.ctx.dashboard.bullet.3':
    'Trip cards, filtered by Planned, Archived and Completed, as a grid or a list. Hover a card for edit, duplicate, archive and delete.',
  'help.ctx.dashboard.bullet.4':
    'Widgets on the right: currency converter, world clocks, upcoming reservations and collections. Every one of them can be switched off.',
  'help.ctx.dashboard.bullet.5': 'The New Trip card and the button in the bottom-right corner both start a new trip.',

  // create-trip
  'help.guide.create-trip.title': 'Create a trip',
  'help.guide.create-trip.goal': 'Start a new trip with a name, dates and a cover photo.',
  'help.guide.create-trip.step.1':
    'Click New Trip. The card at the end of your trips and the button in the bottom-right corner do the same thing.',
  'help.guide.create-trip.step.2':
    'Give the trip a name. That is the only field you need; everything else can be added later.',
  'help.guide.create-trip.step.3':
    'Pick a start and an end date. TREK creates one day per date, so your itinerary is ready to fill.',
  'help.guide.create-trip.step.4':
    'Optional: add a cover photo. Upload your own, drag one in, or search Unsplash for the destination.',
  'help.guide.create-trip.step.5': 'Click Create New Trip.',
  'help.guide.create-trip.result':
    'The trip appears on your dashboard. If it is your next one, it takes over the boarding pass at the top.',
  'help.guide.create-trip.tip.1':
    'Dates can be changed later. If bookings already exist, TREK asks whether to move them along with the days.',
  'help.guide.create-trip.tip.2':
    'The trip currency you pick here is what every cost is converted into. Choose the currency of the destination.',

  // edit-trip
  'help.guide.edit-trip.title': 'Edit a trip',
  'help.guide.edit-trip.goal': 'Rename a trip, change its dates or adjust its settings.',
  'help.guide.edit-trip.step.1': 'Hover the trip card (or the boarding pass) and click the pencil.',
  'help.guide.edit-trip.step.2':
    'Change what you need: name, description, dates, cover, currency, reminder or members.',
  'help.guide.edit-trip.step.3': 'Click Update.',
  'help.guide.edit-trip.result': 'The card updates right away, for every member of the trip.',
  'help.guide.edit-trip.tip.1':
    'Moving the dates of a trip that already has bookings opens a second step that asks whether the bookings should move too.',

  // cover-image
  'help.guide.cover-image.title': 'Set a cover photo',
  'help.guide.cover-image.goal': 'Give a trip a picture that shows on its card and on the boarding pass.',
  'help.guide.cover-image.step.1': 'Open the trip’s edit form via the pencil on its card.',
  'help.guide.cover-image.step.2':
    'In Cover Image, drop a photo, click to upload one, or type a destination into the Unsplash search.',
  'help.guide.cover-image.step.3': 'Pick a photo and click Update.',
  'help.guide.cover-image.result': 'The photo is saved with the trip and shows everywhere the trip is listed.',
  'help.guide.cover-image.tip.1':
    'Photos from the Unsplash search are credited automatically; your own uploads stay on your server.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplicate a trip',
  'help.guide.duplicate-trip.goal': 'Reuse a trip as the template for a new one.',
  'help.guide.duplicate-trip.step.1': 'Hover the card and click the duplicate icon.',
  'help.guide.duplicate-trip.step.2': 'Read what will be copied and what will not, then confirm.',
  'help.guide.duplicate-trip.result': 'A copy appears next to the original, ready to be renamed and re-dated.',
  'help.guide.duplicate-trip.tip.1':
    'Days, places, reservations, budget items, packing lists and day notes come along. Members, chat, polls, files and share links do not.',

  // archive-trip
  'help.guide.archive-trip.title': 'Archive and restore a trip',
  'help.guide.archive-trip.goal': 'Tuck a trip away without deleting it, and bring it back later.',
  'help.guide.archive-trip.step.1': 'Hover the card and click Archive.',
  'help.guide.archive-trip.step.2': 'Switch the filter above the cards to Archived to see it again.',
  'help.guide.archive-trip.step.3': 'Click Restore on the card to move it back to Planned.',
  'help.guide.archive-trip.result':
    'Archived trips keep everything. They just stop cluttering the dashboard and the all-trips calendar feed.',

  // delete-trip
  'help.guide.delete-trip.title': 'Delete a trip',
  'help.guide.delete-trip.goal': 'Remove a trip for good.',
  'help.guide.delete-trip.step.1': 'Hover the card and click the trash icon.',
  'help.guide.delete-trip.step.2': 'Confirm. The dialog names the trip, so you know you have the right one.',
  'help.guide.delete-trip.result':
    'The trip, its days, places, bookings and files are gone. There is no undo, so archive instead if you are unsure.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Find completed trips, switch grid and list',
  'help.guide.filter-and-view.goal': 'See finished or archived trips and pick the layout you like.',
  'help.guide.filter-and-view.step.1':
    'Use Planned, Archived and Completed above the cards. Completed is every trip whose end date has passed.',
  'help.guide.filter-and-view.step.2': 'Click the list icon to switch to a compact list; click it again for the grid.',
  'help.guide.filter-and-view.result': 'The dashboard remembers your layout on this device.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Subscribe to all trips in your calendar',
  'help.guide.calendar-feed.goal': 'See the days and bookings of every active trip in your calendar app, kept in sync.',
  'help.guide.calendar-feed.step.1': 'Click the calendar icon next to the view toggle.',
  'help.guide.calendar-feed.step.2': 'Click Enable calendar subscription. TREK generates a private feed link.',
  'help.guide.calendar-feed.step.3':
    'Add the feed with one of the buttons (Google, Apple, Outlook) or copy the link into any calendar app that subscribes to URLs.',
  'help.guide.calendar-feed.result':
    'Every active trip shows in your calendar and updates on its own. Archived trips and trips that ended more than 90 days ago are left out.',
  'help.guide.calendar-feed.tip.1':
    'The link is a secret. Anyone who has it can read the feed; revoke it from the same dialog if it leaks.',

  // widgets
  'help.guide.widgets.title': 'Choose your dashboard widgets',
  'help.guide.widgets.goal': 'Show or hide the stats row and the widgets on the right.',
  'help.guide.widgets.step.1': 'Open your avatar menu in the top-right corner and choose Settings.',
  'help.guide.widgets.step.2': 'Switch to the Appearance tab.',
  'help.guide.widgets.step.3':
    'Under Dashboard widgets, switch each widget on or off. Desktop and mobile are set separately.',
  'help.guide.widgets.step.4': 'Go back to the dashboard. The change is applied immediately.',
  'help.guide.widgets.result':
    'Hidden widgets free the space for your trips; switch the whole right sidebar off to centre the layout.',
  'help.guide.widgets.link': 'Open Appearance settings',

  // currency-widget
  'help.guide.currency-widget.title': 'Convert currencies',
  'help.guide.currency-widget.goal': 'Convert an amount between two currencies with current rates.',
  'help.guide.currency-widget.step.1': 'Type the amount and pick the two currencies.',
  'help.guide.currency-widget.step.2': 'The arrow between them swaps the pair; the circular arrow refreshes the rate.',
  'help.guide.currency-widget.result':
    'Your currency pair is remembered on your account, so it is the same on every device.',
  'help.guide.currency-widget.tip.1': 'Rates come from the European Central Bank and update once a day.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Add world clocks',
  'help.guide.timezones-widget.goal': 'Keep an eye on the local time at your destinations.',
  'help.guide.timezones-widget.step.1': 'Click + in the Timezones widget and search for a city.',
  'help.guide.timezones-widget.step.2': 'Remove a clock with the × next to it.',
  'help.guide.timezones-widget.result': 'Your clocks are saved with your account.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay is your personal leave planner: how many vacation days you have in a year, which ones you have logged and what is left. The grid shows the whole year at a glance; the sidebar holds the year selector, the people you plan with, calendars shared with you, the legend and your entitlement.',
  'help.ctx.vacay.bullet.1':
    'Year grid: twelve month cards, one cell per day. Click a day to log or clear it. A small blue dot marks days a trip already covers.',
  'help.ctx.vacay.bullet.2':
    'Toolbar at the bottom: Vacation or Company Holiday mode, plus the Half day and Comp / Flex switches that change what a click logs.',
  'help.ctx.vacay.bullet.3':
    'Entitlement: your days for the year, how many are used and how many are left, with carry-over from the previous period.',
  'help.ctx.vacay.bullet.4':
    'Persons are people fused into your plan, each in their own colour. Shared Calendars are read-only rings of other people’s days off.',
  'help.ctx.vacay.bullet.5':
    'Settings cover weekends, week start, carry-over, your leave year, company holidays and public or school holiday calendars.',

  // log-day
  'help.guide.log-day.title': 'Log a vacation day',
  'help.guide.log-day.goal': 'Mark a day off in the year grid and see your balance follow.',
  'help.guide.log-day.step.1':
    'Check the toolbar at the bottom: the left button, in your colour, means a click logs a vacation day for you.',
  'help.guide.log-day.step.2': 'Click a day in any month card. It fills with your colour and Used counts one more day.',
  'help.guide.log-day.step.3': 'Click the same day again to clear it.',
  'help.guide.log-day.result':
    'The day is logged, Days, Used and Left update at once, and anyone fused into your plan sees it live.',
  'help.guide.log-day.tip.1': 'Weekends cannot be logged while Block Weekends is on in Settings.',
  'help.guide.log-day.tip.2':
    'A blue dot in a cell means one of your trips covers that day, so you can see where leave and travel line up.',

  // half-day
  'help.guide.half-day.title': 'Log a half day',
  'help.guide.half-day.goal': 'Take an afternoon off without spending a whole day of entitlement.',
  'help.guide.half-day.step.1':
    'Switch Half day on in the toolbar. Its orange dot is the marker a half day gets in the grid.',
  'help.guide.half-day.step.2': 'Click a day. It is logged as 0.5 and carries the orange dot in its corner.',
  'help.guide.half-day.step.3':
    'Switch Half day off again when you are done; clicking a half day with different settings converts it in place.',
  'help.guide.half-day.result':
    'Used grows by 0.5. Half day and Comp / Flex are independent, so a half comp day is possible too.',
  'help.guide.half-day.tip.1':
    'The toolbar always shows the marker your next click will place, so you can check before you log.',

  // comp-day
  'help.guide.comp-day.title': 'Log comp or flex time',
  'help.guide.comp-day.goal': 'Take time off in lieu that does not cost vacation days.',
  'help.guide.comp-day.step.1':
    'Switch Comp / Flex on in the toolbar. The hatched disc is how a comp day looks in the grid.',
  'help.guide.comp-day.step.2': 'Click a day. It fills with a diagonal hatch in your colour instead of a solid block.',
  'help.guide.comp-day.result': 'Comp days are counted beside the entitlement tiles and never reduce Left.',
  'help.guide.comp-day.tip.1':
    'Overtime taken back, flextime, a day in lieu: anything that is time off but not vacation belongs here.',

  // entitlement
  'help.guide.entitlement.title': 'Set your entitlement',
  'help.guide.entitlement.goal': 'Tell Vacay how many vacation days you have in the year.',
  'help.guide.entitlement.step.1': 'In the sidebar, click the Days tile under Entitlement.',
  'help.guide.entitlement.step.2': 'Type your number of days and press Enter.',
  'help.guide.entitlement.result':
    'Left is recalculated from your entitlement, any carry-over and the days you have used.',
  'help.guide.entitlement.tip.1': 'Each year has its own entitlement, so a change here affects the selected year only.',

  // years
  'help.guide.years.title': 'Add and switch years',
  'help.guide.years.goal': 'Plan next year already, or look back at the last one.',
  'help.guide.years.step.1':
    'Click the + to the right of the year to add the next year, or the + on the left for the previous one.',
  'help.guide.years.step.2': 'Switch between years with the arrows or the year chips underneath.',
  'help.guide.years.step.3':
    'To remove a year, hover its chip and click the small minus. Its entries go with it, so confirm carefully.',
  'help.guide.years.result': 'Every year keeps its own entitlement and entries; carry-over links them together.',

  // company-holidays
  'help.guide.company-holidays.title': 'Mark company holidays',
  'help.guide.company-holidays.goal': 'Block days the whole company is off without spending anyone’s entitlement.',
  'help.guide.company-holidays.step.1':
    'Open Settings and check that Company Holidays is on. It is on by default; the toolbar only offers the mode while it is.',
  'help.guide.company-holidays.step.2': 'Back in the grid, switch the toolbar to Company Holiday mode.',
  'help.guide.company-holidays.step.3': 'Click the days. They turn amber and show up in the legend.',
  'help.guide.company-holidays.result':
    'Company holidays are visible to everyone fused into the plan and never reduce Left.',
  'help.guide.company-holidays.tip.1': 'Any fused person can edit company holidays, so agree on who maintains them.',

  // public-holidays
  'help.guide.public-holidays.title': 'Show public holidays',
  'help.guide.public-holidays.goal': 'Put the public holidays of your country or region on the grid.',
  'help.guide.public-holidays.step.1': 'Open Settings and switch Public Holidays on.',
  'help.guide.public-holidays.step.2':
    'Click Add calendar, then pick the country and, where it matters, the region. Give it a colour and a label if you like.',
  'help.guide.public-holidays.step.3': 'Close Settings. The holidays appear on the grid and in the legend.',
  'help.guide.public-holidays.result':
    'Public holidays are marked in the calendar’s colour and never count against your entitlement.',
  'help.guide.public-holidays.tip.1':
    'You can add several calendars, for example your own region and the one of a fused colleague.',

  // school-holidays
  'help.guide.school-holidays.title': 'Show school holidays',
  'help.guide.school-holidays.goal': 'See the school breaks of your region alongside your own days off.',
  'help.guide.school-holidays.step.1': 'Open Settings and switch School Holidays on.',
  'help.guide.school-holidays.step.2':
    'Click Add calendar and pick the country. Where a country splits its calendar, pick the region or group as well.',
  'help.guide.school-holidays.step.3': 'Close Settings. Each break gets a coloured band along the bottom of its days.',
  'help.guide.school-holidays.result': 'School holidays are purely visual: they never reduce anyone’s entitlement.',
  'help.guide.school-holidays.tip.1':
    'Missing region? Your administrator can maintain school holidays by hand under Admin, Personalization, School holidays.',

  // weekends
  'help.guide.weekends.title': 'Block weekends and set the week start',
  'help.guide.weekends.goal': 'Keep weekends out of your count and start the week on the day you are used to.',
  'help.guide.weekends.step.1': 'Open Settings.',
  'help.guide.weekends.step.2': 'Switch Block Weekends on and pick which days count as your weekend.',
  'help.guide.weekends.step.3': 'Under Week starts on, choose Monday or Sunday.',
  'help.guide.weekends.result': 'Blocked days are greyed out in the grid and cannot be logged by mistake.',

  // leave-year
  'help.guide.leave-year.title': 'Set your leave year',
  'help.guide.leave-year.goal':
    'Count your entitlement over a fiscal year or from your hire date instead of January to December.',
  'help.guide.leave-year.step.1': 'Open Settings and find Vacation year.',
  'help.guide.leave-year.step.2':
    'Choose Calendar, Fiscal (with the month and day it starts) or Hire date (with the date you were hired).',
  'help.guide.leave-year.result':
    'Entitlement, used days and carry-over follow that period, and the grid starts on its first month.',
  'help.guide.leave-year.tip.1':
    'This setting is personal: in a fused plan everyone keeps their own leave year and numbers.',

  // carry-over
  'help.guide.carry-over.title': 'Carry unused days over',
  'help.guide.carry-over.goal': 'Add what is left at the end of a period to the next one.',
  'help.guide.carry-over.step.1': 'Open Settings.',
  'help.guide.carry-over.step.2': 'Switch Carry Over on.',
  'help.guide.carry-over.result':
    'The carried amount is recalculated across all your years and shown under the entitlement.',
  'help.guide.carry-over.tip.1': 'Switching it off sets every carry-over balance back to zero.',

  // invite
  'help.guide.invite.title': 'Plan together with someone',
  'help.guide.invite.goal': 'Fuse your plan with another TREK user so you see each other’s days off in one grid.',
  'help.guide.invite.step.1': 'Click the person icon in the Persons panel.',
  'help.guide.invite.step.2': 'Pick the user and send the invite.',
  'help.guide.invite.step.3': 'They get a notification and accept. Until then the invite shows as pending.',
  'help.guide.invite.result':
    'Both plans merge: each person has a colour, you can log days for each other, and everything syncs live.',
  'help.guide.invite.tip.1': 'To undo a fusion, use Dissolve in Settings. Everyone’s entries return to their own plan.',
  'help.guide.invite.tip.2': 'If the other person should only see your days, share your calendar instead of fusing.',

  // share-calendar
  'help.guide.share-calendar.title': 'Share your calendar read-only',
  'help.guide.share-calendar.goal': 'Let someone see when you are off without giving them a say in your plan.',
  'help.guide.share-calendar.step.1': 'Click the share icon in the Shared Calendars panel.',
  'help.guide.share-calendar.step.2': 'Pick the user and click Share. No acceptance is needed.',
  'help.guide.share-calendar.step.3':
    'Calendars shared with you appear in the same panel; the eye hides one, Stop sharing revokes yours.',
  'help.guide.share-calendar.result':
    'Your days off appear as a coloured ring on their grid. Nothing you share can be edited by them.',
  'help.guide.share-calendar.tip.1':
    'Sharing and fusion are independent: you can be fused with one person and share with others.',
  'help.guide.share-calendar.tip.2': 'Hover a ringed day to see who is off and for how long.',

  // ── Screen: atlas ──────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas is your travel footprint on a world map: every country a trip has taken you to is coloured in, and you can add the ones you visited before TREK by hand. Zoom in for regions, keep a bucket list of places you still want to see, and read your numbers in the glass panel at the bottom.',
  'help.ctx.atlas.bullet.1':
    'The map: visited countries carry a colour that stays theirs, planned countries have a dashed outline, bucket-list countries a diagonal hatch, everywhere else is grey. Hover a country for its trips, places and first and last visit.',
  'help.ctx.atlas.bullet.2':
    'Search at the top: type a country or a place. Picking a country flies there and opens its popup; picking a place lands in its region so you can mark that.',
  'help.ctx.atlas.bullet.3':
    'Show planned countries, top right: reveals the countries of your upcoming trips. The switch only appears while you have some.',
  'help.ctx.atlas.bullet.4':
    'Panel at the bottom: the Stats tab with countries, trips, places, cities, days, continents and your streak; the Bucket List tab with what is still ahead.',
  'help.ctx.atlas.bullet.5':
    'Regions: from zoom level 5 the map switches to states and provinces, each one clickable to mark or unmark.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: with the addon connected, a panel left of the statistics ticks off wishes and adds countries from your recordings, never without your confirmation.',
  // mark-country
  'help.guide.mark-country.title': 'Mark a country as visited',
  'help.guide.mark-country.goal': 'Add a country you have been to before TREK, so the map and your count include it.',
  'help.guide.mark-country.step.1': 'Type the country into the search box at the top of the map.',
  'help.guide.mark-country.step.2': 'Pick it from the list. The map flies there and a popup opens for that country.',
  'help.guide.mark-country.step.3': 'Choose Mark as visited.',
  'help.guide.mark-country.result':
    'The country takes its colour on the map and Countries counts one more. That colour is permanent: marking further countries never reshuffles the rest.',
  'help.guide.mark-country.tip.1':
    'Clicking a grey country on the map opens the same popup; search is the sure way in for small countries.',
  'help.guide.mark-country.tip.2':
    'A country you mark by hand always counts as visited, whatever the dates of any trip going there.',
  // unmark-country
  'help.guide.unmark-country.title': 'Remove a country you marked',
  'help.guide.unmark-country.goal': 'Take a hand-marked country off the map again.',
  'help.guide.unmark-country.step.1':
    'Search the country and pick it, or click it on the map. For a country you marked yourself the popup asks whether to remove it.',
  'help.guide.unmark-country.step.2': 'Confirm with Remove.',
  'help.guide.unmark-country.result': 'The country goes back to grey and leaves your count.',
  'help.guide.unmark-country.tip.1':
    'Only hand-marked countries can be removed this way. A country with trips or places stays until those do; Remove also sits in its detail card in the panel when it was marked by hand.',
  // country-details
  'help.guide.country-details.title': 'See what you did in a country',
  'help.guide.country-details.goal': 'Open a visited country and jump to the trips that took you there.',
  'help.guide.country-details.step.1': 'Search a country you have visited.',
  'help.guide.country-details.step.2':
    'Pick it. The map flies there and the panel at the bottom grows a card with its flag, places, trips and a chip per trip.',
  'help.guide.country-details.result': 'Click a trip chip to open that trip in the planner.',
  'help.guide.country-details.tip.1':
    'Hovering the country on the map shows the same numbers plus the first and last visit.',
  // planned-countries
  'help.guide.planned-countries.title': 'Show the countries you are going to',
  'help.guide.planned-countries.goal':
    'Bring the countries of your upcoming trips onto the map without counting them as visited.',
  'help.guide.planned-countries.step.1':
    'Turn on Show planned countries, top right. The number next to it is how many are waiting.',
  'help.guide.planned-countries.step.2':
    'Search a planned country and pick it: the panel says Planned and the map tooltip shows when you are going.',
  'help.guide.planned-countries.result':
    'Planned countries appear with a dashed outline, so they never look like somewhere you have already been. The switch remembers your choice.',
  'help.guide.planned-countries.tip.1':
    'A country counts as visited once the trip there has started; a trip under way counts too. Trips without dates stay out of the statistics entirely.',
  'help.guide.planned-countries.tip.2': 'The switch only exists while you have upcoming trips.',
  // regions
  'help.guide.regions.title': 'Mark a region',
  'help.guide.regions.goal': 'Go finer than countries: mark the states, provinces or prefectures you have been to.',
  'help.guide.regions.step.1':
    'Zoom into a country until its regions appear, from zoom level 5. Searching the country and picking it flies you close enough.',
  'help.guide.regions.step.2': 'Click a region. Hovering names it; the popup shows the region and its country.',
  'help.guide.regions.step.3': 'Choose Mark as visited.',
  'help.guide.regions.result':
    'The region fills with the country’s colour. Marking a region also counts the country as visited if it was not already.',
  'help.guide.regions.tip.1': 'Clicking a visited region offers Remove, whether you marked it or a place put it there.',
  'help.guide.regions.tip.2': 'Regions you have real places in are marked for you; nothing to do there.',
  // search-place
  'help.guide.search-place.title': 'Find a place and mark its region',
  'help.guide.search-place.goal': 'Mark Lombardy by searching for Milan, without knowing which region a city is in.',
  'help.guide.search-place.step.1':
    'Type a city, a landmark or an address into the search box. Countries come first; the matching places appear under Places below them.',
  'help.guide.search-place.step.2': 'Pick the place. The map flies there and works out which region the spot is in.',
  'help.guide.search-place.step.3':
    'Choose Mark as visited for that region, or Add to bucket list if it is still ahead of you.',
  'help.guide.search-place.result':
    'The region is marked, and with it the country. Countries without region data in the map bundle fall back to the country itself.',
  'help.guide.search-place.tip.1':
    'Places come from the same search as everywhere else in TREK, so they follow the provider your admin set up.',
  // bucket-country
  'help.guide.bucket-country.title': 'Put a country on the bucket list',
  'help.guide.bucket-country.goal':
    'Keep a wishlist of countries right on the map, apart from the ones you have been to.',
  'help.guide.bucket-country.step.1': 'Search the country and pick it, or click it on the map.',
  'help.guide.bucket-country.step.2': 'Choose Add to bucket list.',
  'help.guide.bucket-country.step.3':
    'Pick a month and year if you already know when, then confirm with Add to bucket list.',
  'help.guide.bucket-country.result':
    'The country is drawn with a diagonal hatch in the colour it will carry once you get there, and it appears in the Bucket List tab of the panel.',
  'help.guide.bucket-country.tip.1': 'The same popup offers Remove from wishlist once the country is on the list.',
  'help.guide.bucket-country.tip.2':
    'One entry per target date: the same country can be on the list for two different months, but not twice for the same one.',
  // bucket-place
  'help.guide.bucket-place.title': 'Add a place to the bucket list',
  'help.guide.bucket-place.goal':
    'Save a city, a sight or an address you dream of, with coordinates and a target date.',
  'help.guide.bucket-place.step.1': 'Open the Bucket List tab in the panel at the bottom.',
  'help.guide.bucket-place.step.2': 'Click Add place.',
  'help.guide.bucket-place.step.3':
    'Type the name and press the search button; pick the match so the place carries coordinates. Typing a name and skipping the search works too.',
  'help.guide.bucket-place.step.4': 'Pick a month and year if you like and click Add.',
  'help.guide.bucket-place.result':
    'The place sits at the top of your bucket list with its target date; the × next to it removes it again.',
  'help.guide.bucket-place.tip.1':
    'A wish with coordinates is what Dawarich can tick off for you later, once your recordings show you were there.',
  // stats
  'help.guide.stats.title': 'Read your statistics',
  'help.guide.stats.goal': 'Know what the numbers in the panel count, and what they do not.',
  'help.guide.stats.step.1':
    'Countries is the number of distinct countries you have actually been to; planned ones are shown next to it, not in it. Trips, Places and Days are totals across all your trips. Cities is worked out from your places’ addresses, so it is an estimate.',
  'help.guide.stats.step.2':
    'The continents show visited countries per continent; Antarctica joins the row once you have been. Then your streak, consecutive years with at least one trip, and how many trips you took this year.',
  'help.guide.stats.result': 'The numbers follow your trips as you plan them; nothing here needs maintaining.',
  'help.guide.stats.tip.1':
    'Cities are read from the address text, not looked up, so a short address like “Osteria Francescana, Italy” or one ending on a prefecture can land a region rather than a city.',
  'help.guide.stats.tip.2':
    'Countries you marked by hand count in Countries and the continents, but bring no trips, places or days.',

  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Add countries from your recordings',
  'help.guide.dawarich-countries.goal':
    'Let Dawarich say which countries you were in over the last year, and put the ones you confirm on the map.',
  'help.guide.dawarich-countries.step.1':
    'With the Dawarich addon connected, a Dawarich panel sits at the bottom of the map, left of the statistics, with two tiles. Click Countries.',
  'help.guide.dawarich-countries.step.2':
    'The dialog opens on its Countries tab. Click Look for countries: TREK reads the countries and cities your recordings cover in the last 12 months, a month at a time, so give it a moment. Every country your Atlas does not have yet is listed with its flag, how many cities, and the first of them by name, and starts ticked; click a row to leave it out.',
  'help.guide.dawarich-countries.step.3':
    'Confirm with the button at the bottom right, which reads Add 5 countries when five rows are ticked. The dialog says how many were added; close it and the map has re-read itself.',
  'help.guide.dawarich-countries.result':
    'The confirmed countries carry a colour on the map and count in Countries, recorded as coming from Dawarich. What you marked by hand is untouched.',
  'help.guide.dawarich-countries.tip.1':
    'Countries the Atlas already shows as visited, by hand, from a trip or from an earlier check, are left out, so your own marks are never relabelled. A country you removed from the Atlas earlier comes back when you confirm it here.',
  'help.guide.dawarich-countries.tip.2':
    'A country name TREK cannot match is listed under the rows rather than dropped, and Check again asks Dawarich once more. The note under the list says that the last 12 months were looked at; that window is fixed.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Tick off wishes from your recordings',
  'help.guide.dawarich-wishes.goal':
    'Find out which places on your bucket list you have actually reached, and tick them off on the day it happened.',
  'help.guide.dawarich-wishes.step.1':
    'In the Dawarich panel at the bottom of the map, left of the statistics, click Wishlist.',
  'help.guide.dawarich-wishes.step.2':
    'The dialog opens on its Wishlist tab. Click Check wishlist: TREK looks through your recordings for every entry that has coordinates. A wish you reached is listed with how close you got, how long you stayed and the day, and starts ticked; one you already ticked off says Already ticked off. Under the list a note counts the entries without coordinates, and the rule stands there too: A wish counts as reached within 250 m and after 20 minutes on the spot.',
  'help.guide.dawarich-wishes.step.3':
    'Confirm with the button at the bottom right, which reads Tick off 2 when two rows are ticked. Then close the dialog and open the Bucket List tab of the panel beside it.',
  'help.guide.dawarich-wishes.result':
    'Each wish carries a green tick with the date of the stay, not of today; its tooltip says Ticked off from your Dawarich recordings, and a click on the date undoes it.',
  'help.guide.dawarich-wishes.tip.1':
    'Driving past does not count: the rule needs both closeness and time, and of several stays that qualify the longest wins. A wish without coordinates cannot be checked, so add places through the search in Add place rather than by name alone.',
  'help.guide.dawarich-wishes.tip.2':
    'One check looks at up to 50 entries, the ones not ticked off yet first, and says so when there were more. A wish that was already ticked off keeps its own date.',
  // ── Screen: collections ────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Collections',
  'help.ctx.collections.summary':
    'Collections is your place library outside of any trip: named lists of places you found and want to keep, each place with a status of Idea, Want to go or Visited. Places are copied into and out of trips, never linked, so a list and a trip never change each other.',
  'help.ctx.collections.bullet.1':
    'Lists rail on the left: your own lists, the ones shared with you, invites waiting for a yes, All saved as the union of everything you own, and New list plus the file import at the top.',
  'help.ctx.collections.bullet.2':
    'Hero of the open list: its colour, cover, description and links, the members, and the Edit, Export and Share actions on the right.',
  'help.ctx.collections.bullet.3':
    'Filter row above the places: status, category, rating and sort, the label filter, the + to add a place, the trip import, and Select for bulk actions.',
  'help.ctx.collections.bullet.4':
    'Place rows: avatar, name and address, labels and category, and the status pill on the right that cycles with one click.',
  'help.ctx.collections.bullet.5':
    'Map on the right: a pin per place with coordinates, the list or map toggle, the search box and the label filter. Clicking a pin opens that place.',
  'help.ctx.collections.bullet.6':
    'Detail sheet: click a row for the cover, category, labels, status, description and links, with Edit, Copy to trip and Remove from list.',
  // create-list
  'help.guide.create-list.title': 'Create a list',
  'help.guide.create-list.goal': 'Start a new named list, with a colour and a cover, ready for places.',
  'help.guide.create-list.step.1': 'Click New list at the top of the lists rail.',
  'help.guide.create-list.step.2':
    'Give the list a name and pick a colour. Cover image, description and links are optional; you can add them later with Edit.',
  'help.guide.create-list.step.3': 'Click Create.',
  'help.guide.create-list.result':
    'The list opens empty, with Add a place and Import from a trip as the two ways to fill it.',
  'help.guide.create-list.tip.1':
    'The cover can be an upload of your own or a picture found through the Unsplash search in the same dialog.',
  // add-place
  'help.guide.add-place.title': 'Add a place',
  'help.guide.add-place.goal':
    'Find a place and save it to the open list with name, category, status and notes in one go.',
  'help.guide.add-place.step.1': 'Click the + in the filter row above the places.',
  'help.guide.add-place.step.2':
    'Type the place into the search field and pick a result. Name, address and coordinates fill in from it.',
  'help.guide.add-place.step.3':
    'Set the status and, if you like, a category, a description and links, then click Add. The dialog stays open for the next place; Cancel closes it.',
  'help.guide.add-place.result': 'The place appears in the list and, when it has coordinates, as a pin on the map.',
  'help.guide.add-place.tip.1':
    'From inside a trip, Save to collection in the place inspector or the place menu puts a trip place on a list without leaving the trip.',
  'help.guide.add-place.tip.2':
    'The list must be yours or one where you are an editor or admin; the + is not there on All saved or on a list you only view.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Import places from a trip',
  'help.guide.import-from-trip.goal':
    "Bring a whole trip's places onto a list at once instead of saving them one by one.",
  'help.guide.import-from-trip.step.1':
    'Click the import button with the cloud arrow in the filter row. On an empty list the same action sits next to Add a place.',
  'help.guide.import-from-trip.step.2': 'Pick one of your trips.',
  'help.guide.import-from-trip.step.3':
    'Tick the places you want. Places already on the list are greyed out; the ones no day of the trip holds start out selected. Only new hides what you already have.',
  'help.guide.import-from-trip.step.4': 'Click Import. The button always says how many are about to be added.',
  'help.guide.import-from-trip.result':
    'The places are copied onto the list with their name, address, coordinates, description and category. The trip stays as it was.',
  'help.guide.import-from-trip.tip.1':
    'Duplicates by name or coordinates are skipped automatically, so importing twice does no harm.',
  'help.guide.import-from-trip.tip.2':
    "Inside a trip's place list, select mode offers Save to collection for a hand-picked set of places instead.",
  // place-status
  'help.guide.place-status.title': "Set a place's status",
  'help.guide.place-status.goal': 'Keep track of what is an idea, what is on the shortlist and where you have been.',
  'help.guide.place-status.step.1': 'Click the status pill at the right end of a place row. Idea becomes Want to go.',
  'help.guide.place-status.step.2': 'Click it again for Visited, and once more to start over at Idea.',
  'help.guide.place-status.result':
    'The pill and its colour change at once; the status filter above the list counts along.',
  'help.guide.place-status.tip.1':
    'Status is a Collections thing: copying a place into a trip does not carry it along.',
  'help.guide.place-status.tip.2':
    'From a trip, Save to list shows a status pill per list the place is on, and the places panel has a mark visited action for a selection.',
  // place-detail
  'help.guide.place-detail.title': 'Open a saved place',
  'help.guide.place-detail.goal': 'See everything about a place and act on it: edit, copy to a trip, remove.',
  'help.guide.place-detail.step.1':
    'Click a place row. The detail sheet opens beside the list and the map pans to the place.',
  'help.guide.place-detail.step.2':
    'At the bottom sit Edit, Copy to trip and Remove from list; the camera on the cover swaps the automatic photo for one of your own.',
  'help.guide.place-detail.result':
    'Edit unlocks name, category, labels, address, coordinates, description and links right in the sheet.',
  'help.guide.place-detail.tip.1':
    'The cover is fetched automatically when the place has no picture of its own. Your own upload can be JPG, PNG, GIF or WebP up to 20 MB.',
  'help.guide.place-detail.tip.2':
    'Members of a shared list can also leave a star rating here, and the rating filter in the filter row uses the average.',
  // labels
  'help.guide.labels.title': 'Group places with labels',
  'help.guide.labels.goal': 'Give a list its own labels, such as districts or days, beyond the shared categories.',
  'help.guide.labels.step.1': 'Open the label manager from the label control in the filter row.',
  'help.guide.labels.step.2':
    'Type a name, pick a colour and click Add label. Rename, recolour or delete existing labels in the same dialog.',
  'help.guide.labels.step.3':
    'Turn on Select, tick the places and click Assign label in the selection bar. A single place also takes labels through Edit on its detail sheet.',
  'help.guide.labels.step.4':
    'Pick one or more labels in the filter row to narrow the list and the map to places carrying any of them.',
  'help.guide.labels.result':
    'Labelled places show their labels on the row; the label filter is there for every member, including viewers.',
  'help.guide.labels.tip.1':
    'Labels belong to the one list they were created in. Moving a place to another list drops them.',
  'help.guide.labels.tip.2': 'Managing and assigning labels needs edit rights on the list.',
  // filter-select
  'help.guide.filter-select.title': 'Filter and select places',
  'help.guide.filter-select.goal': 'Narrow the list down and act on many places at once.',
  'help.guide.filter-select.step.1':
    'Use the dropdowns in the filter row: status, category, minimum rating and sort order. Each one shows how many places it would leave.',
  'help.guide.filter-select.step.2': 'Click Select. Every row gets a checkbox and a selection bar appears.',
  'help.guide.filter-select.step.3':
    'Tick places or use Select all for everything currently filtered, then choose Assign label, Move to list, Duplicate to list, Copy to trip or Delete.',
  'help.guide.filter-select.result':
    'The actions apply to the whole selection at once. The × on the right leaves select mode.',
  'help.guide.filter-select.tip.1':
    'Select all follows the filter, so filtering to Want to go and selecting all is the quick way to act on the shortlist.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Copy places into a trip',
  'help.guide.copy-to-trip.goal': 'Turn saved places into stops on one of your trips.',
  'help.guide.copy-to-trip.step.1':
    'Turn on Select and tick the places, or open one place and use Copy to trip on its detail sheet.',
  'help.guide.copy-to-trip.step.2': 'Click Copy to trip in the selection bar.',
  'help.guide.copy-to-trip.step.3': 'Pick the trip. The search box narrows a long list.',
  'help.guide.copy-to-trip.result':
    "The places land in that trip's place list with name, description, category, notes, price, coordinates, photo and tags. Nothing changes in the collection.",
  'help.guide.copy-to-trip.tip.1':
    'Viewers of a shared list can do this too; it copies out of the list, it does not change it.',
  // share-list
  'help.guide.share-list.title': 'Share a list with someone',
  'help.guide.share-list.goal': 'Plan a list together with other people on this TREK, live.',
  'help.guide.share-list.step.1': 'Click Share in the hero of your list.',
  'help.guide.share-list.step.2': 'Select the user and a role: Viewer, Editor or Admin.',
  'help.guide.share-list.step.3':
    'Click Send invite. The person shows as pending until they accept the invite in their lists rail.',
  'help.guide.share-list.result':
    'Once accepted, the list appears under Shared for them and every change syncs live. Members and their roles stay editable in the same dialog.',
  'help.guide.share-list.tip.1':
    'Viewers can look, rate and copy places into their own trips. Editors add and edit places and labels. Admins can also delete.',
  'help.guide.share-list.tip.2':
    'Only the owner invites and removes people; a member can leave a shared list themselves.',
  // export-list
  'help.guide.export-list.title': 'Export a list as a file',
  'help.guide.export-list.goal': 'Hand a list to someone on another TREK, or take it into a map app.',
  'help.guide.export-list.step.1': 'Click Export in the hero of the list.',
  'help.guide.export-list.step.2':
    'Pick TREK list for another TREK, with labels and status, or GPX for OsmAnd, Organic Maps, a Garmin and other apps that read waypoints.',
  'help.guide.export-list.result': 'The file downloads. Any member of a shared list may export it.',
  'help.guide.export-list.tip.1':
    'A place without coordinates cannot be a GPX waypoint; it is left out and TREK tells you how many were.',
  'help.guide.export-list.tip.2':
    'Ratings, members and uploaded photos stay behind on purpose; they belong to this TREK, not to the list.',
  // import-file
  'help.guide.import-file.title': 'Import a list from a file',
  'help.guide.import-file.goal': 'Bring in a TREK list file or a GPX file, as a new list or into one you have.',
  'help.guide.import-file.step.1': 'Click the import button with the upload arrow next to New list in the lists rail.',
  'help.guide.import-file.step.2':
    'Choose the file. TREK shows what is in it before anything happens: the name, how many places and labels.',
  'help.guide.import-file.step.3':
    'Keep New list and change the name if you like, or pick Add to a list to put the places into a list you can edit, then click Import.',
  'help.guide.import-file.result':
    'You land on the list with the imported places. Adding to a list only ever adds; places already there keep their status, notes and labels.',
  'help.guide.import-file.tip.1':
    'From a GPX every named waypoint becomes a place; tracks are lines and are left out, and the preview says how many points that was.',
  'help.guide.import-file.tip.2':
    'A file that is neither a TREK list nor a GPX is refused with a reason; a single unreadable place is skipped, not the whole file.',
  // edit-list
  'help.guide.edit-list.title': 'Edit or delete a list',
  'help.guide.edit-list.goal': "Change a list's name, colour, cover, description or links, or remove the list.",
  'help.guide.edit-list.step.1': 'Click Edit in the hero of the list. Only the owner sees it.',
  'help.guide.edit-list.step.2':
    'Change what you like and click Save. Delete list at the bottom left removes the list with all of its places, after a confirmation.',
  'help.guide.edit-list.result': 'The hero takes the new colour, cover and description right away.',
  'help.guide.edit-list.tip.1': 'Deleting a list cannot be undone. Export it first if you want to keep a copy.',
  // all-saved
  'help.guide.all-saved.title': 'Search your whole library',
  'help.guide.all-saved.goal': 'Look across every list you own at once.',
  'help.guide.all-saved.step.1':
    'Click All saved in the lists rail. It unions the places of every list you own or co-own.',
  'help.guide.all-saved.step.2':
    'Use the search box and the filters as on any list; Select works here too for copying to a trip.',
  'help.guide.all-saved.result':
    'One view over all your saved places, without adding or importing, since it has no single list to put them on.',
  'help.guide.all-saved.tip.1': 'Labels are per list, so the label filter is not offered on All saved.',

  // ── Screen: journey ───────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Journey',
  'help.ctx.journey.summary':
    'Journey is your photo-first travel journal. Every journey is tied to one or more trips and grows day by day from entries with a story, photos, mood and weather. This screen lists your journeys; open one to write.',
  'help.ctx.journey.bullet.1':
    'The banner at the top shows the journey under way, or your latest one, with its entry, photo and place counts. Continue writing opens it on today.',
  'help.ctx.journey.bullet.2':
    'Below, one card per journey with its cover, subtitle, dates and counts. Click a card to open it.',
  'help.ctx.journey.bullet.3': 'The last card in the grid, Create a new Journey, starts one from your trips.',
  // create-journey
  'help.guide.create-journey.title': 'Create a journey',
  'help.guide.create-journey.goal':
    "Start a journal for a trip, with the trip's places already waiting as suggestions.",
  'help.guide.create-journey.step.1': 'Click Create a new Journey, the last card in the grid.',
  'help.guide.create-journey.step.2':
    'Give it a name and, if you like, a subtitle, then tick the trips it belongs to. The counter says how many places will come in.',
  'help.guide.create-journey.step.3': 'Click Create Journey.',
  'help.guide.create-journey.result':
    'The journal opens. Every place of the linked trips sits in the timeline as a suggestion, one per day it stands on, ready to be written into.',
  'help.guide.create-journey.tip.1': 'More trips can be linked later from Journey Settings.',
  'help.guide.create-journey.tip.2': 'A journey without trips works too; you then add entries by hand.',
  // open-journey
  'help.guide.open-journey.title': 'Open a journey',
  'help.guide.open-journey.goal': 'Get into a journal, and know where it opens.',
  'help.guide.open-journey.step.1':
    'Click a card. Each one shows the cover, the dates and how many entries, photos and places the journey holds.',
  'help.guide.open-journey.result':
    'A journey under way opens on today, or on the last entry before today when nothing is written yet; a finished one opens at the beginning.',
  'help.guide.open-journey.tip.1':
    'The cover is the first photo of the journey unless you set one in Journey Settings.',
  // continue-writing
  'help.guide.continue-writing.title': 'Continue the journey under way',
  'help.guide.continue-writing.goal': "Jump straight into today's page of the journey you are on.",
  'help.guide.continue-writing.step.1':
    'Click Continue writing in the banner at the top. It shows the journey under way, or the latest one when none is.',
  'help.guide.continue-writing.result':
    'The journal opens on today, or on the last entry before today when nothing is written yet.',
  'help.guide.continue-writing.tip.1':
    'The banner also offers a suggestion for a trip that has no journey yet; Dismiss hides that one.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Journal',
  'help.ctx.journey-detail.summary':
    'One open journey: the timeline on the left, day by day, and the map on the right with every entry and the places of the linked trips. Everything that adds to the journal sits at the top; the header holds the counts, Studio, the suggestions switch and Journey Settings.',
  'help.ctx.journey-detail.bullet.1':
    'Header: cover, title and subtitle, the day, place, entry and photo counts, and on the right Studio, the suggestions switch and Journey Settings.',
  'help.ctx.journey-detail.bullet.2': 'Toolbar: Timeline and Gallery tabs, Search this journey, and Add Entry.',
  'help.ctx.journey-detail.bullet.3':
    'Timeline: one section per day with a + to add an entry on that day; entry cards with photos, mood, weather and story; suggestions from the trips in a lighter style with Dismiss this suggestion.',
  'help.ctx.journey-detail.bullet.4':
    "Map: entries as pins, linked in date order by a dashed line, the trips' places, and any GPX tracks imported into those trips.",
  'help.ctx.journey-detail.bullet.5':
    'Journey Settings: cover, name and subtitle, tracks on the map, entry fields, dismissed suggestions, linked trips, contributors, public sharing, archive and delete.',
  'help.ctx.journey-detail.bullet.6':
    'Two round buttons float over a long timeline: back to the top, and jump to the last entry.',
  // add-entry
  'help.guide.add-entry.title': 'Write an entry',
  'help.guide.add-entry.goal': "Add a day's story with title, text, mood and weather.",
  'help.guide.add-entry.step.1': 'Click Add Entry in the toolbar, or the + on a day header to start on that day.',
  'help.guide.add-entry.step.2':
    'Give the moment a name and write the story. The toolbar above the text adds bold, italic, headings, quotes, links and lists in Markdown.',
  'help.guide.add-entry.step.3':
    'Pick a mood and the weather, check the date, and pin a location if you like: search a place or use your current position.',
  'help.guide.add-entry.step.4': 'Click Save.',
  'help.guide.add-entry.result':
    'The entry appears on its day in the timeline and as a pin on the map. Its counts update in the header.',
  'help.guide.add-entry.tip.1': 'Writing into a suggestion is the same editor, with the place already set.',
  'help.guide.add-entry.tip.2': 'Tags at the bottom are free text, hidden gem or best meal, and the search finds them.',
  // entry-photos
  'help.guide.entry-photos.title': 'Add photos and videos to an entry',
  'help.guide.entry-photos.goal': "Put pictures on a day; the first one becomes the entry's cover.",
  'help.guide.entry-photos.step.1': "Open an entry's menu with the ⋯ on its card and choose Edit.",
  'help.guide.entry-photos.step.2':
    "Click Upload photos and pick the files. From Gallery takes pictures already in the journey's gallery; External photos searches a connected Immich or Synology library for that day.",
  'help.guide.entry-photos.step.3': 'Hover a picture for Make 1st to choose the cover, then click Save.',
  'help.guide.entry-photos.result':
    'The photos show on the card and in the gallery; the first one is the thumbnail everywhere.',
  'help.guide.entry-photos.tip.1':
    'Videos go on an entry the same way: mp4, m4v, webm or mov up to 500 MB, stored as uploaded.',
  'help.guide.entry-photos.tip.2':
    'HEIC files from an iPhone are converted to JPEG on upload, which drops their GPS and camera metadata.',
  // suggestions
  'help.guide.suggestions.title': 'Use or dismiss the suggestions',
  'help.guide.suggestions.goal':
    'Turn the places of your trips into entries, and clear away the ones you will not write about.',
  'help.guide.suggestions.step.1':
    'A suggestion is a lighter card with the place name in italics. Click it to open the editor with the place and day already set.',
  'help.guide.suggestions.step.2':
    'Click Dismiss this suggestion on a card you will not use. It leaves the timeline without being deleted, and the trip sync will not offer it again.',
  'help.guide.suggestions.step.3':
    'Changed your mind? Journey Settings shows how many are dismissed, and Bring back dismissed suggestions returns them all.',
  'help.guide.suggestions.result':
    'The timeline holds only what you mean to write; the header switch hides all suggestions at once while you read.',
  'help.guide.suggestions.tip.1': 'A place kept across two days gives a suggestion on each of them.',
  'help.guide.suggestions.tip.2': 'Suggestions never count in the statistics; only written entries do.',
  // add-on-day
  'help.guide.add-on-day.title': 'Add an entry on an earlier day',
  'help.guide.add-on-day.goal': 'Write about a day that already passed without fixing the date afterwards.',
  'help.guide.add-on-day.step.1': 'Click the + in the header of that day.',
  'help.guide.add-on-day.step.2': 'The editor opens with that date set. Write and Save as usual.',
  'help.guide.add-on-day.result': 'The entry lands on the right day straight away.',
  'help.guide.add-on-day.tip.1': "Within a day, the arrows in an entry's menu move it earlier or later.",
  // pros-cons
  'help.guide.pros-cons.title': 'Add a verdict',
  'help.guide.pros-cons.goal': 'Sum up a day with what was great and what was not.',
  'help.guide.pros-cons.step.1':
    'In the editor, find Pros & Cons under the story. Type a point into Pros or Cons and use Add another for the next one.',
  'help.guide.pros-cons.step.2': 'Save. The verdict shows on the card as two short lists.',
  'help.guide.pros-cons.result': 'Thumbs up and thumbs down at a glance, under the story.',
  'help.guide.pros-cons.tip.1':
    'A journey that does not use verdicts can switch the section off under Entry fields in Journey Settings.',
  // search-journey
  'help.guide.search-journey.title': 'Find something in a long journal',
  'help.guide.search-journey.goal': 'Get to the entry you mean without scrolling through weeks.',
  'help.guide.search-journey.step.1':
    'Type into Search this journey in the toolbar. The timeline filters as you type, across titles, stories, places and tags. Accents and case do not matter.',
  'help.guide.search-journey.step.2':
    'The suggestions switch in the header hides the unwritten cards while you read. Once the timeline is long, two round buttons float above its bottom edge: back to the top, and jump to the last entry.',
  'help.guide.search-journey.result': 'Only matching entries stay; clear the box to see everything again.',
  'help.guide.search-journey.tip.1':
    'A journey under way opens on today, so the current page is usually already in view.',
  'help.guide.search-journey.tip.2': 'Tags count too: searching for hidden gem finds every entry tagged with it.',
  // gallery-map
  'help.guide.gallery-map.title': 'Browse the gallery and the map',
  'help.guide.gallery-map.goal': 'See the whole journey as pictures, and as places on the map.',
  'help.guide.gallery-map.step.1':
    'Switch to Gallery in the toolbar: every photo of every entry, plus pictures uploaded to the gallery directly. Click one for the lightbox.',
  'help.guide.gallery-map.step.2':
    'The map on the right shows the entries as pins in date order, the places of the linked trips, and any GPX track imported into those trips, in the colour it has in the planner.',
  'help.guide.gallery-map.result':
    'Hover a track for its name. The dashed line between entries is drawn by TREK; a track is the route you actually recorded.',
  'help.guide.gallery-map.tip.1': 'Tracks can be switched off for a journey under Journey Settings.',
  'help.guide.gallery-map.tip.2':
    'Gallery photos with a location show up on the public map too, when both Gallery and Map are shared.',
  // entry-fields
  'help.guide.entry-fields.title': 'Switch entry fields off',
  'help.guide.entry-fields.goal': 'Keep the editor to what this journey uses.',
  'help.guide.entry-fields.step.1': 'Open Journey Settings from the header.',
  'help.guide.entry-fields.step.2': 'Under Entry fields, switch Mood, Weather or Pros & cons off.',
  'help.guide.entry-fields.result':
    'The editor stops asking for them. Nothing written is lost: switching a field back on brings the stored values into view, and a shared journey hides the same fields.',
  'help.guide.entry-fields.tip.1': 'The switches are per journey, so a work trip and a holiday can differ.',
  // link-trip
  'help.guide.link-trip.title': 'Link another trip',
  'help.guide.link-trip.goal': "Bring a second trip's places into the journal as suggestions.",
  'help.guide.link-trip.step.1': 'Open Journey Settings from the header.',
  'help.guide.link-trip.step.2': 'Under the linked trips, click Add Trip.',
  'help.guide.link-trip.step.3': 'Pick the trip.',
  'help.guide.link-trip.result':
    'Its places arrive in the timeline as suggestions on their days, and its GPX tracks join the map.',
  'help.guide.link-trip.tip.1': 'The × next to a linked trip unlinks it again; entries you wrote stay.',
  'help.guide.link-trip.tip.2': 'Entries with a day count only once, however many trips cover that day.',
  // share-public
  'help.guide.share-public.title': 'Share the journey publicly',
  'help.guide.share-public.goal': 'Give people without a TREK account a read-only link.',
  'help.guide.share-public.step.1': 'Open Journey Settings and find Public Share.',
  'help.guide.share-public.step.2': 'Click Create share link.',
  'help.guide.share-public.step.3':
    'Choose what visitors see: Timeline, Gallery and Map are separate switches. Copy puts the link on your clipboard.',
  'help.guide.share-public.result':
    'Anyone with the link sees the enabled sections and nothing else; fields you switched off in Entry fields stay hidden there too.',
  'help.guide.share-public.tip.1':
    'Photos appear on the public map only when Gallery and Map are both on; with Map off their coordinates are stripped before they leave the server.',
  'help.guide.share-public.tip.2': 'Delete the link in the same place to end the sharing.',
  // contributors
  'help.guide.contributors.title': 'Write together',
  'help.guide.contributors.goal': 'Let a fellow traveller add their own entries and photos.',
  'help.guide.contributors.step.1': 'Open Journey Settings and scroll to the contributors.',
  'help.guide.contributors.step.2': 'Click Invite Contributor and search the user by name or email.',
  'help.guide.contributors.step.3': 'Pick a role and confirm.',
  'help.guide.contributors.result':
    'The journey appears in their list and their entries carry their name. Remove a contributor with the × next to them.',
  'help.guide.contributors.tip.1':
    'Contributors are for people on this TREK. For everyone else there is the public link.',
  // studio
  'help.guide.studio.title': 'Lay the journey out as a photo book',
  'help.guide.studio.goal': 'Turn the journal into printable pages.',
  'help.guide.studio.step.1': 'Click Studio in the header. The designer opens on top of the journey.',
  'help.guide.studio.step.2':
    "The journey's name at the left of the top bar is the way back; it drops you where you were.",
  'help.guide.studio.result':
    'Pages rail on the left, the spread on the workbench, properties on the right. Auto layout builds the book from your entries; Export makes a print-ready PDF.',
  'help.guide.studio.tip.1': 'Studio needs a window at least 1024 px wide and is not offered on a phone.',
  'help.guide.studio.tip.2':
    "The book inherits the journey's access: whoever may read the journey may open it, whoever may edit may save.",
  // archive-journey
  'help.guide.archive-journey.title': 'Archive or delete a journey',
  'help.guide.archive-journey.goal': 'Close a finished journey, or remove one for good.',
  'help.guide.archive-journey.step.1': 'Open Journey Settings.',
  'help.guide.archive-journey.step.2':
    'At the bottom, Archive Journey ends it and marks it archived; Restore Journey brings it back. Delete removes it with all entries and photos, after a confirmation.',
  'help.guide.archive-journey.result':
    'An archived journey stays readable and shareable; it just no longer opens on today.',
  'help.guide.archive-journey.tip.1':
    'Deleting cannot be undone, and it does not touch the trips the journey was linked to.',
  'help.guide.archive-journey.tip.2': 'The cover, name and subtitle live in the same dialog, at the top.',

  // ── Screen: journey-studio ─────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio lays a journey out as a printable photo book. It opens over the journal: the pages rail and the content on the left, the spread you are working on in the middle, its properties on the right. Auto layout builds a first draft from your entries; everything after that is yours to move, crop and restyle, with undo for every step.',
  'help.ctx.journey-studio.bullet.1':
    'Top bar: Back to the journey, Book view, undo and redo, Page format, Auto layout and Export. The Saved mark next to the title tells you when the book is stored.',
  'help.ctx.journey-studio.bullet.2':
    "Rail on the left with five sections: Pages, Content (the journey's photos and entries), Elements (text, shapes, lines, grids, frames, icons), Travel (maps, countries, flags and marks built from the journey) and Layouts.",
  'help.ctx.journey-studio.bullet.3':
    'Workbench: the current spread with its bleed and safe margins, the zoom bar underneath, Fit to view, and Download this spread on the right.',
  'help.ctx.journey-studio.bullet.4':
    'Properties on the right: position and size, crop and focal point, fill or fit, look, corners, frame, stacking order and lock of whatever is selected; page numbers and the document when nothing is.',
  'help.ctx.journey-studio.bullet.5':
    'The book has the shape of a bound one: cover, a single first page, the spreads, a single last page and the back cover. Page numbers count from the first page and print as shown.',
  'help.ctx.journey-studio.bullet.6':
    "Several people can design at once: everyone sees the others' pointers with their names, and a save on a version somebody else changed comes back as a conflict instead of overwriting their work.",
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Build the book automatically',
  'help.guide.studio-auto-layout.goal':
    "Get a complete first draft from the journal's entries and photos in one click.",
  'help.guide.studio-auto-layout.step.1': 'Click Auto layout in the top bar.',
  'help.guide.studio-auto-layout.step.2':
    'Pick The whole book: it replaces every page, keeping your title and page setup. This spread rebuilds only the one on screen, and is offered on a spread that came from an entry.',
  'help.guide.studio-auto-layout.step.3':
    'Look through the pages rail. Undo takes the whole layout back if you preferred what you had.',
  'help.guide.studio-auto-layout.result':
    'One spread per entry, in order, with its photos, title and story placed for you. Every element still follows its entry until you edit it.',
  'help.guide.studio-auto-layout.tip.1': 'Both entries are ordinary undo steps, so try them freely.',
  'help.guide.studio-auto-layout.tip.2':
    'An element auto layout tied to an entry keeps up with edits to that entry until you touch it in Properties; that breaks the link.',
  // studio-pages
  'help.guide.studio-pages.title': 'Add, move and remove spreads',
  'help.guide.studio-pages.goal': 'Shape the book page by page.',
  'help.guide.studio-pages.step.1':
    'Open Pages in the rail. The thumbnails are the book in order: cover, first page, spreads, last page, back cover.',
  'help.guide.studio-pages.step.2':
    'Add spread at the bottom puts a new one before the last page; the + between two thumbnails inserts one right there.',
  'help.guide.studio-pages.step.3':
    'Hover a thumbnail for its actions: Move earlier, Move later, Duplicate spread and Delete spread. Click a thumbnail to open that spread on the workbench.',
  'help.guide.studio-pages.result':
    'The cover, the first and last pages and the back cover stay where they are; new spreads always land between them.',
  'help.guide.studio-pages.tip.1': 'Book view in the top bar shows the whole book as sheets, the way it will be bound.',
  'help.guide.studio-pages.tip.2': 'Page numbers are switched on under Document in Properties, with nothing selected.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Apply a layout to a spread',
  'help.guide.studio-layouts.goal': 'Give a spread a ready-made arrangement of photo and text frames.',
  'help.guide.studio-layouts.step.1':
    'Open Layouts in the rail. Thirteen spread layouts, and a separate set for the cover, the back and the single pages.',
  'help.guide.studio-layouts.step.2':
    'Click one. The spread on the workbench takes its frames; photos and text you already had are poured into them.',
  'help.guide.studio-layouts.result':
    'Empty frames wait for content: drag a photo from Content onto one, or use Add to this page.',
  'help.guide.studio-layouts.tip.1': 'A layout is an undo step like any other.',
  // studio-content
  'help.guide.studio-content.title': 'Put photos and entries on a page',
  'help.guide.studio-content.goal': "Bring the journey's own material onto the spread.",
  'help.guide.studio-content.step.1':
    'Open Content in the rail. Photos lists every picture of the journey; Entries lists the entries with their text.',
  'help.guide.studio-content.step.2':
    'Drag a photo onto the spread, or onto an empty frame, or click Add to this page under it. Upload photos adds pictures that are not in the journey yet.',
  'help.guide.studio-content.step.3':
    "Under an entry, Title, Story and Place put that text on the page as a text element; Date and the coordinates come as marks, and the entry's photos are listed right there.",
  'help.guide.studio-content.result':
    'A dropped photo becomes a photo element; text keeps following the entry until you edit it.',
  'help.guide.studio-content.tip.1': 'The search box at the top of Content filters both lists.',
  'help.guide.studio-content.tip.2':
    'Dropping a file from your desktop onto the workbench uploads it and places it in one go.',
  // studio-elements
  'help.guide.studio-elements.title': 'Add text, shapes and icons',
  'help.guide.studio-elements.goal': 'Decorate a spread beyond photos and stories.',
  'help.guide.studio-elements.step.1': 'Open Elements in the rail.',
  'help.guide.studio-elements.step.2':
    'Click a text style for a headline or caption, a shape, a line, a grid, an empty frame with a frame style, or an icon from the searchable library. Each lands in the middle of the spread, ready to move.',
  'help.guide.studio-elements.result':
    'Double-click a text element to type into it; Properties holds font, weight, size, spacing and alignment.',
  'help.guide.studio-elements.tip.1': 'Frames are empty photo slots: drop a picture in later.',
  // studio-travel
  'help.guide.studio-travel.title': 'Add a map, flags and figures',
  'help.guide.studio-travel.goal': 'Turn the journey itself into figures on the page.',
  'help.guide.studio-travel.step.1': 'Open Travel in the rail.',
  'help.guide.studio-travel.step.2':
    "Pick what to add: a route map of the entries, country outlines, a country list or grid, flags, a date, day or distance mark, or a summary of the whole trip. Each is built from the journey's data and refreshes with it.",
  'help.guide.studio-travel.result':
    'The element appears on the spread; Properties adjusts its style, and the map its area.',
  'help.guide.studio-travel.tip.1':
    'Marks follow the entry the spread came from, so a date mark on an auto-laid spread already shows that day.',
  // studio-properties
  'help.guide.studio-properties.title': 'Edit what you selected',
  'help.guide.studio-properties.goal': 'Move, crop, style and stack an element with the inspector.',
  'help.guide.studio-properties.step.1':
    'Click an element on the spread. Handles appear for size and rotation; drag it to move it.',
  'help.guide.studio-properties.step.2':
    'Properties on the right follows the selection: position and size, Crop with the focal point that decides what stays in frame, Fill or Fit, Look filters, Corner radius, Frame style, stacking order and Lock.',
  'help.guide.studio-properties.step.3':
    'Duplicate and Delete sit at the top of the inspector; Undo in the top bar reverts any of it.',
  'help.guide.studio-properties.result':
    'A locked element cannot be grabbed on the page any more, which keeps a finished layout safe while you work around it.',
  'help.guide.studio-properties.tip.1': 'Shift-click selects several elements; the inspector then edits them together.',
  'help.guide.studio-properties.tip.2':
    'Editing an element that auto layout placed breaks its link to the entry; it stops following later changes to that entry.',
  // studio-format
  'help.guide.studio-format.title': 'Choose the page format',
  'help.guide.studio-format.goal': 'Set the size the book will be printed at, before the layout depends on it.',
  'help.guide.studio-format.step.1': 'Click Page format in the top bar.',
  'help.guide.studio-format.step.2':
    'Pick Square 21 × 21 cm, Square 30 × 30 cm, A4 or A5 landscape or portrait, or enter a custom width and height in millimetres. Bleed and safe margin sit underneath.',
  'help.guide.studio-format.result':
    'Every spread is drawn at that size, with 3 mm bleed and a 5 mm safe margin by default.',
  'help.guide.studio-format.tip.1':
    'Change the format first, then run Auto layout; the layout is built for the size it finds.',
  'help.guide.studio-format.tip.2': 'Ask your printer for their bleed and safe values and enter those.',
  // studio-export
  'help.guide.studio-export.title': 'Export the book as a PDF',
  'help.guide.studio-export.goal': 'Get a print-ready file, or one to read on screen.',
  'help.guide.studio-export.step.1': 'Click Export in the top bar.',
  'help.guide.studio-export.step.2':
    'Choose Single pages, one leaf per sheet in reading order, which is what a printer wants, or Spreads, two pages at a time the way the book opens. Crop marks add the bleed on every edge and mark where to cut.',
  'help.guide.studio-export.step.3':
    'Click Print view. Your browser opens the pages and Save as PDF turns them into the file.',
  'help.guide.studio-export.result': 'A PDF with as many sheets as the dialog announced, at the page format you set.',
  'help.guide.studio-export.tip.1': 'Making the PDF is desktop only, like Studio itself.',
  'help.guide.studio-export.tip.2':
    'For a proof, export Spreads without crop marks; for the print shop, Single pages with them.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Reuse a spread in another book',
  'help.guide.studio-spread-file.goal': "Carry a design you like from one journey's book to another.",
  'help.guide.studio-spread-file.step.1':
    'With the spread on the workbench, click Download this spread at the right end of the zoom bar. The file holds the design, not the photographs.',
  'help.guide.studio-spread-file.step.2':
    'In the other book, open Pages and click Import next to Add spread, then pick the file.',
  'help.guide.studio-spread-file.result':
    "The spread arrives with its frames and text styles; drop the new journey's photos into the frames.",
  'help.guide.studio-spread-file.tip.1': 'A file that is not a spread design is refused with a reason.',

  // ── Screen: settings (all tabs) ────────────────────────────────────────────
  'help.ctx.settings.title': 'Settings',
  'help.ctx.settings.summary':
    "Your personal settings, one tab per topic in the sidebar on the left. Most switches apply the moment you flip them; a form with a Save button at the bottom waits for it. Nothing here changes anyone else's TREK.",
  'help.ctx.settings.bullet.1':
    'Sidebar on the left: General, Appearance, Map, Notifications, Integrations, Offline and Account. Plugins appears once one is installed, About wherever the operator has not taken it away.',
  'help.ctx.settings.bullet.2':
    'General is language, units, currency and what the app opens with; Appearance is theme, colours, text size and the dashboard widgets.',
  'help.ctx.settings.bullet.3':
    'Map picks the renderer and its style; Notifications the channels that reach you; Integrations photo libraries, API keys and MCP; Offline what the app keeps on this device.',
  'help.ctx.settings.bullet.4':
    'Account holds your profile, password, two-factor authentication, passkeys and the deletion of your account.',
  'help.ctx.settings-display.title': 'General',
  'help.ctx.settings-display.summary':
    'Language, units and currency, how the map and bookings behave, and what TREK opens with. Every change here applies at once.',
  'help.ctx.settings-display.bullet.1':
    'Language & region: the interface language, the time format, the first day of the week, the display currency, and distance and temperature units.',
  'help.ctx.settings-display.bullet.2':
    'Travel & map: booking routes always on the map, the Explore places pill, route optimisation from your accommodation, blurred booking codes and labelled booking routes.',
  'help.ctx.settings-display.bullet.3':
    'Startup: whether TREK opens on the dashboard or on the active trip, and which tab of a trip comes up first.',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'How TREK looks on this account: light or dark, the accent colour, glass and motion, text size, and which widgets the dashboard shows. Everything applies live, on every device you sign in on.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme: Light, Dark or Auto, and the Color scheme with a Custom accent of your own.',
  'help.ctx.settings-appearance.bullet.2':
    'Readability: Transparency, Reduce motion, Density and Text size, with advanced sizes per tier.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboard widgets: one switch per widget, separately for Desktop and Mobile.',
  'help.ctx.settings-appearance.bullet.4': 'Reset to defaults at the bottom puts everything back.',
  'help.ctx.settings-map.title': 'Map',
  'help.ctx.settings-map.summary':
    'Which engine draws the maps and in what style. Leaflet is the classic raster map, MapLibre draws vector tiles without any token, Mapbox adds 3D buildings and terrain with your own token.',
  'help.ctx.settings-map.bullet.1': 'Map Provider: Leaflet, MapLibre or Mapbox, each with a line on what it needs.',
  'help.ctx.settings-map.bullet.2':
    'Map Style and Map Template: the look of the tiles, plus the token or key a provider asks for.',
  'help.ctx.settings-map.bullet.3':
    'High Quality Mode for antialiasing and the globe projection; Save Map writes the choice.',
  'help.ctx.settings-notifications.title': 'Notifications',
  'help.ctx.settings-notifications.summary':
    'Where TREK reaches you outside the app: push notifications on this device, an ntfy topic, a webhook, or a channel a plugin provides. Below the channels, one row per event decides what goes where.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: the topic, an optional server of your own and an optional access token, with Test to send one right away.',
  'help.ctx.settings-notifications.bullet.2': 'Webhook: one URL that receives every event as JSON, with Test.',
  'help.ctx.settings-notifications.bullet.3':
    'Push notifications on this device: Turn on for this device covers only the browser you are using, so repeat it on each phone or computer. Send test reaches all of them.',
  'help.ctx.settings-notifications.bullet.4':
    'The preference rows: per event, which channel is on. Plugin channels show Configure until they are set up.',
  'help.ctx.settings-integrations.title': 'Integrations',
  'help.ctx.settings-integrations.summary':
    'Everything that connects to TREK from outside: photo libraries for the journal, API keys for scripts, and the MCP endpoint with its tokens and OAuth clients for AI assistants.',
  'help.ctx.settings-integrations.bullet.1':
    'Photo providers: Immich and Synology Photos, each with its URL and key, Test connection and Save.',
  'help.ctx.settings-integrations.bullet.2':
    'API Keys: personal keys for scripts and other tools that call the TREK API in your name.',
  'help.ctx.settings-integrations.bullet.3':
    'MCP Configuration: the endpoint, a ready-made client configuration to copy, and the API tokens.',
  'help.ctx.settings-integrations.bullet.4':
    'OAuth 2.1 Clients: apps that log in through TREK, with redirect URIs, allowed scopes, machine clients and the active sessions.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'What TREK keeps on this device so a trip still opens without a connection, and what happens when a change made offline collides with one made elsewhere.',
  'help.ctx.settings-offline.bullet.1':
    'Offline mode: Force offline mode makes the app behave as if the network were gone, for testing or a metered connection.',
  'help.ctx.settings-offline.bullet.2':
    'Prepare for offline: Download for offline use fetches your trips and their map tiles now.',
  'help.ctx.settings-offline.bullet.3': 'What to store offline: map tiles on or off, and a switch per trip.',
  'help.ctx.settings-offline.bullet.4':
    'Sync conflicts and Offline cache: the strategy for collisions, the pending and failed counts, Re-sync now and Clear cache.',
  'help.ctx.settings-account.title': 'Account',
  'help.ctx.settings-account.summary':
    'Who you are on this TREK and how you sign in: profile and avatar, password, two-factor authentication, passkeys, and at the very bottom the deletion of the account.',
  'help.ctx.settings-account.bullet.1': 'Profile: username, email and avatar, saved with Save Profile.',
  'help.ctx.settings-account.bullet.2': 'Change Password: current password, new password twice, Update password.',
  'help.ctx.settings-account.bullet.3':
    'Two-factor authentication (2FA) with an authenticator app and backup codes; Passkeys for signing in without a password.',
  'help.ctx.settings-account.bullet.4':
    'Delete account at the bottom, behind a confirmation. The last admin cannot delete themselves.',
  // language-region
  'help.guide.language-region.title': 'Set language, units and currency',
  'help.guide.language-region.goal': 'Make TREK speak your language and count the way you do.',
  'help.guide.language-region.step.1':
    'Pick the interface language in Language & region. TREK switches at once, on every device you sign in on.',
  'help.guide.language-region.step.2':
    'Below it, choose the time format, the day every date picker starts its week on, the display currency, and the distance and temperature units.',
  'help.guide.language-region.result':
    "Dates, distances and money read the way you expect; a trip's own currency still shows next to converted amounts.",
  'help.guide.language-region.tip.1':
    'The display currency is for totals across trips; each trip keeps the currency you gave it.',
  'help.guide.language-region.tip.2': 'The language also sets the day and month names in Vacay and the journal.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Tune how the map and bookings behave',
  'help.guide.travel-map-prefs.goal': 'Decide what the trip map shows by default.',
  'help.guide.travel-map-prefs.step.1':
    'In Travel & map, Always show booking routes keeps flights and trains on the map even when their day is not open; Explore places on the map shows the pill for finding places; Optimize route from accommodation starts the route at where you sleep.',
  'help.guide.travel-map-prefs.step.2':
    'Blur Booking Codes hides confirmation numbers until you hover; Booking route labels writes the booking name along its route.',
  'help.guide.travel-map-prefs.result': 'The trip map follows these on every trip, until you flip them back.',
  'help.guide.travel-map-prefs.tip.1':
    'These are per account, not per trip. Members of a shared trip each see their own choices.',
  // startup
  'help.guide.startup.title': 'Choose what TREK opens with',
  'help.guide.startup.goal': 'Land where you work most, not on the dashboard every time.',
  'help.guide.startup.step.1': 'Under Startup, set Start page to Dashboard or Active trip.',
  'help.guide.startup.step.2': 'Start tab picks which tab of a trip comes up first when you open one.',
  'help.guide.startup.result': 'The next sign-in and the next tap on the logo go straight there.',
  'help.guide.startup.tip.1': 'Active trip means the trip under way today, or the next one when none is.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Set the theme and the accent colour',
  'help.guide.theme-scheme.goal': 'Make TREK light, dark or follow your device, in the colour you like.',
  'help.guide.theme-scheme.step.1': 'Under Theme, pick Light, Dark or Auto. Auto follows your device.',
  'help.guide.theme-scheme.step.2':
    'Choose a Color scheme: Default, High contrast, Indigo, Teal, Rose, Amber, Violet or Custom.',
  'help.guide.theme-scheme.step.3':
    'With Custom, pick an accent from the presets or enter your own. A contrast check next to it says whether text stays readable on it.',
  'help.guide.theme-scheme.result':
    'Buttons, links and highlights take the accent everywhere, on every device you sign in on.',
  'help.guide.theme-scheme.tip.1': 'The navbar has a quick light or dark switch too; it sets the same theme.',
  'help.guide.theme-scheme.tip.2': 'High contrast is the scheme to pick when the default reads too soft.',
  // readability
  'help.guide.readability.title': 'Adjust readability and text size',
  'help.guide.readability.goal': 'Less glass, less motion, more room or bigger type.',
  'help.guide.readability.step.1':
    'Under Readability, Transparency switches the glass panels to solid surfaces, Reduce motion minimises animations, and Density chooses Comfortable or Compact.',
  'help.guide.readability.step.2':
    'Text size scales Everything at once; Advanced text sizes lets titles, subtitles, body and captions differ.',
  'help.guide.readability.result': 'The whole app follows at once, including the map panels and the journal.',
  'help.guide.readability.tip.1': "Reduce motion also follows your system's setting when you leave it alone.",
  'help.guide.readability.tip.2':
    'Text size is applied through the typography tiers, so nothing is cut off; a size that no longer fits wraps.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Choose the dashboard widgets',
  'help.guide.dashboard-widgets.goal': 'Show only the widgets you use, separately on desktop and on the phone.',
  'help.guide.dashboard-widgets.step.1':
    'Under Dashboard widgets, switch each widget on or off for Desktop and for Mobile: the right sidebar as a whole, currency, collections, timezones, upcoming reservations, Atlas countries and the travel figures.',
  'help.guide.dashboard-widgets.step.2': 'Reset to defaults at the bottom returns the whole tab to how it shipped.',
  'help.guide.dashboard-widgets.result': 'The dashboard rearranges at once; with the right sidebar off it centres.',
  'help.guide.dashboard-widgets.tip.1': 'Widgets of an addon only appear while the admin has that addon on.',
  'help.guide.dashboard-widgets.tip.2':
    'The dashboard itself remembers your grid or list view and the sort order per device.',
  // map-provider
  'help.guide.map-provider.title': 'Pick the map engine and style',
  'help.guide.map-provider.goal': "Switch between the classic map, vector tiles and Mapbox's 3D map.",
  'help.guide.map-provider.step.1':
    'Under Map Provider, choose Leaflet for the classic 2D map with any raster tiles, MapLibre for OpenFreeMap vector tiles without a token, or Mapbox for vector tiles with 3D buildings and terrain.',
  'help.guide.map-provider.step.2':
    'Pick a Map Style or a Map Template for the look. Mapbox needs a Mapbox Access Token, some raster styles a CARTO API key; the link next to the field leads to where you get one.',
  'help.guide.map-provider.step.3': 'High Quality Mode adds antialiasing and the globe projection. Click Save Map.',
  'help.guide.map-provider.result':
    'Every map in TREK, trips, Atlas, Collections and the journal, is drawn by the engine you picked.',
  'help.guide.map-provider.tip.1': 'Without a token, Mapbox falls back to the default map rather than showing nothing.',
  'help.guide.map-provider.tip.2':
    'The map tiles you store offline come from the provider that is active when you download them.',
  // notification-channels
  'help.guide.notification-channels.title': 'Set up where notifications reach you',
  'help.guide.notification-channels.goal':
    'Get trip reminders and collaboration events on your phone or in another tool.',
  'help.guide.notification-channels.step.1':
    'Under Notifications, fill in an Ntfy Topic; add your own Ntfy Server URL and an Access Token if you run one. Test sends a message straight away.',
  'help.guide.notification-channels.step.2':
    'Or give a Webhook URL that receives every event as JSON, and Test it the same way.',
  'help.guide.notification-channels.step.3':
    "In the rows below, switch each event on or off per channel. A plugin channel says Configure until it is set up in the plugin's settings; Send test tries one.",
  'help.guide.notification-channels.result':
    'Events go out through the channels that are on. The bell in the navbar keeps showing them in the app regardless.',
  'help.guide.notification-channels.tip.1':
    'Per-trip preferences live on the trip itself, under its notification settings.',
  'help.guide.notification-channels.tip.2':
    'The admin can pre-fill a default ntfy server for everyone; you still choose your own topic.',
  // photo-providers
  'help.guide.photo-providers.title': 'Connect a photo library',
  'help.guide.photo-providers.goal': "Let the journal pull the day's photos from Immich or Synology Photos.",
  'help.guide.photo-providers.step.1':
    "Under Integrations, find the provider's section and enter its URL and API key. Immich also offers to mirror journey uploads back into the library.",
  'help.guide.photo-providers.step.2': 'Click Test connection, then Save.',
  'help.guide.photo-providers.result':
    "The entry editor's External photos tab searches the connected library for the entry's day, nearest to the entry's location first.",
  'help.guide.photo-providers.tip.1':
    'The connection is yours: other members of a journey connect their own libraries.',
  'help.guide.photo-providers.tip.2':
    'A provider without GPS data in its photos still works; the list is then in time order.',
  // api-keys
  'help.guide.api-keys.title': 'Create an API key',
  'help.guide.api-keys.goal': 'Let a script or another tool call the TREK API as you.',
  'help.guide.api-keys.step.1': 'Under API Keys, click Create key and give it a name that says where it will be used.',
  'help.guide.api-keys.step.2':
    'Copy the key from the dialog: it is shown once. Delete a key from the list when the tool no longer needs it.',
  'help.guide.api-keys.result':
    'Requests with that key act with your permissions; the list shows when each key was created and last used.',
  'help.guide.api-keys.tip.1': 'One key per tool makes revoking painless.',
  'help.guide.api-keys.tip.2': 'For an AI assistant use MCP with OAuth instead; API keys are for plain HTTP clients.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Connect an AI assistant over MCP',
  'help.guide.mcp-oauth.goal': 'Give Claude, an IDE or another MCP client access to your trips.',
  'help.guide.mcp-oauth.step.1':
    'Under MCP Configuration, copy the MCP Endpoint, or the whole Client Configuration for a client that takes a JSON snippet.',
  'help.guide.mcp-oauth.step.2':
    'Clients that log in through the browser use OAuth 2.1: New Client under OAuth 2.1 Clients, with its Redirect URIs, the Allowed Scopes and, for a server without a browser, Machine client.',
  'help.guide.mcp-oauth.step.3':
    'Rotate Secret and Delete Client sit on each client; Active OAuth Sessions lists what is signed in and lets you revoke it. API Tokens with Create New Token is the older way in.',
  'help.guide.mcp-oauth.result':
    'The client can read and change what its scopes allow, as you, and every action shows up under your name.',
  'help.guide.mcp-oauth.tip.1': 'Scopes are the safety net: give a client only the read scope until it needs more.',
  'help.guide.mcp-oauth.tip.2': 'The admin can switch MCP off for the whole instance; then this section is not there.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Take trips offline',
  'help.guide.offline-prepare.goal': 'Have your trips and their maps on this device before the connection drops.',
  'help.guide.offline-prepare.step.1':
    'Under What to store offline, keep Store map tiles offline on and switch on the trips you want on this device.',
  'help.guide.offline-prepare.step.2':
    'Click Download for offline use under Prepare for offline. It fetches the trips and the tiles around their places.',
  'help.guide.offline-prepare.step.3':
    'Force offline mode under Offline mode lets you check that everything is there before you leave.',
  'help.guide.offline-prepare.result':
    'The trips open without a connection; changes you make wait in a queue and go out on reconnect.',
  'help.guide.offline-prepare.tip.1':
    'Tiles take the most space: the Offline cache section shows what is stored, per trip.',
  'help.guide.offline-prepare.tip.2': 'Install TREK as an app from the browser for the smoothest offline start.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Decide what wins on a sync conflict',
  'help.guide.offline-conflicts.goal': 'Choose how TREK settles a change made offline against one made elsewhere.',
  'help.guide.offline-conflicts.step.1':
    'Under Sync conflicts, pick Ask me each time, Always keep my version or Always keep the server version.',
  'help.guide.offline-conflicts.step.2':
    'Offline cache shows trips, pending and failed changes and conflicts; Re-sync now pushes the queue, Clear cache empties the device.',
  'help.guide.offline-conflicts.result':
    'With Ask, a conflict shows both versions and lets you pick; with the other two it is settled silently.',
  'help.guide.offline-conflicts.tip.1':
    'Clear cache removes only the copy on this device; nothing on the server is touched.',
  // profile
  'help.guide.profile.title': 'Change your profile',
  'help.guide.profile.goal': 'Update your name, email and picture.',
  'help.guide.profile.step.1':
    'Under Account, edit Username and Email. The avatar takes an upload of your own; remove it to go back to the initials.',
  'help.guide.profile.step.2': 'Click Save Profile.',
  'help.guide.profile.result': 'Your name and picture update everywhere at once, including on trips you share.',
  'help.guide.profile.tip.1':
    'An account that signs in through OIDC shows that here; the email then comes from the provider.',
  // password
  'help.guide.password.title': 'Change your password',
  'help.guide.password.goal': 'Set a new password.',
  'help.guide.password.step.1': 'Under Change Password, enter your current password, then the new one twice.',
  'help.guide.password.step.2': 'Click Update password.',
  'help.guide.password.result': 'The new password works at the next sign-in; other sessions stay signed in.',
  'help.guide.password.tip.1': 'An account that signs in through OIDC has no TREK password to change.',
  // mfa
  'help.guide.mfa.title': 'Turn on two-factor authentication',
  'help.guide.mfa.goal': 'Protect the account with a code from an authenticator app.',
  'help.guide.mfa.step.1': 'Under Two-factor authentication (2FA), click Set up authenticator.',
  'help.guide.mfa.step.2':
    'Scan the QR code with your app, or enter the secret by hand, then type the six-digit code it shows and click Enable 2FA.',
  'help.guide.mfa.step.3':
    'Save the backup codes: copy, download or print them. Each works once, when you have no phone at hand.',
  'help.guide.mfa.result': 'Every sign-in asks for a code after the password.',
  'help.guide.mfa.tip.1': 'Disable 2FA needs your password and a current code.',
  'help.guide.mfa.tip.2': 'The admin can require 2FA for everyone; then it cannot be switched off here.',
  // passkeys
  'help.guide.passkeys.title': 'Sign in with a passkey',
  'help.guide.passkeys.goal': "Use your device's fingerprint, face or PIN instead of a password.",
  'help.guide.passkeys.step.1':
    'Under Passkeys, click Add a passkey and confirm with your device. Give it a name that says which device it is.',
  'help.guide.passkeys.step.2':
    'The list shows every passkey with its name and when it was last used; the delete button removes one.',
  'help.guide.passkeys.result': 'The sign-in page offers the passkey; the password stays as a fallback.',
  'help.guide.passkeys.tip.1': 'A passkey lives on the device or in its password manager, so add one per device.',
  'help.guide.passkeys.tip.2':
    'Passkeys need HTTPS; on a plain HTTP instance the section explains why they are unavailable.',
  // delete-account
  'help.guide.delete-account.title': 'Delete your account',
  'help.guide.delete-account.goal': 'Remove your account and the data that is only yours.',
  'help.guide.delete-account.step.1': 'At the very bottom of Account, click Delete account and confirm.',
  'help.guide.delete-account.result':
    'Your account, your own trips and your journeys are gone; trips you share with others stay with them.',
  'help.guide.delete-account.tip.1':
    'The last admin of an instance cannot delete themselves; make someone else admin first.',
  'help.guide.delete-account.tip.2': 'There is no undo. Export what you want to keep before you confirm.',

  // ── Screen: admin (all tabs) ───────────────────────────────────────────────
  'help.ctx.admin.title': 'Admin',
  'help.ctx.admin.summary':
    "The instance behind everyone's TREK: who may sign in and how, what is switched on, where files live, how the server reaches people, and how it is backed up. Only admins see this page; every tab is a screen of its own in the sidebar.",
  'help.ctx.admin.bullet.1':
    'The four cards at the top count users, trips, places and files; a banner above them announces a newer TREK release.',
  'help.ctx.admin.bullet.2':
    'Users and User Defaults: accounts, invite links, and the map settings a new account starts with.',
  'help.ctx.admin.bullet.3':
    'Personalization, Settings, Addons and Plugins: packing templates, categories and school holidays; sign-in methods and API keys; the feature modules; third-party plugins.',
  'help.ctx.admin.bullet.4':
    'Storage, Notifications, MCP Access and GitHub: where uploads go, the instance-wide channels, tokens and sessions of AI clients, and the release history.',
  'help.ctx.admin.bullet.5':
    'Backup and Audit: on-demand and scheduled backups, and the log of security-relevant events.',
  'help.ctx.admin-users.title': 'Users',
  'help.ctx.admin-users.summary':
    'Every account on this TREK, with role, email and last sign-in, and the invite links that let people register on a closed instance.',
  'help.ctx.admin-users.bullet.1':
    'The table: username, email, role, creation date, last login and the actions per row. You are marked as you.',
  'help.ctx.admin-users.bullet.2': 'Create User at the top adds an account by hand, with a password you hand over.',
  'help.ctx.admin-users.bullet.3':
    'Invite Links below: one-time registration links with a use limit, an expiry and, if you like, a trip the new user joins on arrival.',
  'help.ctx.admin-users.bullet.4':
    'Permission Settings at the bottom: per action, who may do it, Everyone, Trip members, Trip owner or Admin only.',
  'help.ctx.admin-defaults.title': 'User Defaults',
  'help.ctx.admin-defaults.summary':
    'The settings a new account starts with, so nobody has to find the map tab first: map provider, style, tokens and quality.',
  'help.ctx.admin-defaults.bullet.1':
    'Map provider, Mapbox style and token, CARTO key and Mapbox quality, exactly as a user would set them under Settings, Map.',
  'help.ctx.admin-defaults.bullet.2':
    "Reset to built-in default per field returns TREK's own choice; a user's own setting always wins over these.",
  'help.ctx.admin-config.title': 'Personalization',
  'help.ctx.admin-config.summary':
    'What every trip on the instance shares: packing templates, the category set for places and collections, and the school-holiday catalogue Vacay draws from.',
  'help.ctx.admin-config.bullet.1':
    "Packing Templates: named lists of categories and items that a trip's packing list can start from.",
  'help.ctx.admin-config.bullet.2':
    'Categories: name, icon and colour of the categories used across TREK, from the place inspector to Collections.',
  'help.ctx.admin-config.bullet.3':
    'School holidays: the catalogue of countries and regions, for places the built-in feeds do not cover.',
  'help.ctx.admin-settings.title': 'Settings',
  'help.ctx.admin-settings.summary':
    'How people get in and what the server may talk to: sign-in and registration methods, SSO, passkeys, two-factor policy, the API keys for maps, places and images, the search and transit providers, and the file types uploads may have.',
  'help.ctx.admin-settings.bullet.1':
    'Authentication Methods: Password Login, Password Registration, SSO Login, SSO Auto-Provisioning, and Require two-factor authentication (2FA).',
  'help.ctx.admin-settings.bullet.2':
    'Single Sign-On (OIDC) with issuer, client and display name; Passkey login with relying-party id and origins.',
  'help.ctx.admin-settings.bullet.3':
    'API Keys: Google Maps, Unsplash and Amap, each with Test; What the key may be used for narrows the Google key to the features you want to pay for.',
  'help.ctx.admin-settings.bullet.4':
    'Place search provider and Transit Provider pick who answers searches and routes; Allowed File Types limits uploads.',
  'help.ctx.admin-addons.title': 'Addons',
  'help.ctx.admin-addons.summary':
    'The feature modules of TREK, each with a switch: Packing, Budget, Documents, Vacay, Atlas, Collab, Journey, Collections, Road trip, MCP, AirTrail, Dawarich and the AI parsing. Off means the navigation entry, the routes and the API are gone for everyone.',
  'help.ctx.admin-addons.bullet.1':
    'One tile per addon with its switch and, where it has any, sub-rows for its options.',
  'help.ctx.admin-addons.bullet.2':
    'Photo providers and document providers appear here as tiles too, so Immich or Synology can be offered to users.',
  'help.ctx.admin-addons.bullet.3': 'Bag Tracking has its own switch below the tiles.',
  'help.ctx.admin-plugins.title': 'Plugins',
  'help.ctx.admin-plugins.summary':
    'Third-party plugins that run in their own process next to TREK, each with the permissions it asked for at install. Install from the catalogue, upload a package, or link a folder while developing one.',
  'help.ctx.admin-plugins.bullet.1':
    'The list: every installed plugin with version, status, signature and the permissions it holds; activate, deactivate, update or uninstall per row.',
  'help.ctx.admin-plugins.bullet.2':
    'Upload plugin takes a package file; Rescan picks up a plugin folder linked for development.',
  'help.ctx.admin-plugins.bullet.3':
    'Allowed hosts per plugin: the addresses a plugin may call, since egress is denied by default.',
  'help.ctx.admin-storage.title': 'Storage',
  'help.ctx.admin-storage.summary':
    'Where uploads live: the local disk, an S3 bucket, or a mirror that writes to both. Each upload category can go to a different backend, and Health says whether every backend answers.',
  'help.ctx.admin-storage.bullet.1':
    'Backends: name and type of each, with Test, Edit and Remove; one set by the environment is read-only here.',
  'help.ctx.admin-storage.bullet.2':
    'Categories: covers, documents, journey photos and the rest, each assigned to a backend; changing one offers to move the existing files.',
  'help.ctx.admin-storage.bullet.3':
    'Health: a check per backend, and the seed file that proves the configuration is what the server sees.',
  'help.ctx.admin-notifications.title': 'Notifications',
  'help.ctx.admin-notifications.summary':
    'The channels the instance offers its users, and the ones that reach you as the admin. Users pick their own topics and URLs under Settings; you decide what exists and configure email.',
  'help.ctx.admin-notifications.bullet.1':
    'In-App, Email (SMTP), Ntfy, Webhook and Web Push: one panel each, with a switch that offers the channel to users and the server-side configuration it needs.',
  'help.ctx.admin-notifications.bullet.2':
    'Trip Reminders: whether the server sends the reminder before a trip starts.',
  'help.ctx.admin-notifications.bullet.3':
    'Admin Ntfy and Admin Webhook: where admin events such as a failed backup or a new release go, with Test.',
  'help.ctx.admin-mcp-tokens.title': 'MCP Access',
  'help.ctx.admin-mcp-tokens.summary':
    'Every token and OAuth session that AI clients hold against this TREK, across all users, with the power to revoke any of them.',
  'help.ctx.admin-mcp-tokens.bullet.1': 'API Tokens: who created it, when it was last used, and Delete.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'OAuth Sessions: the client, the user and the scopes it was granted, and Revoke.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'What is new in TREK: the release history from GitHub, the version you run, and whether a newer one is out. Updating itself happens outside the app, on the host.',
  'help.ctx.admin-github.bullet.1':
    'Release History lists the releases with their notes; the newest carries Latest, and your version is marked.',
  'help.ctx.admin-github.bullet.2':
    'Update available appears in the header once a newer release exists, with how to update for Docker and other installs.',
  'help.ctx.admin-backup.title': 'Backup',
  'help.ctx.admin-backup.summary':
    'Full backups of the database and the uploads, made by hand or on a schedule, kept on the server and downloadable as one file. Restore puts one back.',
  'help.ctx.admin-backup.bullet.1':
    'Data Backup: Create Backup, and the list of existing ones with Download, Restore and delete.',
  'help.ctx.admin-backup.bullet.2': 'Upload Backup brings a file made on another instance or an earlier day.',
  'help.ctx.admin-backup.bullet.3': 'Auto-Backup: on or off, interval, hour and day, and how many to keep.',
  'help.ctx.admin-audit.title': 'Audit',
  'help.ctx.admin-audit.summary':
    'The log of security-relevant and administrative events: sign-ins and failures, MFA changes, user and setting changes, backups and restores. Read-only, newest first.',
  'help.ctx.admin-audit.bullet.1': 'One row per event with time, user, action, resource, IP and details.',
  'help.ctx.admin-audit.bullet.2': 'Refresh reloads; Load more walks further back.',
  // create-user
  'help.guide.create-user.title': 'Create a user',
  'help.guide.create-user.goal': 'Add an account by hand, without an invite.',
  'help.guide.create-user.step.1': 'Click Create User at the top of the Users tab.',
  'help.guide.create-user.step.2': 'Enter Username, Email and a Password, and pick the Role: User or Administrator.',
  'help.guide.create-user.step.3': 'Click Create User.',
  'help.guide.create-user.result':
    'The account appears in the table and can sign in at once; hand over the password on a channel you trust.',
  'help.guide.create-user.tip.1':
    'For a person who should choose their own password, an invite link is the better way in.',
  'help.guide.create-user.tip.2': 'Admins see this page and the audit log; everything else is the same for both roles.',
  // edit-user
  'help.guide.edit-user.title': "Change a user's role or password",
  'help.guide.edit-user.goal': 'Promote someone, demote them, or get them back in after a lost password.',
  'help.guide.edit-user.step.1': "Click the pencil in the user's row. Edit User opens with the account's details.",
  'help.guide.edit-user.step.2':
    'Change the Role, set a New Password, or click Reset passkeys when the person lost the device their passkeys were on, then Save.',
  'help.guide.edit-user.result': 'The change applies at the next request; a new password works from the next sign-in.',
  'help.guide.edit-user.tip.1': 'You cannot take the admin role from yourself while you are the last admin.',
  'help.guide.edit-user.tip.2':
    'Resetting passkeys keeps the password; the person adds new passkeys under Settings, Account.',
  // invite-links
  'help.guide.invite-links.title': 'Invite someone with a link',
  'help.guide.invite-links.goal': 'Let a person register on a closed instance, and land in a trip if you like.',
  'help.guide.invite-links.step.1': 'Under Invite Links, click Create Link.',
  'help.guide.invite-links.step.2':
    'Set Max. Uses and Expires after, optionally Add to trip (optional), and click Create & Copy.',
  'help.guide.invite-links.step.3':
    'Send the link. Each row shows how often it was used and who created it; Copy link copies it again, and used-up or expired links are marked.',
  'help.guide.invite-links.result':
    'Whoever opens the link registers with their own password and, with a trip chosen, joins it straight away.',
  'help.guide.invite-links.tip.1': 'Invite links work even while Password Registration is switched off under Settings.',
  'help.guide.invite-links.tip.2': 'A link with one use and a short expiry is the safest default for a single person.',
  // delete-user
  'help.guide.delete-user.title': 'Delete a user',
  'help.guide.delete-user.goal': 'Remove an account and everything only it owns.',
  'help.guide.delete-user.step.1': "Click the trash icon in the user's row and confirm Delete user.",
  'help.guide.delete-user.result':
    'The account, its own trips and its journeys are gone; trips shared with others stay with the remaining members.',
  'help.guide.delete-user.tip.1': 'There is no undo. Take a backup first if you are not sure.',
  'help.guide.delete-user.tip.2': 'The last admin cannot be deleted; make someone else admin first.',
  // permissions
  'help.guide.permissions.title': 'Decide who may do what',
  'help.guide.permissions.goal': 'Set, per action, which role is allowed to do it on this TREK.',
  'help.guide.permissions.step.1':
    'Under Permission Settings, find the action in its group, such as Delete trips under Trip Management, and pick the level: Everyone, Trip members, Trip owner or Admin only. A changed row is marked customized.',
  'help.guide.permissions.step.2': 'Click Save. Reset to defaults puts every row back to the built-in level.',
  'help.guide.permissions.result':
    'The rule applies to every trip at once; the buttons and menus of people below the level disappear.',
  'help.guide.permissions.tip.1': 'Trip owner means the person who created the trip; admins may always do everything.',
  'help.guide.permissions.tip.2':
    'Lower a level rather than deleting a member: a member who may not edit can still read and comment.',
  // default-map
  'help.guide.default-map.title': 'Set the map defaults for new users',
  'help.guide.default-map.goal': 'Give every new account a working map without a personal token.',
  'help.guide.default-map.step.1':
    'Under Map, pick the Map engine and, for Mapbox or MapLibre, the Map style, the Shared Mapbox token and High-quality mode; for a raster map the Map Template and the Shared CARTO key.',
  'help.guide.default-map.step.2':
    "Next to any field you changed, reset returns TREK's own choice. Default User Settings on the left does the same for Color Mode, units and the currency.",
  'help.guide.default-map.result':
    'New accounts start with these; anyone who set their own map under Settings keeps theirs.',
  'help.guide.default-map.tip.1':
    'A token entered here is shared by everyone who has none of their own, so mind its quota.',
  'help.guide.default-map.tip.2': 'Existing accounts that never touched the map tab follow these defaults too.',
  // packing-templates
  'help.guide.packing-templates.title': 'Build a packing template',
  'help.guide.packing-templates.goal': 'Give trips a packing list to start from instead of an empty one.',
  'help.guide.packing-templates.step.1': 'Click New Template, type a name and confirm with the tick.',
  'help.guide.packing-templates.step.2':
    'Open the template and click Add category; under each category, the + adds items, and an item needs only a name.',
  'help.guide.packing-templates.step.3':
    'Everything saves as you go. The pencil renames a template, a category or an item, the bin deletes it.',
  'help.guide.packing-templates.result':
    "The template is offered on every trip's packing list; applying it copies the items, so a trip can change them freely.",
  'help.guide.packing-templates.tip.1': 'A template per kind of trip, beach, city, hiking, beats one giant list.',
  'help.guide.packing-templates.tip.2': 'Deleting a template does not touch trips that already applied it.',
  // categories
  'help.guide.categories.title': 'Manage the category set',
  'help.guide.categories.goal': 'Decide which categories places and collections can carry, and how they look.',
  'help.guide.categories.step.1':
    'Click New Category, give it a name, pick an icon and a colour; the Preview shows the result. Click Create.',
  'help.guide.categories.step.2': 'Hover a category in the list to edit or delete it. Deleting asks for confirmation.',
  'help.guide.categories.result':
    'The set applies everywhere at once: the place inspector, the map pins, Collections and the filters.',
  'help.guide.categories.tip.1': 'Places keep their category id, so renaming a category renames it on every place.',
  'help.guide.categories.tip.2': 'A deleted category leaves its places without one; reassign first if that matters.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Maintain school holidays by hand',
  'help.guide.school-holiday-catalog.goal': 'Cover a country or region the built-in holiday feeds do not.',
  'help.guide.school-holiday-catalog.step.1':
    'Under School holidays, click Add country, enter the Country and its Country code (e.g. US), and Save; then Add region for each part of it that differs.',
  'help.guide.school-holiday-catalog.step.2':
    'Click a region to open Region or school district: Add holiday period, give each one a Holiday name, Start date and End date, and Save. The bin removes a period, a region or, once it has no regions left, a country.',
  'help.guide.school-holiday-catalog.result':
    'Users find the country and region under Settings in Vacay and see the periods on their year grid.',
  'help.guide.school-holiday-catalog.tip.1':
    'Regions from the built-in feeds cannot be edited here; add a manual region alongside if a date is wrong.',
  // auth-methods
  'help.guide.auth-methods.title': 'Decide how people sign in',
  'help.guide.auth-methods.goal': 'Open or close password sign-in, SSO and registration, and require 2FA.',
  'help.guide.auth-methods.step.1':
    'Under Authentication Methods, switch Password Login and Password Registration on or off. Registration off means new accounts only through invite links, SSO or by hand.',
  'help.guide.auth-methods.step.2':
    'SSO Login and SSO Auto-Provisioning need Single Sign-On (OIDC) configured below; auto-provisioning creates an account the first time someone signs in through SSO.',
  'help.guide.auth-methods.step.3':
    'Require two-factor authentication (2FA) makes every password sign-in set up an authenticator on the next login. Passkey login needs the relying-party id and the origins your TREK is reached at.',
  'help.guide.auth-methods.result': 'The sign-in page offers exactly the methods you left on.',
  'help.guide.auth-methods.tip.1':
    'A warning appears before you lock yourself out: at least one way in for admins stays on.',
  'help.guide.auth-methods.tip.2': 'Values set through environment variables show as read-only here.',
  // oidc
  'help.guide.oidc.title': 'Connect single sign-on',
  'help.guide.oidc.goal': 'Let people sign in with your identity provider.',
  'help.guide.oidc.step.1':
    'Under Single Sign-On (OIDC), enter the Display Name for the button and the Issuer URL, Client ID and Client Secret from your provider, then Save.',
  'help.guide.oidc.step.2': 'Switch SSO Login on under Authentication Methods.',
  'help.guide.oidc.result':
    'The sign-in page shows the SSO button; with SSO Auto-Provisioning on, first-time users get an account automatically.',
  'help.guide.oidc.tip.1':
    "The redirect URI your provider needs is your TREK's address plus the OIDC callback path from the docs.",
  'help.guide.oidc.tip.2': 'Claim mapping decides which SSO groups become admins; see the OIDC page in the docs.',
  // instance-keys
  'help.guide.instance-keys.title': 'Enter the API keys',
  'help.guide.instance-keys.goal': 'Unlock Google place search, Unsplash covers and Amap for the whole instance.',
  'help.guide.instance-keys.step.1':
    'Under API Keys, paste the Google Maps API Key and click Test; the field says whether the key answers.',
  'help.guide.instance-keys.step.2':
    'Under What the key may be used for, switch on only the features you want billed to that key: autocomplete, details, photos, enrichment, the place shadow.',
  'help.guide.instance-keys.step.3':
    'Unsplash API Key powers cover search; Amap (高德地图) API Key place search in China. Test each the same way.',
  'help.guide.instance-keys.result':
    'Users get the features without keys of their own; without a Google key TREK searches through the free OpenStreetMap stack and the TREK Places API.',
  'help.guide.instance-keys.tip.1': "A user's personal key under Settings wins over the instance key for that user.",
  'help.guide.instance-keys.tip.2': 'Keys can also come from environment variables; those show as read-only here.',
  // places-transit
  'help.guide.places-transit.title': 'Pick the search and transit providers',
  'help.guide.places-transit.goal': 'Decide who answers place searches and public-transport routes.',
  'help.guide.places-transit.step.1':
    'Under Place search provider, choose Automatic, Google Places, Amap (高德地图) or OpenStreetMap. Automatic uses the best key that exists.',
  'help.guide.places-transit.step.2':
    'Under Transit Provider, choose Transitous (free), worldwide and without a key, or Google, which needs the Google key.',
  'help.guide.places-transit.result': 'Every search box and every transit route in TREK follows the choice.',
  'help.guide.places-transit.tip.1': 'A provider without its key shows a warning here and falls back to OpenStreetMap.',
  'help.guide.places-transit.tip.2': 'Google transit routes are billed per request; Transitous is not.',
  // file-types
  'help.guide.file-types.title': 'Limit the file types',
  'help.guide.file-types.goal': 'Decide which file extensions uploads may have.',
  'help.guide.file-types.step.1': 'Under Allowed File Types, edit the comma-separated list of extensions and save.',
  'help.guide.file-types.result':
    'Uploads of any other type are refused with a clear message, in the documents, the journal and the covers.',
  'help.guide.file-types.tip.1': 'Keep image types in the list; covers and journey photos go through the same check.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Switch an addon on or off',
  'help.guide.toggle-addon.goal': 'Offer a feature module to everyone, or take it away.',
  'help.guide.toggle-addon.step.1':
    "Flip the switch on the addon's tile. The navigation entry appears or disappears for everyone at once.",
  'help.guide.toggle-addon.step.2':
    'Some tiles carry sub-rows for their options, such as Bag Tracking under Lists or the photo providers under Journey; they show only while the addon is on.',
  'help.guide.toggle-addon.result': 'Data of an addon switched off is kept; switching it back on shows it again.',
  'help.guide.toggle-addon.tip.1': 'MCP off removes the endpoint and the Integrations sections that depend on it.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas and Journey are the addons users ask for most; Documents needs storage for uploads.',
  // document-providers
  'help.guide.document-providers.title': 'Offer a document store',
  'help.guide.document-providers.goal': 'Decide which stores a trip may keep its documents in step with.',
  'help.guide.document-providers.step.1':
    'The Documents tile carries the stores as rows on its shelf: Paperless-ngx, Papra, Nextcloud, OpenCloud and Synology Drive. All five start switched off, and the shelf is only there while Documents itself is on.',
  'help.guide.document-providers.step.2':
    'Flip the switch on the Nextcloud row. The message reads Addon updated, and from now on trip owners find Document sync in the Files tab of their trips, with Nextcloud under Connect a provider.',
  'help.guide.document-providers.result':
    'The store is on offer on every trip of this TREK; nothing is connected until a trip owner does it.',
  'help.guide.document-providers.tip.1':
    'Only whether a store may be offered is decided here. The address and the credentials belong to a trip and are entered in its Files tab by the trip’s owner, never in the admin panel.',
  'help.guide.document-providers.tip.2':
    'Switching Documents off switches every store off with it, and a store cannot be switched on while Documents is off: the server answers Enable the Documents addon first. A store on your own network also needs ALLOW_INTERNAL_NETWORK=true on the server.',
  // install-plugin
  'help.guide.install-plugin.title': 'Install a plugin',
  'help.guide.install-plugin.goal': 'Add a third-party plugin and give it exactly the permissions it asks for.',
  'help.guide.install-plugin.step.1':
    'Open Discover, pick a plugin and click Install; or click Upload plugin and choose a .zip or .tar.gz package.',
  'help.guide.install-plugin.step.2':
    'Back under Installed, read the row: what the plugin may read or write, the hosts it calls and whether it is signed. Switch Enable plugin on.',
  'help.guide.install-plugin.step.3':
    "The row's menu offers Restart, View error log, Allowed hosts and Change version…; Delete uninstalls it. An update is offered on the row when a newer version exists, and one that asks for new rights stays off until you approve them.",
  'help.guide.install-plugin.result':
    'The plugin runs in its own process; what it adds, widgets, map layers, tools, appears where the plugin declares it.',
  'help.guide.install-plugin.tip.1': 'Rescan picks up a plugin folder linked for development without a package.',
  'help.guide.install-plugin.tip.2': 'An unsigned plugin is marked as such; install it only when you trust its source.',
  // storage-backends
  'help.guide.storage-backends.title': 'Move uploads to S3 or a mirror',
  'help.guide.storage-backends.goal': 'Keep files on object storage, or on both disk and bucket.',
  'help.guide.storage-backends.step.1':
    'Under Backends, click Add backend, give it a Name, pick the Type, Local, S3 or Mirror, fill in the fields and Apply. Test checks the connection, Save changes writes it.',
  'help.guide.storage-backends.step.2':
    'Under Categories, assign each upload category to a backend. Changing one asks whether to Move existing objects or Just route new writes.',
  'help.guide.storage-backends.step.3': 'Health at the top checks every backend; a red entry names what failed.',
  'help.guide.storage-backends.result': 'New uploads go to the assigned backend; moved files are served from there.',
  'help.guide.storage-backends.tip.1':
    'A backend configured through environment variables is shown but cannot be edited here.',
  'help.guide.storage-backends.tip.2':
    'A mirror writes to both targets and reads from the first; use it to migrate without downtime.',
  // channels-instance
  'help.guide.channels-instance.title': 'Configure the notification channels',
  'help.guide.channels-instance.goal': 'Decide which channels users may pick, and set up email.',
  'help.guide.channels-instance.step.1':
    'Under Email (SMTP), enter SMTP Host, SMTP Port, SMTP User, SMTP Password and the From Address; Send test email sends a mail to you.',
  'help.guide.channels-instance.step.2':
    'Switch Web Push, Ntfy and Webhook on to offer them; users then turn push on per device, or enter their own topic or URL, under Settings, Notifications.',
  'help.guide.channels-instance.step.3':
    'Trip Reminders switches the reminder before a trip starts; In-App is always on and only explained here.',
  'help.guide.channels-instance.result': 'The Notifications tab of every user shows the channels you switched on.',
  'help.guide.channels-instance.tip.1':
    'A default ntfy server entered here is pre-filled for users; they can still name their own.',
  'help.guide.channels-instance.tip.2':
    'Plugin channels appear on their own once a plugin with that capability is active.',
  // admin-channels
  'help.guide.admin-channels.title': 'Get admin events on your phone',
  'help.guide.admin-channels.goal': 'Hear about failed backups, new releases and other instance events.',
  'help.guide.admin-channels.step.1':
    'Under Admin Ntfy, enter a topic and, if needed, server and token; under Admin Webhook a URL.',
  'help.guide.admin-channels.step.2': 'Click Send test ntfy or Send test webhook to see a message arrive.',
  'help.guide.admin-channels.result': 'Admin events go there in addition to the in-app bell of every admin.',
  'help.guide.admin-channels.tip.1':
    'Keep the admin topic separate from your personal one, so an outage does not drown in trip chatter.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Revoke AI access',
  'help.guide.mcp-tokens-admin.goal': 'See and cut every token and session an AI client holds, for any user.',
  'help.guide.mcp-tokens-admin.step.1':
    'Under API Tokens, find the token by user and name; the bin deletes it and the client stops at once.',
  'help.guide.mcp-tokens-admin.step.2':
    'Under OAuth Sessions, the same for browser-based clients: client, user and date, and the bin revokes the session.',
  'help.guide.mcp-tokens-admin.result': 'The client has to be connected again by its user; nothing else changes.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Scopes tell you what a client could do; a read-only scope is harmless to leave.',
  'help.guide.mcp-tokens-admin.tip.2': 'Switching the MCP addon off revokes everything at once.',
  // release-history
  'help.guide.release-history.title': 'Check for a new release',
  'help.guide.release-history.goal': 'Know whether your TREK is current and what the next version brings.',
  'help.guide.release-history.step.1':
    'When a newer release exists, Update available shows at the top of the admin page; View on GitHub opens it, and How to Update explains the update for Docker and for other installs.',
  'help.guide.release-history.step.2':
    'Release History lists every release with its notes; Show details expands them, the newest carries Latest, and Load more walks further back.',
  'help.guide.release-history.result':
    'Updating happens on the host, by pulling the new image or building the new tag; the data directory stays.',
  'help.guide.release-history.tip.1': 'Take a backup before an update; the Backup tab is next door.',
  'help.guide.release-history.tip.2': 'Pre-releases are shown but not announced as updates unless you run one.',
  // create-backup
  'help.guide.create-backup.title': 'Make and restore a backup',
  'help.guide.create-backup.goal': 'Snapshot the whole instance, keep a copy elsewhere, and be able to put it back.',
  'help.guide.create-backup.step.1':
    'Under Data Backup, click Create Backup. It packs the database and the uploads into one file on the server.',
  'help.guide.create-backup.step.2': 'Download keeps a copy off the machine; the bin deletes old ones to free space.',
  'help.guide.create-backup.step.3':
    'Restore on a backup, or Upload Backup with a file, replaces the current data after Restore Backup? asks once.',
  'help.guide.create-backup.result':
    'A restore brings back users, trips, files and settings as of that backup; everyone is signed out.',
  'help.guide.create-backup.tip.1':
    'Restoring is the one action here that cannot be undone. Make a fresh backup first.',
  'help.guide.create-backup.tip.2':
    'Backups live in the data directory; a copy on another machine is what makes them a backup.',
  // auto-backup
  'help.guide.auto-backup.title': 'Schedule backups',
  'help.guide.auto-backup.goal': 'Let the server back itself up and keep only the last few.',
  'help.guide.auto-backup.step.1':
    'Under Auto-Backup, switch Enable auto-backup on and pick the Interval, Run at hour and, for weekly or monthly, the Day of week or Day of month.',
  'help.guide.auto-backup.step.2':
    'Delete old backups after sets how long a backup is kept; older ones go when a new one is made.',
  'help.guide.auto-backup.result': 'Backups appear in the list on schedule; a failure reaches the admin channels.',
  'help.guide.auto-backup.tip.1': "Times follow the server's timezone, shown in the Audit tab.",
  'help.guide.auto-backup.tip.2': 'Storage on the server is finite; keeping three to five is usually enough.',
  // audit-log
  'help.guide.audit-log.title': 'Read the audit log',
  'help.guide.audit-log.goal': 'Find out who did what, and when.',
  'help.guide.audit-log.step.1':
    'Read the rows: time, user, action, resource, IP and details, newest first. Actions are named by what happened, such as a login failure, an MFA change or a restore.',
  'help.guide.audit-log.step.2': 'Refresh reloads the top; Load more walks further back.',
  'help.guide.audit-log.result': 'A trail you can hand to whoever asks why something changed.',
  'help.guide.audit-log.tip.1': "Times are shown in the server's timezone, named above the table.",
  'help.guide.audit-log.tip.2': 'The log is append-only; nothing here can be edited or deleted from the app.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Trip',
  'help.ctx.trip.summary':
    'One trip, all of it: the plan with its days, map and places, and the tabs for transports, bookings, lists, costs, files and collaboration. Each of those is its own help screen below this one.',
  'help.ctx.trip.bullet.1':
    'The tab bar: Plan, Transports, Bookings, Lists, Costs, Files and Collab. Addons and plugins decide which tabs exist on your TREK.',
  'help.ctx.trip.bullet.2':
    'Plan is three columns: the days on the left, the map in the middle, the places on the right. Bookings and transports live inside the plan, at the stop and between stops; the tabs list them.',
  'help.ctx.trip.bullet.3':
    'Share at the top right opens the people of the trip: members, guests, the invite link and the read-only public link.',
  'help.ctx.trip.bullet.4':
    'The title, dates, cover and currency are edited from My Trips, with the pencil on the trip card.',
  'help.ctx.trip.bullet.5':
    'The chevrons at the inner edge of a column fold it away and the map takes the room; the thin divider next to a column changes its width.',
  'help.ctx.trip.bullet.6': 'The undo arrow in the toolbar of the days takes back the last change to the plan.',
  // add-member
  'help.guide.add-member.title': 'Add a member',
  'help.guide.add-member.goal': 'Give someone with a TREK account access to this trip.',
  'help.guide.add-member.step.1': 'Click Share at the top right.',
  'help.guide.add-member.step.2': 'Under Invite User, pick the person from the list and click Invite.',
  'help.guide.add-member.step.3':
    'The person now appears under Access. The crown marks the owner; the icon at the end of a row removes access again.',
  'help.guide.add-member.result':
    'The member sees and edits the trip like you, within the levels the admin set under Permission Settings.',
  'help.guide.add-member.tip.1':
    'Someone missing from the list has no TREK account yet: add them as a guest, or let them register through an invite link.',
  'help.guide.add-member.tip.2':
    'The number next to Access counts the people in the trip; guests are listed separately below.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Invite by link',
  'help.guide.trip-invite-link.goal': 'Let people join the trip themselves.',
  'help.guide.trip-invite-link.step.1': 'Click Share, then under Trip invite link click Create invite link.',
  'help.guide.trip-invite-link.step.2':
    'Click Copy and send the link. Anyone with a TREK account who opens it joins as a member.',
  'help.guide.trip-invite-link.step.3':
    'Regenerate replaces the link and makes the old one useless; Disable switches it off.',
  'help.guide.trip-invite-link.result': 'Whoever opens the link is in the trip and shows up under Access.',
  'help.guide.trip-invite-link.tip.1':
    'Someone without an account cannot use it. An admin hands out registration links under Admin, Users, and can tie one to this trip.',
  'help.guide.trip-invite-link.tip.2':
    'Regenerate when a link went to the wrong chat: the old one stops working at once.',
  // add-guest
  'help.guide.add-guest.title': 'Add a guest without an account',
  'help.guide.add-guest.goal': 'Count someone in who does not use TREK.',
  'help.guide.add-guest.step.1': 'Click Share and scroll to Guests.',
  'help.guide.add-guest.step.2': 'Type the name into Guest name and click Add guest.',
  'help.guide.add-guest.result': 'The guest can be assigned to costs, packing items and tasks, but cannot sign in.',
  'help.guide.add-guest.tip.1':
    'The pencil renames a guest; the icon at the end of the row removes them together with their shares and assignments.',
  'help.guide.add-guest.tip.2': 'If the person gets an account later, invite them as a member and remove the guest.',
  // public-link
  'help.guide.public-link.title': 'Publish a read-only link',
  'help.guide.public-link.goal': 'Show the trip to people who should not edit it.',
  'help.guide.public-link.step.1':
    'Click Share; on the right, under Public Link, tick what the link may show. Map & Plan is always on; Bookings, Packing, Costs and Chat are your choice.',
  'help.guide.public-link.step.2': 'Click Create link, then Copy.',
  'help.guide.public-link.step.3': 'The ticks can be changed while the link exists; Delete link stops it.',
  'help.guide.public-link.result':
    'Anyone with the link sees the chosen parts without logging in and cannot change anything.',
  'help.guide.public-link.tip.1':
    'The link is listed nowhere; whoever has it can open it, so treat it like a password.',
  'help.guide.public-link.tip.2': 'For editing rights, add the person as a member instead.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Hand the trip over or leave it',
  'help.guide.transfer-ownership.goal': 'Make someone else the owner, or step out of a trip that is not yours.',
  'help.guide.transfer-ownership.step.1':
    'Click Share. Under Access, the crown on a member’s row makes that person the owner; confirm the question.',
  'help.guide.transfer-ownership.step.2':
    'Leave trip on your own row takes you out of the trip; as the owner, hand over first.',
  'help.guide.transfer-ownership.result':
    'The new owner manages members and can delete the trip; you stay a regular member.',
  'help.guide.transfer-ownership.tip.1':
    'The owner is whoever created the trip until it is handed over; deleting the trip is theirs alone.',
  'help.guide.transfer-ownership.tip.2':
    'Remove access on another row is the same button the other way round: the owner takes a member out.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Make room for the map',
  'help.guide.collapse-columns.goal': 'Fold a column away or give it more width.',
  'help.guide.collapse-columns.step.1':
    'Click the chevron at the inner edge of the days column to collapse it; the map takes the space. The places column has the same chevron.',
  'help.guide.collapse-columns.step.2': 'Click the chevron again to bring the column back.',
  'help.guide.collapse-columns.step.3':
    'Drag the thin divider between a column and the map to change the column’s width.',
  'help.guide.collapse-columns.result': 'The widths are remembered; the columns come back open on the next visit.',
  'help.guide.collapse-columns.tip.1': 'Both columns can be folded at once for a map-only view.',
  'help.guide.collapse-columns.tip.2':
    'On a phone there are no columns: Plan and Places are the two buttons at the bottom of the map.',
  // undo-change
  'help.guide.undo-change.title': 'Undo the last change',
  'help.guide.undo-change.goal': 'Take back what you just did to the plan.',
  'help.guide.undo-change.step.1':
    'Click the undo arrow in the toolbar above the days; its tooltip names the change it will take back.',
  'help.guide.undo-change.result': 'The plan is back the way it was, and the arrow greys out until the next change.',
  'help.guide.undo-change.tip.1':
    'Undo covers the plan: assigning, removing, reordering and moving places, optimizing a route, deleting places, category changes and imports.',
  'help.guide.undo-change.tip.2':
    'It is one step deep: only the latest change can be taken back, and a new change replaces it.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Places',
  'help.ctx.trip-places.summary':
    'The right column of the plan: every place of the trip, planned or not, with search and filters, and the ways to bring places in, by hand, from a file or from a shared list.',
  'help.ctx.trip-places.bullet.1':
    'Add Place/Activity at the top opens the form for a place you type or search. While a day is open the button reads New place, and To day next to it creates the place straight on that day.',
  'help.ctx.trip-places.bullet.2':
    'Import file takes .gpx, .kml and .kmz files; List Import takes a shared Google Maps or Naver Maps list. A file can also just be dropped onto the column.',
  'help.ctx.trip-places.bullet.3':
    'The dropdown switches between All, Unplanned, Planned and, once a track was imported, Tracks; below it sit the search, the category filter and the star for a minimum rating.',
  'help.ctx.trip-places.bullet.4':
    'A row shows picture, name and description or address. Click it for the place’s details, drag it onto a day, or right-click it for Edit, Add to day, Open Website, Google Maps, Save to Collection and Delete.',
  'help.ctx.trip-places.bullet.5':
    'With a day open, a + at the end of an unplanned row puts the place on that day, and Planned lists only that day, with Show the whole trip to widen again.',
  'help.ctx.trip-places.bullet.6':
    'The tick at the right end of the filter row starts a selection: several rows at once get a new category, go into a collection or are deleted.',
  // create-place
  'help.guide.create-place.title': 'Create a place',
  'help.guide.create-place.goal': 'Add a place or activity by hand, with everything the plan needs to know about it.',
  'help.guide.create-place.step.1':
    'Click Add Place/Activity at the top of the places column (New place while a day is open). The form opens.',
  'help.guide.create-place.step.2':
    'Type the place into Search places… at the top and pick a result. Name, Address, Latitude, Longitude and Website fill in, and Place details on the left shows pictures, opening hours and a description for it. On a TREK with a Google key, Not the right place? Search Google instead sits under the list and runs the same search through Google.',
  'help.guide.create-place.step.3':
    'In Place details, a click on a picture under Pick a picture makes it the place’s image; Use this text takes the description over into the form.',
  'help.guide.create-place.step.4':
    'Check the fields: Name is required; Description and Notes are yours; Address, Latitude and Longitude come from the search or are typed; Category picks one of the trip’s categories, and the + next to it creates a new one on the spot; Website takes the link.',
  'help.guide.create-place.step.5':
    'Click Add. If a place of the same name is already in the trip, the form says so and the button turns into Add anyway.',
  'help.guide.create-place.result':
    'The place is in the list and on the map, under Unplanned until it is put on a day.',
  'help.guide.create-place.tip.1':
    'Files and Costs at the bottom of the form attach a document to the place, or open the Costs editor for its expense right after saving.',
  'help.guide.create-place.tip.2':
    'The TREK index and OpenStreetMap answer the search on every TREK, and Place details fills itself from Wikipedia, Wikivoyage and Wikimedia. Google is asked only where both come up empty, and only it brings ratings.',
  'help.guide.create-place.tip.3':
    'A place can also start on the map: right-click the spot, and the form opens with the coordinates and address filled in.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Add a place straight to the open day',
  'help.guide.place-to-open-day.goal': 'Skip the second step: create or pick the place and have it on the day at once.',
  'help.guide.place-to-open-day.step.1':
    'Click a day’s header in the days column. The day is open: its card is highlighted, and the places column gains the To day button.',
  'help.guide.place-to-open-day.step.2':
    'To day opens the same form as New place, only the place lands on the open day the moment you click Add.',
  'help.guide.place-to-open-day.step.3':
    'A place that already exists goes onto the open day with the + at the end of its row, or by right-click, Add to day.',
  'help.guide.place-to-open-day.step.4':
    'The other way round works too, and without opening a day first: drag the place’s row out of the column and drop it on a day card. Dropped between two stops it lands exactly there.',
  'help.guide.place-to-open-day.result':
    'The place is listed under the day, at the end; drag it up or down to where it belongs.',
  'help.guide.place-to-open-day.tip.1':
    'The open day also steers the search: with a day open, the map and the nearby search start from where that day already goes.',
  'help.guide.place-to-open-day.tip.2': 'Undo in the toolbar above the days takes the assignment back.',
  // filter-places
  'help.guide.filter-places.title': 'Find a place in the list',
  'help.guide.filter-places.goal': 'Narrow the column to the places you are after.',
  'help.guide.filter-places.step.1':
    'The dropdown at the top switches between All, Unplanned (not on any day yet), Planned (on a day) and Tracks (imported GPX tracks), each with its count.',
  'help.guide.filter-places.step.2': 'Type into Search places…; the list narrows as you type.',
  'help.guide.filter-places.step.3':
    'All Categories opens a list to tick one or more categories, No Category among them; Clear filter at its bottom resets it.',
  'help.guide.filter-places.step.4':
    'The star next to it sets a minimum rating: 5+, 4+ and so on show only places you rated at least that high.',
  'help.guide.filter-places.result': 'The count above the rows says how many places match; the filters combine.',
  'help.guide.filter-places.tip.1':
    'With a day open, Planned lists that day only and says so: Showing the open day only, with Show the whole trip next to it.',
  'help.guide.filter-places.tip.2':
    'The map narrows to the open day as well; All in the list still shows every place of the trip.',
  // edit-place
  'help.guide.edit-place.title': 'Change a place',
  'help.guide.edit-place.goal': 'Fix a name, move the pin, add a website or change the category.',
  'help.guide.edit-place.step.1':
    'Right-click the row and choose Edit, or open the place and click Edit in its details.',
  'help.guide.edit-place.step.2':
    'Change what you need: Name, Description, Notes, Address, Latitude and Longitude, Category, Website. Opened from a day, the form also has Notes for this day and Start and End for that day.',
  'help.guide.edit-place.step.3': 'Click Update.',
  'help.guide.edit-place.result':
    'The change applies everywhere the place appears: the list, the map and every day it is on.',
  'help.guide.edit-place.tip.1':
    'Notes for this day belong to the place on that one day; Notes belong to the place itself.',
  'help.guide.edit-place.tip.2':
    'An End before the Start blocks Update; Time overlap with: only warns that another stop of the day has the same time.',
  // delete-place
  'help.guide.delete-place.title': 'Delete a place',
  'help.guide.delete-place.goal': 'Take a place out of the trip for good.',
  'help.guide.delete-place.step.1': 'Right-click the row and choose Delete, or click Delete in the place’s details.',
  'help.guide.delete-place.step.2':
    'Confirm. If a night was booked at the place, or a booking is linked to it, the question says what goes with it.',
  'help.guide.delete-place.result':
    'The place is gone from the list, the map and every day; Undo in the toolbar above the days brings it back.',
  'help.guide.delete-place.tip.1': 'To take a place off one day only, use Remove from Day on that stop instead.',
  'help.guide.delete-place.tip.2': 'Several places at once: the tick next to the filters starts a selection.',
  // select-places
  'help.guide.select-places.title': 'Change or delete several places at once',
  'help.guide.select-places.goal': 'Tidy the list in one go instead of place by place.',
  'help.guide.select-places.step.1':
    'Click the tick at the right end of the filter row. The rows get checkboxes and a bar with the actions appears.',
  'help.guide.select-places.step.2': 'Tick the rows, or Select all in the bar; the bar counts what is selected.',
  'help.guide.select-places.step.3':
    'Change category gives all of them one category; Save to Collection copies them into one of your collections; Delete selected removes them after a confirmation.',
  'help.guide.select-places.step.4': 'Click the tick again to leave the selection.',
  'help.guide.select-places.result':
    'The change applies to every selected place; a deletion can be undone from the toolbar above the days.',
  'help.guide.select-places.tip.1':
    'The filters keep working while you select: filter to Unplanned first, then Select all catches exactly those.',
  'help.guide.select-places.tip.2':
    'Mark visited in your lists appears in the bar when the Collections addon is on: it ticks the places off in the collections they are saved in.',
  // import-places-file
  'help.guide.import-places-file.title': 'Import places from a GPX, KML or KMZ file',
  'help.guide.import-places-file.goal': 'Bring in what Google My Maps, Google Earth or a GPS tracker exported.',
  'help.guide.import-places-file.step.1': 'Click Import file, or drop the file anywhere on the places column.',
  'help.guide.import-places-file.step.2':
    'Pick the file or drag it into the box. For a GPX, tick what to import: Waypoints, Routes, Tracks (with path geometry); for KML and KMZ, Points (Placemarks) and Paths (LineStrings).',
  'help.guide.import-places-file.step.3':
    'The box takes several files at once, and only .gpx, .kml and .kmz. Another kind of file, or one over 10 MB, is refused in the dialog and not imported.',
  'help.guide.import-places-file.step.4':
    'Click Import. A message says how many places came in; for a KML or KMZ file the dialog stays open with a summary of what was created and what was skipped.',
  'help.guide.import-places-file.result':
    'The places are in the list; a track carries a route marker on its row, draws on the map and gets its own Tracks filter.',
  'help.guide.import-places-file.tip.1':
    'A file that is too big is refused with the size limit; export it again without photos, or split it.',
  'help.guide.import-places-file.tip.2': 'The import can be undone as a whole from the toolbar above the days.',
  // import-places-list
  'help.guide.import-places-list.title': 'Import a shared Google Maps or Naver Maps list',
  'help.guide.import-places-list.goal': 'Turn a shared list link into places.',
  'help.guide.import-places-list.step.1': 'Click List Import and choose Google List or Naver List.',
  'help.guide.import-places-list.step.2':
    'Paste the shared link of the list. A Google Maps directions link works too: its stops become places, in driving order.',
  'help.guide.import-places-list.step.3': 'Click Import.',
  'help.guide.import-places-list.result':
    'Every place of the list is in the trip, named as in the list; places already in the trip are skipped.',
  'help.guide.import-places-list.tip.1':
    'The list has to be shared publicly; the link of a private list imports nothing.',
  'help.guide.import-places-list.tip.2':
    'Enrich places via Google appears in the dialog when your TREK has a Google key: it looks every imported place up and fills in photos, address and details.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Days',
  'help.ctx.trip-days.summary':
    'The left column of the plan: one card per day with its stops in order, the notes, the bookings and transports of the day, and the route between the stops. This is where the trip is actually planned.',
  'help.ctx.trip-days.bullet.1':
    'The toolbar at the top: Export (PDF, calendar, GPX), Expand all days / Collapse all days, the undo arrow, Reorder days and Show all booking routes.',
  'help.ctx.trip-days.bullet.2':
    'A day card: number, weather, title, date and the day’s cost in the header; click the header to open the day, its chevron folds it. Public transit, Add transport and Add Note sit in the header as well.',
  'help.ctx.trip-days.bullet.3':
    'Inside a day: the stops in order, each with picture, name, time and a lock on the picture; notes; bookings that belong to the day; and between the stops the travel time of each leg.',
  'help.ctx.trip-days.bullet.4':
    'Under the stops the route bar: Route draws the day on the map, Optimize sorts the stops, Driving / Walking sets the day’s travel mode, Open in Google Maps and Open in CoMaps hand the day over.',
  'help.ctx.trip-days.bullet.5':
    'Places come onto a day by dragging a row from the places column, with the + on that row, with Add place to this day on an empty day, or from the place’s details.',
  'help.ctx.trip-days.bullet.6':
    'Total Cost at the bottom adds up every stop and booking with a price, in the trip’s currency.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Read a day',
  'help.guide.read-day-plan.goal': 'Know what every part of a day card tells you before you change anything.',
  'help.guide.read-day-plan.step.1':
    'The header: the day number, the forecast for the day, Day 1 or the title you gave it, the date and the cost of the day. Click the header to open the day (its details panel opens over the map); the chevron at the right folds and unfolds the card.',
  'help.guide.read-day-plan.step.2':
    'A stop: the grip on the left drags it, the picture carries a lock for route optimization, then the name, the description and, if set, the notes for this day. A time badge shows Start and End when the stop has them; the arrows that appear at its right end move it up or down.',
  'help.guide.read-day-plan.step.3':
    'A booking on the day: a reservation at a stop marks the stop Reservation confirmed or Reservation pending, and a transport shows as Departure or Arrival with its time and its route, with a small toggle that draws that route on the map.',
  'help.guide.read-day-plan.step.4':
    'Between two stops the connector says how long the leg takes and how far it is, in the day’s travel mode; click it to change the mode for that one leg.',
  'help.guide.read-day-plan.step.5':
    'The route bar at the end: Route draws the day’s way on the map, Optimize reorders the stops, the mode buttons pick Driving or Walking, Open in Google Maps and Open in CoMaps open the day there.',
  'help.guide.read-day-plan.result': 'Every symbol on the card has a meaning; the guides below change each of them.',
  'help.guide.read-day-plan.tip.1':
    'Right-click a stop for its menu: Edit, Remove from day, Open Website, the navigation apps (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), Save to Collection, Delete.',
  'help.guide.read-day-plan.tip.2':
    'Hover a stop and Add booking appears at its end: a reservation created there is tied to this stop on this day.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Put a place on a day',
  'help.guide.place-onto-day.goal': 'Turn a place from the list into a stop of a day, where it belongs in the order.',
  'help.guide.place-onto-day.step.1':
    'Drag a row from the places column onto the day card. Drop it between two stops to put it exactly there, or anywhere on the card to append it.',
  'help.guide.place-onto-day.step.2':
    'Without dragging: open the day by clicking its header, then click the + at the end of the place’s row, or right-click the row and choose Add to day.',
  'help.guide.place-onto-day.step.3':
    'On an empty day, Add place to this day opens the place form, and the new place lands on the day at once.',
  'help.guide.place-onto-day.step.4':
    'From a place’s details, Add to Day asks which day; from the day’s header, To day in the places column creates a new place on the open day.',
  'help.guide.place-onto-day.result':
    'The place is a stop of the day, on the map with the day’s number, and the places column counts it under Planned.',
  'help.guide.place-onto-day.tip.1':
    'A place can be on several days: put it on the second day from the places column. Dragging a stop from one day card to another moves it instead.',
  'help.guide.place-onto-day.tip.2': 'The undo arrow in the toolbar takes the assignment back.',
  'help.guide.place-onto-day.tip.3':
    'A stop cannot be dropped between two entries that have fixed times, or before a booking that is already timed; the plan keeps its chronology.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Change the order of a day',
  'help.guide.reorder-stops.goal': 'Move a stop up or down, or to another day.',
  'help.guide.reorder-stops.step.1': 'Drag the stop by its grip to the new position in the card.',
  'help.guide.reorder-stops.step.2': 'Or use the arrows at the right end of the stop: one step up or down per click.',
  'help.guide.reorder-stops.step.3': 'Drag the stop onto another day card to move it there; it leaves the old day.',
  'help.guide.reorder-stops.step.4':
    "A stop with a fixed time asks Remove time? when a move would break the day's order, because the time decided its place: Confirm drops the time and lets it go anywhere.",
  'help.guide.reorder-stops.result': 'The route and the travel times follow the new order at once.',
  'help.guide.reorder-stops.tip.1':
    'Bookings with a fixed time cannot be reordered; they sit where their time puts them.',
  'help.guide.reorder-stops.tip.2':
    'Optimize in the route bar orders the whole day by the shortest way; lock a stop first to keep it where it is.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Give a stop a time',
  'help.guide.set-stop-times.goal': 'Fix when a stop starts and ends, so the day reads like a schedule.',
  'help.guide.set-stop-times.step.1':
    'Right-click the stop and choose Edit. Opened from the day, the form has Start and End at the bottom.',
  'help.guide.set-stop-times.step.2':
    'Enter Start and, if you like, End. Time overlap with: warns that another timed stop of the day overlaps; an End before the Start blocks Update.',
  'help.guide.set-stop-times.step.3':
    'Click Update. The stop gets a time badge and moves to where its time belongs in the day.',
  'help.guide.set-stop-times.result': 'Timed stops keep their place in the order; untimed stops sort around them.',
  'help.guide.set-stop-times.tip.1':
    'The time belongs to the stop on that day; the same place on another day can have another time.',
  'help.guide.set-stop-times.tip.2':
    'To move a timed stop by hand, drag it: the Remove time? question drops the time on the way, once you Confirm.',
  'help.guide.set-stop-times.tip.3':
    'Notes for this day in the same form hold what only applies on this day, a table reserved, a ticket number.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Take a stop off a day',
  'help.guide.remove-from-day.goal': 'Unplan a place without deleting it from the trip.',
  'help.guide.remove-from-day.step.1': 'Right-click the stop and choose Remove from day.',
  'help.guide.remove-from-day.step.2':
    'The stop is gone from the day; the place stays in the places column, under Unplanned if it is on no other day.',
  'help.guide.remove-from-day.result': 'The day, its route and its cost update; the undo arrow brings the stop back.',
  'help.guide.remove-from-day.tip.1':
    'Delete in the same menu removes the place from the whole trip, every day included.',
  'help.guide.remove-from-day.tip.2': 'Remove from Day also sits in the place’s details panel, next to Add to Day.',
  // lock-stop
  'help.guide.lock-stop.title': 'Lock a stop in place',
  'help.guide.lock-stop.goal': 'Keep a stop where it is when the route is optimized.',
  'help.guide.lock-stop.step.1':
    'Hover the stop’s picture and click the lock: Keep position during route optimization.',
  'help.guide.lock-stop.step.2':
    'Optimize now sorts the other stops around it; click the lock again (Click to unlock) to release it.',
  'help.guide.lock-stop.result': 'The lock shows on the picture; the stop keeps its position until you unlock it.',
  'help.guide.lock-stop.tip.1': 'A stop with a fixed time is locked by its time; it never moves during optimization.',
  'help.guide.lock-stop.tip.2':
    'The lock lasts for this visit: after a reload every stop is free again, only timed stops stay fixed.',
  // day-note
  'help.guide.day-note.title': 'Add a note to a day',
  'help.guide.day-note.goal': 'Keep a reminder, a ticket number or a plan B right in the day.',
  'help.guide.day-note.step.1': 'Click Add Note in the day’s header.',
  'help.guide.day-note.step.2':
    'Give it a name under Note, that is what the day card shows, and write the rest under Daily Note. The toolbar above it formats the text (bold, lists, links, quotes) and Preview on the left shows the card it becomes.',
  'help.guide.day-note.step.3': 'Pick an Icon and a Colour, so the note stands out from the stops, then Add.',
  'help.guide.day-note.step.4':
    'The note sits in the day like a stop: drag it into place, right-click it for Edit and Delete.',
  'help.guide.day-note.result': 'The note is part of the day, in the PDF too; a timed note sorts with the timed stops.',
  'help.guide.day-note.tip.1':
    'A note with a time can stand in for a transport you have no booking for: “08:15 S3 from central station”.',
  'help.guide.day-note.tip.2': 'Notes are per day; a note for the whole trip belongs in Collab.',
  // day-route
  'help.guide.day-route.title': 'Show and optimize the day’s route',
  'help.guide.day-route.goal': 'See the way between the stops, pick how you travel, and let TREK sort the order.',
  'help.guide.day-route.step.1':
    'Open the day and click Route in the route bar: the way between the stops draws on the map, and the connectors between the stops show the time and distance of each leg.',
  'help.guide.day-route.step.2':
    'Driving and Walking next to it set the travel mode of the day; the legs recalculate. Plugins can add modes of their own.',
  'help.guide.day-route.step.3':
    'Click a connector to change the mode of that one leg: pick a mode, or Use day default to fall back to the day’s.',
  'help.guide.day-route.step.4':
    'Optimize reorders the stops by the shortest way. Stops with a lock or a fixed time keep their place; with an accommodation on the day, the route starts there.',
  'help.guide.day-route.step.5':
    'Open in Google Maps or Open in CoMaps opens the whole day as a route in that app, for navigating on the way.',
  'help.guide.day-route.result': 'The day is a route with times; Total Cost and the legs update as the order changes.',
  'help.guide.day-route.tip.1':
    'Routes come from OSRM by default; the admin can point TREK at another routing engine under User Defaults.',
  'help.guide.day-route.tip.2': 'A leg that could not be routed shows no time; check that both stops have coordinates.',
  'help.guide.day-route.tip.3': 'The undo arrow takes an optimization back.',
  // manage-days
  'help.guide.manage-days.title': 'Add, reorder and rename days',
  'help.guide.manage-days.goal': 'Shape the days themselves, not just what is on them.',
  'help.guide.manage-days.step.1':
    'The days come from the trip’s dates; change the dates on the trip card under Dashboard and days are added or dropped at the ends. Before a day with something on it is dropped, a list says which days go and what is on them.',
  'help.guide.manage-days.step.2':
    'Reorder days in the toolbar opens a list: Move up and Move down shift a day with everything on it, and Delete day, the bin beside them, removes it. Below the list, the button with the next date adds a day right after the last dated one and extends the trip by one; Without date appends a day without a date.',
  'help.guide.manage-days.step.3':
    'Delete day asks first: it lists what goes with the day, its places, notes and bookings, a stay that checks in or out on it, and the days that move up a date. Delete day removes it, Cancel keeps it; the last day cannot be deleted.',
  'help.guide.manage-days.step.4':
    'To rename a day, open it and click the pencil next to its title in the details panel over the map; the name replaces Day 1 in the card and in the PDF.',
  'help.guide.manage-days.step.5':
    'Expand all days and Collapse all days in the toolbar fold every card at once; a single card folds with its chevron.',
  'help.guide.manage-days.result':
    'The dates stay with the position: a day moved up takes the earlier date, its stops, notes and bookings travel with it.',
  'help.guide.manage-days.tip.1': 'Moving days can be undone from the toolbar; deleting a day cannot.',
  'help.guide.manage-days.tip.2':
    'The cost in a day’s header adds up the stops and bookings of that day that carry a price.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Read bookings and transports in the plan',
  'help.guide.bookings-in-plan.goal': 'Know where a booking shows up once it exists, and which screen creates it.',
  'help.guide.bookings-in-plan.step.1':
    'A transport (flight, train, ferry, bus, car) shows in the day it departs as Departure and in the day it arrives as Arrival, with time and route; a multi-day one spans the days in between.',
  'help.guide.bookings-in-plan.step.2':
    'A reservation tied to a stop (a restaurant, a tour) marks that stop Reservation confirmed or Reservation pending; a booking with a day but no stop is its own row in the day.',
  'help.guide.bookings-in-plan.step.3':
    'A night at a hotel is an accommodation: it sits in the day’s details panel under Accommodation, from check-in to check-out, and the route of each of those days starts there.',
  'help.guide.bookings-in-plan.step.4':
    'On the map, the toggle on a transport row draws its route; Show all booking routes in the toolbar draws them all.',
  'help.guide.bookings-in-plan.step.5':
    'Creating: Add booking on a hovered stop, Add transport and Public transit in the day header, and the Bookings and Transports tabs for the full list with import and files.',
  'help.guide.bookings-in-plan.result': 'One booking, one place in the plan; the tabs are the same bookings as a list.',
  'help.guide.bookings-in-plan.tip.1':
    'Confirmed and pending is a status you set on the booking; the plan shows it on the stop, the Bookings tab counts both.',
  'help.guide.bookings-in-plan.tip.2':
    'A transport with a fixed time cannot be dragged; change its time in the booking instead.',
  // export-plan
  'help.guide.export-plan.title': 'Export the plan',
  'help.guide.export-plan.goal': 'Take the plan along as a document, into your calendar or onto a GPS.',
  'help.guide.export-plan.step.1': 'Click Export in the toolbar above the days.',
  'help.guide.export-plan.step.2':
    'Document: PDF opens the print view of every day with its stops, notes and bookings; Page break per day starts each day on a new page, Save as PDF downloads it.',
  'help.guide.export-plan.step.3':
    'Calendar: Download .ics saves the bookings as a calendar file; Subscribe to calendar gives a link your calendar app refreshes by itself.',
  'help.guide.export-plan.step.4':
    'Maps & GPS · GPX: Whole trip exports places, day routes and tracks; Places only the pins; Days as routes one route per day, for offline maps and GPS devices.',
  'help.guide.export-plan.result': 'The file downloads; nothing in the trip changes.',
  'help.guide.export-plan.tip.1':
    'A single day goes to a map app from its route bar: Open in Google Maps or Open in CoMaps.',
  'help.guide.export-plan.tip.2':
    'Subscribe to calendar needs calendar feeds switched on in your settings; Dashboard has a guide for it.',
  'help.guide.export-plan.tip.3': 'Exporting is reading: every member of the trip can do it.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Place details',
  'help.ctx.trip-place.summary':
    'The card that opens over the map when you pick a place: everything the trip knows about it, the stars everyone gave it, its picture and its files, and the buttons that put it on the open day, into a list or into a map app.',
  'help.ctx.trip-place.bullet.1':
    'Click a row in the places column, a stop inside a day, or a marker on the map, and the card opens over the map. Picking it inside a day tells the card which stop you mean, and that is what brings the stop’s participants and its booking along.',
  'help.ctx.trip-place.bullet.2':
    'The head carries the round picture, the name, the category, the address and the coordinates. Click the picture to use one of your own, double-click the name to rename the place on the spot, and the X on the right closes the card.',
  'help.ctx.trip-place.bullet.3':
    'Under it: the price if it has one, the stars every traveller gave the place, the description and the notes, and Notes for this day when the stop carries one.',
  'help.ctx.trip-place.bullet.4':
    'Opening Hours, Track color, Track Stats and Files follow, as far as they apply. Files takes anything out of your folders and also lists what hangs on the booking of this stop.',
  'help.ctx.trip-place.bullet.5':
    'The row at the bottom: Add to Day or Remove from Day while a day is open, then Save to Collection, Navigation, Open Website, Edit and Delete.',
  'help.ctx.trip-place.bullet.6':
    'A place picked out of the search carries what the TREK index or OpenStreetMap know about it: a green Open or red Closed ring around the picture, judged by the place’s own clock, the phone number under the stars, Opening Hours further down with the day’s line on the row and the whole week behind a click, and its website behind Open Website. Google’s rating shows only on a place found through Google, on a TREK with a Google key.',
  // read-place
  'help.guide.read-place.title': 'What the card tells you about a place',
  'help.guide.read-place.goal': 'Read everything the trip knows about one place, in one card.',
  'help.guide.read-place.step.1':
    'In the days column, click the stop you want to read. The card opens over the map and the stop stays marked in its day.',
  'help.guide.read-place.step.2':
    'The head: the round picture, the name, the address and the exact coordinates. A green ring with Open, or a red one with Closed, around the picture says whether the place is open right now, by its own clock, once TREK knows its hours. The X on the right closes the card again.',
  'help.guide.read-place.step.3':
    'Under it the stars every traveller gave the place, with the average and how many voted. Not rated yet while nobody has. Right below, the phone number where the place has one: a click on it hands the number to your phone app.',
  'help.guide.read-place.step.4':
    'Then the description and, below it, the notes. Both are the text from the place’s form, rendered: lists, links and bold all work.',
  'help.guide.read-place.step.5':
    'Participants says who is going to this stop. Everybody is in until you take somebody out.',
  'help.guide.read-place.step.6':
    'Opening Hours, further down: the row carries the hours of the day you are looking at, and a click on it unfolds the whole week with that day in bold. Files stands beside it.',
  'help.guide.read-place.step.7':
    'The row at the bottom is what you can do from here: take the place off the open day or put it on, save it to a list, open it in a map app, edit it or delete it.',
  'help.guide.read-place.result':
    'The card stays open until you close it with the X or pick another place, the week’s hours stay unfolded, and the stop it belongs to stays marked in the days column.',
  'help.guide.read-place.tip.1':
    'Picked out of the places column the card knows the place but not a stop, so it shows no participants and no booking. Pick the stop inside the day instead and both are there.',
  'help.guide.read-place.tip.2':
    'Double-click the name to rename the place without opening the form. Enter saves, Escape drops the change.',
  'help.guide.read-place.tip.3':
    'A place typed in by hand shows none of that: the card knows only what its form holds. Open it with Edit, pick it from the suggestions under Search places… and click Update, and the hours, the phone number and the website come with it. Google’s rating needs a Google key.',
  // rate-place
  'help.guide.rate-place.title': 'Rate a place',
  'help.guide.rate-place.goal': 'Give a place your own stars, and see what everybody else gave it.',
  'help.guide.rate-place.step.1':
    'Open the place. The star row sits right under the head and carries the average of the votes so far, with their number in brackets.',
  'help.guide.rate-place.step.2':
    'Click the star you mean. The stars fill as you move across them, so you see what you are about to give.',
  'help.guide.rate-place.step.3':
    'Your vote counts into the average straight away, and the faces beside it are who voted. Rest the pointer on the row to see everyone’s stars.',
  'help.guide.rate-place.step.4':
    'The same average sits on the place’s row in the places column, so the good ones stand out in the list.',
  'help.guide.rate-place.result':
    'Your stars are on the place for the whole trip to see, and the star in the filter row above the list can now keep only the places that reach a floor.',
  'help.guide.rate-place.tip.1': 'Every traveller may rate, even on a trip where only some of you may change places.',
  'help.guide.rate-place.tip.2':
    'Click the star you already gave to take your vote back. With nobody left voting, the place reads Not rated yet again.',
  'help.guide.rate-place.tip.3':
    'Up to six voters fit beside the stars as faces; the tooltip names all of them, and marks yours.',
  // place-image
  'help.guide.place-image.title': 'Put your own picture on a place',
  'help.guide.place-image.goal': 'Replace the automatic thumbnail with a photo of your own.',
  'help.guide.place-image.step.1': 'Open the place from the places column.',
  'help.guide.place-image.step.2':
    'Rest the pointer on the round picture in the head: a camera appears and the tooltip reads Upload image. Click it and pick your file.',
  'help.guide.place-image.step.3': 'The head now shows your picture, with a small red X at its corner.',
  'help.guide.place-image.step.4':
    'The same picture is on the place’s row in the places column, and on its marker on the map.',
  'help.guide.place-image.result':
    'Your picture is the place’s picture everywhere: the card, the places column, the stop in the day, the marker on the map and a shared trip.',
  'help.guide.place-image.tip.1':
    'JPG, PNG, GIF and WebP are taken, and a HEIC from an iPhone is converted on the way in.',
  'help.guide.place-image.tip.2':
    'The X at the corner removes your picture again and the automatic one comes back. The place itself is untouched.',
  'help.guide.place-image.tip.3':
    'Without a picture of your own TREK looks one up from the place’s coordinates, and falls back to the category’s icon.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Put the place on the open day, or take it off',
  'help.guide.place-day-assign.goal': 'Use the card’s own button instead of dragging the row across the planner.',
  'help.guide.place-day-assign.step.1':
    'Click a day’s header in the days column. That day is the open one now, and the card works against it.',
  'help.guide.place-day-assign.step.2':
    'Click a place that is not on that day in the places column. Its card opens and the row at the bottom offers Add to Day.',
  'help.guide.place-day-assign.step.3':
    'Click Add to Day. The stop lands at the end of the day and the button turns into Remove from Day.',
  'help.guide.place-day-assign.step.4': 'The stop is in the day now, last in the list. Drag it up to where it belongs.',
  'help.guide.place-day-assign.step.5':
    'Remove from Day takes that stop off the day again, and the card offers Add to Day once more.',
  'help.guide.place-day-assign.result':
    'The day carries the stop, or carries it no longer, and the place itself is untouched either way.',
  'help.guide.place-day-assign.tip.1':
    'The button only exists while a day is open. Without one the card has nothing to add the place to.',
  'help.guide.place-day-assign.tip.2':
    'Taking a stop off a day leaves the place in the trip and in the places column. Delete is what removes it everywhere.',
  'help.guide.place-day-assign.tip.3':
    'A stop a lodging booking put on the day offers neither button: that night is added and removed in the day’s overnight block.',
  // place-participants
  'help.guide.place-participants.title': 'Say who is going to this stop',
  'help.guide.place-participants.goal': 'Split the group for one stop without splitting the trip.',
  'help.guide.place-participants.step.1':
    'Click the stop inside the day. The card opens and Participants lists everybody in the trip.',
  'help.guide.place-participants.step.2':
    'Click a traveller’s chip to take them out of this stop. The name is struck through as you hover it.',
  'help.guide.place-participants.step.3':
    'A dashed + appears as soon as somebody is missing. Click it to see who is not on the stop.',
  'help.guide.place-participants.step.4':
    'Click a name to put them back. With everybody back in, the stop is the whole group’s again.',
  'help.guide.place-participants.result':
    'The stop carries the travellers you chose, and the rest of the group has that afternoon to themselves.',
  'help.guide.place-participants.tip.1':
    'Participants only appears with a stop selected, so pick the place inside the day rather than in the places column, and only on a trip with more than one traveller.',
  'help.guide.place-participants.tip.2':
    'Nobody chosen means everybody is going, which is why the last traveller left on a stop cannot be taken out.',
  'help.guide.place-participants.tip.3':
    'A guest, who has no account of their own, can be a participant like anybody else.',
  // place-booking
  'help.guide.place-booking.title': 'The booking on a stop',
  'help.guide.place-booking.goal': 'Read the booking that belongs to a stop, open it, and pin a new one to it.',
  'help.guide.place-booking.step.1':
    'Open the stop the booking belongs to. The card shows a strip with Confirmed or Pending and the booking’s name.',
  'help.guide.place-booking.step.2':
    'The strip carries the Date, the Time and the Booking Code, and whatever notes the booking has.',
  'help.guide.place-booking.step.3': 'Click the strip. The booking’s own form opens on it.',
  'help.guide.place-booking.step.4':
    'Link to day assignment is what pins a booking to a stop, and here it already names this one. Close the form again.',
  'help.guide.place-booking.step.5':
    'A new booking for a stop starts in the days column: hover the stop and click the + at its end. The form opens as New Reservation, already linked to it.',
  'help.guide.place-booking.result':
    'The booking hangs on the stop: it is on the card, it is in the day, and its files are listed under Files here as well.',
  'help.guide.place-booking.tip.1':
    'The strip only shows for the stop the booking is pinned to. A booking with no stop lives on the Book tab.',
  'help.guide.place-booking.tip.2':
    'Several bookings can share one stop: the lunch and the tour that starts from the same door.',
  'help.guide.place-booking.tip.3':
    'A train, a flight or a ferry opens the transport form instead, the one the Transports tab uses.',
  // place-files
  'help.guide.place-files.title': 'Keep a place’s tickets with the place',
  'help.guide.place-files.goal': 'Put the ticket, the voucher or the map for a place where you will look for it.',
  'help.guide.place-files.step.1':
    'Open the place. Files sits at the foot of the card and reads Files while the place has none.',
  'help.guide.place-files.step.2': 'Click Upload beside it and pick the file.',
  'help.guide.place-files.step.3': 'The button counts what the place holds, and the list opens itself.',
  'help.guide.place-files.step.4': 'Each row is the file’s name with its size. Click it to open the file.',
  'help.guide.place-files.result':
    'The file sits on the place, counted in the card, and it is on the trip’s Files tab as well.',
  'help.guide.place-files.tip.1':
    'Files also lists what hangs on the booking of this stop, so a hotel confirmation shows up on the hotel.',
  'help.guide.place-files.tip.2': 'Upload takes several files at once.',
  'help.guide.place-files.tip.3':
    'Without the right to upload files the Upload button is not there; files already on the place still are.',
  // place-navigation
  'help.guide.place-navigation.title': 'Open a place in a map app or on its website',
  'help.guide.place-navigation.goal': 'Hand the place over to the app that will actually take you there.',
  'help.guide.place-navigation.step.1': 'Open the place and click Navigation in the row at the bottom.',
  'help.guide.place-navigation.step.2':
    'The list is the map apps that fit this place: Google Maps, Waze, Apple Maps, OpenStreetMap and CoMaps.',
  'help.guide.place-navigation.step.3':
    'Click the one you use. TREK hands it the place itself where it can, not only a pair of coordinates, so you land at the right entrance.',
  'help.guide.place-navigation.step.4':
    'Open Website next to it opens the place’s own page, its times and its tickets, in a new tab.',
  'help.guide.place-navigation.result':
    'The map app opens on the place, the website in a tab of its own, and nothing in the trip changes.',
  'help.guide.place-navigation.tip.1':
    'Waze starts navigating straight away. The others open the place, and starting from there is one more tap.',
  'help.guide.place-navigation.tip.2':
    'Which apps are offered depends on the place and on your device: Apple Maps is left out on Android, 高德地图 only comes up for a place in China, and Waze, Apple Maps and CoMaps need the place’s coordinates.',
  'help.guide.place-navigation.tip.3':
    'When only one app applies, the button carries that app’s name and opens it straight away.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Save a place to one of your lists',
  'help.guide.place-to-collection.goal': 'Keep a place you found on this trip for the next one.',
  'help.guide.place-to-collection.step.1': 'Open the place and click Save to Collection at the bottom of the card.',
  'help.guide.place-to-collection.step.2':
    'Save to list shows every list you own or share. A tick marks the ones that already hold this place.',
  'help.guide.place-to-collection.step.3': 'Click the list. The place is in it straight away.',
  'help.guide.place-to-collection.step.4': 'Close, and the button in the card reads Saved.',
  'help.guide.place-to-collection.result':
    'The place is in your list with its picture, its notes and its address, ready for the next trip.',
  'help.guide.place-to-collection.tip.1':
    'The button is only there while the Collections addon is on, which the admin switches on under Addons.',
  'help.guide.place-to-collection.tip.2':
    'A place can sit in several lists at once, with its own status in each: an idea in one, visited in another.',
  'help.guide.place-to-collection.tip.3':
    'Mark visited, beside the place’s name in the picker, ticks it off in the list; with the place in several of your lists the pill reads Visited everywhere and does them all at once.',
  // place-track
  'help.guide.place-track.title': 'Read a track and give it its own colour',
  'help.guide.place-track.goal':
    'See how long an imported walk is, and tell its line apart from the others on the map.',
  'help.guide.place-track.step.1':
    'A track’s row in the places column carries a short stroke in the colour its line is drawn in. Click it.',
  'help.guide.place-track.step.2': 'Track Stats gives the length of the path, in the units you set.',
  'help.guide.place-track.step.3': 'Track color above it shows the colour in use. Click the row to open the swatches.',
  'help.guide.place-track.step.4': 'Pick a colour. The line on the map and the stroke on the row change with it.',
  'help.guide.place-track.step.5':
    'The dashed cell on the left, Automatic color, hands the track back the colour it inherits; the pipette on the right opens your system’s colour picker for anything else.',
  'help.guide.place-track.result':
    'The track is drawn in the colour you picked, in the card, on its row in the places column and on the map.',
  'help.guide.place-track.tip.1':
    'Only a place that carries a path, one imported from a GPX, KML or KMZ file, has these two blocks.',
  'help.guide.place-track.tip.2':
    'A track recorded with heights also shows its highest and lowest point, the metres up and down, and the profile of the walk.',
  'help.guide.place-track.tip.3':
    'An import gives every track it brings in a colour of its own, so two walks never arrive in the same one.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Day details',
  'help.ctx.trip-day-detail.summary':
    'The panel a day header opens over the map: the day as a whole, its name and its date, the weather where you will be, the bookings that fall on it and the nights booked for it.',
  'help.ctx.trip-day-detail.bullet.1':
    'Click a day’s header in the days column and the panel opens over the middle of the map. The same header again, or the X at its right, closes it and lets go of the day.',
  'help.ctx.trip-day-detail.bullet.2':
    'The header carries the day’s name and its date. The pencil next to the name renames the day, the double chevron folds the panel to a slim bar so the map is free again.',
  'help.ctx.trip-day-detail.bullet.3':
    'At the top, the weather of the day. Forecast for names the place it is for: the day’s first stop, or the hotel you wake up in.',
  'help.ctx.trip-day-detail.bullet.4':
    'Reservations lists the bookings of that day, each with its kind, the stop it belongs to and its times. Green means confirmed, amber still pending; it is a read-out, bookings are changed under Bookings.',
  'help.ctx.trip-day-detail.bullet.5':
    'Accommodation shows every night booked over this day, with Check-in and Check-out on the days they happen, the check-in window, the check-out time and the confirmation number.',
  'help.ctx.trip-day-detail.bullet.6':
    'Add accommodation books a night on this day: pick the property from the trip’s places, say which days it covers, and add the times and the code.',
  // day-panel
  'help.guide.day-panel.title': 'Open a day and read its details',
  'help.guide.day-panel.goal':
    'See one day whole, its weather, its bookings and where you sleep, without leaving the map.',
  'help.guide.day-panel.step.1':
    'Click a day’s header in the days column. The day is selected and its details open over the middle of the map.',
  'help.guide.day-panel.step.2': 'The header names the day, Day 1 until you give it a name, with its date underneath.',
  'help.guide.day-panel.step.3':
    'At the top, the weather of the day. Forecast for says which place it is for: the day’s first stop, or the hotel you wake up in.',
  'help.guide.day-panel.step.4': 'Reservations below it lists the bookings that fall on this day, with their times.',
  'help.guide.day-panel.step.5':
    'Accommodation shows the nights booked over this day, with Check-in and Check-out on the days they happen.',
  'help.guide.day-panel.step.6':
    'The double chevron in the header folds the panel to a slim bar. The X next to it closes the panel and lets go of the day.',
  'help.guide.day-panel.result':
    'Folded to its bar the panel leaves the map free and keeps the day selected; closed, the day is deselected and the plan is as it was.',
  'help.guide.day-panel.tip.1':
    'Clicking anywhere on the panel’s header bar folds it too. The chevron is only the button for it.',
  'help.guide.day-panel.tip.2':
    'Opening a place from the places column puts the place’s details in the panel’s place. Close them and the day comes back.',
  // day-weather
  'help.guide.day-weather.title': 'Read the day’s weather',
  'help.guide.day-weather.goal': 'Know what the day will be like where you actually are that day.',
  'help.guide.day-weather.step.1':
    'Forecast for names the place the numbers are for: the day’s first stop, or, on a day without one, the hotel you wake up in.',
  'help.guide.day-weather.step.2':
    'The big number is the day’s temperature, next to it the low and the high, and the condition in words.',
  'help.guide.day-weather.step.3':
    'The chips under it: the chance of rain, how much of it, the strongest wind, and sunrise and sunset.',
  'help.guide.day-weather.step.4':
    'At the bottom, the day hour by hour, every second hour: the time, the icon, the temperature and the chance of rain. An hour over 50 percent is shaded blue.',
  'help.guide.day-weather.result':
    'The day’s card in the days column carries the same weather in small under its number, so the whole trip can be read at a glance.',
  'help.guide.day-weather.tip.1':
    'Degrees and wind follow Temperature Unit under General in Settings: pick °F Fahrenheit and the same forecast is read out in °F and mph.',
  'help.guide.day-weather.tip.2':
    'A day with no located stop and no hotel to wake up in shows no weather at all: the forecast is always for a place, never for the trip.',
  'help.guide.day-weather.tip.3':
    'More than 16 days ahead there is no forecast to be had. The numbers are then the averages of earlier years for that date, marked with Ø and said so underneath.',
  // rename-day
  'help.guide.rename-day.title': 'Give the day a name',
  'help.guide.rename-day.goal': 'Call a day what it is, Arrival in Kyoto or Rest day, instead of Day 5.',
  'help.guide.rename-day.step.1': 'Open the day. Its header reads Day 5, with the date underneath.',
  'help.guide.rename-day.step.2': 'Click the pencil next to the name.',
  'help.guide.rename-day.step.3': 'The name turns into a field. Type the name you want.',
  'help.guide.rename-day.step.4':
    'Press Enter, or simply click elsewhere; Escape throws the change away. The day’s card in the days column carries the name too.',
  'help.guide.rename-day.result':
    'The name replaces Day 5 in the panel and on the day’s card in the days column; the date stays where it was.',
  'help.guide.rename-day.tip.1':
    'Clear the field and save, and the day is Day 5 again: the number is what shows when there is no name.',
  'help.guide.rename-day.tip.2':
    'The name belongs to the day, not to its date. Reorder the days and it travels with everything else on that day.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Book a night on a day',
  'help.guide.add-accommodation.goal':
    'Put the hotel into the plan once, with the days it covers, its times and its confirmation number.',
  'help.guide.add-accommodation.step.1':
    'The property has to be a place of the trip first. Create it in the places column the way you would any other place: the picker only offers what is already there.',
  'help.guide.add-accommodation.step.2': 'Open the day you arrive on and click Add accommodation under Accommodation.',
  'help.guide.add-accommodation.step.3':
    'Apply to days says which nights the stay covers: the check-in day on the left, the check-out day on the right. All covers the whole trip.',
  'help.guide.add-accommodation.step.4':
    'Fill in Check-in, Until and Check-out, and put the booking’s number under Confirmation. All four may stay empty.',
  'help.guide.add-accommodation.step.5':
    'Pick the property from the trip’s places. The chips above the list narrow it to one category.',
  'help.guide.add-accommodation.step.6': 'Click Save.',
  'help.guide.add-accommodation.result':
    'The stay shows on every day it covers, Check-in on the first and Check-out on the last. The property becomes a stop on the check-in day, so the map draws the way there, and a Hotel booking appears under Bookings.',
  'help.guide.add-accommodation.tip.1':
    'The picker opens on the day you came from, with check-out the day after; both can be moved before you save.',
  'help.guide.add-accommodation.tip.2':
    'Give the hotel the Hotel category when you create it and the chips above the list narrow it to your hotels in one click.',
  'help.guide.add-accommodation.tip.3':
    'The times are all optional: a stay with no check-in and no code still covers its nights and still draws its route.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Change or cancel a booked night',
  'help.guide.edit-accommodation.goal': 'Move a stay, correct its times, or take it out of the plan again.',
  'help.guide.edit-accommodation.step.1':
    'On every day of the stay the card shows the property, the check-in window, the check-out time and the confirmation number.',
  'help.guide.edit-accommodation.step.2':
    'The pencil at its right opens the stay again. The popup now reads Edit accommodation.',
  'help.guide.edit-accommodation.step.3':
    'Correct the row of fields: Check-in, Until, Check-out and Confirmation. The days above it and the property below it can be changed here too.',
  'help.guide.edit-accommodation.step.4': 'Click Save.',
  'help.guide.edit-accommodation.step.5':
    'The X next to the pencil ends the stay. It asks nothing, and the Hotel booking that belongs to it goes with it.',
  'help.guide.edit-accommodation.result':
    'The change reaches every day the stay covers at once, and the Hotel booking under Bookings with it.',
  'help.guide.edit-accommodation.tip.1':
    'A night in the middle of a stay carries no Check-in and no Check-out label: only the first and the last day of the range do.',
  'help.guide.edit-accommodation.tip.2':
    'Cancelling a stay also takes the stop it put on the check-in day and any cost attached to its booking. Book the night again if it was a mistake.',
  // day-bookings
  'help.guide.day-bookings.title': 'The day’s bookings at a glance',
  'help.guide.day-bookings.goal': 'See in one place what is already booked for this day and whether it is confirmed.',
  'help.guide.day-bookings.step.1':
    'Reservations lists the bookings of the day: the ones dated on it, and the ones hanging off one of its stops.',
  'help.guide.day-bookings.step.2':
    'A row shows what kind of booking it is, its name and, when it belongs to a stop, that stop after a dot. Its times sit at the right end.',
  'help.guide.day-bookings.step.3':
    'The colour says where a booking stands: a green row is confirmed, an amber one is still pending. Hotels are not in this list, they have their own block below.',
  'help.guide.day-bookings.step.4':
    'The list only reads the bookings out. A booking is created and changed under Bookings.',
  'help.guide.day-bookings.result':
    'Everything dated on the day, and everything hanging off one of its stops, is in this one list.',
  'help.guide.day-bookings.tip.1':
    'A booking lands on a day by its own date. Change the date under Bookings and it moves to the other day by itself.',
  'help.guide.day-bookings.tip.2':
    'No Reservations block means the day has no bookings: it is hidden rather than shown empty.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Map',
  'help.ctx.trip-map.summary':
    'The middle of the plan: every place of the trip as a pin, the routes that join them, and the switches along the edges of the map for satellite, for the whole trip at once and for the places around the part of town you are looking at.',
  'help.ctx.trip-map.bullet.1':
    'A pin is a place: its own photo when it has one, otherwise its category colour with the category icon. Rest the pointer on one for a card with its name and its address, plus its category and its rating where the place carries them. Drag a pin onto a day card to plan the place there.',
  'help.ctx.trip-map.bullet.2':
    'Pins too close together to tell apart fold into one dark bubble with a count. Click the bubble and the map zooms to what is inside.',
  'help.ctx.trip-map.bullet.3':
    'Click a pin to open the place under the map, with its rating, its files and what to do with it next; click an empty piece of the map to let it go again.',
  'help.ctx.trip-map.bullet.4':
    'With a day open in the days column, its stops carry a small white badge with their number in that day, and a place planned on two days carries both numbers, joined by ·.',
  'help.ctx.trip-map.bullet.5':
    'The row of icons at the top searches the part of the map you can see: Restaurants, Cafés, Bars & nightlife, Accommodation, Sights, Museums & culture, Nature & parks and Activities. Search this area runs it again after you move the map.',
  'help.ctx.trip-map.bullet.6':
    'Right-click anywhere on the map to open the place form at that point, with the address already looked up. The round button at the bottom left swaps the drawn map for aerial imagery.',
  'help.ctx.trip-map.bullet.7':
    'Show whole trip at the bottom right draws every travel day at once and lists what each one covers; the route icon on a booking’s row draws that booking, and the one in the toolbar above the days draws them all.',
  'help.ctx.trip-map.bullet.8':
    'With the Dawarich addon on, the round Dawarich button under Show whole trip draws the route your phone actually recorded: Show recorded route lays it dashed under the planned route, one colour per day, and the button’s label says why there is no line when there is none.',
  // map-markers
  'help.guide.map-markers.title': 'Read the map',
  'help.guide.map-markers.goal': 'Know what every pin, badge and bubble on the map is telling you.',
  'help.guide.map-markers.step.1':
    'The map holds every place of the trip. Where pins sit too close together to tell apart they fold into one dark bubble carrying the number inside it; click the bubble and the map zooms to what was in it, or, at the deepest zoom, fans the pins apart.',
  'help.guide.map-markers.step.2':
    'A pin is the place’s own photo when it has one, otherwise its category colour with the category icon. Rest the pointer on one and a card gives its name and its address, with its category and its rating where the place carries them.',
  'help.guide.map-markers.step.3':
    'Click a pin and the place opens in a card under the map: its coordinates, its rating, its files, and along the bottom what to do with it next, Navigation, Edit and Delete among them, with Add to Day while a day is open. Click an empty piece of the map to let it go again.',
  'help.guide.map-markers.step.4':
    'Open a day in the days column and its stops get numbered: the small white badge at a pin’s corner is that stop’s place in the day. A place planned on two days carries both numbers, joined by ·. Without a day open there are no numbers, and the corner carries the rating instead.',
  'help.guide.map-markers.step.5':
    'Drag a pin off the map onto a day card in the days column and the place is planned on that day, exactly as dragging its row out of the places list would.',
  'help.guide.map-markers.result':
    'Nothing on the trip has changed: the map is a view of it, and every pin says which place, which day and in which order.',
  'help.guide.map-markers.tip.1':
    'A day folded shut in the days column takes its stops off the map with it; open the day again and they are back.',
  'help.guide.map-markers.tip.2':
    'The filter above the places list decides what the map draws as well: pick Unplanned and only the places still without a day are left on it.',
  'help.guide.map-markers.tip.3':
    'There are no zoom buttons on this map: the wheel zooms, a double click zooms in a step, and dragging the map itself moves it.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Find places around you on the map',
  'help.guide.map-nearby-places.goal':
    'Let the map look for restaurants, sights or a hotel in the part of town you are looking at, and take one into the trip.',
  'help.guide.map-nearby-places.step.1':
    'The row of icons at the top of the map is the category search: Restaurants, Cafés, Bars & nightlife, Accommodation, Sights, Museums & culture, Nature & parks and Activities.',
  'help.guide.map-nearby-places.step.2':
    'Click a category. TREK looks for that kind of place in the part of the map you can see and drops a pin in the category’s colour for every hit. One category at a time: clicking another swaps it, and clicking the one that is on turns it off.',
  'help.guide.map-nearby-places.step.3':
    'Move the map and a second button appears under the row: Search this area runs the same search for the new view. Moving alone never searches again, which keeps the number of requests down.',
  'help.guide.map-nearby-places.step.4':
    'The pins carry the name of what they found. Click one and the place form opens already filled in from it: Name, Address, Latitude and Longitude, and the website and phone number where OpenStreetMap has them.',
  'help.guide.map-nearby-places.step.5':
    'Check what it filled in and add what the search could not know: a Description, a Category, notes of your own.',
  'help.guide.map-nearby-places.step.6':
    'Click Add. If a place of the same name is already in the trip, the form says so and the button turns into Add anyway.',
  'help.guide.map-nearby-places.result':
    'The place is in the places list and on the map as one of the trip’s own pins, under Unplanned until you put it on a day. The search pins stay until you switch the category off.',
  'help.guide.map-nearby-places.tip.1':
    'The row is gone when Explore places on the map is off in Settings, under Travel & map.',
  'help.guide.map-nearby-places.tip.2':
    'The answers come from the TREK Places index and from OpenStreetMap, so this is one of the few things on the plan that needs a connection.',
  'help.guide.map-nearby-places.tip.3':
    'A search covers what is on screen, so zoom in to the street you are asking about: a whole city answers with the first sixty hits and little order to them.',
  // map-add-place
  'help.guide.map-add-place.title': 'Create a place by right-clicking the map',
  'help.guide.map-add-place.goal': 'Put a place exactly where you want it, without searching for it first.',
  'help.guide.map-add-place.step.1':
    'Right-click the spot on the map you mean. The place form opens, titled Add Place/Activity.',
  'help.guide.map-add-place.step.2':
    'Latitude and Longitude are already at that point, and TREK looks the coordinates up and fills Address in from what it finds there, and the Name too where the look-up has one to give. Nothing is written yet, so overwrite whatever is wrong.',
  'help.guide.map-add-place.step.3':
    'Give it a Name you will recognise, and the rest of what the plan should know: Description, Notes, Category, Website.',
  'help.guide.map-add-place.step.4':
    'Click Add. The place lands in the list as unplanned even with a day open: a right-click on the map says where, not when.',
  'help.guide.map-add-place.result':
    'The place is in the list and on the map, under Unplanned until you put it on a day.',
  'help.guide.map-add-place.tip.1':
    'The address comes from a look-up of the coordinates, so it can read as a street rather than a name, and over open country it can come back empty. Both fields are yours to overwrite.',
  'help.guide.map-add-place.tip.2':
    'On the MapLibre GL and Mapbox GL maps a middle click does the same, and on a touch screen a long press.',
  // map-satellite
  'help.guide.map-satellite.title': 'Switch to satellite',
  'help.guide.map-satellite.goal': 'Swap the drawn map for aerial imagery, and back.',
  'help.guide.map-satellite.step.1':
    'The round button at the bottom left of the map is the base layer switch. Its icon always shows the layer it would move to, and hovering it says which: Switch to satellite view. Click it.',
  'help.guide.map-satellite.step.2':
    'The map is aerial imagery now, deep enough to make out a single building and without a key of your own. Everything TREK draws stays on top of it: the pins, the day’s route, the tracks and the booking routes.',
  'help.guide.map-satellite.step.3': 'The button now reads Switch to map view. Click it to go back to the drawn map.',
  'help.guide.map-satellite.result':
    'The map is drawn again, and the layer you left it on is remembered on your account.',
  'help.guide.map-satellite.tip.1':
    'The choice is kept on your account rather than on the trip, so every trip opens the way you left it, whichever map renderer you use.',
  'help.guide.map-satellite.tip.2':
    'The imagery carries no writing: street names, districts and house numbers are on the drawn map, so switch back when you are looking for an address.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'See the whole trip and its distances',
  'help.guide.map-whole-trip.goal':
    'Swap the one open day for every travel day of the trip, and read how far each one goes.',
  'help.guide.map-whole-trip.step.1':
    'The round Show whole trip button sits at the bottom right of the map. Click it and every travel day of the trip is drawn at once, each in its own colour over a white casing, so neighbouring days stay apart.',
  'help.guide.map-whole-trip.step.2':
    'The card above the button lists those days: a colour dot, the day’s name, an icon for each way you travel it, and the distance it covers. Total distance is at the top.',
  'help.guide.map-whole-trip.step.3':
    'Click a day in the card to select it, the same as picking it in the days column: the map frames that day, and its stops get their numbers back.',
  'help.guide.map-whole-trip.step.4':
    'The button now reads Hide whole trip. Press it to drop back to the one open day.',
  'help.guide.map-whole-trip.result':
    'Every travel day is drawn in its own colour, and the card says what each one covers and what the trip comes to.',
  'help.guide.map-whole-trip.tip.1':
    'The total arrives a few legs at a time. While an … follows it, the number is still a partial sum; it settles once every leg has answered.',
  'help.guide.map-whole-trip.tip.2':
    'A leg the router refuses stays a straight line and counts nothing, and the card says so rather than quietly reading low.',
  'help.guide.map-whole-trip.tip.3':
    'A day with fewer than two located stops has no route to draw, so it is left out of the card entirely.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Show a booking’s route on the map',
  'help.guide.map-booking-routes.goal':
    'Draw the flights, trains and drives you have booked on the map, and get them off it again.',
  'help.guide.map-booking-routes.step.1':
    'Booking routes are off until you ask for one. On a booking’s row in the days column sits a small route icon: Show booking routes.',
  'help.guide.map-booking-routes.step.2':
    'Click it and the booking appears on the map: a flight as a great circle arc, a drive along the real roads, a train as the chain of its stations. Confirmed is drawn solid, pending dashed, and the ends of the route are blue pills with the transport’s icon.',
  'help.guide.map-booking-routes.step.3':
    'Click an end pill and the booking behind it opens, with its times, its reference and where it starts. Close puts it away again.',
  'help.guide.map-booking-routes.step.4':
    'The route icon in the toolbar above the days does the whole trip at once: Show all booking routes draws every booking that has one.',
  'help.guide.map-booking-routes.step.5':
    'It is a clean slate rather than a layer on top, so whatever you picked booking by booking is dropped. Press it again, now reading Hide all booking routes, and the map is clear.',
  'help.guide.map-booking-routes.result':
    'The bookings you asked for are drawn on the map, and the choice is kept for this trip in this browser until you change it.',
  'help.guide.map-booking-routes.tip.1':
    'The ends carry the airport code or the station’s name only when Booking route labels is on in Settings, under Travel & map; otherwise they show the icon alone.',
  'help.guide.map-booking-routes.tip.2':
    'Always show booking routes, in the same settings, draws them from the start on every trip you have not already decided about.',
  'help.guide.map-booking-routes.tip.3':
    'A booking needs two ends with coordinates before it can be drawn, so a hotel or a restaurant carries no route icon.',

  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Show the route you actually travelled',
  'help.guide.map-dawarich-trail.goal':
    'Lay the route Dawarich recorded on your phone over the map, dashed beside the one you planned, and read the trip day by day as it really went.',
  'help.guide.map-dawarich-trail.step.1':
    'The round Dawarich button sits at the bottom right of the map, under Show whole trip; hovering it says Show recorded route. Click it. TREK asks your Dawarich for the trip’s dates, and a ring spins around the button while the answer is on its way.',
  'help.guide.map-dawarich-trail.step.2':
    'The recorded route lands as a dashed line, one colour per day, drawn underneath the planned route so the plan stays readable. The button now reads Hide recorded route. Days are cut at local midnight, and a day folded shut in the days column takes its dashed line off the map along with its stops.',
  'help.guide.map-dawarich-trail.step.3':
    'Click Show whole trip as well and every planned day is drawn solid beside the dashed recording. Where the two run together the day went as planned; where the dashed line wanders off is where it did not.',
  'help.guide.map-dawarich-trail.result':
    'What you planned and what you actually did are on the map together, dashed against solid, and the card above the buttons still lists the planned days and their distances.',
  'help.guide.map-dawarich-trail.tip.1':
    'On or off is remembered per trip for this browser session. While the route is on, TREK asks Dawarich again every two minutes, so a trip under way catches up without a reload; the route itself is never stored, so it is not in TREK’s database, not in backups and not there offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'The button’s label explains an empty map: Loading the recorded route… while it is on its way, Nothing was recorded on these dates, The recorded route could not be loaded, or The recorded route needs a connection when TREK is offline.',
  // map-compass
  'help.guide.map-compass.title': 'Turn the map and find north again',
  'help.guide.map-compass.goal':
    'Rotate the map to face the way you are going, and snap it back to north with one click.',
  'help.guide.map-compass.step.1':
    'Turn the map with a right-button drag, or hold Ctrl and drag with the left button; on a touch screen, twist with two fingers. The round compass next to the row of category icons at the top of the map turns with it: its arrow always points north, so it leans as far as you have turned.',
  'help.guide.map-compass.step.2':
    'Click the compass. Reset north, as the button is called, eases the map back to north at the top and to a flat view, and the arrow stands upright again.',
  'help.guide.map-compass.result':
    'The map is north-up and level again, and nothing on the trip has changed: the compass only moves the camera.',
  'help.guide.map-compass.tip.1':
    'The compass exists on the MapLibre GL and Mapbox GL maps only; the Leaflet map cannot be turned, so it has none. Map Provider in Settings, under Map, decides which one you use, and Save Map keeps the choice.',
  'help.guide.map-compass.tip.2':
    'The click also takes the tilt out: a right-button drag up or down pitches the view, and Reset north levels it along with the turn. On Mapbox GL with 3D Buildings & Terrain on, that flattens the 3D view too, until you tilt it again.',
  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transports',
  'help.ctx.trip-transports.summary':
    'Everything that carries you between the stops: flights, trains, buses, cars, taxis, bicycles, cruises, ferries and the public-transit connections TREK looks up for you. The tab is the list of them; they are made and read on the plan as well, and drawn on the map.',
  'help.ctx.trip-transports.bullet.1':
    'The tab holds the rides only. Accommodation, restaurants, events and tickets live on Bookings, so the same entry never shows up twice.',
  'help.ctx.trip-transports.bullet.2':
    'The toolbar counts them all under All and gives every type in use its own chip with its own count, Flight, Train, Car, Public transit. Transport at the right adds one by hand.',
  'help.ctx.trip-transports.bullet.3':
    'The cards come in three groups, each foldable by its heading: Automated public transit for the connections the search planned, then Pending, then Confirmed.',
  'help.ctx.trip-transports.bullet.4':
    'A card carries the status, the type, the days it spans, the times, the Booking Code, the route and the airline and flight number or the train number, platform and seat. The pencil opens it, the bin deletes it after a question.',
  'help.ctx.trip-transports.bullet.5':
    'Transports are made on the plan too: every day header has a plus for Add transport and a tram button for Public transit, and the travel-time connector between two stops opens the same search for that one leg.',
  'help.ctx.trip-transports.bullet.6':
    'A transport with both ends set draws a line on the map. The route icon on its row in the day plan switches that line on, and Show all booking routes in the toolbar above the days flips the whole trip.',
  // transports-list
  'help.guide.transports-list.title': 'Read the Transports tab',
  'help.guide.transports-list.goal': 'Know what the list tells you before you change anything on it.',
  'help.guide.transports-list.step.1':
    'Transports is the second tab of the trip. It holds the rides only: hotels, restaurants, events and tickets are on Bookings.',
  'help.guide.transports-list.step.2':
    'The toolbar counts every transport under All and gives each type in use its own chip with its own count. Click a chip to keep only that type, click it again to let it go. Several chips can be on at once, and All clears them.',
  'help.guide.transports-list.step.3':
    'Automated public transit is a group of its own, the connections the transit search planned. Pending and Confirmed hold everything entered by hand. The arrow next to a heading folds a group away.',
  'help.guide.transports-list.step.4':
    'A card says it all: the status dot with Pending or Confirmed, the type, the days it spans with their dates, the times, the Booking Code, the route, and the airline and flight number or the train number, platform and seat.',
  'help.guide.transports-list.step.5':
    'The pencil opens the transport for editing, the bin deletes it, after a question that names what goes.',
  'help.guide.transports-list.result':
    'The list is narrowed to what you were after, and every card says at a glance whether the ride is booked.',
  'help.guide.transports-list.tip.1':
    'The chips and the folded groups are remembered per trip, so the tab opens again the way you left it.',
  'help.guide.transports-list.tip.2':
    'Import from file and AirTrail join Transport in the toolbar only when the server can read booking confirmations and when an AirTrail instance is connected. Without them the list is filled by hand and by the transit search.',
  // add-transport
  'help.guide.add-transport.title': 'Add a transport to a day',
  'help.guide.add-transport.goal': 'Put the ride that gets you from one stop to the next into the day it happens on.',
  'help.guide.add-transport.step.1':
    'Every day header carries four small buttons at its right. Click the plus, whose tooltip reads Add transport. The form opens with Date already set to that day.',
  'help.guide.add-transport.step.2':
    'Booking Type picks what you are taking: Flight, Train, Bus, Car, Taxi, Bicycle, Cruise, Ferry or Other. The form follows. A flight gets an airport on every leg, a train a chain of stations, a car the Pickup and Return wording and Stops along the way.',
  'help.guide.add-transport.step.3':
    'Title is the only field that has to be filled; Add stays grey without it. Write what you would recognise on a platform board.',
  'help.guide.add-transport.step.4':
    'From and To search a station, a port or an address. Type at least three letters and pick a result from the list. A name that was only typed carries no coordinates, so it draws nothing on the map.',
  'help.guide.add-transport.step.5':
    'Date and Start time say when it runs, End date and End time when it is over; a ride that lands the next day takes the next day there. Booking Code, Status with Pending or Confirmed, and Notes are optional.',
  'help.guide.add-transport.step.6': 'Click Add.',
  'help.guide.add-transport.result':
    'The transport is a row on the day, at its time among the stops, and a card in the Transports tab under Pending or Confirmed.',
  'help.guide.add-transport.tip.1':
    'The row lands where its start time puts it, after the last stop that starts earlier. Its grip drags it anywhere else in the day, or onto another day.',
  'help.guide.add-transport.tip.2':
    'Attach file under Files takes the ticket, and Create expense under Costs saves the booking and opens the Costs editor for the fare.',
  'help.guide.add-transport.tip.3':
    'Travelers marks who is on this ride. As soon as one transport has travelers, the toolbar of the tab grows their avatars and filters the list by them.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Read a flight out of its e-ticket',
  'help.guide.import-transport-file.goal':
    'Let TREK pull a flight, a train or a ferry out of the ticket the carrier sent, and check it before it is saved.',
  'help.guide.import-transport-file.step.1':
    'Click Import from file in the toolbar of the Transports tab, next to Transport. Import booking confirmations opens, the same dialog the Bookings tab has.',
  'help.guide.import-transport-file.step.2':
    'Drop the ticket on the box, or click it and pick it: EML, PDF, PKPass, HTML and TXT, up to five files of 10 MB each. The files you chose are named on the box.',
  'help.guide.import-transport-file.step.3':
    'Click Import. The dialog closes at once; the reading happens in the background.',
  'help.guide.import-transport-file.step.4':
    'A card at the bottom right reports the run under the file’s name. Parsing files… turns into a tick when the reading is done, and the card offers Import. Click it.',
  'help.guide.import-transport-file.step.5':
    'A flight opens in Add transport, already filled in: Booking Type on Flight, the airline and the flight number in Title, both airports under Route with Departure and Arrival, their times and their time zones, Airline and Flight No., the Booking Code and the ticket under Files. Check it and click Add.',
  'help.guide.import-transport-file.result':
    'The flight is a card in Pending on the Transports tab and a row on the day it leaves, with the ticket under Files, and with both airports known it draws its curve on the map.',
  'help.guide.import-transport-file.tip.1':
    'The two tabs share one import: a file that holds a flight and a hotel opens the flight in Add transport and the hotel in New Reservation, one after the other, whichever tab you started from.',
  'help.guide.import-transport-file.tip.2':
    'Airports are placed by their code. A station or a port the reading could not locate is named in amber on the card; pick it by hand under Route before you click Add, or the transport draws nothing on the map.',
  // plan-transit
  'help.guide.plan-transit.title': 'Plan a public-transit connection',
  'help.guide.plan-transit.goal':
    'Let TREK look up the real trains and buses between two points of a day and put the one you pick into the plan.',
  'help.guide.plan-transit.step.1':
    'In the day header, click the tram button, Public transit. The search opens for that day.',
  'help.guide.plan-transit.step.2':
    'From and To take a stop or a station. With the box still empty the day’s own stops and the trip’s accommodations are offered; typing two letters searches the timetable’s stations instead. Swap between the two boxes turns the connection round.',
  'help.guide.plan-transit.step.3':
    'Depart or Arrive with a time says when you want to travel, and Best route, Fewer transfers or Less walking says how the answers should be ordered.',
  'help.guide.plan-transit.step.4':
    'The chips below say which modes may be used: Train, Subway, Tram, Bus, Ferry and Cable car. Switch one off to leave it out, at least one stays on. Then click Search.',
  'help.guide.plan-transit.step.5':
    'Each result gives departure and arrival, how long it takes, how many transfers and how much walking, and the lines in their own colours. Click one to unfold it stop by stop, with the platforms and the walks between the lines.',
  'help.guide.plan-transit.step.6': 'Click Add to day.',
  'help.guide.plan-transit.result':
    'The connection is a row on the day with its lines, its transfers and its walking time, and a card in the Transports tab under Automated public transit.',
  'help.guide.plan-transit.tip.1':
    'The connections come from Transitous, a free community service over public timetable data: no key, no account. An admin can point the search at Google instead.',
  'help.guide.plan-transit.tip.2':
    'Nothing found? The feeds cover a region and a period. Try another time, switch more modes on, or pick a station rather than the place itself. The message names the service that answered.',
  'help.guide.plan-transit.tip.3':
    'The same search opens for a single leg: click the travel-time connector between two stops and choose Public transit. From, To and the departure time are filled in for you.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Open and change a planned connection',
  'help.guide.change-transit-route.goal': 'Read the connection stop by stop, rename it, or look the route up again.',
  'help.guide.change-transit-route.step.1':
    'In the Transports tab the planned connections sit under Automated public transit. Click the card.',
  'help.guide.change-transit-route.step.2':
    'Duration, Transfers and Walking sit at the top. Itinerary below them walks the connection stop by stop, with the platforms and the walks between the lines.',
  'help.guide.change-transit-route.step.3':
    'Change route runs the search again, already filled with this connection’s two ends and its day.',
  'help.guide.change-transit-route.step.4':
    'Pick another connection and click Add to day; it takes the old one’s place. Edit details, next to Change route, opens the ordinary transport form instead, where the Booking Code, the Status, the travelers and the files live.',
  'help.guide.change-transit-route.result':
    'The journey carries the new itinerary, and its card in the Transports tab shows the new lines and times.',
  'help.guide.change-transit-route.tip.1':
    'The journey’s title is only text: the pencil next to it renames it without touching the route. Notes underneath take markdown and have an Edit and a Preview tab.',
  'help.guide.change-transit-route.tip.2':
    'Delete at the foot of the journey takes the connection out of the trip; the day keeps its stops.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Change how one leg is travelled',
  'help.guide.leg-travel-mode.goal':
    'Walk one leg of a day that is otherwise driven, or hand that leg to the transit search.',
  'help.guide.leg-travel-mode.step.1':
    'The connectors between the stops only appear once the day’s route is on. Click the day to open it, then Route under its stops.',
  'help.guide.leg-travel-mode.step.2':
    'Each connector names the travel time and the distance of that leg, with the icon of the mode it was routed in: a car for driving, a foot for walking.',
  'help.guide.leg-travel-mode.step.3':
    'Click the connector. The menu offers Driving and Walking, Public transit, and Use day default.',
  'help.guide.leg-travel-mode.step.4': 'Choose Walking. Only this leg changes; the rest of the day keeps its own mode.',
  'help.guide.leg-travel-mode.result':
    'The leg shows the foot icon and its walking time, and the day’s other legs keep the day’s mode.',
  'help.guide.leg-travel-mode.tip.1':
    'The mode belongs to the leg, not to the day: the Driving and Walking buttons of the whole day never overwrite a leg you set by hand. Use day default gives the leg back to them.',
  'help.guide.leg-travel-mode.tip.2':
    'Public transit in the same menu opens the connection search for exactly this leg, with both ends and the departure time already filled in.',
  'help.guide.leg-travel-mode.tip.3':
    'The times come from a public router over real roads and footpaths. A leg it cannot answer keeps its straight line and shows no time.',
  // edit-transport
  'help.guide.edit-transport.title': 'Change or delete a transport',
  'help.guide.edit-transport.goal': 'Fix a time, a platform or a booking code, or take the ride out of the trip.',
  'help.guide.edit-transport.step.1': 'In the day plan a transport is a coloured row between the stops. Click it.',
  'help.guide.edit-transport.step.2':
    'The form is the one that created it, with Edit transport in its title bar. Everything can be changed: the type, the route, the days and times, the Booking Code, the Status.',
  'help.guide.edit-transport.step.3':
    'A flight’s route is a chain of airports, a train’s a chain of stations. Add stop puts another one in between, and every leg keeps its own times and its own flight or train number.',
  'help.guide.edit-transport.step.4':
    'Click Update. To remove the transport altogether, use the bin on its card in the Transports tab and confirm.',
  'help.guide.edit-transport.result':
    'The change shows everywhere the transport appears: the Transports tab, the day it runs on, and its line on the map.',
  'help.guide.edit-transport.tip.1':
    'The same form opens from both sides, the pencil on the card in the Transports tab and the transport’s own row in the day plan. A planned public-transit connection is the exception: its row opens the journey view, and Edit details there leads to this form.',
  'help.guide.edit-transport.tip.2':
    'Moving a transport to another day does not need the form at all: drag its row from one day card to the next.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Draw a transport on the map',
  'help.guide.transport-on-map.goal': 'See where a flight, a drive or a connection actually goes.',
  'help.guide.transport-on-map.step.1':
    'A transport with both ends set carries a small route icon on its row in the day plan. Click it; its label turns into Hide booking routes.',
  'help.guide.transport-on-map.step.2':
    'The route is drawn on the map, with a pill marker at each end carrying the transport’s icon.',
  'help.guide.transport-on-map.step.3':
    'Click an end marker to read the booking without leaving the map: the times, the airline and flight number, the Booking Code and the address. Close puts the sheet away.',
  'help.guide.transport-on-map.step.4':
    'The route icon in the toolbar above the days does the whole trip at once: Show all booking routes, and Hide all booking routes to clear them again.',
  'help.guide.transport-on-map.step.5':
    'A planned public-transit connection has no icon of its own. It is drawn with the day’s Route toggle, which is why Hide all booking routes does not clear it while that day’s route is still on.',
  'help.guide.transport-on-map.result':
    'The routes are on the map with a marker at each end, and they stay there until you switch them off again.',
  'help.guide.transport-on-map.tip.1':
    'A flight, a cruise and a ferry draw as a curve, a car, a bus, a taxi and a bicycle follow the real roads, and a train or a planned connection runs through the stations it calls at.',
  'help.guide.transport-on-map.tip.2':
    'A confirmed booking is a solid line, a pending one a dashed one. The Booking route labels setting prints the airport code or the station name into the end markers.',
  'help.guide.transport-on-map.tip.3':
    'Show all booking routes is a clean slate, not a layer: it discards what the single icons had set, so pressing it twice leaves you with everything on or everything off.',

  // airtrail-import
  'help.guide.airtrail-import.title': 'Import flights from AirTrail',
  'help.guide.airtrail-import.goal':
    'Bring the flights you already keep in AirTrail into the trip in one go, and let them follow AirTrail from then on.',
  'help.guide.airtrail-import.step.1':
    'With the AirTrail addon on and your instance connected under Integrations in Settings, the toolbar of the Transports tab carries an AirTrail button beside Transport. Click it.',
  'help.guide.airtrail-import.step.2':
    'Import from AirTrail lists the flights of your account in two groups. During this trip holds the ones dated inside the trip, already ticked; Other flights holds the rest, unticked. A flight that is in the trip already is greyed out and marked Imported.',
  'help.guide.airtrail-import.step.3':
    'Every row is a tick box with the airline and flight number, the two airports and the date. Click a row to take the flight in or to leave it out; the ones under Other flights come in only when you tick them.',
  'help.guide.airtrail-import.step.4':
    'Flights that connect, each leaving from the airport the one before landed at within a day, are framed together. The tick underneath, Import as one flight with a layover in that airport, is on already: leave it on for one booking with a stop, or switch it off to import the legs as separate flights.',
  'help.guide.airtrail-import.step.5':
    'Click Import. The button counts the ticked flights, and the message afterwards says how many came in.',
  'help.guide.airtrail-import.step.6':
    'The flights are cards under Confirmed, each with a blue AirTrail badge beside its status, and rows on the days they run. A joined connection is one card, with its route running through the layover.',
  'help.guide.airtrail-import.result':
    'The flights from AirTrail are cards in the Transports tab and rows on their days, each wearing the AirTrail badge that says where it came from.',
  'help.guide.airtrail-import.tip.1':
    'A flight that is in the trip already under the same number and date is skipped, and a message says how many were. Undo in the toolbar above the days takes the whole import back.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail stays the source of truth. TREK reads its changes when you open the trip and every few minutes in the background; a flight deleted there keeps its card, with the badge turned to Not synced. Edits made in TREK travel back only with Write changes back to AirTrail switched on under Integrations.',
  'help.guide.airtrail-import.tip.3':
    'A joined connection has no single AirTrail flight to follow, so it is a one-time import: it keeps the blue badge, and hovering the badge says so. The same happens to a synced flight you give a stop by hand.',
  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Bookings',
  'help.ctx.trip-bookings.summary':
    'The tab that holds everything booked for the trip that is not a way of getting about: the places to stay, the tables, the tickets, the tours, the parking. Every booking is a card in Pending or in Confirmed, carrying its code, its document, its travellers and its cost.',
  'help.ctx.trip-bookings.bullet.1':
    'Manual Booking at the top right opens the form. The six kinds it makes are Accommodation, Restaurant, Event, Tour, Parking and Other; flights, trains and the rest live on the Transports tab and never appear here.',
  'help.ctx.trip-bookings.bullet.2':
    'Import from file hands a confirmation to the parser: EML, PDF, PKPass, HTML or TXT, five files of 10 MB at most. The button is only there when the server can read them.',
  'help.ctx.trip-bookings.bullet.3':
    'The chips beside the heading filter by type, each with its own count, and All brings everything back. Once a booking names people, the row of avatars next to the chips narrows the tab to one of them.',
  'help.ctx.trip-bookings.bullet.4':
    'The cards stand in two sections, Pending and Confirmed, each with its count. A click on a section heading folds it away, and whether it is open is remembered for this trip.',
  'help.ctx.trip-bookings.bullet.5':
    'A card carries the status dot, the type, the title, the dates and times, the Booking Code, the Location / Address, what the booking is linked to, its Link, Notes, Files and Travelers.',
  'help.ctx.trip-bookings.bullet.6':
    'The pencil on a card opens the same form again; the bin asks once and then the booking is gone. With an accommodation its nights in the day plan and its linked expense go with it.',
  // create-booking
  'help.guide.create-booking.title': 'Create a booking',
  'help.guide.create-booking.goal':
    'Put a restaurant, an event, a tour, a parking space or anything else into the trip by hand.',
  'help.guide.create-booking.step.1': 'Click Manual Booking at the top right of the tab. New Reservation opens.',
  'help.guide.create-booking.step.2':
    'Pick the Booking Type from the list at the top of the form, next to Travelers. Accommodation, Restaurant, Event, Tour, Parking and Other are the six this tab makes, and the form changes with the choice: only Accommodation trades its dates for a range of days.',
  'help.guide.create-booking.step.3':
    'Type the Title. It is the one field the form insists on, and Add stays dead until it has something.',
  'help.guide.create-booking.step.4':
    'Set Date and Start time, and End date and End time if the booking has an end. The calendars only offer days inside the trip, and an end that is not after the start says so in red and blocks Add.',
  'help.guide.create-booking.step.5':
    'Put in the Booking Code from the confirmation and set Status. Pending or Confirmed decides which of the two sections the card lands in.',
  'help.guide.create-booking.step.6': 'Click Add.',
  'help.guide.create-booking.result':
    'The booking is a card in its section with its type chip, its dates and its code, and everyone else in the trip sees it appear.',
  'help.guide.create-booking.tip.1':
    'Location / Address offers real addresses while you type; picking one replaces what you wrote, and an address you typed yourself is kept as it is.',
  'help.guide.create-booking.tip.2':
    'Link takes the booking’s own page at the provider. The card turns it into a link that opens in a new tab.',
  'help.guide.create-booking.tip.3': 'Notes are Markdown, so a list or a bold line is rendered as one on the card.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Book a place to stay',
  'help.guide.booking-hotel.goal':
    'Enter an accommodation so it counts as a booking and as nights in the day plan at once.',
  'help.guide.booking-hotel.step.1':
    'Click Manual Booking and choose Accommodation. The date fields go and a block of hotel fields takes their place.',
  'help.guide.booking-hotel.step.2':
    'Pick the hotel under Accommodation. The list is the trip’s own places, and picking one writes its name into Title and its address into Location / Address.',
  'help.guide.booking-hotel.step.3':
    'Set From and To: the first night and the morning you leave. Both offer the days of the trip with their dates, and the two keep each other in order.',
  'help.guide.booking-hotel.step.4':
    'Fill in Check-in, Check-in until and Check-out, and the Booking Code from the confirmation.',
  'help.guide.booking-hotel.step.5': 'Click Add.',
  'help.guide.booking-hotel.result':
    'The card carries a range of days instead of a date, with the check-in and check-out times and the address, and the same stay now sits on those days of the plan.',
  'help.guide.booking-hotel.tip.1':
    'Accommodation is the one type without a Date and a Start time. Its dates are From and To, and they are days of the trip rather than a calendar.',
  'help.guide.booking-hotel.tip.2':
    'Leave Accommodation empty and type the address instead: the place is looked up, created and pinned on the map for you.',
  'help.guide.booking-hotel.tip.3': 'Deleting the booking takes the nights out of the day plan with it.',
  // link-booking
  'help.guide.link-booking.title': 'Tie a booking to the plan',
  'help.guide.link-booking.goal':
    'Hang a booking off the stop and the place it belongs to, so it turns up where you will want it.',
  'help.guide.link-booking.step.1': 'Click the pencil on the card you want to link. Edit Reservation opens.',
  'help.guide.link-booking.step.2':
    'Open Link to day assignment. The list is your plan: a heading per day, then that day’s stops, numbered and with their times. Pick the one the booking belongs to.',
  'help.guide.link-booking.step.3':
    'Place / Activity links the place itself. Pick it there, and Title and Location / Address fill in wherever you left them empty.',
  'help.guide.link-booking.step.4': 'Click Update.',
  'help.guide.link-booking.result':
    'The card names the day and the stop under Link to day assignment, and the booking rides along with that stop in the day plan.',
  'help.guide.link-booking.tip.1':
    'No link (standalone) at the top of the list takes the link off again. Accommodation has no stop picker at all: it links through its nights.',
  'help.guide.link-booking.tip.2':
    'Picking a stop on a dated day fills an empty Date for you. A date you have already set is left alone.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Say who a booking is for',
  'help.guide.booking-travelers.goal': 'Mark the travellers a booking covers, and then see only theirs.',
  'help.guide.booking-travelers.step.1':
    'Open the booking with the pencil. Travelers sits at the top of the form, next to Booking Type, and reads Assign travelers while nobody is on the booking.',
  'help.guide.booking-travelers.step.2':
    'Click it and pick the people this booking is for; named guests are in the list too. A chosen one gets a tick and their avatar in the field. Click the name again to take it off.',
  'help.guide.booking-travelers.step.3': 'Click Update.',
  'help.guide.booking-travelers.step.4':
    'Up in the toolbar, next to the type chips, click a traveller’s avatar to see only their bookings.',
  'help.guide.booking-travelers.result':
    'The card lists the people it is for, and the avatar row narrows the tab to one of them.',
  'help.guide.booking-travelers.tip.1':
    'On the card the travellers are only shown, never changed. They are set here, in the form.',
  'help.guide.booking-travelers.tip.2':
    'The avatar row appears once the trip has more than one member and at least one booking names somebody. What you pick lasts for this browser session.',
  // booking-files
  'help.guide.booking-files.title': 'Keep the voucher with the booking',
  'help.guide.booking-files.goal': 'Attach the confirmation, the ticket or the pass to the booking it belongs to.',
  'help.guide.booking-files.step.1':
    'Open the booking with the pencil, go down to Files and click Attach file. On a booking that already exists the document goes up at once and TREK says File uploaded.',
  'help.guide.booking-files.step.2': 'The document is listed by its name, with a button to open it and an X beside it.',
  'help.guide.booking-files.step.3':
    'Link existing file offers the documents of the trip that are not on this booking yet. Pick one and it is attached without uploading anything again.',
  'help.guide.booking-files.step.4': 'Click Update.',
  'help.guide.booking-files.result': 'The card lists the documents under Files, and a click on one of them opens it.',
  'help.guide.booking-files.tip.1':
    'On a booking you are still creating the document waits and goes up the moment you click Add.',
  'help.guide.booking-files.tip.2':
    'The X next to a document takes the link away, not the document. It stays in the trip’s Files tab.',
  'help.guide.booking-files.tip.3':
    'Which kinds of file may be attached is the administrator’s list; documents, text and pictures are allowed out of the box.',
  // booking-cost
  'help.guide.booking-cost.title': 'Turn a booking’s price into a cost',
  'help.guide.booking-cost.goal': 'Get what a booking costs into Costs, split between the people paying for it.',
  'help.guide.booking-cost.step.1':
    'Open the booking and go to the foot of the form. Under Costs stand Create expense and Link existing expense, with the note Saves the booking, then opens the Costs editor.',
  'help.guide.booking-cost.step.2':
    'Click Create expense. The booking is saved, its form closes and the Costs editor opens.',
  'help.guide.booking-cost.step.3':
    'What was it for? is already the booking’s title. Put in the Total amount and check the Currency and the Day.',
  'help.guide.booking-cost.step.4':
    'Category is the one the booking type implies. Set Who paid? and how the amount is split.',
  'help.guide.booking-cost.step.5': 'Click Add expense.',
  'help.guide.booking-cost.result':
    'The booking’s form now lists the expense under Linked expenses with its amount, and the same expense stands in the Costs tab, tied to this booking.',
  'help.guide.booking-cost.tip.1':
    'The category follows the type: Restaurant becomes Food & drink, Accommodation becomes Accommodation, Parking becomes Parking, and Event and Tour both land in Other.',
  'help.guide.booking-cost.tip.2':
    'A booking can carry several expenses. Link existing expense offers the ones in Costs that belong nowhere yet. On a linked one, Unlink, keep the expense lets it go and leaves it in Costs, while the bin removes it.',
  'help.guide.booking-cost.tip.3':
    'Costs is in the form only while the Costs addon is on, which the administrator switches under Addons.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Find a booking',
  'help.guide.filter-bookings.goal': 'Narrow a long tab down to the type, the person or the state you are after.',
  'help.guide.filter-bookings.step.1':
    'The chips beside the heading are the types this trip actually uses, each with the number it holds. All is the whole tab.',
  'help.guide.filter-bookings.step.2': 'Click a chip to keep only that type. Click a second and both are kept.',
  'help.guide.filter-bookings.step.3': 'All puts everything back.',
  'help.guide.filter-bookings.step.4':
    'The avatars next to the chips filter by traveller, one person or several at once.',
  'help.guide.filter-bookings.step.5':
    'Pending and Confirmed are the two sections, each with its count. Click a heading to fold one away; it is still folded when you come back.',
  'help.guide.filter-bookings.result':
    'The tab shows only what you picked, and it is still picked when you come back to it in this browser session.',
  'help.guide.filter-bookings.tip.1':
    'The chips only offer the types the trip has, so a trip without a single tour has no Tour chip.',
  'help.guide.filter-bookings.tip.2':
    'A filter that matches nothing leaves the tab empty with No places found. The wording is the places list’s; the meaning is the same.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Read a booking out of its confirmation',
  'help.guide.import-booking-file.goal':
    'Let TREK pull the booking out of the mail or the PDF the provider sent, instead of typing it again.',
  'help.guide.import-booking-file.step.1': 'Click Import from file in the toolbar. Import booking confirmations opens.',
  'help.guide.import-booking-file.step.2':
    'Drop the confirmations on the box, or click it and pick them: EML, PDF, PKPass, HTML and TXT, up to five files of 10 MB each. The ones you chose are named on the box.',
  'help.guide.import-booking-file.step.3':
    'Click Import. The dialog closes at once, because the reading happens in the background.',
  'help.guide.import-booking-file.step.4':
    'A card at the bottom right reports the run under the file’s name, and it follows you through the app and through a reload. Parsing files… turns into a tick when the reading is done, and the card offers Import. Click it.',
  'help.guide.import-booking-file.step.5':
    'Every booking that was found opens in New Reservation, one after another, already filled in. For a hotel that is the name in Title and, when the trip has the place, under Accommodation, its Location / Address, From and To on its nights, Check-in and Check-out, the Booking Code, the confirmation under Files and, with Costs on, the price as Linked expense. Check it and click Add.',
  'help.guide.import-booking-file.result':
    'The booking is a card in Pending with its nights, its code and the confirmation under Files, the stay sits on those days of the plan, and with Costs on the price is an expense tied to it.',
  'help.guide.import-booking-file.tip.1':
    'Import from file is there only when the server can read confirmations, which takes either the extractor or the AI Parsing addon. The administrator switches that one under Addons.',
  'help.guide.import-booking-file.tip.2':
    'If nothing could be read the card says so and offers Try AI parsing, which sends the same files straight to the model. A finished parse is kept for ten minutes; start the review inside that window.',
  'help.guide.import-booking-file.tip.3':
    'The confirmation is attached only when its type is on the Allowed File Types of the admin settings. PDF is there out of the box; a mail, EML, has to be added first, or the booking is saved without it.',
  // edit-booking
  'help.guide.edit-booking.title': 'Change a booking',
  'help.guide.edit-booking.goal':
    'Correct a time, add the code that arrived later, or move a booking from Pending to Confirmed.',
  'help.guide.edit-booking.step.1':
    'Click the pencil in the card’s header. Edit Reservation opens with everything the booking knows.',
  'help.guide.edit-booking.step.2': 'Change what needs changing, here the Booking Code the operator finally sent.',
  'help.guide.edit-booking.step.3': 'Put Status on Confirmed.',
  'help.guide.edit-booking.step.4': 'Click Update.',
  'help.guide.edit-booking.result':
    'The card moves: a confirmed booking stands in the Confirmed section behind a green dot, and everyone in the trip sees it move.',
  'help.guide.edit-booking.tip.1':
    'A Booking Code you cannot read is Blur Booking Codes in Settings, under Display. Hover it, or click it, and it is legible.',
  'help.guide.edit-booking.tip.2':
    'Change the type and the category of a linked expense follows it, unless you had picked a category by hand in the Costs editor.',
  'help.guide.edit-booking.tip.3': 'An accommodation is edited here too: its From and To days are in the same form.',
  // delete-booking
  'help.guide.delete-booking.title': 'Delete a booking',
  'help.guide.delete-booking.goal': 'Take a booking that fell through out of the trip.',
  'help.guide.delete-booking.step.1': 'Click the bin in the card’s header.',
  'help.guide.delete-booking.step.2':
    'Delete booking? names the one you picked and says it will be permanently deleted.',
  'help.guide.delete-booking.step.3': 'Click Confirm.',
  'help.guide.delete-booking.result':
    'The card is gone, for everyone in the trip. A booking has no undo, so the question is the last stop.',
  'help.guide.delete-booking.tip.1':
    'Deleting an accommodation booking also takes its nights out of the day plan and removes the expense that was linked to it.',
  'help.guide.delete-booking.tip.2':
    'Documents that were attached stay in the trip’s Files tab; only their link to the booking goes.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Lists',
  'help.ctx.trip-lists.summary':
    'Two lists for one trip: the packing list, with who brings what and what it weighs, and the to-do list of everything that has to happen before and during it. The tab is there while the Lists addon is on.',
  'help.ctx.trip-lists.bullet.1':
    'Packing List and To-Do at the top switch between the two and count what is on each; the buttons on the right belong to whichever one is open.',
  'help.ctx.trip-lists.bullet.2':
    'The packing list is grouped into lists, Documents, Clothing, whatever you call them, each with a colour dot, a packed-of-total badge and three dots holding Rename, Check All, Uncheck All and Delete List. Add list in the bar above makes a new one.',
  'help.ctx.trip-lists.bullet.3':
    'A row is a tick box and a name, then who brings it, the quantity and the weight in grams as small badges and a bag circle while Bag Tracking is on, then the bin and three dots holding Move to List, Sharing, Rename and Delete. What a row does not use stays dimmed until you point at it, and the grip on the left drags it up or down inside its list.',
  'help.ctx.trip-lists.bullet.4':
    'Shared and My list split the packing list in two: the pool everyone sees, and your own. All, Open and Done narrow whichever one is open, and the bar above counts what is packed.',
  'help.ctx.trip-lists.bullet.5':
    'Apply template and Save as template fill or keep a list without typing it out, and the two icons beside them export the list, as a printout, a PDF or a file, and import one. The red button beside the progress bar names how many items are ticked and clears them away.',
  'help.ctx.trip-lists.bullet.6':
    'To-Do has a sidebar of its own: the progress card, the filters All, My Tasks, Overdue and Done, one row per list and Add list under them. The tasks sit in a card whose head names the filter and holds the sort, Priority or Due date. A click on a task opens it in the pane on the right, and Add new task opens the New task form over the middle of the screen.',
  // packing-categories
  'help.guide.packing-categories.title': 'Build the packing list',
  'help.guide.packing-categories.goal':
    'Group what you are taking into lists, fill them with items and say who looks after each list.',
  'help.guide.packing-categories.step.1':
    'Click Add list in the bar above the lists, type the name into List name (e.g. Clothing) and click Add.',
  'help.guide.packing-categories.step.2':
    'The new list starts with one empty row. Click Add item, type the item into Item name… and press Enter; the field stays open for the next one.',
  'help.guide.packing-categories.step.3':
    'Rename a row by clicking its name, or with Rename in the three dots at its right end.',
  'help.guide.packing-categories.step.4':
    'The dashed circle in the list header assigns trip members to the list. Pick a name; the chip that appears removes that person again on a click.',
  'help.guide.packing-categories.step.5':
    'The three dots at the end of the header hold the rest: Rename, Check All, Uncheck All, and Delete List, which takes the list and everything in it without asking again.',
  'help.guide.packing-categories.result':
    'The new list sits in the grid with its items under it and its colour dot, and its badge counts what is already packed.',
  'help.guide.packing-categories.tip.1':
    'A list is only its items. Delete the last one and the row turns into a placeholder so the list keeps its place and its colour; delete that row too and the list is gone.',
  'help.guide.packing-categories.tip.2':
    'Assigning someone to a list sends them a packing notification. It does not change who can see the items, that is Sharing, in a row’s three dots.',
  'help.guide.packing-categories.tip.3':
    'Two lists may carry the same name. TREK keeps them apart internally, so the names stay the way you typed them.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Tick things off while you pack',
  'help.guide.check-off-packing.goal': 'Mark what is in the bag, watch the bar, and clear the packed items away.',
  'help.guide.check-off-packing.step.1':
    'Click the box at the left of a row. The name is struck through and the bar moves.',
  'help.guide.check-off-packing.step.2':
    'The bar above counts what is packed against everything on the list, as a number and as a percentage.',
  'help.guide.check-off-packing.step.3':
    'A whole list at once: the three dots in its header hold Check All and Uncheck All.',
  'help.guide.check-off-packing.step.4':
    'All, Open and Done narrow the grid. Open leaves only what is still missing, so a list that is fully packed drops out of it.',
  'help.guide.check-off-packing.step.5':
    'Remove 3 checked beside the progress bar deletes every ticked item at once, after one confirmation from the browser.',
  'help.guide.check-off-packing.result':
    'Only what is still open is listed, and the bar above says how far along the packing is.',
  'help.guide.check-off-packing.tip.1': 'A ticked item can still be renamed: click its name.',
  'help.guide.check-off-packing.tip.2':
    'Check All and Uncheck All work on one list at a time, from that list’s own three dots.',
  'help.guide.check-off-packing.tip.3':
    'When every item is checked the counter is replaced by All packed! and the bar turns green.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Apply a packing template',
  'help.guide.apply-packing-template.goal':
    'Bring a ready-made list into the trip, and keep this trip’s list for the next one.',
  'help.guide.apply-packing-template.step.1': 'Click Apply template in the bar above the list.',
  'help.guide.apply-packing-template.step.2': 'Pick a template. Each line names it and says how many items it holds.',
  'help.guide.apply-packing-template.step.3':
    'The items land in the view you are in: Shared puts them in the pool everyone sees, My list makes them yours.',
  'help.guide.apply-packing-template.step.4':
    'Keep this trip’s list for the next trip: Save as template opens a dialog, type a name and click Save.',
  'help.guide.apply-packing-template.result':
    'The template’s lists and items are in the trip, next to what was already there.',
  'help.guide.apply-packing-template.tip.1':
    'A template only carries names and lists. Quantities, weights, bags and what is already ticked stay behind.',
  'help.guide.apply-packing-template.tip.2':
    'Apply template is only there once a template exists. Without one the button does not appear at all.',
  'help.guide.apply-packing-template.tip.3':
    'Save as template appears for an instance admin only, and only while the list has items. It saves the shared pool plus your own items, never another member’s private ones.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Paste a whole packing list in',
  'help.guide.import-packing-list.goal': 'Turn a list you already have somewhere else into packing items in one go.',
  'help.guide.import-packing-list.step.1': 'Click the import button with the down arrow in the bar above the list.',
  'help.guide.import-packing-list.step.2':
    'One item per line: Category, Name, Weight in g (optional), Bag (optional), checked/unchecked (optional). The grey sample in the box shows all four shapes. A Markdown list works too: a heading names the list, and "- [ ]" and "- [x]" become items.',
  'help.guide.import-packing-list.step.3':
    'Or load the lines from a file with Load CSV/TXT/MD. It takes a .csv, a .txt or a .md and replaces whatever is in the box.',
  'help.guide.import-packing-list.step.4': 'Click Import. The button counts the lines it understood.',
  'help.guide.import-packing-list.result':
    'Every line is a row, in the list its first field names, and nothing that was already there is touched.',
  'help.guide.import-packing-list.tip.1':
    'Commas, semicolons and tabs all separate fields, and double quotes hold a field together, so "Shirt, blue" stays one name. A line with a single value is just a name, a line with no list of its own lands in Other, and "3x" in front of a name sets the quantity.',
  'help.guide.import-packing-list.tip.2':
    'A bag named in the fourth field is created if the trip does not have it yet. This is the only place that loads weights and bags in bulk; a template brings names and lists only.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Print or export the packing list',
  'help.guide.export-packing-list.goal':
    'Take the list along on paper, as a PDF, or as a file for another app or the next trip.',
  'help.guide.export-packing-list.step.1': 'Click the export button with the up arrow in the bar above the list.',
  'help.guide.export-packing-list.step.2':
    'Markdown checklist (.md) and CSV for import (.csv) save the list as a file right away.',
  'help.guide.export-packing-list.step.3':
    'Click Print or save as PDF. The preview shows the list as a page: the trip and its dates on top, then every list as a card with a box to tick.',
  'help.guide.export-packing-list.step.4':
    'Click Print or save as PDF under the preview. The browser opens its print dialog: pick a printer, or Save as PDF to keep a file.',
  'help.guide.export-packing-list.result':
    'The printout and the files hold the view that is open, Shared or My list, with the quantities, weights and checkmarks.',
  'help.guide.export-packing-list.tip.1':
    'The CSV is the format Import reads, bags included, so it works as a packing template of your own: import it into the next trip.',
  'help.guide.export-packing-list.tip.2':
    'The Markdown file opens as a checklist in Obsidian, Notion or GitHub, and comes back in through Import just the same.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Decide who sees an item and who brings it',
  'help.guide.share-packing-item.goal':
    'Move an item between the group pool, your own list and the people you are bringing it for.',
  'help.guide.share-packing-item.step.1':
    'Shared above the lists is the pool everyone sees, My list is your own, and each counts what is in it. Click My list to look at yours.',
  'help.guide.share-packing-item.step.2': 'Back in Shared, open the three dots at the end of a row and click Sharing.',
  'help.guide.share-packing-item.step.3':
    'Three tiers: Shared, in the group pool and visible to everyone; Personal, which only you can see; and Shared with…, where you pick the people the item covers.',
  'help.guide.share-packing-item.step.4': 'A Personal item is only on My list. Switch over to find it.',
  'help.guide.share-packing-item.step.5':
    'Open Sharing again and tick a name under Shared with…. The item shows on that person’s list too, and the row gets a small badge counting the people it is shared with.',
  'help.guide.share-packing-item.result': 'The item sits in the tier you chose, and the row says who is bringing it.',
  'help.guide.share-packing-item.tip.1':
    'Only the person bringing an item changes its sharing. Someone you shared it with sees it on their own My list, marked with your name, and can tick it off.',
  'help.guide.share-packing-item.tip.2':
    'On an item somebody else brought you get two other buttons instead: I can bring that too, which adds you next to them, and Copy to my list, which makes a private copy of your own.',
  'help.guide.share-packing-item.tip.3':
    'New items inherit the view you add them in. Added in My list they are Personal, added in Shared they go into the pool.',
  // packing-bags
  'help.guide.packing-bags.title': 'Weigh the bags',
  'help.guide.packing-bags.goal':
    'Put a weight on every item, sort the items into bags and keep each bag under its airline limit.',
  'help.guide.packing-bags.step.1': 'Click the weight badge before the circle and type the item’s weight in grams.',
  'help.guide.packing-bags.step.2': 'The circle at the end of the row is its bag. Click it.',
  'help.guide.packing-bags.step.3':
    'No bag yet: Add bag, a name, Enter. The bag is created and the item goes straight into it.',
  'help.guide.packing-bags.step.4':
    'The Bags panel appears on the right as soon as one bag exists: name, weight, a fill bar, who carries it and how many items are in it, then Unassigned and Total weight.',
  'help.guide.packing-bags.step.5': 'Click Set limit and type the limit in kilograms, the way airlines state it.',
  'help.guide.packing-bags.step.6': 'The dashed plus beside a bag’s name says who is carrying it.',
  'help.guide.packing-bags.result':
    'The Bags panel on the right shows each bag’s weight against its limit, what is in no bag, and the total.',
  'help.guide.packing-bags.tip.1':
    'The weight field, the bag circle and the Bags panel only exist while an admin has Bag Tracking switched on under the Lists addon.',
  'help.guide.packing-bags.tip.2':
    'A bag’s weight is summed on the server over every member’s items, including the ones you cannot see, so the number really is what the bag weighs.',
  'help.guide.packing-bags.tip.3':
    'A bag without a limit is drawn against the heaviest bag, so the bars stay comparable. Give it a limit and the bar reads against that instead.',
  // create-todo
  'help.guide.create-todo.title': 'Add a task',
  'help.guide.create-todo.goal':
    'Write down something that has to happen, with a list, a priority, a date and a name against it.',
  'help.guide.create-todo.step.1': 'Click Add new task at the top right.',
  'help.guide.create-todo.step.2': 'Name it in Task name, and put anything worth remembering under Description.',
  'help.guide.create-todo.step.3':
    'List groups the task. Pick one, or use the plus next to it to name a new one in a small dialog.',
  'help.guide.create-todo.step.4': 'Priority is four buttons: None, P1, P2 and P3, red down to blue.',
  'help.guide.create-todo.step.5': 'Due date opens a calendar, and Assigned to puts a name on the task.',
  'help.guide.create-todo.step.6': 'Click Create task.',
  'help.guide.create-todo.result':
    'The task is in the list with its badges, the priority, the due date, the list and the person it is assigned to, and it opens in the pane on the right.',
  'help.guide.create-todo.tip.1':
    'Only the name is required. Everything else can be filled in later from the pane on the right.',
  'help.guide.create-todo.tip.2': 'With a list selected in the sidebar, a new task starts in that list.',
  'help.guide.create-todo.tip.3':
    'Enter in the name field creates the task straight away, without touching the other fields.',
  // todo-filters
  'help.guide.todo-filters.title': 'Find and change a task',
  'help.guide.todo-filters.goal': 'Cut the task list down to what matters now, then edit the task you landed on.',
  'help.guide.todo-filters.step.1':
    'Tasks in the sidebar: All is everything still open, My Tasks what is on you, Overdue what has a date in the past, Done what is finished. Each carries its count; click Overdue.',
  'help.guide.todo-filters.step.2':
    'Under Lists sits one row per list. Picking one shows that list, finished tasks included.',
  'help.guide.todo-filters.step.3':
    'The sort in the head of the list reorders what is on screen: Priority puts P1 first, Due date puts the nearest deadline first. Only one of the two at a time, and a second click goes back to your own order.',
  'help.guide.todo-filters.step.4': 'Click a task to open it in the pane on the right.',
  'help.guide.todo-filters.step.5':
    'Change what you need, Description, Priority, List, Due date or Assigned to, then Save changes. The box in the pane’s head ticks the task off, and Delete takes it away at once.',
  'help.guide.todo-filters.result':
    'The list shows only the tasks you asked for, and the pane on the right edits the one you picked.',
  'help.guide.todo-filters.tip.1':
    'A list row counts only what is still open, but selecting it shows the finished tasks too. All, My Tasks and Overdue hide what is done; Done shows nothing else.',
  'help.guide.todo-filters.tip.2':
    'Priority and Due date in the sort exclude each other, and while either is on the rows can no longer be dragged into an order of your own.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Costs',
  'help.ctx.trip-costs.summary':
    'The trip’s money: every expense as a dated ledger, who put it down and who owes for it, in whatever currency the receipt was in, and, in the right-hand column, who has to pay whom to make it even again.',
  'help.ctx.trip-costs.bullet.1':
    "Four cards at the top: You owe and You're owed are your own side of the settlement, Outstanding amount is what is recorded but has no payer yet, and Total trip spend adds everything up with your share and what you paid under it.",
  'help.ctx.trip-costs.bullet.2':
    'Add expense at the top right opens the editor; Settle up beside it records every open transfer at once.',
  'help.ctx.trip-costs.bullet.3':
    'The ledger is grouped by day, newest first, with that day’s total on the right. A row carries the category as a coloured tab, the name, the payer chips, the note and the amount, plus you lent or you borrowed when the split leaves you up or down on it.',
  'help.ctx.trip-costs.bullet.4':
    "Above the list sit Search expenses…, a category filter, a day filter, the All / Paid by me / I'm owed switch and the Export CSV button.",
  'help.ctx.trip-costs.bullet.5':
    'The right-hand column is the answer: Settle up lists who pays whom, Balances shows each traveler’s surplus or deficit, Final budget what the trip costs each of them, and By category where the money went.',
  'help.ctx.trip-costs.bullet.6':
    'A recorded payment sits in the same ledger as its own row, with Edit and Undo beside it; an expense has a pencil and a bin, and the bin deletes it without asking.',
  // add-expense
  'help.guide.add-expense.title': 'Add an expense',
  'help.guide.add-expense.goal': 'Record what something cost, who paid it and who it is shared with.',
  'help.guide.add-expense.step.1':
    'Click Add expense at the top right of the Costs tab. The editor opens, dated today, with everybody already in the split.',
  'help.guide.add-expense.step.2':
    'Type what it was for into What was it for?, the only field that has to be filled in, and the figure from the receipt into Total amount.',
  'help.guide.add-expense.step.3':
    'Currency and Day sit under the amount. Currency starts on the trip’s own; change it and the editor shows what the amount is worth in the trip currency. Day starts on today and is what the ledger groups the expense under.',
  'help.guide.add-expense.step.4':
    'Pick a Category. There are fourteen of them and they cannot be changed: the one you pick is the coloured tab on the row and the bar in By category.',
  'help.guide.add-expense.step.5':
    'Under Who paid?, pick the person who actually put the money down. You is preselected; No one paid yet records the amount without making anyone owe for it, and Multiple people paid splits the bill between several payers.',
  'help.guide.add-expense.step.6':
    'Split starts on Equally with everyone included, and each name shows the share it works out to. Click Add expense to save.',
  'help.guide.add-expense.result':
    'The expense is in the ledger under its day, counted into Total trip spend, and the settle-up column has recalculated who owes whom.',
  'help.guide.add-expense.tip.1':
    'Left as it opens, the expense is in the trip’s currency, dated today and split equally between everyone: only the name and the amount really have to be filled in.',
  'help.guide.add-expense.tip.2':
    'The ± beside the amount turns the expense into a refund. A negative total gives money back instead of taking it, and the split runs the other way.',
  'help.guide.add-expense.tip.3':
    'Attach receipt / invoice at the bottom takes images and PDFs. They are uploaded when you save, land in the trip’s Files, and a Receipts chip appears beside the name in the list.',
  // expense-payers
  'help.guide.expense-payers.title': 'Say who paid the bill',
  'help.guide.expense-payers.goal':
    'Record who is out of pocket for an expense, the other half of the settlement maths.',
  'help.guide.expense-payers.step.1':
    'Open an expense with the pencil beside its row and look at Who paid?. One person paid is the default: the dropdown names the single person who put the money down.',
  'help.guide.expense-payers.step.2':
    'No one paid yet, the first entry of that dropdown, records the amount without making anyone owe anything. The expense still counts toward Total trip spend.',
  'help.guide.expense-payers.step.3':
    'Multiple people paid, the link beside the label, opens a row per traveler. Include the ones who paid and type what each of them put in; the amounts have to add up to the total.',
  'help.guide.expense-payers.step.4':
    'An expense nobody has paid for is flagged Unfinished on its row and counted into the Outstanding amount card, which is where recorded but unsettled spending collects.',
  'help.guide.expense-payers.result':
    'Who paid decides who gets paid back, the split decides who pays, and Balances is the difference between the two.',
  'help.guide.expense-payers.tip.1':
    'Who paid? and Split are independent: you can pay for a dinner you were not at, and be split into one you did not pay for.',
  'help.guide.expense-payers.tip.2':
    'With several payers the amounts have to add up to the total. Include one more and the others rearrange themselves around it; while they do not match, the editor says what they have to add up to and refuses to save.',
  'help.guide.expense-payers.tip.3':
    'Removing a payer does not remove the expense: the amount stays in Total trip spend and the row becomes Unfinished.',
  // split-expense
  'help.guide.split-expense.title': 'Split a bill between the travelers',
  'help.guide.split-expense.goal':
    'Decide who owes for an expense: everyone equally, by amount, or line by line off the receipt.',
  'help.guide.split-expense.step.1':
    'In the expense editor, Split lists every traveler. Click a name to leave them out of this expense; an excluded traveler reads Excluded and owes nothing for it.',
  'help.guide.split-expense.step.2':
    'Equally is the default: every included traveler gets the same share, and the line under the list says how many ways it is split and what each share comes to.',
  'help.guide.split-expense.step.3':
    'Custom swaps the shares for amount fields. Type what each traveler owes; the line underneath counts along and turns green on Split matches total. It will not save while it is off.',
  'help.guide.split-expense.step.4':
    'Ticket splits the receipt line by line: Add item, then a name and a price per line, and under Splitting: the travelers who share that line.',
  'help.guide.split-expense.step.5':
    'Individual shares under the lines shows what each traveler ends up owing, and Total amount at the top is summed from the lines. Click Save.',
  'help.guide.split-expense.result':
    'The split is what every balance is built from. It is saved with the expense and can be changed later without touching anything else.',
  'help.guide.split-expense.tip.1':
    'A traveler you leave out reads Excluded and owes nothing for this one expense; the others take their share.',
  'help.guide.split-expense.tip.2':
    'Equally is cent-perfect: the leftover cent rotates from expense to expense, so nobody is the one who always pays it.',
  'help.guide.split-expense.tip.3':
    'Ticket mode sums Total amount itself and greys the field out: the receipt’s lines are the total.',
  // expense-currency
  'help.guide.expense-currency.title': 'Enter an expense in another currency',
  'help.guide.expense-currency.goal': 'Put in what the receipt actually says and let TREK hold the rate.',
  'help.guide.expense-currency.step.1':
    'Open Add expense and fill in the name and the amount exactly as the receipt says, the figure itself and not a conversion of it.',
  'help.guide.expense-currency.step.2':
    'Open Currency and pick the receipt’s currency. The list carries every code TREK knows and is searchable: type the three letters.',
  'help.guide.expense-currency.step.3':
    'A line appears under the fields with what the amount is worth right now, marked live rate. It is a preview, not what gets stored.',
  'help.guide.expense-currency.step.4':
    'Click Add expense. The rate is frozen on the spot: from here on this expense is worth what it was worth on the day you entered it.',
  'help.guide.expense-currency.step.5':
    'In the ledger the row carries both figures under the name: what you typed, an arrow, and what it counts as in the trip’s currency. Every total, balance and settle-up above uses the second one.',
  'help.guide.expense-currency.result':
    'The expense keeps the amount and the currency you typed. The ledger shows both, and the trip’s totals and balances stay in the trip’s currency.',
  'help.guide.expense-currency.tip.1':
    'The rate is frozen the moment you save, so a settled debt does not reopen because the market moved the week after. Only changing the expense’s currency freezes a new one.',
  'help.guide.expense-currency.tip.2':
    'Display currency in Settings changes only what you read; the stored amounts never move. Left empty, every trip is shown in its own currency.',
  'help.guide.expense-currency.tip.3':
    'The trip currency itself lives on the trip, under Edit trip, and needs the right to edit it. Changing it re-anchors every frozen rate rather than redenominating the amounts.',
  // filter-costs
  'help.guide.filter-costs.title': 'Find an expense, or one day’s spending',
  'help.guide.filter-costs.goal': 'Narrow a long ledger down to what you are actually looking for.',
  'help.guide.filter-costs.step.1':
    'Type into Search expenses… above the list. It matches the expense’s name as you type.',
  'help.guide.filter-costs.step.2':
    'All categories opens the fourteen categories. Pick one and only that category’s expenses stay.',
  'help.guide.filter-costs.step.3':
    'All days lists every day something was spent on. Pick one and a banner replaces the day headers with that day, how many expenses it holds and its total.',
  'help.guide.filter-costs.step.4':
    "The All / Paid by me / I'm owed switch is your own view of the ledger: what you put money down for, and what you are still out of pocket on.",
  'help.guide.filter-costs.step.5':
    'Export CSV at the end of the row writes every expense to a file, with the original amount, its currency and the converted amount.',
  'help.guide.filter-costs.result':
    'The filters combine, and the day groups redraw with their own totals for whatever is left.',
  'help.guide.filter-costs.tip.1':
    'Recorded payments carry no name and no category, so a search or a category filter hides them. The day filter keeps them, under the day the payment was recorded.',
  'help.guide.filter-costs.tip.2':
    'Export CSV always exports every expense, whatever is filtered on screen, one row per expense.',
  // settle-up
  'help.guide.settle-up.title': 'Work out who owes whom, and settle it',
  'help.guide.settle-up.goal':
    'Turn a pile of shared expenses into the fewest transfers that make everyone even, and record them as they happen.',
  'help.guide.settle-up.step.1':
    'The Settle up card in the right-hand column lists the transfers that would make everyone even: who pays whom, and how much. The number beside the title is how many are still open.',
  'help.guide.settle-up.step.2':
    'Settle beside a transfer records it as done. The flow disappears from the card and the balances redraw.',
  'help.guide.settle-up.step.3':
    'The recorded transfer is a row in the ledger, under the day it happened, marked Payment with the two travelers and the amount.',
  'help.guide.settle-up.step.4':
    'Beside that row the pencil corrects a payment and Undo takes it back, and the transfer returns to the Settle up card.',
  'help.guide.settle-up.step.5':
    'Add payment in the card header records a transfer that did not follow a suggestion. Pick From and To, the amount, its currency and the day it happened.',
  'help.guide.settle-up.step.6':
    'Settle up in the header at the top of the screen records every open transfer at once, the way a group squares up at the end of a trip.',
  'help.guide.settle-up.result':
    "Every recorded transfer is a row in the ledger and a line off the Settle up card. When the card reads Everyone's square, the trip is paid off.",
  'help.guide.settle-up.tip.1':
    'The card shows the fewest transfers, not every debt: three people owing each other in a circle collapse into one or two payments.',
  'help.guide.settle-up.tip.2':
    'Settle records a transfer, it does not move money. Send it by whatever means you use, then click it.',
  'help.guide.settle-up.tip.3':
    'A payment can be made in any currency, so paying a yen debt in euros is normal: the dialog has its own currency picker and freezes that rate too.',
  // final-budget
  'help.guide.final-budget.title': 'See what the trip cost each traveler',
  'help.guide.final-budget.goal':
    'Read the per-person side of the ledger: the balance today, and the real cost per person.',
  'help.guide.final-budget.step.1':
    'Balances shows every traveler’s position: a green bar to the right if the trip owes them, a red bar to the left if they owe it, and the amount beside the name.',
  'help.guide.final-budget.step.2':
    'Final budget below it answers a different question: not who owes what right now, but what the trip costs each traveler once everything has been paid back.',
  'help.guide.final-budget.step.3':
    'Click a name to open the arithmetic: Expenses paid, then Net reimbursements and Pending reimbursements under it.',
  'help.guide.final-budget.step.4':
    'Under each line sit the rows it is made of: the expenses that traveler paid for, the transfers already recorded and the ones still open. They add up to the line above them exactly.',
  'help.guide.final-budget.result':
    'Balances is who is up or down today; Final budget is what the trip ends up costing each of you once everything is paid back.',
  'help.guide.final-budget.tip.1':
    'Recording a payment does not change anyone’s final budget. It only moves an amount from pending reimbursements to net reimbursements.',
  'help.guide.final-budget.tip.2':
    'An expense with no payer stays out of both cards, the same way it stays out of the settle-up suggestions.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Turn a booking into an expense',
  'help.guide.expense-from-booking.goal':
    'Attach what a flight, a hotel or a place actually cost to the record it belongs to.',
  'help.guide.expense-from-booking.step.1': 'Open the booking on the Transports or Bookings tab and click its pencil.',
  'help.guide.expense-from-booking.step.2':
    'Scroll to the Costs block at the bottom of the form. It offers Create expense, which saves the booking first, and Link existing expense for one that is already in Costs.',
  'help.guide.expense-from-booking.step.3':
    'Click Create expense. The booking is saved, the form closes, and the Costs editor opens with the booking’s title as the name and its type already matched to a category.',
  'help.guide.expense-from-booking.step.4':
    'Fill in the amount and its currency, who paid and the split as for any expense, and save. Reopening the booking now shows it under Linked expenses, with a pencil to edit it, Unlink, keep the expense to let it go and a bin to remove it.',
  'help.guide.expense-from-booking.result':
    'The booking carries its cost, and the expense is an ordinary row on the Costs tab, with a payer, a split and a currency like any other.',
  'help.guide.expense-from-booking.tip.1':
    'Deleting the booking deletes its linked expenses with it. Remove expense in the booking’s Costs block does the opposite: the expense goes, the booking stays. Unlink, keep the expense keeps both.',
  'help.guide.expense-from-booking.tip.2':
    'A place has the same block in its form, with Create expense saving the place first.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Files',
  'help.ctx.trip-files.summary':
    'Every document of the trip in one list: tickets, confirmations, passes and pictures, each with a note, a link to the place or the booking it belongs to, and a trash it can come back out of.',
  'help.ctx.trip-files.bullet.1':
    'Drop files here at the top takes the files; a click on the box opens the file picker. The line under it lists the file types this TREK accepts and the limit of 50 MB per file.',
  'help.ctx.trip-files.bullet.2':
    'The tabs say what the list shows: All, PDFs, Images and Documents, each with its count. A star tab joins them as soon as a file is starred, Collab Notes as soon as a note carries an attachment.',
  'help.ctx.trip-files.bullet.3':
    'A row carries who uploaded it, the name, the note under it, the size and the date, and one badge per link: Day Plan and the place, Booking or Transport and the booking, From Collab Notes.',
  'help.ctx.trip-files.bullet.4':
    'At the end of a row sit Star, Assign, Open, Download and Delete. Delete does not ask: the file goes to the trash, where it can be brought back.',
  'help.ctx.trip-files.bullet.5':
    'A picture or a video opens full screen, with the arrow keys and a strip of thumbnails; every other document opens in a preview over the page, with Open in new tab and Download. A wallet pass is downloaded straight away.',
  'help.ctx.trip-files.bullet.6':
    'Trash at the right end switches the list over to the deleted files, where each one is restored or deleted for good and Empty Trash clears them all. Where an administrator has connected a document store, Document sync sits next to it.',
  // files-upload
  'help.guide.files-upload.title': 'Put a document into the trip',
  'help.guide.files-upload.goal':
    'Get a ticket, a confirmation or a photo out of your downloads folder and into the trip, where everyone on it can reach it.',
  'help.guide.files-upload.step.1':
    'Open the trip and click Files in the tab bar. The trip’s documents are listed there, with the upload box above them.',
  'help.guide.files-upload.step.2':
    'Click Drop files here and pick one or several files. They are uploaded one after the other and the box reads Uploading... while it runs. The line under the box says which types this TREK takes, and that a file may be 50 MB at most.',
  'help.guide.files-upload.step.3':
    'As soon as the last file is up, Assign File opens for it by itself. Add a note... gives the file a line of its own, and the lists under it tie it to a place or a booking. Close it with the ×; nothing is lost by closing it.',
  'help.guide.files-upload.step.4':
    'The new files stand at the top of the list. A row shows who uploaded it, the name, the size and the date; a picture gets a thumbnail, every other file its type.',
  'help.guide.files-upload.result':
    'The documents are in the trip, and everyone who can see the trip can open and download them.',
  'help.guide.files-upload.tip.1':
    'A file can also be dragged from the desktop straight onto the box, which lights up while the file is over it.',
  'help.guide.files-upload.tip.2':
    'A picture on the clipboard goes into the list with Ctrl+V, so a screenshot of a booking never has to be saved first.',
  'help.guide.files-upload.tip.3':
    'Uploading needs the right to upload files; without it the box is not there at all. A type that is not on the list is refused with a message and nothing is uploaded. A file over 50 MB is dropped by the box itself, before anything is sent.',
  // files-link
  'help.guide.files-link.title': 'Tie a document to a place or a booking',
  'help.guide.files-link.goal': 'Make the ticket findable from the day it belongs to, not only from this list.',
  'help.guide.files-link.step.1':
    'Click Assign, the pencil at the end of the row. Assign File opens, named after the file.',
  'help.guide.files-link.step.2':
    'Under Note, Add a note... takes one line, which then stands under the file’s name in the list. It is saved the moment you leave the box.',
  'help.guide.files-link.step.3':
    'Under Place stand the trip’s places, grouped by the day they are on, with Unassigned at the end for the ones on no day. Click one and it gets a tick.',
  'help.guide.files-link.step.4':
    'Under Booking and Transport stand the trip’s bookings. Click the one the document belongs to; it gets its tick too.',
  'help.guide.files-link.step.5':
    'Close with the ×. There is no save button here: every click was written as you made it.',
  'help.guide.files-link.result':
    'The row carries the note and one badge per link, Day Plan and the place’s name, Transport and the flight’s name, and the document hangs on the place and on the flight as well.',
  'help.guide.files-link.tip.1':
    'A file can hold several links at once, so the same confirmation belongs to the hotel and to the night it covers.',
  'help.guide.files-link.tip.2': 'Clicking a ticked entry again takes that link away; the file itself stays.',
  'help.guide.files-link.tip.3':
    'It works the other way round as well: a document attached to a place or to a booking is in this list too, with the same badge on its row.',
  // files-star
  'help.guide.files-star.title': 'Keep the important documents on top',
  'help.guide.files-star.goal':
    'Pull the two or three papers you will really need out of a list that grows all trip long.',
  'help.guide.files-star.step.1':
    'Click Star at the end of a row. It fills in yellow, a second star appears in front of the file’s name, and the button now reads Unstar.',
  'help.guide.files-star.step.2':
    'The list sorts itself again: starred files stand above all the others, newest first within each group.',
  'help.guide.files-star.step.3':
    'A star has joined the tabs at the top, with the number of starred files behind it. Click it to see only those.',
  'help.guide.files-star.result':
    'The papers you need at the counter stand at the top of the list, and one tab shows nothing else.',
  'help.guide.files-star.tip.1':
    'The star tab only exists while something is starred. Unstar the last file and the tab goes away with it.',
  'help.guide.files-star.tip.2':
    'Starring counts as an edit: a member who may only read the trip’s files sees the stars but cannot set them.',
  // files-filter
  'help.guide.files-filter.title': 'Find a document in the list',
  'help.guide.files-filter.goal': 'Narrow a list of everything down to the one kind of paper you are after.',
  'help.guide.files-filter.step.1':
    'The tabs above the list are All, PDFs, Images and Documents, each with the number of files behind it.',
  'help.guide.files-filter.step.2': 'Click PDFs: the list keeps the PDF files and nothing else.',
  'help.guide.files-filter.step.3':
    'Two more tabs come and go with what is in the trip. Click Collab Notes, which is there as soon as a note in the Collab tab carries an attachment: the list keeps those files and nothing else. A star joins the row the same way, as soon as a file is starred.',
  'help.guide.files-filter.step.4': 'All brings the whole list back.',
  'help.guide.files-filter.result':
    'The list shows only what the tab names, and the count on each tab says how many that is.',
  'help.guide.files-filter.tip.1':
    'There are no folders here and no renaming: the note in Assign File, the links to places and bookings, and the star are what a document is sorted by.',
  'help.guide.files-filter.tip.2':
    'The list itself is always starred first, then newest first, so a document uploaded today stands above one from last month.',
  // files-preview
  'help.guide.files-preview.title': 'Read a document without leaving TREK',
  'help.guide.files-preview.goal':
    'Look at a ticket or a picture on the spot, and get it onto your own machine when you need it there.',
  'help.guide.files-preview.step.1':
    'Click a picture’s name or its thumbnail. It opens full screen, with the file’s name and its place in the pictures in the header.',
  'help.guide.files-preview.step.2':
    'The round arrows at the sides, the left and right arrow keys and the strip of thumbnails at the bottom move through every picture the list is currently showing.',
  'help.guide.files-preview.step.3':
    'Open in new tab and Download sit in the header; the × or Escape closes the picture again.',
  'help.guide.files-preview.step.4':
    'A document that is not a picture opens in a preview over the page instead, with the same two buttons in its header. This one closes on the × or on a click beside it.',
  'help.guide.files-preview.step.5':
    'Download at the end of a row saves the file straight to your machine, without opening anything first.',
  'help.guide.files-preview.result':
    'The document is on screen, and the same two buttons put it in a browser tab or on your disk.',
  'help.guide.files-preview.tip.1': 'On a touch screen you swipe through the pictures instead of clicking the arrows.',
  'help.guide.files-preview.tip.2':
    'A wallet pass never opens a preview: it is downloaded at once, so the phone can hand it to its wallet app.',
  'help.guide.files-preview.tip.3':
    'Open in new tab and Download both fetch the file with your session, so a link copied out of the address bar is of no use to anyone else.',
  // files-trash
  'help.guide.files-trash.title': 'Throw a document away, and get it back',
  'help.guide.files-trash.goal':
    'Clear out what the trip no longer needs, without losing anything you did need after all.',
  'help.guide.files-trash.step.1':
    'Click Delete at the end of a row. The file leaves the list at once and the message reads Moved to trash. Nothing asks first.',
  'help.guide.files-trash.step.2':
    'Trash at the right end of the toolbar switches the list over to what was thrown away. The heading reads Trash and the filter tabs are gone.',
  'help.guide.files-trash.step.3':
    'A thrown-away row is greyed out and has two buttons left: Restore, which brings the file back, and Delete, which removes it for good after a question.',
  'help.guide.files-trash.step.4':
    'Click Restore. The message reads File restored and the row leaves the trash, with its note and its links still on it.',
  'help.guide.files-trash.step.5':
    'Empty Trash at the top clears everything still in here for good, and the browser asks once before it does. Trash switches back to the files.',
  'help.guide.files-trash.result': 'The file is back in the list where it was, as if nothing had happened.',
  'help.guide.files-trash.tip.1':
    'Delete on a row does not ask first, and that is what the trash is for: nothing leaves TREK until you say so in here.',
  'help.guide.files-trash.tip.2':
    'Throwing a file away and getting it back needs the right to delete files. A member without it sees neither Delete on the row nor the buttons in the trash.',
  'help.guide.files-trash.tip.3': 'A file deleted for good in the trash cannot be brought back.',

  // files-sync
  'help.guide.files-sync.title': 'Keep the documents in step with your document store',
  'help.guide.files-sync.goal':
    'Bind the trip to your own document store, so that what is uploaded here lands there and what is filed there turns up here.',
  'help.guide.files-sync.step.1':
    'Click Document sync, next to Trash at the right end of the toolbar. The dialog opens with the trip’s name under its title. On the left, under Connect a provider, stand the stores an administrator has switched on, each with a line on how it files things: Paperless-ngx and Papra by tag, Nextcloud and Synology Drive in a folder, OpenCloud in a space. On the right it reads Nothing connected yet.',
  'help.guide.files-sync.step.2':
    'Click your store, here Nextcloud. A smaller dialog opens for the connection, named after the store and asking for what that store signs in with.',
  'help.guide.files-sync.step.3':
    'Fill in Address and the store’s own sign-in: an API token for Paperless-ngx, an API key and the Organisation ID for Papra, Username and an App password for Nextcloud, Username and an App token for OpenCloud, and for Synology Drive Username, Password and, if the account asks for one, a Two-factor code. Use an app password or token wherever the store offers one, never your account password. Nextcloud and Synology Drive also take an optional Base folder, where TREK looks for trip folders, here /Reisen. Accept a self-signed certificate at the bottom is only for a store on your own network with such a certificate.',
  'help.guide.files-sync.step.4':
    'Click Test connection. TREK reaches the store with what you typed and the footer reads Reached it, signed in as followed by the account’s name. Credentials that are refused or an address that cannot be reached are named there instead, and nothing is saved either way.',
  'help.guide.files-sync.step.5':
    'Click Connect. The connection is saved with the trip and TREK asks where the trip should live in the store: the tag, folder or space that holds its documents. Only what is in there is synced. Make a new one creates it on Create, with a name prefilled from the trip’s title; under Or use one you already have stand the ones that are there already. Click one, here the folder Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'The dialog is back: your store stands under This trip on the left, and its card on the right carries where it syncs to, when it last ran and Sync now. A first run starts by itself; Sync now runs one whenever you like. Once a run is through, the Not synced yet badge beside the name gives way to a green dot, In sync when you point at it, and the flow bar counts the documents TREK and the store each hold, with the lanes Out to the store and In from the store between them. Close the dialog with the ×.',
  'help.guide.files-sync.result':
    'The documents that were already there stand at the top of the list, uploaded in your name, and every document of the trip is in the store as well. From now on TREK checks the store in the background, and the store follows the list.',
  'help.guide.files-sync.tip.1':
    'Only the trip’s owner or an instance administrator can bind a trip, since the credentials reach that whole account at the store. Every member can open Document sync, read the card and press Sync now.',
  'help.guide.files-sync.tip.2':
    'A store on your own network needs ALLOW_INTERNAL_NETWORK=true on the TREK server, and its address has to be the machine’s address on the network, never localhost. Without that, Test connection answers That address is not allowed.',
  'help.guide.files-sync.tip.3':
    'Disconnect on the card ends the pairing and keeps every document on both sides. A tag, folder or space bound a second time is treated as new, and everything in it comes in again, so after a Disconnect bind an empty one rather than the old one.',
  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collab',
  'help.ctx.trip-collab.summary':
    'The tab where the group plans together: the chat on the left, the shared notes and links beside it, the polls under them and What’s Next at the end. Everything written here is on every other member’s screen at once, without a reload.',
  'help.ctx.trip-collab.bullet.1':
    'The chat is the column on the left. Write into Type a message… and press Enter; Shift and Enter make a new line. The smiley adds an emoji, Attach images hangs up to four pictures on the message.',
  'help.ctx.trip-collab.bullet.2':
    'Hover a message for Reply and, on your own, Delete; right-click it for the eight quick reactions. A deleted message leaves one line saying you deleted it.',
  'help.ctx.trip-collab.bullet.3':
    'Notes is the shared pad: New Note writes one, and the gear beside it opens Manage Categories for their names and colours. A card carries Expand, Pin, Edit and Delete.',
  'help.ctx.trip-collab.bullet.4':
    'Links collects the addresses the trip runs on. Add link takes a title and an http or https address; Edit link, Pin link and Delete link sit in the chip’s tail, and pinned links stay at the front.',
  'help.ctx.trip-collab.bullet.5':
    'Polls decide things. New Poll asks a question with at least two options; a click on an option is your vote, Close ends the voting and Delete removes the poll.',
  'help.ctx.trip-collab.bullet.6':
    'What’s Next lists the stops of the trip that are still ahead, up to eight of them, with their times and the people on them. It only reads the day plan; the times are set there.',
  // write-note
  'help.guide.write-note.title': 'Write a shared note',
  'help.guide.write-note.goal':
    'Put what the whole group needs, a rule, an address, a reminder, where everyone finds it again.',
  'help.guide.write-note.step.1': 'Click New Note at the top of the Notes panel. The form opens.',
  'help.guide.write-note.step.2':
    'Note title is the name the card carries. It is the only thing the form insists on: Create stays grey until there is something in it.',
  'help.guide.write-note.step.3':
    'The big box under it holds the text and takes Markdown: a bold word, a list, a heading. The card shows the first few lines, and Expand on it opens the whole note.',
  'help.guide.write-note.step.4':
    'Under Category, pick the one the note belongs to; its colour becomes the card’s colour. The pills are the categories that already exist, and a new one is made under Manage Categories.',
  'help.guide.write-note.step.5':
    'Website takes a link that belongs to the note. The card then carries a Link tile that opens it.',
  'help.guide.write-note.step.6': 'Click Create.',
  'help.guide.write-note.result':
    'The note is a card in the Notes panel, in its category’s colour, and it is already on every other member’s screen.',
  'help.guide.write-note.tip.1':
    'Pin on a card keeps it at the top of the panel; everything under it is sorted by when it was last changed.',
  'help.guide.write-note.tip.2':
    'The gear beside New Note opens Manage Categories: there a category gets its colour, is renamed everywhere at once, or is added before any note uses it.',
  'help.guide.write-note.tip.3':
    'Attach files hangs a document on the note. Attach opens the file picker, and an image or a PDF can also just be pasted into the form.',
  'help.guide.write-note.tip.4':
    'Notes is a switch of its own under Addons, below Collab: an admin can turn it off and leave the chat, the links, the polls and What’s Next running.',
  // shared-links
  'help.guide.shared-links.title': 'Collect the trip’s links',
  'help.guide.shared-links.goal':
    'Keep the booking portal, the shared album and the timetable in one place instead of scrolling the chat for them.',
  'help.guide.shared-links.step.1': 'Click Add link at the top of the Links panel.',
  'help.guide.shared-links.step.2':
    'Give the link a name in Link title, paste the address into the field under it, then click Save link.',
  'help.guide.shared-links.step.3':
    'The chip shows the name and the site it points at. A click on it opens the page in a new tab.',
  'help.guide.shared-links.step.4':
    'The three small buttons in its tail are Edit link, Pin link and Delete link. Pin link moves the chip to the front of the panel; Delete link asks nothing.',
  'help.guide.shared-links.result':
    'The link is a chip in the Links panel, pinned to the front, and on every member’s screen at once.',
  'help.guide.shared-links.tip.1':
    'Only http and https addresses are taken; the field refuses anything else before it saves.',
  'help.guide.shared-links.tip.2':
    'Pinned links come first, then the newest. The small icon beside a title is the site’s own favicon, fetched from the site itself, so with no internet the chip shows a plain link glyph instead.',
  'help.guide.shared-links.tip.3':
    'Links is a switch of its own under Addons, below Collab, so an admin can turn the panel off without touching the rest of the tab.',
  // create-poll
  'help.guide.create-poll.title': 'Ask the group',
  'help.guide.create-poll.goal': 'Turn a question nobody answers in the chat into a poll everybody can tick.',
  'help.guide.create-poll.step.1': 'Click New Poll at the top of the Polls panel.',
  'help.guide.create-poll.step.2':
    'Write the question. Markdown supported under the box means a bold word, a line break or a short list works here.',
  'help.guide.create-poll.step.3': 'Fill Option 1 and Option 2. Two options with something in them are the minimum.',
  'help.guide.create-poll.step.4':
    '+ Add option adds a third, a fourth, as many as you need; the small cross beside a row takes one away again.',
  'help.guide.create-poll.step.5':
    'Multiple choice lets everyone tick more than one option. Left off, a vote moves over when somebody picks something else.',
  'help.guide.create-poll.step.6': 'Click Create Poll.',
  'help.guide.create-poll.result': 'The poll stands at the top of the Polls panel, open, with nobody having voted yet.',
  'help.guide.create-poll.tip.1': 'The question is rendered as Markdown; the options stay plain text.',
  'help.guide.create-poll.tip.2':
    'Create Poll stays grey until there is a question and at least two options with something in them.',
  'help.guide.create-poll.tip.3':
    'A deadline can only be set in the phone app. A poll that has one shows the time left in an amber chip here and counts as closed once it runs out.',
  'help.guide.create-poll.tip.4':
    'Polls is a switch of its own under Addons, below Collab: an admin can turn it off and leave the other four panels running.',
  // vote-poll
  'help.guide.vote-poll.title': 'Vote and read the result',
  'help.guide.vote-poll.goal': 'Cast your vote, see where the group stands, and change your mind.',
  'help.guide.vote-poll.step.1': 'Click the option you want. Its circle fills in and the bar behind it grows.',
  'help.guide.vote-poll.step.2':
    'Now the whole result is readable: the bar is the share, the percentage stands on the right, and the small circles are the people who picked that option.',
  'help.guide.vote-poll.step.3':
    'Changed your mind? Click another option. On a poll without Multiple choice your vote moves over instead of adding a second one.',
  'help.guide.vote-poll.step.4':
    'Under the question stands how many votes the poll has. A click on the option you already chose takes your vote back out, and the counter falls again.',
  'help.guide.vote-poll.result':
    'Your tick is on one option, the bars show how the group is split, and the circles say who chose what.',
  'help.guide.vote-poll.tip.1':
    'The bars and the percentages only appear once you have voted yourself, or once the poll is closed, so nobody is nudged by the standings.',
  'help.guide.vote-poll.tip.2':
    'A vote is never anonymous: hover one of the circles on an option for the name behind it.',
  // close-poll
  'help.guide.close-poll.title': 'Close a poll, or remove it',
  'help.guide.close-poll.goal':
    'Stop the voting once the group has decided, and clear away a poll nobody needs any more.',
  'help.guide.close-poll.step.1':
    'Close, the lock in a poll’s corner, ends the voting. The options stop taking clicks.',
  'help.guide.close-poll.step.2':
    'A closed poll sinks under the Closed heading at the bottom of the panel, wears a Closed badge and shows everybody the result, whether they voted or not. The winning option is tinted green.',
  'help.guide.close-poll.step.3':
    'Delete, the bin in the same corner, removes the poll. Nothing asks twice, and the votes go with it.',
  'help.guide.close-poll.result':
    'The poll is gone from every member’s panel. One you only closed stays readable at the bottom, with its result.',
  'help.guide.close-poll.tip.1':
    'Closing cannot be undone: there is no reopen. A poll closed by accident has to be asked again.',
  'help.guide.close-poll.tip.2':
    'Delete takes the poll and every vote on it away for everyone, straight away and without a question.',
  // whats-next
  'help.guide.whats-next.title': 'Read What’s Next',
  'help.guide.whats-next.goal': 'See what the group is doing next without opening the plan.',
  'help.guide.whats-next.step.1':
    'The panel lists the stops of the trip that are still ahead, up to eight of them, in time order, under a heading per day: Today, Tomorrow or the date.',
  'help.guide.whats-next.step.2':
    'On the left of a row stands its time: the start, to, and the end when the stop has one, or TBD when no time is set on it yet.',
  'help.guide.whats-next.step.3':
    'The chips under the name are the people on that stop. With nobody picked for it, everyone in the trip is listed.',
  'help.guide.whats-next.result':
    'A list of what is coming, to read only: it follows the plan, and nothing here changes it.',
  'help.guide.whats-next.tip.1':
    'Nothing is set here. The times come from the day plan; change them there and this list follows at once.',
  'help.guide.whats-next.tip.2':
    'Only what still lies ahead is listed: a stop whose time has passed drops out, and at the end of a trip the panel is empty.',
  'help.guide.whats-next.tip.3':
    'What’s Next is a switch of its own under Addons, below Collab, and it is a desktop panel: the Collab tab of the phone app does not offer it.',
  // trip-chat
  'help.guide.trip-chat.title': 'Talk to the group',
  'help.guide.trip-chat.goal':
    'Say something, answer one particular message, react to another, and take your own back.',
  'help.guide.trip-chat.step.1':
    'Write into Type a message… and press Enter. The blue arrow beside the box does the same; Shift and Enter make a new line instead.',
  'help.guide.trip-chat.step.2':
    'The smiley opens the emoji picker, with Smileys, Reactions and Travel in it. What you pick is added to what you are writing, it is not sent by itself.',
  'help.guide.trip-chat.step.3':
    'Hover somebody else’s message: a small round button appears at its corner. That is Reply.',
  'help.guide.trip-chat.step.4':
    'The message you answer is quoted above the box. Write and send, and the quote rides along in your bubble; the cross on the quote drops it again.',
  'help.guide.trip-chat.step.5':
    'Right-click a message for the eight quick reactions. Yours sits under the bubble, and a second click on the same one takes it back.',
  'help.guide.trip-chat.step.6':
    'Your own messages carry Delete beside Reply. It takes the message away and leaves one line saying you deleted it: there is no way back.',
  'help.guide.trip-chat.result':
    'Your answer sits under the message it quotes, a reaction hangs on a third, and the one you took back leaves a single line saying so.',
  'help.guide.trip-chat.tip.1':
    'Enter sends, Shift and Enter make a new line. A message that is nothing but emoji is shown large.',
  'help.guide.trip-chat.tip.2':
    'Attach images takes up to four pictures for one message; they can also just be pasted or dropped onto the box.',
  'help.guide.trip-chat.tip.3':
    'A message with a link in it gets a preview card underneath, fetched by your own TREK, so a link to something only you can reach stays a plain link.',
  'help.guide.trip-chat.tip.4':
    'Chat is a switch of its own under Addons, below Collab: an admin can turn it off and leave the notes, the links, the polls and What’s Next running.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Road trip',
  'help.ctx.trip-roadtrip.summary':
    'The plan read as one drive: the same days and the same places, chained into stops with the driving between them, in a rail down the left column and on the map. It says how far and how long, where the tank runs out, and what is along the road.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Days and Road trip at the top of the left column switch between the day plan and the drive. Nothing is copied and nothing is changed: Days gives the plan back exactly as it was.',
  'help.ctx.trip-roadtrip.bullet.2':
    'The head of the rail totals the trip: Distance, Driving time and Stops. Below it comes one card per day, with the day’s own kilometres, how many stops it is for, whatever it goes over, and a Track badge.',
  'help.ctx.trip-roadtrip.bullet.3':
    'A numbered stop is a place the day is for. A stop on the way, fuel, charging, a rest area, wears its kind’s icon instead of a number and is not counted. Click a number to change which it is, and the Stay badge to say how long it takes.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Between two stops a drive band gives the leg as distance and time. Click it for Ways to drive this leg, or click the drawn route on the map to bend the leg through a via point.',
  'help.ctx.trip-roadtrip.bullet.5':
    'The right column becomes Along the route: pick a day, what to look for and how wide the corridor is, then Search. Add puts a hit on the drive at the point it is really passed.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Driving settings under it holds the limits, the car and its range, the daily travel times, what to avoid and how the line is drawn. They belong to the trip, so everyone plans with the same car.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Read the trip as one drive',
  'help.guide.roadtrip-mode.goal': 'Switch the plan over to road trip mode and read what the rail tells you.',
  'help.guide.roadtrip-mode.step.1':
    'Click Road trip in the Days and Road trip switch at the top of the left column. The day plan is replaced by the drive, and the map draws every day that has routed.',
  'help.guide.roadtrip-mode.step.2': 'The head of the rail totals the whole trip: Distance, Driving time and Stops.',
  'help.guide.roadtrip-mode.step.3':
    'Below it comes one card per day. Its header carries the day’s number and date, the driving as distance and time, and how many stops the day is for.',
  'help.guide.roadtrip-mode.step.4':
    'Inside the card the day is a chain: a numbered stop per place, a drive band between each pair, and the arrival time at the right edge.',
  'help.guide.roadtrip-mode.step.5':
    'Click a day’s header to fold it away. A folded day comes off the map as well; click the header again to bring it back.',
  'help.guide.roadtrip-mode.result':
    'The left column is the drive and the map shows every day of it. Days switches straight back to the plan, unchanged.',
  'help.guide.roadtrip-mode.tip.1':
    'The choice is remembered per trip for as long as the browser tab is open, so a reload comes back to the drive.',
  'help.guide.roadtrip-mode.tip.2':
    'The switch only exists once an admin has turned the Road trip addon on, under Addons in the admin panel.',
  'help.guide.roadtrip-mode.tip.3':
    'On a phone there is no switch: the addon adds a Road trip tab of its own beside Plan.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Stops on the way, and how long you stay',
  'help.guide.roadtrip-stops.goal':
    'Turn a place on the drive into a stop on the way, and say how long each stop takes.',
  'help.guide.roadtrip-stops.step.1':
    'Click the number in front of a stop in the rail. Its label is Make it a stop on the way, and it opens Kind of stop.',
  'help.guide.roadtrip-stops.step.2':
    'Pick a kind: Accommodation, Fuel, Charging, Rest area, Campsite, Food or Sights. The number turns into that kind’s icon and the stops below it are renumbered.',
  'help.guide.roadtrip-stops.step.3':
    'A stop on the way is not a destination, so the day’s header counts one stop fewer.',
  'help.guide.roadtrip-stops.step.4':
    'Click the icon again, Change what kind of stop this is, and choose Back to a destination to give the stop its number back.',
  'help.guide.roadtrip-stops.step.5': 'Every stop carries a Stay badge. Click it to open Time at this stop.',
  'help.guide.roadtrip-stops.step.6':
    'Set the length with the slider, with the minus and plus buttons or with one of the presets, watch what Arrive and Leave do, then click Save.',
  'help.guide.roadtrip-stops.result':
    'The stop you timed carries the hour on its Stay badge and every arrival after it has moved with it, and the one you sent to a kind and back is a numbered destination again.',
  'help.guide.roadtrip-stops.tip.1':
    'A stay belongs to the place, not to one visit: a place planned on two days is stood at just as long on both.',
  'help.guide.roadtrip-stops.tip.2':
    'Stops on the way show under Days as well. Turning Show in Days too off, under Service stops in the Driving settings, keeps them in Road trip only.',
  'help.guide.roadtrip-stops.tip.3': 'No stay, in the same dialog, takes the time away again.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Find fuel, food and a bed along the route',
  'help.guide.roadtrip-corridor.goal': 'Search the road you really drive, and put what you find on the right leg.',
  'help.guide.roadtrip-corridor.step.1':
    'Pick the day at the top of Along the route. Only days that have routed are offered.',
  'help.guide.roadtrip-corridor.step.2':
    'Under Looking for, tick what you need. Fuel, Charging, Rest area, Campsite, Accommodation, Food and Sights can be combined.',
  'help.guide.roadtrip-corridor.step.3':
    'Under Within, choose how far either side of the road to look, 2 km, 5 km or 10 km, then click Search.',
  'help.guide.roadtrip-corridor.step.4':
    'The hits come back grouped by kind, in the order you pass them, each with how far along the day it lies and how far off the route it is.',
  'help.guide.roadtrip-corridor.step.5':
    'Add on a hit opens Add as a stop. It says which day and which position the stop lands on, asks for the kind and the time at the stop, and Add puts it on the drive.',
  'help.guide.roadtrip-corridor.result':
    'The hits are listed in the order you pass them and drawn on the map, and the one you added sits on the drive at the point it is really passed.',
  'help.guide.roadtrip-corridor.tip.1':
    'Nothing is searched until you press Search: one run is many requests against a shared service.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filter by name narrows what came back without asking again, and Clear results empties the list and its pins. Click a hit to bring it into view on the map.',
  'help.guide.roadtrip-corridor.tip.3':
    'A hit can also be dragged from the map onto the drawn route, which is how you pick the leg yourself where the same road is driven twice. Add manually, beside Search, looks a place up by name instead.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Bend a leg through a via point',
  'help.guide.roadtrip-via.goal': 'Send a leg down the road you actually want, without adding a stop to it.',
  'help.guide.roadtrip-via.step.1':
    'Bring the leg you want into view: click a stop in the rail, then close the card that opens over the map.',
  'help.guide.roadtrip-via.step.2':
    'Click the drawn route. A via point is dropped on the leg you clicked, and the leg is routed again through it.',
  'help.guide.roadtrip-via.step.3':
    'The rail follows: the day’s header carries the new distance and driving time, and every arrival after the via moves with it.',
  'help.guide.roadtrip-via.step.4':
    'Hover the handle and it says what it can do: Drag to reshape the route, right-click to remove. Drag it somewhere else and the leg is redrawn through the new spot.',
  'help.guide.roadtrip-via.step.5': 'Right-click the handle to take it away. The leg drives the direct way again.',
  'help.guide.roadtrip-via.result':
    'The leg follows the road you chose, and the day’s distance, driving time and arrivals are worked out again for it.',
  'help.guide.roadtrip-via.tip.1':
    'A via is not a stop: it has no number, no stay and no arrival time, and it is not counted in the day’s stops.',
  'help.guide.roadtrip-via.tip.2':
    'The handles are drawn from zoom level 9, so a map fitted to the whole trip shows the line without them.',
  'help.guide.roadtrip-via.tip.3':
    'A click more than two kilometres from any drawn leg is ignored, and so is a click on a flight, a train or a ferry.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Try another way to drive a leg',
  'help.guide.roadtrip-alternatives.goal': 'See what else the router offers for one stretch, and take it.',
  'help.guide.roadtrip-alternatives.step.1':
    'Click a drive band in the rail, the row between two stops that gives the leg as distance and time. Its label is Other ways.',
  'help.guide.roadtrip-alternatives.step.2':
    'Ways to drive this leg opens over the map, one entry per road, each drawn on the map in its own colour.',
  'help.guide.roadtrip-alternatives.step.3':
    'Hover an entry to light that road up. Current is the road being driven and Fastest the quickest; the others say how much slower they are, or which road class they leave out.',
  'help.guide.roadtrip-alternatives.step.4': 'Click an entry to drive that way, or Close to keep the road you are on.',
  'help.guide.roadtrip-alternatives.result':
    'The leg drives the road you chose, and the rail’s distance and the arrivals after it change with it.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Choosing another road places a via point on the leg and replaces any it already had; choosing the router’s own road takes them away again.',
  'help.guide.roadtrip-alternatives.tip.2':
    'No motorway, No tolls and No ferry come from a second engine with its own speed model, so their times are not comparable with the others.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Set the car and the driving limits',
  'help.guide.roadtrip-limits.goal': 'Tell TREK what you drive and how far you are willing to drive in one go.',
  'help.guide.roadtrip-limits.step.1':
    'Driving settings sits under the search in the right column. Its badges say what is set; click it to open.',
  'help.guide.roadtrip-limits.step.2':
    'Under Driving, Longest drive at once and Driving per day are minutes. An empty field means off, and nothing is flagged.',
  'help.guide.roadtrip-limits.step.3':
    'Under Vehicle, say what you drive. Petrol refills only at fuel stops, Electric only at charging ones, Either at both.',
  'help.guide.roadtrip-limits.step.4':
    'Type Range on one tank, or Range on one charge, yourself. Work it out from the car under it takes Tank size and Consumption, or Battery and Consumption, and does the sum.',
  'help.guide.roadtrip-limits.step.5':
    'Avoid where possible is a preference, not a ban: a day with no way round still uses the road, and says so in its header.',
  'help.guide.roadtrip-limits.step.6':
    'Close the dialog. The card says what is set, and the rail marks every leg and every day that goes over it.',
  'help.guide.roadtrip-limits.result':
    'The card’s badges say what is set, and every leg and day over a limit carries a badge in the rail.',
  'help.guide.roadtrip-limits.tip.1':
    'The settings belong to the trip, so everyone on it plans with the same car and the same limits.',
  'help.guide.roadtrip-limits.tip.2':
    'Fill up to says how full a stop fills, because nobody charges to 100 % on the road. A fuel or charging stop can override it for itself.',
  'help.guide.roadtrip-limits.tip.3':
    'Route line decides how the drive is drawn: Connect the days routes the night between two days, and A colour per day gives each day its own.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Give the driving day a start and an end',
  'help.guide.roadtrip-day-window.goal': 'Stop driving at an hour you choose, and say where the day should end.',
  'help.guide.roadtrip-day-window.step.1': 'Open Driving settings in the right column and find Daily travel times.',
  'help.guide.roadtrip-day-window.step.2':
    'Set a Day start time. On its own it does nothing: both times are needed, as the note under them says.',
  'help.guide.roadtrip-day-window.step.3':
    'Set a Day end time. The drive now stops at that hour and carries the rest over to the next morning, as an End of day row and a Continue journey row in the rail.',
  'help.guide.roadtrip-day-window.step.4':
    'Under End the day, choose Along the route to pause on the road at the end time, or At the last place to stop before the next drive would pass it.',
  'help.guide.roadtrip-day-window.step.5':
    'Close the dialog. The Driving settings card carries the two times as a badge.',
  'help.guide.roadtrip-day-window.result':
    'The drive is cut into travel days of the length you set, and whatever does not fit continues on calculated days after the last one. Your days and their places are not changed.',
  'help.guide.roadtrip-day-window.tip.1':
    'Clearing either time turns the whole thing off again. Times you pinned on a stop yourself always take priority.',
  'help.guide.roadtrip-day-window.tip.2':
    'With daily travel times set the days are always connected: the drive from one day’s last stop to the next day’s first is routed and counted.',
  'help.guide.roadtrip-day-window.tip.3':
    'Each day ending is a marker on the map as well, a moon with the day number. Drag it along the route, or onto a place, to end the day somewhere else; right-click it to put the automatic ending back, and Restore automatic day endings in this dialog undoes the lot.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Fill up before the tank runs out',
  'help.guide.roadtrip-refuel.goal':
    'Find somewhere to refuel on the stretch the car can still reach, and put it on the drive.',
  'help.guide.roadtrip-refuel.step.1':
    'With a range set, the rail draws a band across the leg where it runs out: Tank runs out here, and under it how far into the leg that is.',
  'help.guide.roadtrip-refuel.step.2':
    'The lamp on the band is the button. Find fuel looks along the road you have already driven, Looking along the route… while it does.',
  'help.guide.roadtrip-refuel.step.3':
    'Up to three stations come back, each with how far off the route it is and how much range it would leave to spare.',
  'help.guide.roadtrip-refuel.step.4':
    'The plus on an offer adds it as a fuel stop. Add as a stop opens with the kind and the time already filled in, and Add puts it on the leg at the point it is really passed.',
  'help.guide.roadtrip-refuel.result':
    'The stop is on the right leg with its own icon, the range counts again from it, and the band is gone.',
  'help.guide.roadtrip-refuel.tip.1':
    'The range counts from the last fuel or charging stop, across days. What you drive decides which stops count: Petrol only fuel, Electric only charging.',
  'help.guide.roadtrip-refuel.tip.2':
    'The search looks at the road before the dry point, keeps a reserve and counts the detour twice, so everything it offers is really reachable.',
  'help.guide.roadtrip-refuel.tip.3':
    'An empty answer is not a dead end: the lamp turns into Try again, because the place search is a shared service that does time out.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Make a day follow an imported track',
  'help.guide.roadtrip-track.goal': 'Put a day’s drive onto a scenic route you imported as a GPX or KML track.',
  'help.guide.roadtrip-track.step.1': 'Click the Track badge in a day’s header. The dialog opens on that day.',
  'help.guide.roadtrip-track.step.2':
    'Pick a track. Each one says how long it is and whether it runs along this day or how far off it lies, nearest first.',
  'help.guide.roadtrip-track.step.3':
    'Click Follow this track. TREK drops via points where the drive strays furthest from the track, and routes again, round after round.',
  'help.guide.roadtrip-track.step.4':
    'It says how many via points it placed and how close the drive now stays. The button under it drops those via points again and gives the day back to the router; closing the dialog keeps the track.',
  'help.guide.roadtrip-track.result':
    'The day’s drive follows the track instead of the road the router picked, and its Track badge is lit and names that track when you point at it.',
  'help.guide.roadtrip-track.tip.1':
    'Import the file under Days with Import file, with Routes or Tracks ticked. Until the trip holds one, no day carries the badge.',
  'help.guide.roadtrip-track.tip.2':
    'Following a track replaces the via points the day’s legs already had, so shape a leg by hand after the track, not before.',
};

export default help;
