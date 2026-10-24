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
  'help.center.thisScreen': 'Current',
  'help.center.subScreens': '{count} sub-screens',
  'help.center.subScreens.one': '{count} sub-screen',
  'help.center.subScreensLabel': 'Sub-screens',
  'help.center.guidesCount': '{count} guides',
  'help.center.guidesCount.one': '{count} guide',
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
  'help.center.steps.one': '{count} step',
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

  // ── Screen: dashboard ───────────────────────────────────────────────────────
  'help.ctx.dashboard.title': 'Dashboard',
  'help.ctx.dashboard.summary':
    'Your dashboard shows all your trips. The card at the top, styled as a boarding pass, shows the trip that is running or coming up next. The row below it counts what you have travelled so far, and the cards list every trip you are planning, have archived or have already finished.',
  'help.ctx.dashboard.bullet.1':
    'Boarding pass: the running or next trip with its dates, travellers, places and a countdown. Click it to open the trip. The four buttons in its top-right corner edit, duplicate, archive or delete it.',
  'help.ctx.dashboard.bullet.2':
    'Travel stats: countries visited, trips, days on the road and distance flown, across all your trips.',
  'help.ctx.dashboard.bullet.3':
    "Trip cards, filtered by Planned, Archived and Completed, as a grid or a list. The search box above them searches all your trips at once, by title, date or a place in the trip. The buttons to edit, duplicate, archive and delete a trip are in the top-right corner of each card's photo.",
  'help.ctx.dashboard.bullet.4':
    'Widgets on the right: currency converter, Collections (when the Collections add-on is on), world clocks, upcoming reservations and widgets from plugins. The built-in ones can be switched off under Settings, Appearance.',
  'help.ctx.dashboard.bullet.5': 'The New Trip card and the button in the bottom-right corner both start a new trip.',
  'help.guide.create-trip.title': 'Create a trip',
  'help.guide.create-trip.goal': 'Start a new trip with a name, dates and a cover photo.',
  'help.guide.create-trip.step.1':
    'Click New Trip. The card at the end of your trips and the button in the bottom-right corner do the same thing.',
  'help.guide.create-trip.step.2':
    'Give the trip a name. That is the only field you need; everything else can be added later.',
  'help.guide.create-trip.step.3':
    'Pick a start and an end date. TREK creates one day for each date, so you can start planning your itinerary. No dates yet? Leave both empty and enter the Number of Days instead.',
  'help.guide.create-trip.step.4':
    'Optional: add a cover photo. Upload your own, drag or paste one in, or search Unsplash for the destination.',
  'help.guide.create-trip.step.5': 'Click Create New Trip.',
  'help.guide.create-trip.result':
    'The trip appears on your dashboard. If it is your next trip, it is shown in the boarding pass at the top.',
  'help.guide.create-trip.tip.1':
    'Dates can be changed later. If bookings already exist, TREK asks whether to move them along with the days.',
  'help.guide.create-trip.tip.2':
    'The trip currency you pick here is what every cost is converted into. Choose the currency of the destination.',
  'help.guide.create-trip.tip.3':
    'Under Travel buddies you can add people who already have an account here. They become members of the trip as soon as it is created.',
  'help.guide.dateless-trip.title': 'Plan a trip without dates',
  'help.guide.dateless-trip.goal': 'Start planning before you know when you travel.',
  'help.guide.dateless-trip.step.1': 'Click New Trip and give the trip a name.',
  'help.guide.dateless-trip.step.2':
    'Leave Start Date and End Date empty. A Number of Days field appears below them: enter how many days you want to plan for.',
  'help.guide.dateless-trip.step.3': 'Click Create New Trip.',
  'help.guide.dateless-trip.result':
    'The card shows Idea and Open dates, and the trip has as many empty days as you asked for.',
  'help.guide.dateless-trip.tip.1':
    'Once you know when you travel, open the form with the pencil on the card and pick the dates. Your planned days keep their order and get the dates in that order.',
  'help.guide.edit-trip.title': 'Edit a trip',
  'help.guide.edit-trip.goal': 'Rename a trip, change its dates or adjust its settings.',
  'help.guide.edit-trip.step.1': 'Click the pencil in the top-right corner of the trip card (or of the boarding pass).',
  'help.guide.edit-trip.step.2':
    'Change what you need: name, description, dates, cover, currency, reminder or travel buddies.',
  'help.guide.edit-trip.step.3': 'Click Update.',
  'help.guide.edit-trip.result': 'The card updates right away, for every member of the trip.',
  'help.guide.edit-trip.tip.1':
    'Moving the start of a trip that has bookings asks whether the bookings should move too. Shortening a trip lists the days that would be removed and what is planned on them. It saves only after you click Remove days and save.',
  'help.guide.edit-trip.tip.2': 'Travel buddies you add or remove here change right away, without Update.',
  'help.guide.cover-image.title': 'Set a cover photo',
  'help.guide.cover-image.goal': 'Give a trip a picture that shows on its card and on the boarding pass.',
  'help.guide.cover-image.step.1': 'Open the trip’s edit form with the pencil on its card.',
  'help.guide.cover-image.step.2':
    'Under Cover Image, drop or paste a photo, click to upload one, or type a destination and click Search Unsplash.',
  'help.guide.cover-image.step.3': 'Pick a photo and click Update.',
  'help.guide.cover-image.result': 'The photo is saved with the trip and shows everywhere the trip is listed.',
  'help.guide.cover-image.tip.1':
    'Photos from the Unsplash search are credited automatically; your own uploads stay on your server.',
  'help.guide.trip-reminder.title': 'Get a reminder before a trip',
  'help.guide.trip-reminder.goal': 'Be reminded a few days before you leave.',
  'help.guide.trip-reminder.step.1':
    'Click the pencil on the trip’s card. For a new trip, the New Trip form has the same section.',
  'help.guide.trip-reminder.step.2':
    'Under Reminder, pick 1, 3 or 9 days. For another lead time, click Custom and type a number of days between 1 and 30.',
  'help.guide.trip-reminder.step.3': 'Click Update.',
  'help.guide.trip-reminder.result':
    'You receive the reminder the chosen number of days before the trip starts, on the channels you receive notifications on.',
  'help.guide.trip-reminder.tip.1':
    'Only the trip’s owner (or an administrator) sees the Reminder block. If it is greyed out, an administrator has to switch trip reminders on first, under Admin, Notifications.',
  'help.guide.trip-reminder.tip.2':
    'A new trip starts with a reminder 3 days before departure. You choose the channels for it under Settings, Notifications.',
  'help.guide.duplicate-trip.title': 'Duplicate a trip',
  'help.guide.duplicate-trip.goal': 'Reuse a trip as the template for a new one.',
  'help.guide.duplicate-trip.step.1': 'Click the duplicate icon in the top-right corner of the card.',
  'help.guide.duplicate-trip.step.2': 'Read what will be copied and what will not, then click Copy trip.',
  'help.guide.duplicate-trip.result':
    'A copy appears on your dashboard. It has the name of the original followed by (copy). You can rename it and change its dates.',
  'help.guide.duplicate-trip.tip.1':
    'Days, places, tours and road-trip routes, reservations, budget items, packing lists, to-dos and day notes are copied; packing lists and to-dos are copied unchecked. Members, chat, polls, files and share links are not copied.',
  'help.guide.archive-trip.title': 'Archive and restore a trip',
  'help.guide.archive-trip.goal': 'Move a trip out of your trip list without deleting it, and restore it later.',
  'help.guide.archive-trip.step.1': 'Click the archive icon in the top-right corner of the card.',
  'help.guide.archive-trip.step.2': 'Switch the filter above the cards to Archived to see it again.',
  'help.guide.archive-trip.step.3':
    'Click Restore on the card to bring it back to Planned, or to Completed if its dates have passed.',
  'help.guide.archive-trip.result':
    'Archived trips keep all their data. They are no longer shown on the dashboard or in the all-trips calendar feed.',
  'help.guide.delete-trip.title': 'Delete a trip',
  'help.guide.delete-trip.goal': 'Remove a trip for good.',
  'help.guide.delete-trip.step.1': 'Click the trash icon in the top-right corner of the card.',
  'help.guide.delete-trip.step.2':
    'Confirm with Delete. The dialog names the trip, so you know you have the right one.',
  'help.guide.delete-trip.result':
    'The trip, its days, places, bookings and files are deleted. You cannot undo this, so archive the trip instead if you are unsure.',
  'help.guide.filter-and-view.title': 'Find completed trips, switch grid and list',
  'help.guide.filter-and-view.goal': 'See finished or archived trips and pick the layout you like.',
  'help.guide.filter-and-view.step.1':
    'Use Planned, Archived and Completed above the cards. Completed is every trip whose end date has passed.',
  'help.guide.filter-and-view.step.2': 'Click the list icon to switch to a compact list; click it again for the grid.',
  'help.guide.filter-and-view.result': 'The dashboard remembers your layout on this device.',
  'help.guide.calendar-feed.title': 'Subscribe to all trips in your calendar',
  'help.guide.calendar-feed.goal': 'See the days and bookings of every active trip in your calendar app, kept in sync.',
  'help.guide.calendar-feed.step.1': 'Click the calendar icon next to the view toggle.',
  'help.guide.calendar-feed.step.2': 'Click Enable calendar subscription. TREK creates a private feed link.',
  'help.guide.calendar-feed.step.3':
    'Click Add to Google Calendar or Add to Apple Calendar / Outlook. For any other calendar app, open Or copy a link manually and copy the link from there.',
  'help.guide.calendar-feed.result':
    'Every active trip shows in your calendar and updates automatically. Archived trips and trips that ended more than 90 days ago are not included.',
  'help.guide.calendar-feed.tip.1':
    'Keep the link secret: anyone who has it can read the feed. If other people get it, Regenerate gives you a new link and the old link stops working. Turn off removes the link completely.',
  'help.guide.upcoming-reservations.title': 'Jump to your next bookings',
  'help.guide.upcoming-reservations.goal':
    'See what is booked next across all your trips and open the trip it belongs to.',
  'help.guide.upcoming-reservations.step.1':
    'Find Upcoming reservations in the right column. It lists the next six bookings of all your trips, soonest first, with their date, time and type.',
  'help.guide.upcoming-reservations.step.2': 'Click a booking to open the trip it belongs to.',
  'help.guide.upcoming-reservations.result':
    'The trip opens. Back on the dashboard, the widget keeps showing what comes up next.',
  'help.guide.upcoming-reservations.tip.1': 'A hotel stay shows up twice, once for check-in and once for check-out.',
  'help.guide.upcoming-reservations.tip.2':
    'Pending marks a booking that is not confirmed yet. Cancelled bookings and archived trips are left out.',
  'help.guide.widgets.title': 'Choose your dashboard widgets',
  'help.guide.widgets.goal': 'Show or hide the stats row and the widgets on the right.',
  'help.guide.widgets.step.1': 'Open your avatar menu in the top-right corner and choose Settings.',
  'help.guide.widgets.step.2': 'Switch to the Appearance tab.',
  'help.guide.widgets.step.3':
    'Under Dashboard widgets, switch each widget on or off, separately for Desktop and Mobile. Right sidebar turns the whole right column off at once.',
  'help.guide.widgets.step.4': 'Go back to the dashboard. The change is applied immediately.',
  'help.guide.widgets.result':
    'When you hide widgets, your trips get more space. Switch off the whole right sidebar to centre the layout.',
  'help.guide.widgets.link': 'Open Appearance settings',
  'help.guide.currency-widget.title': 'Convert currencies',
  'help.guide.currency-widget.goal': 'Convert an amount between two currencies with current rates.',
  'help.guide.currency-widget.step.1': 'Type the amount and pick the two currencies.',
  'help.guide.currency-widget.step.2': 'The arrow between them swaps the pair; the circular arrow refreshes the rate.',
  'help.guide.currency-widget.result':
    'Your currency pair is remembered on your account, so it is the same on every device.',
  'help.guide.currency-widget.tip.1':
    "Rates come from the free Frankfurter service. The circular arrow in the widget's corner fetches the latest ones.",
  'help.guide.timezones-widget.title': 'Add world clocks',
  'help.guide.timezones-widget.goal': 'See the local time at your destinations.',
  'help.guide.timezones-widget.step.1':
    'Click + in the Timezones widget, search for a city, Lisbon for example, and pick it from the list.',
  'help.guide.timezones-widget.step.2': 'To remove a clock, hover it and click the × that appears on the right.',
  'help.guide.timezones-widget.result': 'Your clocks are saved with your account.',
  'help.guide.timezones-widget.tip.1':
    'The list uses the official time zone names, such as Europe/Lisbon or America/New_York, so search for the city that appears in the name.',
  'help.guide.search-trips.title': 'Search your trips',
  'help.guide.search-trips.goal':
    'Find a trip by its name, a date or a place you planned on it, archived trips included.',
  'help.guide.search-trips.step.1':
    'Type into Search trips or places above the cards. The list is filtered as you type, across planned, archived and completed trips at once.',
  'help.guide.search-trips.step.2':
    'If a trip matches because of one of its places, that place is shown under the trip title. Click the x in the box, or press Escape, to see all your trips again.',
  'help.guide.search-trips.result':
    'The dashboard shows only the trips that match. Clear the search box to show all trips again.',
  'help.guide.search-trips.tip.1':
    'You can also search by date: type a month and a year, May 2027 for example, or 2027-05, to find the trips in that month.',
  'help.guide.search-trips.tip.2':
    'While a search is active, the Planned, Archived and Completed switch is not applied, so the wrong filter never hides a trip.',

  // ── Screen: vacay ───────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay is your personal leave planner: how many vacation days you have in a year, which ones you have logged and how many are left. The grid shows the whole year. The sidebar contains the year selector, the people you plan with, calendars shared with you, the legend and your entitlement.',
  'help.ctx.vacay.bullet.1':
    'Year grid: twelve month cards, one cell per day. Click a day to log or clear it. A small blue dot marks days a trip already covers.',
  'help.ctx.vacay.bullet.2':
    'Toolbar at the bottom: the first button, with your name and colour, logs vacation; Company Holiday marks days the whole company is off. Half day and Comp / Flex change what a click logs, and Half day works for company holidays too.',
  'help.ctx.vacay.bullet.3':
    'Entitlement: Days, Used and Left for the selected year, with carry-over and comp / flex days beside them. Click the card heading to collapse it.',
  'help.ctx.vacay.bullet.4':
    'Persons are people who share your plan, each in their own colour. Shared Calendars show other people’s days off as coloured rings. You cannot edit them.',
  'help.ctx.vacay.bullet.5':
    'Settings cover weekends, week start, carry-over, your leave year, company holidays, public and school holiday calendars, and Dissolve Fusion while you plan together with someone.',
  'help.guide.log-day.title': 'Log a vacation day',
  'help.guide.log-day.goal': 'Mark a day off in the year grid and see your balance update.',
  'help.guide.log-day.step.1':
    'Check the first button in the toolbar at the bottom. When it shows your name and colour, a click on a day logs a vacation day for you.',
  'help.guide.log-day.step.2':
    'Click a day in any month card. The day is filled with your colour, and Used goes up by one day.',
  'help.guide.log-day.step.3': 'Click the same day again to clear it.',
  'help.guide.log-day.result':
    'The day is logged. Days, Used and Left update immediately, and everyone fused into your plan sees the change right away.',
  'help.guide.log-day.tip.1':
    'Weekends cannot be logged while Block Weekends is on in Settings. A weekend day logged before can still be cleared.',
  'help.guide.log-day.tip.2':
    'A blue dot in a cell means one of your trips covers that day, so you can see where leave and travel line up.',
  'help.guide.log-day.tip.3':
    'A day marked as a whole company holiday cannot be logged. On a half company holiday a vacation day costs only 0.5.',
  'help.guide.half-day.title': 'Log a half day',
  'help.guide.half-day.goal': 'Take an afternoon off and use only half a day of your entitlement.',
  'help.guide.half-day.step.1':
    'Switch Half day on in the toolbar. Its orange dot is the marker for a half day in the grid.',
  'help.guide.half-day.step.2': 'Click a day. It is logged as 0.5 and shows an orange dot in its corner.',
  'help.guide.half-day.step.3':
    'Switch Half day off again when you are done. If you click a half day that has different settings, it changes to the current settings.',
  'help.guide.half-day.result':
    'Used goes up by 0.5. Half day and Comp / Flex are independent, so you can also log a half comp day.',
  'help.guide.half-day.tip.1':
    'The toolbar always shows the marker your next click will place, so you can check before you log.',
  'help.guide.comp-day.title': 'Log comp or flex time',
  'help.guide.comp-day.goal': 'Take time off in lieu without using vacation days.',
  'help.guide.comp-day.step.1':
    'Switch Comp / Flex on in the toolbar. The hatched disc is the marker for a comp day in the grid.',
  'help.guide.comp-day.step.2':
    'Click a day. It is filled with diagonal lines in your colour instead of a solid colour.',
  'help.guide.comp-day.result': 'Comp days are counted beside the entitlement tiles and never reduce Left.',
  'help.guide.comp-day.tip.1':
    'Use this for overtime you take as time off, flextime or a day in lieu: any time off that is not vacation.',
  'help.guide.entitlement.title': 'Set your entitlement',
  'help.guide.entitlement.goal': 'Tell Vacay how many vacation days you have in the year.',
  'help.guide.entitlement.step.1':
    'In the Entitlement card of the sidebar, click the Days tile on your row. If the card is collapsed, click its heading to open it.',
  'help.guide.entitlement.step.2': 'Type your number of days and press Enter. Press Escape to keep the old value.',
  'help.guide.entitlement.result':
    'Left is recalculated from your entitlement, any carry-over and the days you have used.',
  'help.guide.entitlement.tip.1': 'Each year has its own entitlement, so a change here affects the selected year only.',
  'help.guide.entitlement.tip.2':
    'In a fused plan everyone has a row of their own, and you can set the entitlement of the others too.',
  'help.guide.years.title': 'Add and switch years',
  'help.guide.years.goal': 'Plan next year now, or look at last year.',
  'help.guide.years.step.1':
    'Click the + to the right of the year to add the next year, or the + on the left for the previous one.',
  'help.guide.years.step.2': 'Switch between years with the arrows or the year chips underneath.',
  'help.guide.years.step.3':
    'To remove a year, hover over its chip and click the small minus. This also deletes all its entries, so confirm carefully.',
  'help.guide.years.result':
    'Every year has its own entitlement and entries. Carry-over connects one year to the next.',
  'help.guide.company-holidays.title': 'Mark company holidays',
  'help.guide.company-holidays.goal':
    'Block days when the whole company is off, without taking days from anyone’s entitlement.',
  'help.guide.company-holidays.step.1':
    'Open Settings and check that Company Holidays is on. It is on by default. The toolbar shows the mode only while it is on.',
  'help.guide.company-holidays.step.2': 'Back in the grid, switch the toolbar to Company Holiday.',
  'help.guide.company-holidays.step.3':
    'Click the days. They turn amber and show up in the legend. Click a day again to clear it.',
  'help.guide.company-holidays.result':
    'Everyone fused into the plan can see company holidays, and they never reduce Left.',
  'help.guide.company-holidays.tip.1': 'Any fused person can edit company holidays, so agree on who maintains them.',
  'help.guide.company-holidays.tip.2':
    'A whole company holiday removes any vacation already logged on that day, so nobody uses vacation entitlement for it.',
  'help.guide.half-company-holiday.title': 'Mark a half company holiday',
  'help.guide.half-company-holiday.goal':
    'Give everyone a free afternoon, on Christmas Eve for example, without closing the whole day.',
  'help.guide.half-company-holiday.step.1': 'Switch the toolbar to Company Holiday.',
  'help.guide.half-company-holiday.step.2': 'Switch Half day on in the same toolbar.',
  'help.guide.half-company-holiday.step.3': 'Click the day. Half of the cell turns amber.',
  'help.guide.half-company-holiday.result':
    'The company has the half day off, and a vacation day logged on it counts as only half a day.',
  'help.guide.half-company-holiday.tip.1':
    'Vacation already logged on that day is cut to half a day. Anyone who logs that day later uses only 0.5 days.',
  'help.guide.half-company-holiday.tip.2':
    'Click the day again with the same settings to clear it, or with Half day off to make it a whole company holiday.',
  'help.guide.public-holidays.title': 'Show public holidays',
  'help.guide.public-holidays.goal': 'Put the public holidays of your country or region on the grid.',
  'help.guide.public-holidays.step.1': 'Open Settings and switch Public Holidays on.',
  'help.guide.public-holidays.step.2':
    'Click Add calendar, then pick the country and, if needed, the region. You can also give it a colour and a label. Then click Add.',
  'help.guide.public-holidays.step.3': 'Close Settings. The holidays appear on the grid and in the legend.',
  'help.guide.public-holidays.result':
    'Public holidays are marked in the calendar’s colour and never count against your entitlement.',
  'help.guide.public-holidays.tip.1':
    'You can add several calendars, for example your own region and the one of a fused colleague.',
  'help.guide.public-holidays.tip.2': 'Hover a holiday in the grid to see its name.',
  'help.guide.school-holidays.title': 'Show school holidays',
  'help.guide.school-holidays.goal': 'See the school breaks of your region alongside your own days off.',
  'help.guide.school-holidays.step.1': 'Open Settings and switch School Holidays on.',
  'help.guide.school-holidays.step.2':
    'Click Add calendar and pick the country. Where a country splits its calendar, pick the region or group as well, then click Add.',
  'help.guide.school-holidays.step.3':
    'Close Settings. School breaks are shaded in the calendar’s colour and have a coloured bar along the bottom of their days.',
  'help.guide.school-holidays.result':
    'School holidays are only shown in the calendar: they never reduce anyone’s entitlement.',
  'help.guide.school-holidays.tip.1':
    'Missing region? Your administrator can maintain school holidays by hand under Admin, Personalization, School holidays.',
  'help.guide.school-holidays.tip.2': 'Hover a day in a break to see its name under School Holidays.',
  'help.guide.edit-holiday-calendar.title': 'Change or remove a holiday calendar',
  'help.guide.edit-holiday-calendar.goal':
    'Rename, recolour, move or delete a public or school holiday calendar you added.',
  'help.guide.edit-holiday-calendar.step.1':
    'Open Settings and find the calendar under Public Holidays or School Holidays.',
  'help.guide.edit-holiday-calendar.step.2':
    'Click the colour square to pick a new colour, or type a new label and press Enter.',
  'help.guide.edit-holiday-calendar.step.3':
    'Change the country or region in its lists, or click the bin to remove the calendar.',
  'help.guide.edit-holiday-calendar.result': 'The grid and the legend update immediately after every change.',
  'help.guide.edit-holiday-calendar.tip.1': 'Every change is saved at once. There is no Save button.',
  'help.guide.weekends.title': 'Block weekends and set the week start',
  'help.guide.weekends.goal': 'Leave weekends out of your count and start the week on the day you prefer.',
  'help.guide.weekends.step.1': 'Open Settings.',
  'help.guide.weekends.step.2':
    'Switch Block Weekends on, then under Weekend days pick the days that count as your weekend.',
  'help.guide.weekends.step.3': 'Under Week starts on, choose Mon or Sun.',
  'help.guide.weekends.result': 'Blocked days are greyed out in the grid and cannot be logged by mistake.',
  'help.guide.leave-year.title': 'Set your leave year',
  'help.guide.leave-year.goal':
    'Count your entitlement over a fiscal year or from your hire date instead of January to December.',
  'help.guide.leave-year.step.1': 'Open Settings and find Vacation year.',
  'help.guide.leave-year.step.2':
    'Choose Calendar, Fiscal (with the month and day it starts) or Hire date (with the date you were hired).',
  'help.guide.leave-year.result':
    'Entitlement, used days and carry-over are counted for that period, and the grid starts with its first month.',
  'help.guide.leave-year.tip.1':
    'This setting is personal: in a fused plan everyone keeps their own leave year and numbers.',
  'help.guide.carry-over.title': 'Carry unused days over',
  'help.guide.carry-over.goal': 'Add what is left at the end of a period to the next one.',
  'help.guide.carry-over.step.1': 'Open Settings.',
  'help.guide.carry-over.step.2': 'Switch Carry Over on.',
  'help.guide.carry-over.result':
    'The carried amount is recalculated across all your years and shown under the entitlement.',
  'help.guide.carry-over.tip.1': 'Switching it off sets every carry-over balance back to zero.',
  'help.guide.person-color.title': 'Change a person’s colour',
  'help.guide.person-color.goal': 'Give yourself or someone you plan with a colour that is easier to tell apart.',
  'help.guide.person-color.step.1': 'In the Persons card, click the coloured dot before the name.',
  'help.guide.person-color.step.2': 'Pick a colour. It is saved immediately and the dialog closes.',
  'help.guide.person-color.result': 'Every day the person logged now shows in the new colour.',
  'help.guide.person-color.tip.1': 'The same colour marks the person in the toolbar and in the Entitlement card.',
  'help.guide.invite.title': 'Plan together with someone',
  'help.guide.invite.goal':
    'Combine your plan with another TREK user’s plan so you both see your days off in one grid.',
  'help.guide.invite.step.1': 'Click the person icon in the Persons card.',
  'help.guide.invite.step.2': 'Pick the user and click Send Invite.',
  'help.guide.invite.step.3':
    'They get a notification and a Fusion Request the next time they open Vacay. Until then the invite shows as pending; hover it to cancel.',
  'help.guide.invite.result':
    'Both plans merge: each person has a colour, you can log days for each other, and everything syncs live.',
  'help.guide.invite.tip.1':
    'To undo a fusion, click Dissolve in Settings. Everyone’s entries return to their own plan.',
  'help.guide.invite.tip.2': 'If the other person should only see your days, share your calendar instead of fusing.',
  'help.guide.answer-fusion-request.title': 'Answer a fusion request',
  'help.guide.answer-fusion-request.goal': 'Decide whether to merge your vacation plan with someone who invited you.',
  'help.guide.answer-fusion-request.step.1':
    'Open Vacay after someone invites you. The Fusion Request dialog opens by itself.',
  'help.guide.answer-fusion-request.step.2':
    'Read what fusing means: one shared calendar, entries you can edit for each other, and shared holiday settings.',
  'help.guide.answer-fusion-request.step.3':
    'Click Accept & Fuse to merge the plans, or Decline to keep your plan separate.',
  'help.guide.answer-fusion-request.result':
    'After Accept & Fuse both plans show in one grid, each person in their own colour.',
  'help.guide.answer-fusion-request.tip.1':
    'The request stays open until you answer it. If there are several requests, you see them one after the other.',
  'help.guide.answer-fusion-request.tip.2': 'Either of you can dissolve the fusion later, and your entries are kept.',
  'help.guide.log-for-partner.title': 'Log days for someone you plan with',
  'help.guide.log-for-partner.goal':
    'Enter a day off for a person fused into your plan, for example when they ask you to.',
  'help.guide.log-for-partner.step.1':
    'In the Persons card, click the person’s name. A check mark shows they are selected.',
  'help.guide.log-for-partner.step.2': 'Check the toolbar: its first button now shows their name and colour.',
  'help.guide.log-for-partner.step.3': 'Click the days to log, then click your own name in Persons again.',
  'help.guide.log-for-partner.result':
    'The days show in the other person’s colour and count against their entitlement, not yours.',
  'help.guide.log-for-partner.tip.1': 'Half day and Comp / Flex work for the selected person too.',
  'help.guide.log-for-partner.tip.2': 'They see the change immediately, and their Entitlement row updates at once.',
  'help.guide.dissolve-fusion.title': 'Stop planning together',
  'help.guide.dissolve-fusion.goal': 'Split a fused plan back into separate plans.',
  'help.guide.dissolve-fusion.step.1': 'Open Settings.',
  'help.guide.dissolve-fusion.step.2': 'Under Dissolve Fusion at the bottom, click Dissolve.',
  'help.guide.dissolve-fusion.step.3': 'Confirm with Dissolve in the window that asks.',
  'help.guide.dissolve-fusion.result':
    'Everyone is back on their own plan with their own entries, and Persons lists only you.',
  'help.guide.dissolve-fusion.tip.1':
    'Cancel in that window leaves the plan as it is; your entries are kept either way.',
  'help.guide.dissolve-fusion.tip.2': 'To only let someone see your days, share your calendar instead.',
  'help.guide.share-calendar.title': 'Share your calendar read-only',
  'help.guide.share-calendar.goal': 'Let someone see when you are off without letting them change your plan.',
  'help.guide.share-calendar.step.1': 'Click the share icon in the Shared Calendars card.',
  'help.guide.share-calendar.step.2': 'Pick the user and click Share. No acceptance is needed.',
  'help.guide.share-calendar.step.3':
    'Calendars shared with you appear at the top of the card: click one to hide or show it, or hover it and click the x to remove it. Under You share with, hover a name and click Stop sharing.',
  'help.guide.share-calendar.result':
    'Your days off appear as a coloured ring on their grid. They cannot edit anything you share.',
  'help.guide.share-calendar.tip.1':
    'Sharing and fusion are independent: you can be fused with one person and share with others.',
  'help.guide.share-calendar.tip.2': 'Hover over a day with a ring to see who is off and for how long.',

  // ── Screen: atlas ───────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas shows where you have travelled on a world map: every country a trip has taken you to is coloured in, and you can add by hand the countries you visited before you used TREK. Zoom in to see regions, keep a bucket list of places you still want to see, and read your numbers in the glass panel at the bottom.',
  'help.ctx.atlas.bullet.1':
    'The map: each visited country has its own fixed colour, planned countries have a dashed outline, bucket-list countries have diagonal lines, and all other countries are grey. Hover over a country to see its trips, places and first and last visit.',
  'help.ctx.atlas.bullet.2':
    'Search at the top: type a country or a place. A country you have not been to opens its popup. For a country you have been to, its card appears in the panel. If you pick a place, the map opens its region so you can mark it.',
  'help.ctx.atlas.bullet.3':
    'Show planned countries, top right: reveals the countries of your upcoming trips. The switch only appears while you have some.',
  'help.ctx.atlas.bullet.4':
    "Panel at the bottom: the Stats tab with countries (planned ones beside them), regions, trips, places, cities, days, continents, your streak and this year's trips; the Bucket List tab with the places you still want to visit; with the Tours addon, a Tours tab with the distance and climb of the tours you have done.",
  'help.ctx.atlas.bullet.5':
    'Regions: when you zoom in close, the map shows states and provinces. Click one to mark it, unmark it or add it to the bucket list.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: with the addon connected, a panel to the left of the statistics marks wishes as done and adds countries from your recordings. It only does this after you confirm.',
  'help.guide.mark-country.title': 'Mark a country as visited',
  'help.guide.mark-country.goal':
    'Add a country you visited before you used TREK, so the map and your count include it.',
  'help.guide.mark-country.step.1': 'Type the country into the search box at the top of the map.',
  'help.guide.mark-country.step.2': 'Pick it from the list. The map moves to the country and a popup opens for it.',
  'help.guide.mark-country.step.3': 'Choose Mark as visited.',
  'help.guide.mark-country.result':
    'The country gets a colour on the map and the Countries count goes up by one. That colour is permanent: when you mark more countries, the colours of the other countries do not change.',
  'help.guide.mark-country.tip.1':
    'Clicking a grey country on the map opens the same popup. For small countries, the search is more reliable.',
  'help.guide.mark-country.tip.2':
    'A country you mark by hand always counts as visited, whatever the dates of any trip going there.',
  'help.guide.unmark-country.title': 'Remove a country you marked',
  'help.guide.unmark-country.goal': 'Remove a country that you marked by hand from the map.',
  'help.guide.unmark-country.step.1':
    'Search the country and pick it, or click it on the map. For a country you marked yourself the popup asks whether to remove it.',
  'help.guide.unmark-country.step.2': 'Confirm with Remove.',
  'help.guide.unmark-country.result': 'The country turns grey again and is no longer counted.',
  'help.guide.unmark-country.tip.1':
    'Only countries you marked by hand can be removed this way. A country with trips or places stays marked until those trips or places are removed. For a country you marked by hand, Remove is also in its detail card in the panel.',
  'help.guide.country-details.title': 'See what you did in a country',
  'help.guide.country-details.goal': 'Open a visited country and go to the trips that took you there.',
  'help.guide.country-details.step.1': 'Type a country you have visited into the search box at the top of the map.',
  'help.guide.country-details.step.2':
    "Pick it. The map moves there, and a card appears in the panel at the bottom. The card shows the country's flag, badges for its places, trips and visited regions, and a chip for each of its first three trips.",
  'help.guide.country-details.result': 'Click a trip chip to open that trip in the planner.',
  'help.guide.country-details.tip.1':
    'Hovering the country on the map shows the same numbers plus the first and last visit.',
  'help.guide.country-details.tip.2':
    'Click the Places badge to see every place counted for the country, grouped by trip.',
  'help.guide.country-places.title': 'See every place in a country',
  'help.guide.country-places.goal':
    'List the places TREK counts for a country, to check what you did there or to find a place that TREK assigned to the wrong country.',
  'help.guide.country-places.step.1':
    'Search a country you have visited and pick it. Its card appears in the panel at the bottom.',
  'help.guide.country-places.step.2': 'Click the Places badge in the card, the one with the pin.',
  'help.guide.country-places.step.3':
    'The dialog lists every place counted for the country, grouped by trip; with more than six, Search places at the top narrows the list. Click a place or a trip heading to open that trip in the planner.',
  'help.guide.country-places.result': 'The planner opens on the trip the place belongs to.',
  'help.guide.country-places.tip.1':
    'A place under the wrong country usually has a wrong address or wrong coordinates. Open its trip from here and fix the place there.',
  'help.guide.country-places.tip.2':
    'The badge only appears when the country has places of its own. A country you only marked by hand has none.',
  'help.guide.planned-countries.title': 'Show the countries you are going to',
  'help.guide.planned-countries.goal':
    'Show the countries of your upcoming trips on the map without counting them as visited.',
  'help.guide.planned-countries.step.1':
    'Turn on Show planned countries, top right. The number next to it shows how many planned countries there are.',
  'help.guide.planned-countries.step.2':
    'Search a planned country and pick it: the panel says Planned and the map tooltip shows when you are going.',
  'help.guide.planned-countries.result':
    'Planned countries appear with a dashed outline, so they never look like countries you have already visited. The switch remembers your choice.',
  'help.guide.planned-countries.tip.1':
    'A country counts as visited once the trip there has started. A trip that is in progress counts too. Trips without dates are not included in the statistics at all.',
  'help.guide.planned-countries.tip.2': 'The switch only exists while you have upcoming trips.',
  'help.guide.regions.title': 'Mark a region',
  'help.guide.regions.goal': 'Mark the states, provinces or prefectures you have been to, not only countries.',
  'help.guide.regions.step.1':
    'Zoom into a country until the borders of its states and provinces appear. If you search for the country and pick it, the map moves close enough.',
  'help.guide.regions.step.2':
    'Click a region. When you hover over a region, its name appears. The popup shows the region and its country.',
  'help.guide.regions.step.3': 'Choose Mark as visited.',
  'help.guide.regions.result':
    'The region is filled with the country’s colour. Marking a region also counts the country as visited if it was not already.',
  'help.guide.regions.tip.1':
    'When you click a visited region, it offers Remove, whether you marked it yourself or it was added because of a place.',
  'help.guide.regions.tip.2':
    'Regions where you have real places are marked automatically. You do not need to do anything for them.',
  'help.guide.regions.tip.3':
    'Add to bucket list works for a region too. The region is shown with the same hatching as a country on your bucket list.',
  'help.guide.search-place.title': 'Find a place and mark its region',
  'help.guide.search-place.goal': 'Mark Bavaria by searching for Munich, without knowing which region a city is in.',
  'help.guide.search-place.step.1':
    'Type a city, a landmark or an address into the search box. Countries come first; the matching places appear under Places below them.',
  'help.guide.search-place.step.2': 'Pick the place. The map moves there and finds the region the spot is in.',
  'help.guide.search-place.step.3':
    'Choose Mark as visited for that region, or Add to bucket list if you have not been there yet.',
  'help.guide.search-place.result':
    'The region is marked, and the country too. For countries without region data in the map bundle, the country itself is marked instead.',
  'help.guide.search-place.tip.1':
    'Places come from the same search as everywhere else in TREK, so they use the provider your admin set up.',
  'help.guide.search-place.tip.2': 'If the region is already marked, the popup asks whether to remove it instead.',
  'help.guide.bucket-country.title': 'Put a country on the bucket list',
  'help.guide.bucket-country.goal':
    'Keep a wishlist of countries on the map, separate from the countries you have visited.',
  'help.guide.bucket-country.step.1': 'Search the country and pick it, or click it on the map.',
  'help.guide.bucket-country.step.2': 'Choose Add to bucket list.',
  'help.guide.bucket-country.step.3':
    'Pick a month and year if you already know when, then confirm with Add to bucket list.',
  'help.guide.bucket-country.result':
    'The country is shown with diagonal lines in the colour it will have after you visit it, and it appears in the Bucket List tab of the panel.',
  'help.guide.bucket-country.tip.1': 'The same popup offers Remove from wishlist once the country is on the list.',
  'help.guide.bucket-country.tip.2':
    'One entry per target date: the same country can be on the list for two different months, but not twice for the same one.',
  'help.guide.bucket-place.title': 'Add a place to the bucket list',
  'help.guide.bucket-place.goal':
    'Save a city, a sight or an address you want to visit, with coordinates and a target date.',
  'help.guide.bucket-place.step.1': 'Open the Bucket List tab in the panel at the bottom.',
  'help.guide.bucket-place.step.2': 'Click Add place.',
  'help.guide.bucket-place.step.3':
    'Type the name and press the search button; pick the match so the place gets coordinates. You can also type a name and skip the search.',
  'help.guide.bucket-place.step.4': 'Pick a month and year if you like and click Add.',
  'help.guide.bucket-place.result':
    'The place appears at the top of your bucket list with its target date. Hover over it to show the × that removes it.',
  'help.guide.bucket-place.tip.1':
    'Dawarich can mark a wish as done later only if the wish has coordinates. It does this once your recordings show you were there.',
  'help.guide.stats.title': 'Read your statistics',
  'help.guide.stats.goal': 'Learn what the numbers in the panel count, and what they do not count.',
  'help.guide.stats.step.1':
    'Countries is the number of distinct countries you have actually been to. Planned countries are shown below the number and are not counted in it. Regions counts the states and provinces you have been to. Trips, Places and Days are totals across all your trips. Cities is calculated from your places’ addresses, so it is an estimate.',
  'help.guide.stats.step.2':
    'The continents show visited countries per continent. Antarctica appears in the row after you have visited it. Next come your streak (consecutive years with at least one trip) and how many trips you took this year.',
  'help.guide.stats.result':
    'The numbers update automatically as you plan your trips. You do not need to maintain anything here.',
  'help.guide.stats.tip.1':
    'Cities are taken from the address text, not looked up. So a short address like “Osteria Francescana, Italy”, or one that ends in a prefecture, can be counted as a region instead of a city.',
  'help.guide.stats.tip.2':
    'Countries you marked by hand count in Countries and the continents, but add no trips, places or days.',
  'help.guide.tour-activity-stats.title': 'See what you did on your tours',
  'help.guide.tour-activity-stats.goal':
    'Read the distance, climb and number of tours you have done across all your trips, for a period and a type, and leave out a tour that did not happen.',
  'help.guide.tour-activity-stats.step.1':
    'In the panel at the bottom of the map, open the Tours tab next to Stats and Bucket List.',
  'help.guide.tour-activity-stats.step.2':
    'Pick a period and a type with the two pills on the left. Period offers All time, This year, Last 12 months and every earlier year you have tours in; Type narrows the numbers to one kind of tour, or All types.',
  'help.guide.tour-activity-stats.step.3':
    'Read the numbers: the distance, with the number of tours in its corner, then Ascent and Descent. With All types, the three types you did most are listed next, each with its count and distance.',
  'help.guide.tour-activity-stats.step.4':
    'The badges on the right show what the sums are based on: Planned for tours counted with your trip planning, Recorded for tours with a linked actual track. Still ahead, On no day and No date count the tours that are not included yet. The i explains the rule.',
  'help.guide.tour-activity-stats.step.5':
    'Click Show tours. My tour activities opens with the totals, the breakdown By type and every tour of the period with its day, its trip, its distance and its climb. The pills in its header also change the period and type here.',
  'help.guide.tour-activity-stats.step.6':
    'For a tour that did not happen, click Leave out, the round button at the end of its row. The tour stays in the list, dimmed and marked Left out. The same button, now Count again, counts it again.',
  'help.guide.tour-activity-stats.result':
    'The sums in the dialog and in the Tours tab no longer include the tour you left out. Its route, its days and the trip stay as they are.',
  'help.guide.tour-activity-stats.tip.1':
    'A tour counts after its last day is over. A tour that is on no day, or only on days without a date, never counts. To count it, put it on a day with a date in its trip.',
  'help.guide.tour-activity-stats.tip.2':
    "Link the track you actually took with Add actual track in the tour's detail, and its recorded values replace the planned ones here. A tour planned on several days counts once.",
  'help.guide.tour-activity-stats.tip.3':
    'A day that names participants counts only for them; a day that names nobody counts for everyone in the trip. The tab loads live data and needs an internet connection.',
  'help.guide.dawarich-countries.title': 'Add countries from your recordings',
  'help.guide.dawarich-countries.goal':
    'Use Dawarich to find out which countries you were in over the last year, and add the ones you confirm to the map.',
  'help.guide.dawarich-countries.step.1':
    'When the Dawarich addon is connected, a Dawarich panel with two tiles appears at the bottom of the map, left of the statistics. Click Countries.',
  'help.guide.dawarich-countries.step.2':
    'The dialog opens on its Countries tab. Click Look for countries: TREK reads the countries and cities your recordings cover in the last 12 months, one month at a time, so this can take a moment. Every country your Atlas does not have yet is listed with its flag, how many cities, and the name of the first city. Each country is ticked by default. Click a row to leave it out.',
  'help.guide.dawarich-countries.step.3':
    'Confirm with the button at the bottom right, which reads Add 5 countries when five rows are ticked. The dialog says how many were added. When you close it, the map is already updated.',
  'help.guide.dawarich-countries.result':
    'The confirmed countries are coloured on the map and counted in Countries, recorded as coming from Dawarich. The countries you marked by hand do not change.',
  'help.guide.dawarich-countries.tip.1':
    'Countries the Atlas already shows as visited, by hand, from a trip or from an earlier check, are left out, so your own marks never change. A country you removed from the Atlas earlier is added again when you confirm it here.',
  'help.guide.dawarich-countries.tip.2':
    'If TREK cannot match a country name, the name is listed under the rows and is not dropped. Check again asks Dawarich again. The note under the list says that the last 12 months were checked. You cannot change this period.',
  'help.guide.dawarich-wishes.title': 'Tick off wishes from your recordings',
  'help.guide.dawarich-wishes.goal':
    'Find out which places on your bucket list you have actually reached, and mark them as reached with the date you reached them.',
  'help.guide.dawarich-wishes.step.1':
    'In the Dawarich panel at the bottom of the map, to the left of the statistics, click Wishlist.',
  'help.guide.dawarich-wishes.step.2':
    'The dialog opens on its Wishlist tab. Click Check wishlist: TREK looks through your recordings for every entry that has coordinates. A wish you reached is listed with how close you got, how long you stayed and the day, and is ticked by default. One you already ticked off says Already ticked off. Under the list, a note counts the entries without coordinates and also shows the rule: A wish counts as reached within 250 m and after 20 minutes on the spot.',
  'help.guide.dawarich-wishes.step.3':
    'Confirm with the button at the bottom right, which reads Tick off 2 when two rows are ticked. Then close the dialog and open the Bucket List tab of the panel next to it.',
  'help.guide.dawarich-wishes.result':
    'Each wish gets a green tick with the date of the stay, not today’s date. Its tooltip says Ticked off from your Dawarich recordings. Click the date to undo it.',
  'help.guide.dawarich-wishes.tip.1':
    'Driving past does not count: you must be close to the place and stay there for some time. If several stays qualify, the longest one is used. A wish without coordinates cannot be checked, so add places through the search in Add place, not by name only.',
  'help.guide.dawarich-wishes.tip.2':
    'One check looks at up to 50 entries, starting with the ones that are not ticked off yet. If there are more, TREK tells you. A wish that was already ticked off keeps its own date.',

  // ── Screen: collections ─────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Collections',
  'help.ctx.collections.summary':
    'Collections is your library outside of any trip: named lists of places you found and want to keep, each place with a status of Idea, Want to go or Visited, and, with Tours on, whole tours you kept from a trip. Places and tours are copied into and out of trips, never linked, so a list and a trip never change each other.',
  'help.ctx.collections.bullet.1':
    'The lists column on the left shows your own lists, the lists shared with you, invites you have not answered yet, and All saved, which combines everything in the lists you own. New list and the file import are at the top.',
  'help.ctx.collections.bullet.2':
    'The header of the open list shows its colour, cover, description and links, the members, and Edit (owner only), Export and Share on the right. On a list shared with you, the Share button shows Shared.',
  'help.ctx.collections.bullet.3':
    'Filter row above the places: the + to add a place, the Status, Category, Rating and Sort dropdowns, the checkbox icon for Select and the cloud icon for Import from a trip. The label filter appears in this row only when no map is shown.',
  'help.ctx.collections.bullet.4':
    'Place rows: photo, name and address, labels and category, and the status pill on the right. One click on the pill changes it to the next status.',
  'help.ctx.collections.bullet.5':
    'Map on the right: a pin for each place with coordinates. Its top bar has Expand map (Show list once the map is full), the label filter with the button that manages labels, and the Search places box. Click a pin to open that place.',
  'help.ctx.collections.bullet.6':
    'Detail sheet: click a row for the cover, category, status, star rating, labels, description and links. The camera on the cover changes the photo. At the bottom are Edit, Copy to trip, the navigation button and Remove from list.',
  'help.ctx.collections.bullet.7':
    'Kept tours: tours you kept from a trip are the first rows of a list, with their grade, type, the trip they came from and their measures. Add to a trip makes a new tour from one, and the bin icon removes it from the list.',
  'help.guide.create-list.title': 'Create a list',
  'help.guide.create-list.goal': 'Create a new named list, with a colour and a cover, ready for places.',
  'help.guide.create-list.step.1': 'Click New list at the top of the lists sidebar.',
  'help.guide.create-list.step.2':
    'Give the list a name and pick a colour. Cover image, description and links are optional; you can add them later with Edit.',
  'help.guide.create-list.step.3': 'Click Create.',
  'help.guide.create-list.tip.1':
    'The cover can be an upload of your own or a picture found through the Unsplash search in the same dialog.',
  'help.guide.create-list.result':
    'The list opens empty, with Add a place and Import from a trip as the two ways to fill it.',
  'help.guide.add-place.title': 'Add a place',
  'help.guide.add-place.goal':
    'Find a place and save it to the open list with name, category, status and notes in one step.',
  'help.guide.add-place.step.1':
    'Click the + at the start of the filter row above the places. On a list that is still empty, click Add a place in the middle of the page.',
  'help.guide.add-place.step.2':
    'Type the place into the search field and pick a result. Name, address and coordinates are filled in from the result.',
  'help.guide.add-place.step.3':
    'Set the status and, if you like, a category, a description and links, then click Add. The dialog stays open for the next place; Cancel closes it.',
  'help.guide.add-place.tip.1':
    "From inside a trip, Save to Collection in the place inspector or in a place's menu puts a trip place on a list without leaving the trip.",
  'help.guide.add-place.tip.2':
    'The list must be yours or one where you are an editor or admin; the + is not there on All saved or on a list you only view.',
  'help.guide.add-place.result': 'The place appears in the list and, when it has coordinates, as a pin on the map.',
  'help.guide.import-from-trip.title': 'Import places from a trip',
  'help.guide.import-from-trip.goal':
    "Bring a whole trip's places onto a list at once instead of saving them one by one.",
  'help.guide.import-from-trip.step.1':
    'Click the import button with the cloud arrow in the filter row. On an empty list, the same button is next to Add a place.',
  'help.guide.import-from-trip.step.2': 'Pick one of your trips.',
  'help.guide.import-from-trip.step.3':
    'Tick the places you want. Places already on the list are greyed out. Places that are not on any day of the trip are selected at the start. If every place is already on a day, all new places are selected. Only new hides the places the list already has.',
  'help.guide.import-from-trip.step.4': 'Click Import. The button always says how many are about to be added.',
  'help.guide.import-from-trip.tip.1':
    'TREK skips duplicates by name or coordinates automatically, so it is safe to import twice.',
  'help.guide.import-from-trip.tip.2':
    "Inside a trip's place list, select mode offers Save to Collection for a hand-picked set of places instead.",
  'help.guide.import-from-trip.result':
    'The places are copied to the list with their name, address, coordinates, description and category. The trip does not change.',
  'help.guide.place-status.title': "Set a place's status",
  'help.guide.place-status.goal': 'Keep track of what is an idea, what is on the shortlist and where you have been.',
  'help.guide.place-status.step.1': 'Click the status pill at the right end of a place row. Idea becomes Want to go.',
  'help.guide.place-status.step.2': 'Click it again for Visited, and once more to go back to Idea.',
  'help.guide.place-status.tip.1':
    'Status exists only in Collections. When you copy a place into a trip, its status is not copied.',
  'help.guide.place-status.tip.2':
    'From a trip, Save to Collection opens Save to list with a status pill per list the place is on, and the selection bar of the places panel has Mark visited in your lists.',
  'help.guide.place-status.result':
    'The pill and its colour change immediately, and the counts in the status filter above the list update.',
  'help.guide.place-detail.title': 'Open a saved place',
  'help.guide.place-detail.goal':
    'See everything about a place and what you can do with it: edit, copy to a trip, find the way, remove.',
  'help.guide.place-detail.step.1':
    'Click a place row. The detail sheet opens next to the list and the map moves to the place.',
  'help.guide.place-detail.step.2':
    'At the bottom are Edit, Copy to trip, the navigation button that opens the place in a map app, and Remove from list. The camera on the cover replaces the automatic photo with a photo of your own.',
  'help.guide.place-detail.tip.1':
    'The cover is fetched automatically when the place has no picture of its own. Your own upload can be JPG, PNG, GIF, WebP or HEIC up to 20 MB. The bin icon next to the camera restores the automatic photo.',
  'help.guide.place-detail.tip.2':
    'Every member, you included, can leave a star rating under the status; the Rating filter in the filter row uses the average.',
  'help.guide.place-detail.result':
    'With Edit, you can change the name, category, labels, address, coordinates, description and links directly in the sheet.',
  'help.guide.labels.title': 'Group places with labels',
  'help.guide.labels.goal':
    'Give a list its own labels, such as districts or days, in addition to the shared categories.',
  'help.guide.labels.step.1':
    'Click Add label next to the labels above the map (Manage labels once the list has some). When no map is shown, the button is at the end of the filter row.',
  'help.guide.labels.step.2':
    'Type a name, pick a colour and click Add label. Rename, recolour or delete existing labels in the same dialog.',
  'help.guide.labels.step.3':
    'Turn on Select, tick the places and click Assign label in the selection bar, then pick the labels and confirm with Assign label. For a single place, you can also add labels with Edit on its detail sheet.',
  'help.guide.labels.step.4':
    'Click one or more labels above the map to show only places that have any of these labels, in the list and on the map. Click a label again to remove it from the filter.',
  'help.guide.labels.tip.1':
    'Labels belong to the list they were created in. If you move a place to another list, its labels are removed.',
  'help.guide.labels.tip.2': 'Managing and assigning labels needs edit rights on the list.',
  'help.guide.labels.result':
    'Labelled places show their labels on the row; the label filter is there for every member, including viewers.',
  'help.guide.filter-select.title': 'Filter and select places',
  'help.guide.filter-select.goal': 'Filter the list and change many places at once.',
  'help.guide.filter-select.step.1':
    'Use the dropdowns in the filter row: status, category, minimum rating and sort order. Status and category show how many places match each choice.',
  'help.guide.filter-select.step.2':
    'Click the checkbox icon, Select, after the dropdowns. Every row gets a checkbox and a selection bar appears.',
  'help.guide.filter-select.step.3':
    'Tick places or use Select all for all places the filter shows, then choose Assign label, Move to list, Duplicate to list, Copy to trip or Delete. Only the owner or an admin of the list can use Move and Delete.',
  'help.guide.filter-select.tip.1':
    'Select all selects only the places that match the filter. To act on all your Want to go places, filter to Want to go and click Select all.',
  'help.guide.filter-select.result':
    'The actions apply to the whole selection at once. The × on the right closes select mode.',
  'help.guide.move-to-list.title': 'Move or duplicate places to another list',
  'help.guide.move-to-list.goal':
    'Reorganise your lists by moving places between them or copying them into a second one.',
  'help.guide.move-to-list.step.1': 'Click the checkbox icon, Select, in the filter row and tick the places.',
  'help.guide.move-to-list.step.2':
    'Click Duplicate to list to keep them here as well, or Move to list to remove them from this list.',
  'help.guide.move-to-list.step.3':
    'Pick the list they go to. With more than three lists, a search box at the top narrows them.',
  'help.guide.move-to-list.tip.1':
    'Labels belong to one list, so a moved or duplicated place has no labels in the new list.',
  'help.guide.move-to-list.tip.2':
    'Moving removes places from the list, so only its owner or an admin sees Move to list. Duplicate to list works from any list you can open.',
  'help.guide.move-to-list.result':
    'The places are on the other list, and a short note says how many were moved or duplicated.',
  'help.guide.copy-to-trip.title': 'Copy places into a trip',
  'help.guide.copy-to-trip.goal': 'Add saved places as stops to one of your trips.',
  'help.guide.copy-to-trip.step.1':
    'Turn on Select and tick the places, or open one place and use Copy to trip on its detail sheet.',
  'help.guide.copy-to-trip.step.2': 'Click Copy to trip in the selection bar.',
  'help.guide.copy-to-trip.step.3': 'Pick the trip. Use the search box to filter a long list.',
  'help.guide.copy-to-trip.tip.1':
    'Viewers of a shared list can do this too. It copies the places from the list and does not change the list.',
  'help.guide.copy-to-trip.tip.2': 'A place the trip already has is skipped, and TREK shows how many were skipped.',
  'help.guide.copy-to-trip.result':
    "The places are added to that trip's place list with name, description, category, notes, price, coordinates, photo and tags. Nothing changes in the collection.",
  'help.guide.share-list.title': 'Share a list with someone',
  'help.guide.share-list.goal': 'Plan a list together with other people on this TREK, live.',
  'help.guide.share-list.step.1': 'Click Share in the hero of your list.',
  'help.guide.share-list.step.2': 'Select the user and a role: Viewer, Editor or Admin.',
  'help.guide.share-list.step.3':
    'Click Send invite. The person shows as pending until they accept the invite in their lists rail or from its notification.',
  'help.guide.share-list.tip.1':
    'Viewers can look, rate and copy places into their own trips. Editors add and edit places and labels. Admins can also move and delete.',
  'help.guide.share-list.tip.2':
    'Only the owner can invite and remove people; a member can leave a shared list themselves.',
  'help.guide.share-list.result':
    'Once they accept, the list appears under Shared for them, and every change syncs live. You can still edit members and their roles in the same dialog.',
  'help.guide.accept-list-invite.title': 'Accept an invite to a list',
  'help.guide.accept-list-invite.goal': 'Join a list someone shared with you, or decline the invite.',
  'help.guide.accept-list-invite.step.1':
    'Find the invite under Invites in the lists rail. If you followed the invite notification, the card is at the top of the page. It names the list and who it is from.',
  'help.guide.accept-list-invite.step.2': 'Click Accept to join, or Decline to reject the invitation.',
  'help.guide.accept-list-invite.tip.1':
    'What you can do on the list depends on the role the owner gave you: Viewer, Editor or Admin.',
  'help.guide.accept-list-invite.tip.2':
    'Click Shared at the top of the list to see its members. Click Leave list there to leave the list again.',
  'help.guide.accept-list-invite.result':
    'The list appears under Shared in the rail and opens with its places. Changes its members make show up live.',
  'help.guide.export-list.title': 'Export a list as a file',
  'help.guide.export-list.goal': 'Give a list to someone on another TREK server, or open it in a map app.',
  'help.guide.export-list.step.1': 'Click Export in the hero of the list.',
  'help.guide.export-list.step.2':
    'Pick TREK list to use the list in another TREK, with labels and status, or GPX for OsmAnd, Organic Maps, a Garmin and other apps that read waypoints.',
  'help.guide.export-list.tip.1':
    'A place without coordinates cannot be a GPX waypoint; it is left out and TREK tells you how many were.',
  'help.guide.export-list.tip.2':
    'Ratings, members and uploaded photos are not exported, on purpose; they belong to this TREK, not to the list.',
  'help.guide.export-list.result': 'The file downloads. Any member of a shared list may export it.',
  'help.guide.import-file.title': 'Import a list from a file',
  'help.guide.import-file.goal': 'Import a TREK list file or a GPX file, as a new list or into an existing list.',
  'help.guide.import-file.step.1': 'Click the import button with the upload arrow next to New list in the lists rail.',
  'help.guide.import-file.step.2':
    'Choose the file. Before TREK imports anything, it shows what is in the file: the name, how many places and how many labels.',
  'help.guide.import-file.step.3':
    'Keep New list and change the name if you like, then click Import. Or pick Add to a list to put the places into a list you can edit, and click Add to list.',
  'help.guide.import-file.tip.1':
    'From a GPX every named waypoint becomes a place; tracks are lines and are left out, and the preview says how many points that was.',
  'help.guide.import-file.tip.2':
    'A file that is neither a TREK list nor a GPX is refused, and TREK shows the reason. If a single place cannot be read, only that place is skipped, not the whole file.',
  'help.guide.import-file.result':
    'The list opens with the imported places. An import into a list only adds places. Places that are already there keep their status, notes and labels.',
  'help.guide.edit-list.title': 'Edit or delete a list',
  'help.guide.edit-list.goal': "Change a list's name, colour, cover, description or links, or remove the list.",
  'help.guide.edit-list.step.1': 'Click Edit in the hero of the list. Only the owner sees it.',
  'help.guide.edit-list.step.2':
    'Change what you like and click Save. The bin icon at the bottom left, Delete list, deletes the list and all of its places after you confirm.',
  'help.guide.edit-list.tip.1': 'Deleting a list cannot be undone. Export it first if you want to keep a copy.',
  'help.guide.edit-list.result': 'The header at the top shows the new colour, cover and description right away.',
  'help.guide.all-saved.title': 'Search your whole library',
  'help.guide.all-saved.goal': 'See the places from every list you own at once.',
  'help.guide.all-saved.step.1':
    'Click All saved in the lists rail. It shows the places of every list you own or co-own in one view.',
  'help.guide.all-saved.step.2':
    'Type into Search places above the map and use the filters as on any list. Select works here too: move, duplicate, copy to a trip or delete across lists.',
  'help.guide.all-saved.tip.1': 'Labels and kept tours belong to one list, so neither is offered on All saved.',
  'help.guide.all-saved.result':
    'This view shows all your saved places together. You cannot add or import places here, because there is no single list to add them to.',
  'help.guide.tour-collection-add-to-trip.title': 'Add a tour from a list to a trip',
  'help.guide.tour-collection-add-to-trip.goal':
    'Make a new tour in one of your trips from a tour saved in a list, with or without its waypoints.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Open the list. Kept tours are the first rows, above the places. Click Add to a trip on the tour, or click the row itself.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'Under Into the trip, pick the trip. A trip you may not add tours to is dimmed.',
  'help.guide.tour-collection-add-to-trip.step.3':
    'Under Waypoints, choose the tile with the waypoints to add the start, stops and end in their order, or Line only to add only the saved line.',
  'help.guide.tour-collection-add-to-trip.step.4': 'Change Name in the trip if you like, then click Add to a trip.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'The new tour is on no day yet and adds no places. Neither the list nor the original tour changes.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'If a tour was kept without a line, its waypoints must be added with it. The dialog tells you this and selects that option for you.',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'To keep a tour in a list, open a saved tour in the trip and click Collection in its footer.',
  'help.guide.tour-collection-add-to-trip.result':
    'The dialog confirms that the tour now belongs to that trip. Open trip takes you there. Close leaves you in Collections.',
  'help.guide.tour-collection-manage.title': 'Find and remove kept tours',
  'help.guide.tour-collection-manage.goal':
    'See which tours a list contains and where they came from, and remove the ones you no longer need.',
  'help.guide.tour-collection-manage.step.1':
    'Open a list. Each saved tour shows its grade, type, the trip it was saved from, its distance and climb, and how many waypoints it has. Hover the trip name to see who saved it.',
  'help.guide.tour-collection-manage.step.2':
    'Type into Search places. It narrows the tours by name together with the places.',
  'help.guide.tour-collection-manage.step.3':
    "Click the bin at the end of the tour's row and confirm with Remove from the collection.",
  'help.guide.tour-collection-manage.tip.1':
    'Removing a tour from the list does not change the tours already made from it in your trips.',
  'help.guide.tour-collection-manage.tip.2': 'Only the owner and the admins of the list see the bin.',
  'help.guide.tour-collection-manage.tip.3': 'Kept tours appear only in their own list, not in All saved.',
  'help.guide.tour-collection-manage.result': 'The tour is removed from the list, and a short message confirms it.',

  // ── Screen: journey ─────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Journey',
  'help.ctx.journey.summary':
    'Journey is your photo-first travel journal. Every journey is linked to one or more trips, and you fill it day by day with entries that have a story, photos, mood and weather. This screen lists your journeys; open one to write.',
  'help.ctx.journey.bullet.1':
    'The banner at the top shows the journey in progress, or your latest one, with its entry, photo and place counts. Continue writing opens it on today. When a trip has just ended, a Trip just ended banner above it offers to turn that trip into a journey.',
  'help.ctx.journey.bullet.2':
    'Below All Journeys, one card per journey with its cover, status, dates and counts; the journey shown in the banner does not appear there again. Click a card to open it.',
  'help.ctx.journey.bullet.3': 'The last card in the grid, Create a new Journey, starts one from your trips.',
  'help.guide.create-journey.title': 'Create a journey',
  'help.guide.create-journey.goal': "Start a journal for a trip, with the trip's places already added as suggestions.",
  'help.guide.create-journey.step.1': 'Click Create a new Journey, the last card in the grid.',
  'help.guide.create-journey.step.2':
    'Give it a name and, if you like, a subtitle, then tick the trips it belongs to. The counter says how many places will be added.',
  'help.guide.create-journey.step.3': 'Click Create Journey.',
  'help.guide.create-journey.tip.1': 'More trips can be linked later from Journey Settings.',
  'help.guide.create-journey.tip.2': 'A journey without trips works too; you then add entries by hand.',
  'help.guide.create-journey.tip.3':
    'When a trip has just ended, Create Journey in the Trip just ended banner at the top starts a journey with that trip already selected.',
  'help.guide.create-journey.result':
    'The journal opens. Every place of the linked trips appears in the timeline as a suggestion, once for each day it is planned on. You can write an entry for each one.',
  'help.guide.open-journey.title': 'Open a journey',
  'help.guide.open-journey.goal': 'Open a journal and see where it opens.',
  'help.guide.open-journey.step.1':
    'Click a card. Each one shows the cover, the dates and how many entries, photos and places the journey contains.',
  'help.guide.open-journey.tip.1':
    'The cover is the first photo of the journey unless you set one in Journey Settings.',
  'help.guide.open-journey.result':
    'A journey that is in progress opens on today, or on the last entry before today when nothing is written for today yet. A finished journey opens at the beginning.',
  'help.guide.continue-writing.title': 'Continue the current journey',
  'help.guide.continue-writing.goal': "Open today's page of the journey you are on directly.",
  'help.guide.continue-writing.step.1':
    'Click Continue writing in the banner at the top. It shows the journey that is in progress, or the latest one if none is in progress.',
  'help.guide.continue-writing.tip.1':
    'When a trip has just ended, a Trip just ended banner is shown above this one: Create Journey starts a journey with that trip ticked, Dismiss hides the offer in this browser.',
  'help.guide.continue-writing.result':
    'The journal opens on today, or on the last entry before today when nothing is written yet.',
  'help.ctx.journey-detail.title': 'Journal',
  'help.ctx.journey-detail.summary':
    'One open journey: the timeline on the left, day by day, and the map on the right with switchable layers for the plan, what you recorded, the entries and the photos. The header shows the counts, Studio, the suggestions switch and ⋯ for Journey Settings. Use the toolbar under it to add entries.',
  'help.ctx.journey-detail.bullet.1':
    'Header: back arrow and status badge, cover, title and subtitle, the day, place, entry and photo counts, and on the right Studio, the eye that hides or shows the suggestions, and ⋯ for Journey Settings.',
  'help.ctx.journey-detail.bullet.2':
    'Toolbar: Timeline and Gallery tabs, Search this journey, and Add Entry. On Gallery, Upload replaces Add Entry.',
  'help.ctx.journey-detail.bullet.3':
    'Timeline: one section per day with its number, the place count and a + to add an entry on that day. Below it the entry cards with photos, mood, weather and story, and the dashed suggestion cards from the trips, each with an × to dismiss it.',
  'help.ctx.journey-detail.bullet.4':
    "Map: the layer bar at its top switches Plan (hollow pins and the trips' dashed GPX routes), Recorded (solid routes kept from Dawarich), Entries (pins in day colours, joined in date order by a thin dashed line) and Photos. The (i) next to them explains every symbol.",
  'help.ctx.journey-detail.bullet.5':
    'Journey Settings (⋯): cover, name and subtitle, status, GPX tracks, recorded days, places from photos, entry fields, dismissed suggestions, synced trips, contributors and which members of a trip get access, public sharing, archive and delete.',
  'help.ctx.journey-detail.bullet.6':
    'At the bottom of a long timeline you find Back to top, a day count that jumps to any day or entry, and Jump to the last entry.',
  'help.ctx.journey-detail.bullet.7':
    'With Dawarich connected, a day header also shows Take over recording (or the distance of the route saved for the day) and Take over day. On a day with waiting stays, the stays are grouped in one row at the end of the day.',
  'help.guide.add-entry.title': 'Write an entry',
  'help.guide.add-entry.goal': "Add a day's story with title, text, mood and weather.",
  'help.guide.add-entry.step.1':
    'Click Add Entry in the toolbar, or the + at the right end of a day header to start on that day.',
  'help.guide.add-entry.step.2':
    'Give the entry a title and write your text. The toolbar above the text adds bold, italic, headings, quotes, links and lists in Markdown.',
  'help.guide.add-entry.step.3':
    'In the right column, check the date and time, search a location or use your current position, and pick a mood and the weather.',
  'help.guide.add-entry.step.4': 'Click Save.',
  'help.guide.add-entry.tip.1':
    'When you write into a suggestion, you use the same editor, with the place already set.',
  'help.guide.add-entry.tip.2':
    'An entry with a place has the option Leave out of the route: the entry stays in the journal, but it is not counted in the distance or the countries and is not shown on the map in Studio.',
  'help.guide.add-entry.result':
    'The entry appears on its day in the timeline and as a pin on the map. The counts in the header update.',
  'help.guide.entry-photos.title': 'Add photos and videos to an entry',
  'help.guide.entry-photos.goal': "Add photos to a day; the first one becomes the entry's cover.",
  'help.guide.entry-photos.step.1': "Open an entry's menu with the ⋯ on its card and choose Edit.",
  'help.guide.entry-photos.step.2':
    "Click Upload photos and pick the files. From Gallery takes pictures already in the journey's gallery; External photos searches a connected Immich or Synology library for that day.",
  'help.guide.entry-photos.step.3': 'Hover over a picture and click Make 1st to choose the cover, then click Save.',
  'help.guide.entry-photos.tip.1':
    'You add videos to an entry the same way: mp4, m4v, webm or mov up to 500 MB. They are stored without changes.',
  'help.guide.entry-photos.tip.2':
    'HEIC files from an iPhone are converted to JPEG on upload, which removes their GPS and camera metadata.',
  'help.guide.entry-photos.result':
    'The photos show on the card and in the gallery; the first one is the thumbnail everywhere.',
  'help.guide.entry-draft.title': 'Keep an entry as a draft',
  'help.guide.entry-draft.goal': 'Write an entry now and hide it from the shared journey until it is ready.',
  'help.guide.entry-draft.step.1': 'In the editor, switch on Draft in the right column.',
  'help.guide.entry-draft.step.2': 'Click Save. The card now shows a Draft badge.',
  'help.guide.entry-draft.tip.1':
    'Contributors still see a draft. Only the public link hides it until you switch Draft off.',
  'help.guide.entry-draft.tip.2':
    'When you take over a day from Dawarich, its entries are drafts. Check for the badge before you share.',
  'help.guide.entry-draft.result':
    'The entry stays in your timeline, marked Draft, and is not shown on the shared link.',
  'help.guide.suggestions.title': 'Use or dismiss the suggestions',
  'help.guide.suggestions.goal':
    'Turn the places of your trips into entries, and dismiss the ones you will not write about.',
  'help.guide.suggestions.step.1':
    'A suggestion is a card with a dashed border and an Add Entry button: a place of a linked trip on the day it was planned. Click it to open the editor with the place and day already set.',
  'help.guide.suggestions.step.2':
    'Click the × at the right end of a card you will not use. The card is removed from the timeline but not deleted, and the trip sync will not suggest it again.',
  'help.guide.suggestions.step.3':
    'Changed your mind? Open Journey Settings with ⋯ in the header: Bring back dismissed suggestions shows how many there are and returns them all.',
  'help.guide.suggestions.tip.1': 'A place that is planned on two days gives a suggestion on each of those days.',
  'help.guide.suggestions.tip.2': 'Suggestions never count in the statistics; only written entries do.',
  'help.guide.suggestions.result':
    'The timeline shows only the entries you want to write. The eye icon in the header hides all suggestions at once while you read.',
  'help.guide.add-on-day.title': 'Add an entry on an earlier day',
  'help.guide.add-on-day.goal': 'Write about a day in the past without changing the date afterwards.',
  'help.guide.add-on-day.step.1': "Click the + at the right end of that day's header.",
  'help.guide.add-on-day.step.2': 'The editor opens with that date set. Write and Save as usual.',
  'help.guide.add-on-day.tip.1':
    'To change the order within a day, hover an entry: Move up and Move down appear to its left.',
  'help.guide.add-on-day.result': 'The entry is added to the correct day immediately.',
  'help.guide.pros-cons.title': 'Add a verdict',
  'help.guide.pros-cons.goal': 'Sum up a day with what was great and what was not.',
  'help.guide.pros-cons.step.1':
    'In the editor, find Pros & Cons under the story. Type a point into Pros or Cons and use Add another for the next one.',
  'help.guide.pros-cons.step.2': 'Save. On the card, Show more opens the story and the verdict as two short lists.',
  'help.guide.pros-cons.tip.1':
    'If a journey does not use verdicts, you can switch the section off under Entry fields in Journey Settings.',
  'help.guide.pros-cons.result': 'Thumbs up and thumbs down appear under the story, where you can see them quickly.',
  'help.guide.search-journey.title': 'Find something in a long journal',
  'help.guide.search-journey.goal': 'Find an entry without scrolling through weeks of entries.',
  'help.guide.search-journey.step.1':
    'Type into Search this journey in the toolbar. The timeline filters as you type, across titles, stories, places and tags. Accents and case do not matter.',
  'help.guide.search-journey.step.2':
    'To jump to a day instead, click the day count at the bottom of the timeline, between Back to top and Jump to the last entry.',
  'help.guide.search-journey.step.3':
    "Click a day to scroll there, or its arrow to list that day's entries and pick one.",
  'help.guide.search-journey.tip.1':
    'A running journey opens on today’s page, so the current page is usually already visible.',
  'help.guide.search-journey.tip.2':
    'The eye in the header hides the suggestions, so you see only the entries you wrote.',
  'help.guide.search-journey.result':
    'The timeline scrolls to the day or entry you picked, and the map moves to it. Only the matching entries are shown until you clear the search box.',
  'help.guide.gallery-map.title': 'Browse the gallery and the map',
  'help.guide.gallery-map.goal': 'See the whole journey as pictures, and as places on the map.',
  'help.guide.gallery-map.step.1':
    'Switch to Gallery in the toolbar. It shows every photo of every entry, plus pictures uploaded to the gallery directly. Click one to open it in the lightbox.',
  'help.guide.gallery-map.step.2':
    'Upload at the right adds pictures to the gallery. With Immich or Synology connected, a button with the name of the library lets you pick pictures from there.',
  'help.guide.gallery-map.step.3':
    'Back on Timeline, the map on the right follows your scrolling: the entry you can see has a ring in its day colour. Click a pin to scroll the timeline to its entry.',
  'help.guide.gallery-map.tip.1':
    "A trip's GPX tracks are shown on the map's Plan layer as dashed lines. Show all trip GPX tracks in Journey Settings switches them off.",
  'help.guide.gallery-map.tip.2':
    'Gallery photos with a location show up on the public map too, when both Gallery and Map are shared.',
  'help.guide.gallery-map.result':
    'Pins have the colour of their day and are joined in date order by a thin dashed line. The layer bar at the top of the map switches what is drawn.',
  'help.guide.journey-map-layers.title': 'Choose what the journey map shows',
  'help.guide.journey-map-layers.goal':
    'See the difference between the plan and what really happened, and switch layers on and off.',
  'help.guide.journey-map-layers.step.1':
    'At the top of the map, the layer bar has Plan, Recorded, Entries and Photos, each with its count. Click one to hide or show it.',
  'help.guide.journey-map-layers.step.2':
    'Click the (i) at the end of the bar for the map key: it explains every pin, dot and line.',
  'help.guide.journey-map-layers.step.3':
    'Click a hollow pin or a small dot on the map. A card shows what it is: a planned place and its day, or a stay with Open entry, which takes you to the day report it belongs to.',
  'help.guide.journey-map-layers.tip.1':
    "A dashed coloured line is a trip's GPX route, part of the plan; a solid one is a route recorded on that day.",
  'help.guide.journey-map-layers.tip.2':
    'A dimmed switch has nothing to show yet, and its tooltip says why. Your choice is kept per journey in this browser.',
  'help.guide.journey-map-layers.result':
    'The map shows only the layers you want, and every pin, dot and line can be read from the key.',
  'help.guide.journey-keep-route.title': 'Keep the route you recorded on a day',
  'help.guide.journey-keep-route.goal': "Add a day's real route from Dawarich to the journey map and keep it there.",
  'help.guide.journey-keep-route.step.1': 'In the header of the day, click the Dawarich button, Take over recording.',
  'help.guide.journey-keep-route.step.2':
    'Check Time zone of the day, which decides where the day starts and ends, and check the recording: distance, time span, pieces and gaps.',
  'help.guide.journey-keep-route.step.3': 'Click Keep route.',
  'help.guide.journey-keep-route.tip.1':
    'Where the recording stops, the line stops too. TREK draws only what was recorded.',
  'help.guide.journey-keep-route.tip.2':
    "Click the distance in the day header later to compare with Dawarich again: Replace takes the new version, Remove route removes the day's route from the journey.",
  'help.guide.journey-keep-route.result':
    "The day header shows the distance, and the route is drawn solid on the map's Recorded layer for everyone on the journey. A shared link shows it only when Recorded routes is on.",
  'help.guide.journey-day-stays.title': 'Write entries from the stays Dawarich recorded',
  'help.guide.journey-day-stays.goal': 'Turn the stays that Dawarich recorded into entries, one at a time.',
  'help.guide.journey-day-stays.step.1':
    'A day with stays to review ends with a row such as 4 stays from Dawarich and the time span. Click it to show the stays.',
  'help.guide.journey-day-stays.step.2':
    "Click Write a journal entry on a stay. The entry is added to that day at the arrival time, with the stay's name and position.",
  'help.guide.journey-day-stays.step.3':
    'Click Not a place I visited on a stay you do not want. The stay is removed from the list.',
  'help.guide.journey-day-stays.tip.1':
    'The row appears only for people who may edit the journal and have their own Dawarich connected, and only on days with something left to decide.',
  'help.guide.journey-day-stays.tip.2':
    'For a busy day, Take over day at the end of the row handles all its stays at once.',
  'help.guide.journey-day-stays.result':
    'The stays you decided on are removed from the row. The entries you wrote appear on their day like any other entry, and you can add photos and text as usual.',
  'help.guide.journey-take-over-day.title': 'Take over a whole recorded day',
  'help.guide.journey-take-over-day.goal':
    "Turn a day's stays into draft entries, or one day report, in a single step.",
  'help.guide.journey-take-over-day.step.1':
    "Click Take over day at the end of the day's stay row, or the list button in the day header, which shows how many stays are waiting.",
  'help.guide.journey-take-over-day.step.2':
    'Tick the stays to keep and correct their names. Join into one entry between two ticked stays merges them, Keep apart splits them again.',
  'help.guide.journey-take-over-day.step.3':
    'If you want one entry for the whole day, switch Entries to Day report: one entry lists every chosen stay with its times.',
  'help.guide.journey-take-over-day.step.4':
    "Leave Keep the day's route too on to keep the route as well, then click the Take over button. It shows how many drafts it creates.",
  'help.guide.journey-take-over-day.tip.1':
    'Nothing is saved before you click that button, and nothing is saved twice: a stay already in the journal is marked and cannot be chosen again.',
  'help.guide.journey-take-over-day.tip.2':
    'Drafts stay off shared links. Add photos and text, then switch Draft off in each entry.',
  'help.guide.journey-take-over-day.result':
    'The day now has one draft per stay or joined group, or a single day report, and its stays are no longer listed as open.',
  'help.guide.journey-auto-prepare.title': 'Let TREK prepare your recorded days',
  'help.guide.journey-auto-prepare.goal':
    "Have each day's stays prepared for review automatically while a trip is running.",
  'help.guide.journey-auto-prepare.step.1': 'Click ⋯ at the top right of the header to open Journey Settings.',
  'help.guide.journey-auto-prepare.step.2': 'Under Recorded days, switch on Prepare recorded days automatically.',
  'help.guide.journey-auto-prepare.step.3':
    'The line underneath says when your stays were last fetched, or why it did not work. Click Fetch now to ask Dawarich right away.',
  'help.guide.journey-auto-prepare.tip.1':
    'Only days of linked trips with dates are prepared, and nothing is added to the journal automatically.',
  'help.guide.journey-auto-prepare.tip.2':
    "A dot on a day's list button means the day is not final yet; its tooltip says why.",
  'help.guide.journey-auto-prepare.result':
    'While a linked trip runs, the stays of each day are listed at that day, ready for Take over day.',
  'help.guide.photo-location.title': 'Place entries where their photos were taken',
  'help.guide.photo-location.goal': 'Put entries on the map without searching a place for each one.',
  'help.guide.photo-location.step.1': 'Click ⋯ at the top right of the header to open Journey Settings.',
  'help.guide.photo-location.step.2': 'Under Photos, switch on Place entries from their photos.',
  'help.guide.photo-location.tip.1': 'Places you set yourself are never moved.',
  'help.guide.photo-location.result':
    'An entry without a place gets the location where its first photo with GPS was taken, and shows up on the map.',
  'help.guide.entry-fields.title': 'Switch entry fields off',
  'help.guide.entry-fields.goal': 'Show only the fields this journey uses in the editor.',
  'help.guide.entry-fields.step.1': 'Click ⋯ at the top right of the header to open Journey Settings.',
  'help.guide.entry-fields.step.2': 'Under Entry fields, switch Mood, Weather or Pros & cons off.',
  'help.guide.entry-fields.tip.1': 'The switches are per journey, so a work trip and a holiday can differ.',
  'help.guide.entry-fields.result':
    'The editor no longer shows these fields. Nothing you wrote is lost: when you switch a field back on, the stored values are shown again. A shared journey hides the same fields.',
  'help.guide.link-trip.title': 'Link another trip',
  'help.guide.link-trip.goal': "Add a second trip's places to the journal as suggestions.",
  'help.guide.link-trip.step.1': 'Click ⋯ at the top right of the header to open Journey Settings.',
  'help.guide.link-trip.step.2': 'Under Synced Trips, click Add Trip.',
  'help.guide.link-trip.step.3': 'Search for the trip by name or destination and click Link next to it.',
  'help.guide.link-trip.tip.1': 'The bin next to a linked trip unlinks it after asking; entries you wrote stay.',
  'help.guide.link-trip.tip.2': 'Entries with a day count only once, however many trips cover that day.',
  'help.guide.link-trip.tip.3':
    'If you write an entry on a day of a trip that is not linked yet, the editor offers Link Trip directly in the entry.',
  'help.guide.link-trip.result':
    'Its places appear in the timeline as suggestions on their days, and are added to the Plan layer of the map with its GPX tracks.',
  'help.guide.journey-status.title': 'Set a journey’s status',
  'help.guide.journey-status.goal':
    'Mark a journey as a draft, live or completed yourself instead of following the dates of its trips.',
  'help.guide.journey-status.step.1': "Click ⋯ at the top right of the journey's header to open Journey Settings.",
  'help.guide.journey-status.step.2': 'Under Status, pick Draft, Live or Completed. The choice is saved at once.',
  'help.guide.journey-status.tip.1':
    'Automatic uses the dates of the linked trips again. Without a linked trip, an automatic journey stays a draft.',
  'help.guide.journey-status.tip.2': 'A status set by hand stays until you change it, even when the trip dates change.',
  'help.guide.journey-status.result':
    'The journey keeps the status you picked: Draft and Completed show as a badge on its card and in its header, and a Live journey is shown in the banner at the top of the journey list.',
  'help.guide.share-public.title': 'Share the journey publicly',
  'help.guide.share-public.goal': 'Give people without a TREK account a read-only link.',
  'help.guide.share-public.step.1': 'Open Journey Settings with ⋯ in the header and scroll to Public Share.',
  'help.guide.share-public.step.2': 'Click Create share link.',
  'help.guide.share-public.step.3':
    'Choose what visitors see: Timeline, Gallery and Map. Under Map, Trip plan adds the planned places and routes, and Recorded routes adds the routes of the days you recorded. Copy copies the link to your clipboard.',
  'help.guide.share-public.tip.1':
    'Photos appear on the public map only when Gallery and Map are both on. With Map off, the server removes their coordinates before it sends the photos.',
  'help.guide.share-public.tip.2': 'Click Delete link next to Copy to stop sharing.',
  'help.guide.share-public.tip.3':
    'Drafts never appear on the link, and recorded routes show only on days with a published entry.',
  'help.guide.share-public.result':
    'Anyone with the link sees the enabled sections and nothing else; fields you switched off in Entry fields stay hidden there too.',
  'help.guide.contributors.title': 'Write together',
  'help.guide.contributors.goal': 'Let another traveller add their own entries and photos.',
  'help.guide.contributors.step.1': 'Open Journey Settings with ⋯ in the header and find Contributors.',
  'help.guide.contributors.step.2': 'Click Invite Contributor and search the user by name or email.',
  'help.guide.contributors.step.3': 'Pick Viewer or Editor and click Invite.',
  'help.guide.contributors.tip.1':
    'Contributors are for people on this TREK. For everyone else there is the public link.',
  'help.guide.contributors.tip.2':
    "Through trips lists the people who have access through a linked trip. Change their access in that trip's settings, not here.",
  'help.guide.contributors.result':
    'The journey appears in their list and their entries show their name. To remove a contributor, click the × next to them.',
  'help.guide.studio.title': 'Lay the journey out as a photo book',
  'help.guide.studio.goal': 'Turn the journal into printable pages.',
  'help.guide.studio.step.1': 'Click Studio in the header. The designer opens on top of the journey.',
  'help.guide.studio.step.2': 'To go back, click × at the right end of the top bar. You return to where you were.',
  'help.guide.studio.tip.1': 'Studio needs a window at least 1024 px wide and is not offered on a phone.',
  'help.guide.studio.tip.2':
    'The book has the same access as the journey: anyone who can read the journey can open the book, and anyone who can edit the journey can save it.',
  'help.guide.studio.result':
    'The rail and its panels are on the left, the spread is on the workbench, and the properties are on the right. Auto layout builds the book from your entries. Export creates a print-ready PDF.',
  'help.guide.archive-journey.title': 'Archive or delete a journey',
  'help.guide.archive-journey.goal': 'Close a finished journey, or delete one permanently.',
  'help.guide.archive-journey.step.1': 'Click ⋯ at the top right of the header to open Journey Settings.',
  'help.guide.archive-journey.step.2':
    'At the bottom, Archive Journey ends it and marks it archived; Restore Journey restores it. Delete removes it with all entries and photos, after a confirmation.',
  'help.guide.archive-journey.tip.1':
    'Deleting cannot be undone, and it does not change the trips the journey was linked to.',
  'help.guide.archive-journey.tip.2': 'The cover, name and subtitle are in the same dialog, at the top.',
  'help.guide.archive-journey.result':
    'An archived journey stays readable and shareable; it just no longer opens on today.',
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio lays out a journey as a photo book that you can print. It opens on top of the journal: the rail and its panels are on the left, the spread you are working on is in the middle, and its properties are on the right. Auto layout builds a first draft from your entries, a theme gives the book its colours and typefaces, and the assistant can design pages with you. After that, you can move, crop and restyle everything, and you can undo every step.',
  'help.ctx.journey-studio.bullet.1':
    "Top bar: the journey's cover and name on the left. On the right, who else is in the book and whether it is saved, the page format, undo, redo and paste, Auto layout, the assistant, help, Export and the button that closes Studio.",
  'help.ctx.journey-studio.bullet.2':
    "Rail on the left: Pages, Content (the journey's photos and entries), Layouts, Elements (text, shapes, lines, frames, icons and stickers), Travel (figures, maps, countries and marks built from the journey) and, set apart below them, Theme and Layers.",
  'help.ctx.journey-studio.bullet.3':
    'Workbench: the current spread with its bleed and safe margins, and the zoom bar below it with Fit to view, Book view and Download this spread.',
  'help.ctx.journey-studio.bullet.4':
    'Properties on the right: everything about the selected element, from position, size and crop to colours, effects, stacking order and lock. When nothing is selected, it shows the page background, the theme, the page numbers and the document.',
  'help.ctx.journey-studio.bullet.5':
    'The book is laid out like a printed book: cover, a single first page opposite the blank inside of the cover, the spreads, a single last page and the back cover. Page numbers count from the first page and print as shown.',
  'help.ctx.journey-studio.bullet.6':
    'Several people can design at the same time: everyone sees the pointers of the others with their names. If you save a version that somebody else has changed, TREK shows a conflict instead of overwriting their work.',
  'help.ctx.journey-studio.bullet.7':
    'Theme: one look for the whole book, its paper, ink and three accents, its typefaces and its motifs. Elements linked to the theme follow it when you change it.',
  'help.ctx.journey-studio.bullet.8':
    'Assistant: where an administrator has set up AI, the speech bubble in the top bar opens an assistant that lays out pages, writes captions and restyles the book with you. Every change it makes is an undo step.',
  'help.guide.studio-auto-layout.title': 'Build the book automatically',
  'help.guide.studio-auto-layout.goal':
    "Get a complete first draft from the journal's entries and photos in one click.",
  'help.guide.studio-auto-layout.step.1': 'Click Auto layout in the top bar.',
  'help.guide.studio-auto-layout.step.2':
    'Pick The whole book: it replaces every page and keeps your title and page setup. This spread rebuilds only the spread on screen. It is offered only on a spread that was made from an entry.',
  'help.guide.studio-auto-layout.step.3':
    'Look through the pages rail. If you liked the previous version better, Undo reverts the whole layout.',
  'help.guide.studio-auto-layout.tip.1': 'Both entries are normal undo steps, so you can try them and undo them.',
  'help.guide.studio-auto-layout.tip.2':
    'When auto layout links an element to an entry, the element updates when you edit that entry. When you change the element in Properties, the link is removed.',
  'help.guide.studio-auto-layout.result':
    'One spread per entry, in order, with its photos, title and text placed for you. Each element stays linked to its entry and updates with it until you edit it.',
  'help.guide.studio-pages.title': 'Add, move and remove spreads',
  'help.guide.studio-pages.goal': 'Edit the book page by page.',
  'help.guide.studio-pages.step.1':
    'Open Pages in the rail. The thumbnails show the book in order: cover, first page, spreads, last page and back cover. The first and the last page are drawn beside the blank inside of their cover, the way the bound book opens.',
  'help.guide.studio-pages.step.2':
    'Add spread at the bottom adds a new spread before the last page. The + between two thumbnails inserts one at that position.',
  'help.guide.studio-pages.step.3':
    'Hover over a thumbnail to see its actions: Move earlier, Move later, Duplicate spread and Delete spread. Click a thumbnail to open that spread on the workbench.',
  'help.guide.studio-pages.tip.1': 'Book view in the top bar shows the whole book as sheets, the way it will be bound.',
  'help.guide.studio-pages.tip.2': 'Page numbers are switched on under Document in Properties, with nothing selected.',
  'help.guide.studio-pages.result':
    'The cover, the first and last pages and the back cover stay where they are. New spreads are always added between them.',
  'help.guide.studio-layouts.title': 'Apply a layout to a spread',
  'help.guide.studio-layouts.goal': 'Give a spread a ready-made arrangement of photo and text frames.',
  'help.guide.studio-layouts.step.1':
    "Open Layouts in the rail. Designed pages come first: whole covers and spreads set in the book's theme, which the style chips narrow to one look. My layouts and Built in follow below them, in the same grid.",
  'help.guide.studio-layouts.step.2':
    'Click one. The spread on the workbench gets the frames of this layout, and your existing photos and text are placed into them.',
  'help.guide.studio-layouts.tip.1': 'A layout is an undo step like any other.',
  'help.guide.studio-layouts.result':
    'Empty frames are placeholders for content: drag a photo from Content onto one, or use Add to this page.',
  'help.guide.studio-my-layouts.title': 'Save a page as your own layout',
  'help.guide.studio-my-layouts.goal': 'Reuse an arrangement you built on other pages of the book.',
  'help.guide.studio-my-layouts.step.1': 'Arrange a page the way you like it, then open Layouts in the rail.',
  'help.guide.studio-my-layouts.step.2':
    'Click Save this page as a layout under My layouts. The page appears as a card in the list.',
  'help.guide.studio-my-layouts.tip.1':
    'Click your layout on another page to lay that page out the same way, with its own photos and words.',
  'help.guide.studio-my-layouts.result':
    "Your layouts are saved with the book and offered on pages of the same kind: a cover's for covers, a spread's for spreads.",
  'help.guide.studio-content.title': 'Put photos and entries on a page',
  'help.guide.studio-content.goal': "Add the journey's own photos and entries to the spread.",
  'help.guide.studio-content.step.1':
    'Open Content in the sidebar. Photos lists every picture of the journey. Entries lists the entries with their text.',
  'help.guide.studio-content.step.2':
    'Drag a photo onto the spread or onto an empty frame, or click Add to this page under it. Upload photos adds pictures that are not in the journey yet; From Immich or From Synology picks them from a connected library.',
  'help.guide.studio-content.step.3':
    "Under an entry, Title, Story and Place put that text on the page as a text element. Date and the coordinates are added as marks, and the entry's photos are listed there too.",
  'help.guide.studio-content.tip.1': 'The search box at the top of Content filters both lists.',
  'help.guide.studio-content.tip.2':
    'When you drop a file from your desktop onto the workbench, TREK uploads it and places it in one step.',
  'help.guide.studio-content.result':
    'A dropped photo becomes a photo element. Text stays linked to the entry until you edit it.',
  'help.guide.studio-theme.title': 'Give the book a theme',
  'help.guide.studio-theme.goal': 'Set the colours and typefaces of the whole book in one go.',
  'help.guide.studio-theme.step.1':
    'Open Theme in the rail. Each card shows a theme as a little page: its paper, its typeface and its three accent colours.',
  'help.guide.studio-theme.step.2':
    'Click a theme to try it. Below the cards you can change its palette, pick other typefaces and choose motifs and decoration.',
  'help.guide.studio-theme.step.3': 'Click Apply to the book, or Apply to this page for the spread on screen.',
  'help.guide.studio-theme.tip.1':
    'Elements linked to the theme take its colours and typefaces and follow when you change it. Also restyle what is not linked yet links the rest first.',
  'help.guide.studio-theme.tip.2': 'Colours from the photos builds a palette from the pictures of the journey.',
  'help.guide.studio-theme.result':
    'Every linked colour and typeface in the book changes at once, and applying the theme is one undo step.',
  'help.guide.studio-elements.title': 'Add text, shapes, icons and stickers',
  'help.guide.studio-elements.goal': 'Add decoration to a spread in addition to photos and stories.',
  'help.guide.studio-elements.step.1':
    'Open Elements in the rail. Six tabs sort what you can add: Text, Shapes, Lines, Frames, Icons and Stickers.',
  'help.guide.studio-elements.step.2':
    'Click a text style or a designed title, a shape, a line, an empty frame, an icon or a sticker. Each one is placed in the middle of the spread, and you can then move it.',
  'help.guide.studio-elements.tip.1': 'Frames are empty photo slots: drop a picture in later.',
  'help.guide.studio-elements.result':
    'Double-click a text element to type into it; Properties holds font, weight, size, spacing and alignment.',
  'help.guide.studio-stickers.title': 'Decorate with stickers',
  'help.guide.studio-stickers.goal': 'Add illustrations, from landmarks and food to animals and arrows.',
  'help.guide.studio-stickers.step.1': 'Open Elements in the rail and choose Stickers.',
  'help.guide.studio-stickers.step.2':
    'Search for a word or browse the shelves, then click a sticker to place it on the spread.',
  'help.guide.studio-stickers.tip.1': 'With a sticker selected, Properties recolours its parts and mirrors it.',
  'help.guide.studio-stickers.result': 'The sticker is a drawing, so it stays sharp at any size.',
  'help.guide.studio-travel.title': 'Add maps, figures, countries and marks',
  'help.guide.studio-travel.goal': 'Turn the journey itself into designed elements on the page.',
  'help.guide.studio-travel.step.1':
    'Open Travel in the rail. Four tabs sort what you can add: Figures, Maps, Countries and Marks.',
  'help.guide.studio-travel.step.2':
    "Each card shows the element with your journey's own numbers, in the colours of the theme: a summary as a poster, a ticket, a road sign or an odometer, a map with numbered stops or cut to a country, a country as a stamp, a postcard or a pin, a date or a distance as a stamp, a tag or a ribbon.",
  'help.guide.studio-travel.step.3':
    'Click a card. The element is placed in the middle of the spread, and you can then move it and size it.',
  'help.guide.studio-travel.tip.1':
    'Under Maps, Stops lists every stop of the route. Switch one off to leave it out of the maps and figures, your home airport for instance.',
  'help.guide.studio-travel.tip.2':
    "A country map shows that country's stops alone, so the country fills the page even when the journey began with a long flight.",
  'help.guide.studio-travel.result':
    'The element appears on the spread. Properties changes its look, and every figure, map and country updates when the journey changes.',
  'help.guide.studio-text-effects.title': 'Add effects to text',
  'help.guide.studio-text-effects.goal':
    'Give a headline an outline, a shadow, a curve or letters filled with a pattern.',
  'help.guide.studio-text-effects.step.1': 'Click a text element on the page to select it.',
  'help.guide.studio-text-effects.step.2':
    'In Properties, open Effects to add an outline, a shadow or a highlight, or fill the letters with a gradient or a pattern. Placement curves the line and fits it to its box.',
  'help.guide.studio-text-effects.tip.1':
    'Fit shrinks the text until it fits its box, so a long title never spills over.',
  'help.guide.studio-text-effects.result': 'The effect is drawn with the text, in print the same as on screen.',
  'help.guide.studio-background.title': 'Change the page background',
  'help.guide.studio-background.goal': 'Paint the page in a colour, a gradient or a pattern, or lay a photo under it.',
  'help.guide.studio-background.step.1':
    'Click an empty part of the page so nothing is selected. Page background is at the top of Properties.',
  'help.guide.studio-background.step.2':
    'Choose Paper, Solid, Gradient or Pattern and a colour, or click a photo under Photo as background.',
  'help.guide.studio-background.tip.1': 'Apply to all pages gives every page of the book the same background.',
  'help.guide.studio-background.result': 'The background runs into the bleed, so it prints to the edge of the page.',
  'help.guide.studio-layers.title': 'Arrange, hide and lock with layers',
  'help.guide.studio-layers.goal': 'See everything on the spread in stacking order and work on it there.',
  'help.guide.studio-layers.step.1': 'Open Layers in the rail. The top of the list is the front of the page.',
  'help.guide.studio-layers.step.2':
    'Drag a row to restack it, use the eye to hide an element and the lock to keep it in place. Select several and group them to move them together.',
  'help.guide.studio-layers.tip.1': 'Double-click a row to give the element a name of its own.',
  'help.guide.studio-layers.tip.2': 'Hidden elements are left out of the PDF.',
  'help.guide.studio-layers.result':
    'Busy pages stay easy to edit, and the finished parts cannot be moved by accident.',
  'help.guide.studio-properties.title': 'Edit what you selected',
  'help.guide.studio-properties.goal': 'Move, crop, style and stack an element with the inspector.',
  'help.guide.studio-properties.step.1':
    'Click an element on the spread. Handles appear for size and rotation; drag it to move it.',
  'help.guide.studio-properties.step.2':
    'Properties on the right shows the settings of the selected item: position and size, Crop with the focal point that decides what stays in the frame, Fill or Fit, Look filters, Corner radius, Frame style, stacking order and Lock.',
  'help.guide.studio-properties.step.3':
    'Duplicate and Delete are at the top of the inspector. Undo in the top bar reverts any of these changes.',
  'help.guide.studio-properties.tip.1': 'Shift-click selects several elements; the inspector then edits them together.',
  'help.guide.studio-properties.tip.2':
    'If you edit an element that auto layout placed, it is no longer linked to the entry and does not follow later changes to that entry.',
  'help.guide.studio-properties.result':
    'You cannot select or move a locked element on the page. This protects a finished layout while you work on the other elements.',
  'help.guide.studio-format.title': 'Choose the page format',
  'help.guide.studio-format.goal': 'Set the print size of the book before you build the layout.',
  'help.guide.studio-format.step.1':
    "Click the page format in the top bar, beside the editing tools. It shows the format's name and shape.",
  'help.guide.studio-format.step.2':
    'Pick Square 21 × 21 cm, Square 30 × 30 cm, A4 or A5 landscape or portrait, or enter a custom width and height in millimetres. Bleed and safe margin are below.',
  'help.guide.studio-format.tip.1':
    'Change the format first, then run Auto layout. Auto layout uses the format that is set when it runs.',
  'help.guide.studio-format.tip.2': 'Ask your printer for their bleed and safe values and enter those.',
  'help.guide.studio-format.result':
    'Every spread is drawn at that size, with 3 mm bleed and a 5 mm safe margin by default.',
  'help.guide.studio-export.title': 'Export the book as a PDF',
  'help.guide.studio-export.goal': 'Get a print-ready file, or one to read on screen.',
  'help.guide.studio-export.step.1': 'Click Export in the top bar.',
  'help.guide.studio-export.step.2':
    'Choose Single pages, one page per sheet in reading order, which is what a print shop needs, or Spreads, two pages at a time as the book opens. Crop marks add the bleed on every edge and show where to cut.',
  'help.guide.studio-export.step.3':
    'Click Print view. Your browser opens the pages. Choose Save as PDF to create the file.',
  'help.guide.studio-export.tip.1': 'You can only make the PDF on a desktop, like Studio itself.',
  'help.guide.studio-export.tip.2':
    'For a proof, export Spreads without crop marks; for the print shop, Single pages with them.',
  'help.guide.studio-export.result': 'A PDF with as many sheets as the dialog announced, at the page format you set.',
  'help.guide.studio-spread-file.title': 'Reuse a spread in another book',
  'help.guide.studio-spread-file.goal': "Copy a design you like from one journey's book to another.",
  'help.guide.studio-spread-file.step.1':
    'With the spread on the workbench, click Download this spread at the right end of the zoom bar. The file contains the design, not the photos.',
  'help.guide.studio-spread-file.step.2':
    'In the other book, open Pages and click Import next to Add spread, then pick the file.',
  'help.guide.studio-spread-file.tip.1': 'If a file is not a spread design, TREK rejects it and shows the reason.',
  'help.guide.studio-spread-file.result':
    'The spread is imported with its frames and text styles. Drop the photos of the new journey into the frames.',

  // ── Screen: settings ────────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Settings',
  'help.ctx.settings.summary':
    'Your personal settings, with one tab per topic in the sidebar on the left. Most switches take effect as soon as you change them. A form with a Save button only saves when you click Save. Nothing here changes TREK for anyone else.',
  'help.ctx.settings.bullet.1':
    'Sidebar on the left: General, Appearance, Map, Notifications, Integrations, Offline and Account. Plugins appears once a plugin is active. About appears unless the operator has hidden it. The version is shown at the bottom.',
  'help.ctx.settings.bullet.2':
    'General opens first. It holds the language, the language of place names, units, time format, week start and display currency, plus how the trip map behaves. Appearance holds theme, colours, readability, text size and the dashboard widgets.',
  'help.ctx.settings.bullet.3':
    'Map sets the map engine and its style; Notifications sets which events go to which channel; Integrations connects photo libraries, AirTrail, Dawarich and wanderer, and contains API keys and MCP; Offline sets what this device stores.',
  'help.ctx.settings.bullet.4':
    'Account contains your profile, password, two-factor authentication, passkeys and the option to delete your account.',
  'help.ctx.settings-display.title': 'General',
  'help.ctx.settings-display.summary':
    'What TREK opens with, the language and units it uses, and how the trip map and bookings behave. Every change applies at once.',
  'help.ctx.settings-display.bullet.1':
    'Startup: Start page opens on the Dashboard or on the Active trip; with Active trip, Start tab picks the tab that trip opens on.',
  'help.ctx.settings-display.bullet.2':
    'Language & region: Display currency (or Trip currency for none), Language, Place names, Temperature Unit, Distance Unit, Time Format and Week starts on.',
  'help.ctx.settings-display.bullet.3':
    'Travel & map: Open places in, Date first in day headings, Booking route labels, Always show booking routes, Compact markers for unplanned places, Explore places on the map, Blur Booking Codes and Optimize route from accommodation.',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'How TREK looks on this account: light or dark, the accent colour, glass and motion, text size, and which widgets the dashboard shows. Everything applies live, on every device you sign in on.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme: Color Mode (Light, Dark or Auto), the Color scheme, and with Custom, your own accent colour for light and dark mode with a contrast check.',
  'help.ctx.settings-appearance.bullet.2':
    'Readability, marked Experimental: Transparency, Reduce motion, Density, and Text size with one slider for Everything plus one each for Large, Medium, Normal and Small.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboard widgets: separate switches for Desktop (Below the hero, Right sidebar) and Mobile (Below the hero, Bottom of page).',
  'help.ctx.settings-appearance.bullet.4':
    'Reset to defaults, under the cards, resets the whole tab to its default values.',
  'help.ctx.settings-map.title': 'Map',
  'help.ctx.settings-map.summary':
    'Which engine draws the trip planner and journal maps, and in what style. Leaflet is the classic raster map, Mapbox GL adds 3D buildings and terrain with your own token, MapLibre GL draws OpenFreeMap vector tiles without one. Atlas always uses Leaflet.',
  'help.ctx.settings-map.bullet.1':
    'Map Provider: Leaflet, Mapbox GL (Experimental) or MapLibre GL, each option with a short description.',
  'help.ctx.settings-map.bullet.2':
    'Map Template and CARTO API key for Leaflet; Map Style for the two GL engines, plus the Mapbox Access Token for Mapbox GL.',
  'help.ctx.settings-map.bullet.3':
    'Mapbox GL only: 3D Buildings & Terrain and High Quality Mode. A live preview is shown above Save Map. Save Map saves your choice.',
  'help.ctx.settings-notifications.title': 'Notifications',
  'help.ctx.settings-notifications.summary':
    'How TREK contacts you outside the app. At the top, a table with one row per event and one column per channel decides what is sent where. Below it are the cards for the webhook, ntfy, push on this device and any plugin channel.',
  'help.ctx.settings-notifications.bullet.1':
    'Notifications: switch each event on or off per channel. A lock means the admin turned that one off for everyone.',
  'help.ctx.settings-notifications.bullet.2': 'Webhook URL: a Discord, Slack or custom webhook, with Test and Save.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: Ntfy Topic, optional Ntfy Server URL and Access Token, with Test and Save.',
  'help.ctx.settings-notifications.bullet.4':
    'Push notifications on this device: Turn on for this device covers only this browser; Send test sends a test notification. A plugin channel shows Configure until it is set up.',
  'help.ctx.settings-integrations.title': 'Integrations',
  'help.ctx.settings-integrations.summary':
    'Everything that connects to TREK from outside: photo libraries for the journal, AirTrail for flights, Dawarich for where you actually went, wanderer for trails, read-only API keys for other software, and MCP for AI clients. A connection to another service only shows up once the admin has switched it on.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich and Synology Photos, AirTrail, Dawarich and wanderer: each card has its address and key, Save and Test connection, and a Connected or Not connected badge.',
  'help.ctx.settings-integrations.bullet.2':
    'API Keys: read-only keys for the public API, each limited to the areas you pick, with the Endpoint to copy.',
  'help.ctx.settings-integrations.bullet.3':
    'MCP Configuration: the MCP Endpoint, and under OAuth 2.1 Clients your registered clients, the Client Configuration to copy and the Active OAuth Sessions with Revoke.',
  'help.ctx.settings-integrations.bullet.4':
    'API Tokens: the old way to connect to MCP, marked Deprecated; use OAuth 2.1 Clients instead.',
  'help.ctx.settings-plugins.title': 'Plugins',
  'help.ctx.settings-plugins.summary':
    'Your own settings for the plugins the admin installed: the keys and preferences each plugin asks you for, and a log of what plugins did on your behalf. The tab only appears while a plugin is active.',
  'help.ctx.settings-plugins.bullet.1':
    'Plugin settings: below it, one card for each plugin that needs input from you, with its fields and Save. A secret field is never shown again once saved.',
  'help.ctx.settings-plugins.bullet.2':
    'A plugin can add Actions to its card, which run after you confirm, and Connect or Disconnect when it signs in to another service for you.',
  'help.ctx.settings-plugins.bullet.3':
    'Plugin activity at the bottom lists every action a plugin took on your behalf, newest first, with Refresh.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'What TREK stores on this device so a trip still opens without a connection, and what happens when a change made offline conflicts with a change made elsewhere.',
  'help.ctx.settings-offline.bullet.1':
    'Offline mode: Force offline mode downloads everything first, then works from the cache only and queues your changes.',
  'help.ctx.settings-offline.bullet.2':
    'Prepare for offline: Download for offline use fetches trip data, documents and map tiles; Re-sync now syncs again by hand.',
  'help.ctx.settings-offline.bullet.3':
    'What to store offline: Store map tiles offline, and a switch per trip. A finished trip is only stored if you switch it on.',
  'help.ctx.settings-offline.bullet.4':
    'Sync conflicts appears only when two changes are in conflict, with Keep mine, Keep theirs and When a conflict happens. Offline cache counts the trips and the pending or failed changes, with Try again, Discard and Clear cache.',
  'help.ctx.settings-account.title': 'Account',
  'help.ctx.settings-account.summary':
    'Your account on this TREK and how you sign in: profile picture, username and email, password, two-factor authentication and passkeys. Delete account is in the footer of the Account card.',
  'help.ctx.settings-account.bullet.1':
    'Account: click the camera on the picture to upload one, and the red bin to remove it. Username and Email are saved with Save Profile.',
  'help.ctx.settings-account.bullet.2':
    'Change Password: the current password, the new one twice with the rules ticked off as you type, then Update password. When this TREK signs in through SSO only, this card is not shown.',
  'help.ctx.settings-account.bullet.3':
    'Two-factor authentication (2FA) with an authenticator app and backup codes; Passkeys for signing in without a password.',
  'help.ctx.settings-account.bullet.4':
    "Delete account is at the left of the Account card's footer and asks for confirmation. The only administrator cannot delete themselves.",
  'help.ctx.settings-about.title': 'About',
  'help.ctx.settings-about.summary':
    'What TREK is, the version this server runs, and where to find the project: the documentation, where to report a bug and the ways to support the project.',
  'help.ctx.settings-about.bullet.1': 'The version this server runs is shown next to the title.',
  'help.ctx.settings-about.bullet.2':
    'Report a Bug and Feature Request open the project on GitHub; Wiki opens the documentation.',
  'help.ctx.settings-about.bullet.3':
    'Ko-fi, Buy Me a Coffee and Discord are where you can support TREK or talk to the people who make it.',
  'help.guide.startup.title': 'Choose what TREK opens with',
  'help.guide.startup.goal': 'Open TREK on the page you use most, not on the dashboard every time.',
  'help.guide.startup.step.1': 'At the top of General, under Startup, set Start page to Dashboard or Active trip.',
  'help.guide.startup.step.2': 'With Active trip, Start tab appears: pick the tab that trip opens on.',
  'help.guide.startup.result': 'The next time you open TREK, it opens that page directly.',
  'help.guide.startup.tip.1':
    'Active trip means the trip that runs today, or the next one coming up. This is the same trip that the dashboard shows at the top.',
  'help.guide.startup.tip.2': 'A start tab that belongs to an addon you switched off opens the plan instead.',
  'help.guide.language-region.title': 'Set language, units and currency',
  'help.guide.language-region.goal': 'Use TREK in your language and with the formats of your region.',
  'help.guide.language-region.step.1':
    'Under Language & region, pick a Language from the row of chips. TREK switches at once, on every device you sign in on.',
  'help.guide.language-region.step.2':
    'Place names sets the language that place search, suggestions and addresses use; Same as the app follows the interface language.',
  'help.guide.language-region.step.3':
    'Set the Display currency, or keep Trip currency to see each trip in its own. Then choose Temperature Unit, Distance Unit, Time Format and the day the Week starts on.',
  'help.guide.language-region.result':
    'Dates, distances and money are shown in the format you expect. In Costs, amounts are shown in your display currency for display only; the amounts that were entered do not change.',
  'help.guide.language-region.tip.1': 'Trip currency shows every trip in its own currency, without converting.',
  'help.guide.language-region.tip.2': 'The language also sets the day and month names in Vacay and the journal.',
  'help.guide.language-region.tip.3':
    'Week starts on sets the first column of every date picker; Vacay has its own setting.',
  'help.guide.travel-map-prefs.title': 'Adjust the trip map and day headings',
  'help.guide.travel-map-prefs.goal': 'Choose what the trip map shows and how day headers look, on every trip.',
  'help.guide.travel-map-prefs.step.1':
    'In Travel & map, Open places in sets which map app the navigate button opens directly; Ask every time lets you choose an app each time. Date first in day headings shows the calendar date first in each day heading.',
  'help.guide.travel-map-prefs.step.2':
    'Always show booking routes draws every flight, train and other booking on the map; Booking route labels puts the station or airport name at each end. Compact markers for unplanned places shrinks the places not yet planned into a day, so the planned stops are easier to see.',
  'help.guide.travel-map-prefs.step.3':
    'Explore places on the map shows the category pill for finding places nearby. Blur Booking Codes hides confirmation numbers until you hover over or tap them. Optimize route from accommodation starts and ends a day at your hotel.',
  'help.guide.travel-map-prefs.result': 'The trip map uses these settings on every trip, until you change them again.',
  'help.guide.travel-map-prefs.tip.1':
    'These are per account, not per trip. Members of a shared trip each see their own choices.',
  'help.guide.travel-map-prefs.tip.2':
    'An admin can set the defaults for everyone; what you switch here applies to you.',
  'help.guide.theme-scheme.title': 'Set the theme and the accent colour',
  'help.guide.theme-scheme.goal': 'Make TREK light, dark or follow your device, in the colour you like.',
  'help.guide.theme-scheme.step.1': 'Under Theme, set Color Mode to Light, Dark or Auto. Auto follows your device.',
  'help.guide.theme-scheme.step.2':
    'Choose a Color scheme: Default, High contrast, Indigo, Teal, Rose, Amber, Violet or Custom.',
  'help.guide.theme-scheme.step.3':
    'With Custom, pick one of the colour dots, or set your own accent separately for Light and Dark. The pill next to them says Good contrast or Low contrast.',
  'help.guide.theme-scheme.result':
    'Buttons, links and highlights use the accent colour everywhere, on every device you sign in on.',
  'help.guide.theme-scheme.tip.1': 'The navbar also has a quick light or dark switch; it sets the same theme.',
  'help.guide.theme-scheme.tip.2': 'Pick the High contrast scheme when the default is too hard to read.',
  'help.guide.readability.title': 'Adjust readability and text size',
  'help.guide.readability.goal': 'Use less glass effect and motion, more space or bigger text.',
  'help.guide.readability.step.1':
    'Under Readability, Transparency switches the glass panels to solid surfaces, Reduce motion minimises animations, and Density chooses Comfortable or Compact.',
  'help.guide.readability.step.2':
    'Text size: drag Everything to scale all text at once, or set Large, Medium, Normal and Small one by one. Each size shows a sample, so you see the result as you drag.',
  'help.guide.readability.result':
    'The change applies to the whole app at once, including the map panels and the journal.',
  'help.guide.readability.tip.1':
    'Some parts of TREK already use less animation when your device is set to reduce motion. Reduce motion reduces the animation in the other parts.',
  'help.guide.readability.tip.2':
    'Text size is applied through the typography tiers, so nothing is cut off; a size that no longer fits wraps.',
  'help.guide.readability.tip.3':
    'Readability is marked Experimental. If something looks wrong, click Reset to defaults at the bottom of the tab to restore the default settings.',
  'help.guide.dashboard-widgets.title': 'Choose the dashboard widgets',
  'help.guide.dashboard-widgets.goal': 'Show only the widgets you use, separately on desktop and on the phone.',
  'help.guide.dashboard-widgets.step.1':
    'Under Dashboard widgets, Desktop lists the widgets Below the hero and the Right sidebar. Switching Right sidebar off hides the whole column and centres the dashboard; its widgets are dimmed until you switch it on again.',
  'help.guide.dashboard-widgets.step.2':
    'Mobile has its own switches, Below the hero and Bottom of page, for the dashboard on your phone.',
  'help.guide.dashboard-widgets.step.3':
    'Reset to defaults, under the cards, resets the whole Appearance tab to its original settings.',
  'help.guide.dashboard-widgets.result':
    'The dashboard changes immediately. If the right sidebar is off, the dashboard is centred.',
  'help.guide.dashboard-widgets.tip.1': 'Widgets of an addon only appear while the admin has that addon on.',
  'help.guide.dashboard-widgets.tip.2':
    'The dashboard itself remembers your grid or list view and the sort order per device.',
  'help.guide.map-provider.title': 'Pick the map engine and style',
  'help.guide.map-provider.goal': "Switch between the classic map, vector tiles and Mapbox's 3D map.",
  'help.guide.map-provider.step.1':
    'Under Map Provider, choose Leaflet for the classic 2D map with any raster tiles, Mapbox GL for vector tiles with 3D buildings and terrain, or MapLibre GL for OpenFreeMap vector tiles without a token.',
  'help.guide.map-provider.step.2':
    'Pick a Map Template for Leaflet or a Map Style for a GL engine, or paste your own URL. Mapbox GL needs a Mapbox Access Token, CARTO templates a CARTO API key; the link under each field shows where to get one.',
  'help.guide.map-provider.step.3':
    'With Mapbox GL, switch on 3D Buildings & Terrain and, if your device is fast enough, High Quality Mode. Check the preview, then click Save Map.',
  'help.guide.map-provider.result':
    'The trip planner and the journal maps use the engine you picked. Atlas always uses Leaflet.',
  'help.guide.map-provider.tip.1': 'Without a token, Mapbox GL uses Leaflet instead of showing an empty map.',
  'help.guide.map-provider.tip.2':
    'The map tiles you store offline come from the provider that is active when you download them.',
  'help.guide.map-provider.tip.3':
    'On a GL map, right-click and drag to rotate and tilt it; middle-click adds a place.',
  'help.guide.notification-channels.title': 'Set up where you get notifications',
  'help.guide.notification-channels.goal':
    'Get trip reminders and collaboration events on your phone or in another tool.',
  'help.guide.notification-channels.step.1':
    'For a webhook, paste a Discord, Slack or custom Webhook URL, click Test, then Save.',
  'help.guide.notification-channels.step.2':
    'For ntfy, fill in the Ntfy Topic, and add your own Ntfy Server URL and an Access Token if you run one. Test sends a message right away; Save stores the settings.',
  'help.guide.notification-channels.step.3':
    'In the Notifications card at the top, switch each event on or off per channel. A lock means the admin turned it off for everyone. A plugin channel shows Configure until it is set up; Send test tries it.',
  'help.guide.notification-channels.result':
    'Events are sent through the channels you switched on for them. The In-App column decides what the bell in the navbar shows.',
  'help.guide.notification-channels.tip.1':
    "A trip's own Reminder, how many days before departure, is set in the trip's edit form.",
  'help.guide.notification-channels.tip.2':
    'The admin can pre-fill a default ntfy server for everyone; you still choose your own topic.',
  'help.guide.web-push-device.title': 'Get push notifications on this device',
  'help.guide.web-push-device.goal': 'See TREK notifications on your phone or computer even while TREK is closed.',
  'help.guide.web-push-device.step.1':
    'Under Push notifications on this device, click Turn on for this device and allow notifications when the browser asks. Send test checks that one arrives.',
  'help.guide.web-push-device.step.2':
    'In the Notifications card at the top, the Push column sets which events are sent to your devices.',
  'help.guide.web-push-device.result':
    'The card shows On for this device, and the events switched on under Push arrive even while TREK is closed.',
  'help.guide.web-push-device.tip.1':
    'Push works per browser: repeat it on every phone and computer on which you want notifications. Turn off for this device stops it on that device only.',
  'help.guide.web-push-device.tip.2': 'On iPhone and iPad, add TREK to the Home Screen first and open it from there.',
  'help.guide.web-push-device.tip.3':
    'Push needs TREK opened over HTTPS. If notifications are blocked, allow them in the browser settings and try again.',
  'help.guide.photo-providers.title': 'Connect a photo library',
  'help.guide.photo-providers.goal': "Let the journal load the day's photos from Immich or Synology Photos.",
  'help.guide.photo-providers.step.1':
    'Under Integrations, find the card of Immich or Synology Photos and enter what it asks for: the Server URL with an API Key for Immich, or a Username and Password for Synology Photos. Immich can also copy journey photos into the Immich library when you upload them.',
  'help.guide.photo-providers.step.2': 'Click Test connection, then Save. The badge changes to Connected.',
  'help.guide.photo-providers.result':
    "The entry editor's External photos tab searches the connected library for the entry's day, nearest to the entry's location first.",
  'help.guide.photo-providers.tip.1':
    'The connection belongs to your account only: other members of a journey connect their own libraries.',
  'help.guide.photo-providers.tip.2':
    'A provider without GPS data in its photos still works. The list is then sorted by time.',
  'help.guide.connect-airtrail.title': 'Connect your AirTrail',
  'help.guide.connect-airtrail.goal': 'Let TREK import and sync the flights of your own AirTrail.',
  'help.guide.connect-airtrail.step.1':
    'Under Integrations, find AirTrail and enter its Instance URL and an API key. You create the key in AirTrail under Settings, Security.',
  'help.guide.connect-airtrail.step.2':
    'Allow self-signed certificates is only for a trusted instance on your own network. Write changes back to AirTrail is off by default, so TREK only reads; switch it on to send your edits back.',
  'help.guide.connect-airtrail.step.3':
    'Click Save, then Test connection. It says how many flights it found, and the badge changes to Connected.',
  'help.guide.connect-airtrail.result':
    'The badge shows Connected, and the Transports tab of a trip offers Import from AirTrail.',
  'help.guide.connect-airtrail.tip.1': 'The card only appears while the admin has the AirTrail addon on.',
  'help.guide.connect-airtrail.tip.2':
    'The key is stored encrypted and never shown again; dots in the field mean one is saved.',
  'help.guide.connect-dawarich.title': 'Connect your Dawarich',
  'help.guide.connect-dawarich.goal': 'Let TREK read where you actually went, from your own Dawarich.',
  'help.guide.connect-dawarich.step.1':
    'Under Integrations, find Dawarich and enter its Instance address and the API key from Dawarich under Account, API key.',
  'help.guide.connect-dawarich.step.2':
    'Check for new stays automatically lets TREK check on its own. When it is off, TREK reads Dawarich only when you ask. Allow self-signed certificate is only for an instance your server does not trust.',
  'help.guide.connect-dawarich.step.3':
    'Click Save, then Test connection: it counts the stays of the last 30 days. Once connected, Check now checks right away, and Disconnect on the right ends the connection.',
  'help.guide.connect-dawarich.result':
    'The badge shows Connected, and the trip planner, the journal and Atlas can offer what Dawarich recorded.',
  'help.guide.connect-dawarich.tip.1':
    'TREK only suggests entries, places and countries; nothing is added until you confirm, and nothing is written back to Dawarich.',
  'help.guide.connect-dawarich.tip.2':
    'Below the buttons, the card says when TREK last checked and what your Dawarich version does not offer.',
  'help.guide.tour-connect-wanderer.title': 'Connect your wanderer',
  'help.guide.tour-connect-wanderer.goal':
    'Let TREK read the trails of your own wanderer, so you can import them as tours.',
  'help.guide.tour-connect-wanderer.step.1':
    'Under Integrations, find wanderer and enter its Instance URL and an API token. You create the token in wanderer under Settings, Account, API tokens; it starts with wanderer_key_.',
  'help.guide.tour-connect-wanderer.step.2':
    'Switch on Allow a self-signed certificate only for an instance on your own network.',
  'help.guide.tour-connect-wanderer.step.3':
    'Click Save, then Test connection. It says how many of your trails you can import, and the badge changes to Connected.',
  'help.guide.tour-connect-wanderer.result':
    'The badge shows Connected, and the Tours tab of a trip can search your wanderer and import its trails.',
  'help.guide.tour-connect-wanderer.tip.1': 'The card only appears while the admin allows wanderer under Tours.',
  'help.guide.tour-connect-wanderer.tip.2':
    'An instance on a private address may need the admin to allow internal networks.',
  'help.guide.tour-connect-wanderer.tip.3': 'Disconnect, on the right, removes the token again.',
  'help.guide.tour-wanderer-watch.title': 'Get notified when your wanderer trails change',
  'help.guide.tour-wanderer-watch.goal': 'Have TREK look for changes to the trails you imported, in the background.',
  'help.guide.tour-wanderer-watch.step.1':
    'In the wanderer card, switch on Check my trails for changes. It needs a saved connection first.',
  'help.guide.tour-wanderer-watch.step.2':
    'At most once a day, TREK reads the short record of each trail you imported, and the row shows when it last checked. When a trail may have changed, you get a notification and Hints counts it: click Hints to see each tour as May have changed, Changed or Not checkable, and open it from there.',
  'help.guide.tour-wanderer-watch.result':
    'TREK checks your imported trails and tells you when one may have changed. A tour changes only when you accept the change.',
  'help.guide.tour-wanderer-watch.tip.1':
    'A hint never changes a tour; the source check of the tour shows what really changed.',
  'help.guide.tour-wanderer-watch.tip.2':
    'Paused until means wanderer did not answer; Token refused means the token needs a successful connection test or a new token.',
  'help.guide.tour-wanderer-watch.tip.3':
    'You choose the channels for these hints in Notifications, in the row wanderer: hints on your trails.',
  'help.guide.api-keys.title': 'Create an API key',
  'help.guide.api-keys.goal': 'Let other software read your trips through the public API.',
  'help.guide.api-keys.step.1':
    'Under API Keys, click Create key, give it a Name that says where it will be used, and under What this key may read keep only the areas it needs. Click Create.',
  'help.guide.api-keys.step.2':
    'Copy the key from API key created: it is shown once. Click Done. The Endpoint to call is shown below the list.',
  'help.guide.api-keys.result':
    'Software with the key can read the areas you picked and never change anything. The list shows when each key was created and last used, and the bin deletes it.',
  'help.guide.api-keys.tip.1': 'Use one key per tool, so you can revoke a key without affecting the other tools.',
  'help.guide.api-keys.tip.2': 'To let an AI client change things, use MCP with OAuth instead; API keys only read.',
  'help.guide.api-keys.tip.3':
    'Send the key as Authorization: Bearer or X-API-Key to /api/v1. An account holds up to 10 keys.',
  'help.guide.mcp-oauth.title': 'Connect an AI assistant over MCP',
  'help.guide.mcp-oauth.goal': 'Give Claude, an IDE or another MCP client access to your trips.',
  'help.guide.mcp-oauth.step.1': 'Under MCP Configuration, copy the MCP Endpoint for your client.',
  'help.guide.mcp-oauth.step.2':
    'Under OAuth 2.1 Clients, click New Client and pick a Quick preset such as Claude Desktop or Cursor, or fill in the Application Name, Redirect URIs and Allowed Scopes yourself; for a server without a browser, pick Machine client. Click Register Client and copy the Client Secret: it is shown once.',
  'help.guide.mcp-oauth.step.3':
    'Each client has Rotate Secret and Delete Client. Active OAuth Sessions lists the signed-in clients, with Revoke. Client Configuration expands to show a ready-made snippet for clients that use JSON.',
  'help.guide.mcp-oauth.result':
    'The client can read and change what its scopes allow, as you, and every action shows up under your name.',
  'help.guide.mcp-oauth.tip.1':
    'Scopes limit what a client can do: give a client only the read scope until it needs more.',
  'help.guide.mcp-oauth.tip.2': 'The admin can switch MCP off for the whole instance. Then this section is not shown.',
  'help.guide.mcp-oauth.tip.3': 'API Tokens still work but are marked Deprecated; move to an OAuth client.',
  'help.guide.plugin-settings.title': 'Set up a plugin for yourself',
  'help.guide.plugin-settings.goal': 'Give a plugin your own keys and preferences, and see what it did on your behalf.',
  'help.guide.plugin-settings.step.1':
    'Open Plugins in the settings sidebar. Below Plugin settings, every plugin that needs settings from you has a card with its fields: fill them in and click Save. Actions on the card run after you confirm.',
  'help.guide.plugin-settings.step.2':
    'Plugin activity lists every action a plugin took on your behalf, newest first; Refresh loads the latest.',
  'help.guide.plugin-settings.result':
    'The plugin works with your settings, and every action it performs for you is listed under Plugin activity.',
  'help.guide.plugin-settings.tip.1': 'These settings are yours alone; other members set the plugin up for themselves.',
  'help.guide.plugin-settings.tip.2':
    'A plugin channel under Notifications has a Configure button that opens this page.',
  'help.guide.offline-prepare.title': 'Take trips offline',
  'help.guide.offline-prepare.goal': 'Save your trips and their maps on this device before you lose your connection.',
  'help.guide.offline-prepare.step.1':
    'Under What to store offline, keep Store map tiles offline on and switch on the trips you want on this device. A finished trip is only stored when you switch it on.',
  'help.guide.offline-prepare.step.2':
    'Back at the top, under Prepare for offline, click Download for offline use. It fetches trip data, documents and map tiles, and says how many trips it stored.',
  'help.guide.offline-prepare.step.3':
    'Force offline mode downloads once more, then works from this device only, so you can check everything is there before you leave.',
  'help.guide.offline-prepare.result':
    'The trips open without a connection. Changes you make are saved in a queue and sent when you are online again.',
  'help.guide.offline-prepare.tip.1':
    'Map tiles take the most space; switch them off to keep only trip data and documents.',
  'help.guide.offline-prepare.tip.2': 'Install TREK as an app from the browser for the smoothest offline start.',
  'help.guide.offline-conflicts.title': 'Decide which version is kept in a sync conflict',
  'help.guide.offline-conflicts.goal':
    'Choose how TREK resolves a conflict between a change made offline and a change made elsewhere.',
  'help.guide.offline-conflicts.step.1':
    'When a change you made offline conflicts with a newer one, Sync conflicts appears near the top of Offline. For each change, click Keep mine or Keep theirs.',
  'help.guide.offline-conflicts.step.2':
    'In the same card, When a conflict happens decides for next time: Ask me each time, Always keep my version or Always keep the server version.',
  'help.guide.offline-conflicts.step.3':
    "Changes the server keeps refusing show up under Offline cache as Failed changes: Try again sends them once more, Discard keeps the server's version.",
  'help.guide.offline-conflicts.result':
    'With Ask me each time, a conflict stays in Sync conflicts until you choose. With the other two options, TREK resolves it automatically.',
  'help.guide.offline-conflicts.tip.1':
    'Clear cache removes only the copy on this device. Nothing on the server changes.',
  'help.guide.offline-conflicts.tip.2': 'The choice applies to this device only.',
  'help.guide.profile.title': 'Change your profile',
  'help.guide.profile.goal': 'Update your name, email and picture.',
  'help.guide.profile.step.1':
    'In the Account card, click the camera on your picture to upload one; the red bin removes it again and brings back your initial.',
  'help.guide.profile.step.2': 'Edit Username and Email below the picture.',
  'help.guide.profile.step.3': "Click Save Profile at the right of the card's footer.",
  'help.guide.profile.result': 'Your name and picture update everywhere at once, including on trips you share.',
  'help.guide.profile.tip.1': 'An account linked through SSO shows an SSO badge and Linked with its provider.',
  'help.guide.password.title': 'Change your password',
  'help.guide.password.goal': 'Set a new password.',
  'help.guide.password.step.1':
    'Under Change Password, enter your Current password, then the New password and the same again in Confirm new password. The list below marks each rule as met while you type.',
  'help.guide.password.step.2': 'Click Update password.',
  'help.guide.password.result':
    'The new password applies at once. Every other device is signed out, your MCP API tokens are deleted and OAuth clients have to sign in again; this device stays signed in.',
  'help.guide.password.tip.1':
    'When this TREK signs in through SSO only, there is no TREK password and no Change Password card.',
  'help.guide.mfa.title': 'Turn on two-factor authentication',
  'help.guide.mfa.goal': 'Protect the account with a code from an authenticator app.',
  'help.guide.mfa.step.1': 'Under Two-factor authentication (2FA), click Set up authenticator.',
  'help.guide.mfa.step.2':
    'Scan the QR code with your app, or enter the secret by hand, then type the six-digit code it shows and click Enable 2FA.',
  'help.guide.mfa.step.3':
    'Save the backup codes with Copy codes, Download TXT or Print / PDF, then click OK. Each code works once. Use a code when you do not have your phone.',
  'help.guide.mfa.result': 'Every sign-in asks for a code after the password.',
  'help.guide.mfa.tip.1': 'Disable 2FA needs your password and a current code or an unused backup code.',
  'help.guide.mfa.tip.2': 'The admin can require 2FA for everyone; then it cannot be switched off here.',
  'help.guide.passkeys.title': 'Sign in with a passkey',
  'help.guide.passkeys.goal': "Use your device's fingerprint, face or PIN instead of a password.",
  'help.guide.passkeys.step.1':
    "Under Passkeys, click Add a passkey, confirm your current password and give it a name that says which device it is, then follow your device's prompt.",
  'help.guide.passkeys.step.2':
    'Each passkey shows whether it is Synced or bound to This device and when it was last used. Rename changes its name, and the delete button removes it after you enter your password.',
  'help.guide.passkeys.result': 'The sign-in page offers the passkey. You can still sign in with your password.',
  'help.guide.passkeys.tip.1':
    'A passkey is stored on the device or in its password manager, so add one passkey for each device.',
  'help.guide.passkeys.tip.2':
    'Passkeys only show up once the admin has switched them on. Until the server has its WebAuthn domain, the card says so instead of offering Add a passkey.',
  'help.guide.delete-account.title': 'Delete your account',
  'help.guide.delete-account.goal': 'Remove your account and the data that is only yours.',
  'help.guide.delete-account.step.1':
    'In the Account card, click Delete account at the left of its footer, then Delete permanently.',
  'help.guide.delete-account.result':
    'Your account is deleted, together with the trips, places and files you own. Trips that other people own are kept.',
  'help.guide.delete-account.tip.1':
    'If you are the only administrator, TREK shows Deletion not possible: promote another user to admin first.',
  'help.guide.delete-account.tip.2': 'There is no undo. Export what you want to keep before you confirm.',

  // ── Screen: admin ───────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Admin',
  'help.ctx.admin.summary':
    'Settings for the whole TREK instance, for all users: who may sign in and how, what is switched on, where files are stored, how the server contacts people, and how it is backed up. Only admins see this page. The sidebar groups the tabs under Users, Configuration, Integrations and Maintenance, and every tab is a separate screen.',
  'help.ctx.admin.bullet.1':
    'The header counts users, trips, places and files on its right. Below it, an Update available banner appears when a newer TREK release is available.',
  'help.ctx.admin.bullet.2':
    'Users and User Defaults: accounts, invite links and permissions, and the settings and map a new account starts with.',
  'help.ctx.admin.bullet.3':
    'Personalization, Settings, Addons, Plugins and Storage: packing templates, categories and school holidays; sign-in, passkeys, 2FA, API keys and search providers; the feature modules; third-party plugins; where uploads go.',
  'help.ctx.admin.bullet.4':
    'Notifications, MCP Access and GitHub: the channels users may pick and the defaults they start with, the tokens and sessions of AI clients, and the release history.',
  'help.ctx.admin.bullet.5':
    'Backup and Audit: on-demand and scheduled backups, and the log of security-relevant events.',
  'help.ctx.admin-users.title': 'Users',
  'help.ctx.admin-users.summary':
    'Every account on this TREK, with role, email and when it was last active, the invite links that let people register on a closed instance, and who may do what in trips.',
  'help.ctx.admin-users.bullet.1':
    'The table: user, email, role, created and Last Active, with Edit User and Delete user per row. A green dot on the avatar means the person is online right now; your own row says (You).',
  'help.ctx.admin-users.bullet.2':
    'Create User, at the top right of the Users card, adds an account manually with a password that you give to the user.',
  'help.ctx.admin-users.bullet.3':
    'Invite Links below: registration links with a use limit, an expiry and, if you like, a trip the new user joins when they sign up.',
  'help.ctx.admin-users.bullet.4':
    'Permission Settings at the bottom: per action, who may do it (Everyone, Trip members, Trip owner or Admin only). Click Save at the top of the card to save it.',
  'help.ctx.admin-defaults.title': 'User Defaults',
  'help.ctx.admin-defaults.summary':
    'What a new account starts with, so nobody has to set it up first: colour mode, units, time format, week start, display currency and blurred booking codes, plus the map, its keys and the routing servers.',
  'help.ctx.admin-defaults.bullet.1':
    'Default User Settings on the left: Color Mode, Temperature Unit, Distance Unit, Time Format, Week starts on, Display currency and Blur Booking Codes.',
  'help.ctx.admin-defaults.bullet.2':
    'Map on the right: Map Template, Shared CARTO key, Own routing engine and Own Valhalla instance, a preview, then Map engine with Map style, Shared Mapbox token, 3D buildings & terrain and High-quality mode.',
  'help.ctx.admin-defaults.bullet.3':
    "The reset link next to a field you set restores TREK's own default. A user's own setting always overrides these.",
  'help.ctx.admin-config.title': 'Personalization',
  'help.ctx.admin-config.summary':
    'Settings that all trips on the instance share: packing templates, the category set for places and collections, and the school-holiday catalogue that Vacay uses.',
  'help.ctx.admin-config.bullet.1':
    "Packing Templates: named lists of categories and items that a trip's packing list can start from.",
  'help.ctx.admin-config.bullet.2':
    'Categories: name, icon and colour of the categories used across TREK, from the place inspector to Collections, each edited in a dialog with a preview.',
  'help.ctx.admin-config.bullet.3':
    'School holidays: the catalogue of countries and regions with their holiday periods, which everyone can pick in Vacay.',
  'help.ctx.admin-settings.title': 'Settings',
  'help.ctx.admin-settings.summary':
    'How people sign in and which external services the server may use. On the left: Authentication Methods, Passkey login, Require two-factor authentication (2FA) and Single Sign-On (OIDC). On the right: Allowed File Types and API Keys with the search and transit providers. Danger Zone is at the bottom.',
  'help.ctx.admin-settings.bullet.1':
    'Authentication Methods: Password Login, Password Registration and, once OIDC is set up, SSO Login and SSO Auto-Provisioning. Require two-factor authentication (2FA) has a card of its own.',
  'help.ctx.admin-settings.bullet.2':
    'Passkey login: Enable passkey login, the Relying Party ID (domain) and the Allowed origins. Single Sign-On (OIDC): Display Name, Issuer URL, an optional Discovery URL, Client ID and Client Secret.',
  'help.ctx.admin-settings.bullet.3':
    'API Keys: the TREK Places API comes first and needs no key. Below it are the Google Maps API Key (with Test and What the key may be used for), the Unsplash and the Amap key, and one Save at the bottom of the card.',
  'help.ctx.admin-settings.bullet.4':
    'Transit Provider and Place search provider choose who answers transit and place searches; Place Search Log records which result was picked; Allowed File Types limits uploads.',
  'help.ctx.admin-settings.bullet.5': 'Danger Zone: Rotate JWT Secret signs every user out, you included.',
  'help.ctx.admin-addons.title': 'Addons',
  'help.ctx.admin-addons.summary':
    'The feature modules of TREK, each with a switch: Packing, Budget, Documents, Vacay, Atlas, Collab, Journey, Collections, Road trip, MCP, AirTrail, Dawarich and the AI parsing. Off means the navigation entry, the routes and the API are removed for everyone.',
  'help.ctx.admin-addons.bullet.1':
    'One tile per addon with its switch and, where it has any, sub-rows for its options.',
  'help.ctx.admin-addons.bullet.2':
    'Photo providers and document providers appear here as tiles too, so Immich or Synology can be offered to users.',
  'help.ctx.admin-addons.bullet.3': 'Bag Tracking has its own switch below the tiles.',
  'help.ctx.admin-plugins.title': 'Plugins',
  'help.ctx.admin-plugins.summary':
    'Third-party plugins that run in their own process next to TREK, each with the permissions it asked for at install. Install from the catalogue, upload a package, or link a folder while you develop a plugin.',
  'help.ctx.admin-plugins.bullet.1':
    'Installed and Discover, with Search plugins… and the Type, Status and Sort filters. Each row shows the version, Reviewed, Signed or Unsigned, what the plugin may access, a switch and a ⋯ menu.',
  'help.ctx.admin-plugins.bullet.2':
    "The two icons in the card's header: Upload plugin accepts a .zip, .tgz or .tar.gz (or drop a .zip on the page); Rescan finds a plugin folder that is linked for development.",
  'help.ctx.admin-plugins.bullet.3':
    'Allowed hosts per plugin: the addresses a plugin may call, because outgoing connections are blocked by default.',
  'help.ctx.admin-storage.title': 'Storage',
  'help.ctx.admin-storage.summary':
    'Where uploads are stored: the local disk or an S3 bucket, optionally copied to further backends. Each upload category can go to a different backend, and nothing changes until you click Save changes.',
  'help.ctx.admin-storage.bullet.1':
    'Health at the top: the failed writes to a mirror target, or No replica failures recorded.',
  'help.ctx.admin-storage.bullet.2':
    'Backends: name, type, usage and Mirrored to, with Test, Edit and Remove. Compute now counts what is stored; a backend defined by an environment variable is read-only.',
  'help.ctx.admin-storage.bullet.3':
    'Categories: trip documents, journey photos, covers, profile pictures, place images, the photo caches and backups, each assigned to a backend.',
  'help.ctx.admin-notifications.title': 'Notifications',
  'help.ctx.admin-notifications.summary':
    'The channels the instance offers its users, and the ones that you receive as the admin. Users pick their own topics and URLs under Settings; you decide what exists and configure email.',
  'help.ctx.admin-notifications.bullet.1':
    'Email (SMTP), Webhook, Ntfy and Web Push each have a switch that offers the channel to users; email also needs its server settings. In-App is always on.',
  'help.ctx.admin-notifications.bullet.2':
    'Trip Reminders: whether the server sends the reminder before a trip starts.',
  'help.ctx.admin-notifications.bullet.3':
    'Admin Webhook, Admin Ntfy and the Notifications card: where admin events (New version available, Storage replica failure, Paddle region requested) go, with a test button each.',
  'help.ctx.admin-notifications.bullet.4':
    'Defaults for users, at the bottom: per event and channel On, Off or Blocked for everyone who has not changed it.',
  'help.ctx.admin-mcp-tokens.title': 'MCP Access',
  'help.ctx.admin-mcp-tokens.summary':
    'Every token and OAuth session that AI clients have for this TREK, across all users. You can revoke any of them.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    'OAuth Sessions: the client, the scopes it was granted, its owner and the date, with a bin icon that revokes it.',
  'help.ctx.admin-mcp-tokens.bullet.2': 'API Tokens: name, owner, Created and Last Used, with a bin that deletes it.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'What is new in TREK: the release history from GitHub, and whether a newer version than yours is available. The update itself happens outside the app, on the host.',
  'help.ctx.admin-github.bullet.1':
    'Release History lists the releases as a timeline with their notes. The newest has the Latest label, pre-releases say Pre-release, and GitHub opens the releases page.',
  'help.ctx.admin-github.bullet.2':
    'Update available appears under the page header once a newer release exists; How to Update shows the commands for Docker or the update guide for other installs.',
  'help.ctx.admin-github.bullet.3':
    'About: Ko-fi, Buy Me a Coffee, Discord, Report a Bug, Feature Request and the Wiki.',
  'help.ctx.admin-backup.title': 'Backup',
  'help.ctx.admin-backup.summary':
    'Full backups of the database and the uploads, made by hand or on a schedule, kept on the server and downloadable as one file. Use Restore to bring a backup back.',
  'help.ctx.admin-backup.bullet.1':
    'Data Backup: Create Backup and Upload Backup at the top of the card, and the list of backups with Download, Restore and a bin icon to delete.',
  'help.ctx.admin-backup.bullet.2':
    'Upload Backup restores from a file made on another instance or an earlier day, after the same question as Restore.',
  'help.ctx.admin-backup.bullet.3':
    'Auto-Backup: on or off, Interval, Run at hour and the day, and Delete old backups after (1 day to Keep forever), applied with Save.',
  'help.ctx.admin-audit.title': 'Audit',
  'help.ctx.admin-audit.summary':
    'The log of security-relevant and administrative events: sign-ins and failures, MFA changes, user and setting changes, backups and restores. Read-only, newest first.',
  'help.ctx.admin-audit.bullet.1': 'One row per event with time, user, action, resource, IP and details.',
  'help.ctx.admin-audit.bullet.2':
    "Refresh in the card's header reloads the list. The badge beside the title shows how many entries are loaded out of the total, and Load more loads older entries.",
  'help.guide.create-user.title': 'Create a user',
  'help.guide.create-user.goal': 'Add an account by hand, without an invite.',
  'help.guide.create-user.step.1': 'Click Create User at the top right of the Users card.',
  'help.guide.create-user.step.2':
    'Enter Username, Email and a Password; the checklist under the password shows which rules the password meets. Pick the Role: User or Administrator.',
  'help.guide.create-user.step.3': 'Click Create User.',
  'help.guide.create-user.result':
    'The account appears in the table and can sign in immediately. Give the password to the person over a channel you trust.',
  'help.guide.create-user.tip.1': 'For a person who should choose their own password, an invite link is better.',
  'help.guide.create-user.tip.2':
    'An Administrator sees this page and may do everything. What a User may do in trips is set under Permission Settings below.',
  'help.guide.edit-user.title': "Change a user's details or password",
  'help.guide.edit-user.goal':
    'Rename someone, promote or demote them, or help them sign in again after they lose their password.',
  'help.guide.edit-user.step.1':
    "Click the pencil (Edit User) in the user's row. The dialog shows the account's email at the top.",
  'help.guide.edit-user.step.2':
    'Change Username, Email or Role, or type a New Password (leave it empty to keep the current one), and click Save. Reset passkeys, at the bottom, removes every passkey of the account after you confirm.',
  'help.guide.edit-user.result':
    'The change applies at once. A new password also signs the person out on every device, so an old session stops working.',
  'help.guide.edit-user.tip.1': 'You cannot take the admin role from yourself while you are the last admin.',
  'help.guide.edit-user.tip.2':
    'Resetting passkeys keeps the password; the person adds new passkeys under Settings, Account.',
  'help.guide.invite-links.title': 'Invite someone with a link',
  'help.guide.invite-links.goal': 'Let a person register on a closed instance and, if you want, add them to a trip.',
  'help.guide.invite-links.step.1': 'Click Create Link at the top right of the Invite Links card.',
  'help.guide.invite-links.step.2':
    'Pick Max. Uses (1× to 5×, or ∞) and Expires after (1d to 14d, or ∞), optionally a trip under Add to trip (optional), and click Create & Copy.',
  'help.guide.invite-links.step.3':
    'Send the link. Each row shows how often it was used, when it expires, the trip it adds to and who made it, with Active, Expired or Used up beside it. Copy link copies it again, and the bin deletes it.',
  'help.guide.invite-links.result':
    'Whoever opens the link registers with their own password. If a trip was chosen, they join it immediately.',
  'help.guide.invite-links.tip.1': 'Invite links work even while Password Registration is switched off under Settings.',
  'help.guide.invite-links.tip.2': 'A link with one use and a short expiry is the safest default for a single person.',
  'help.guide.delete-user.title': 'Delete a user',
  'help.guide.delete-user.goal': 'Remove an account and everything it owns.',
  'help.guide.delete-user.step.1': "Click the bin (Delete user) in the user's row and confirm with Delete.",
  'help.guide.delete-user.result':
    'The account is deleted, together with every trip and journey it owns, even trips it shared with others. Trips it was only a member of stay with their owners.',
  'help.guide.delete-user.tip.1': 'There is no undo. Take a backup first if you are not sure.',
  'help.guide.delete-user.tip.2':
    'The bin icon on your own row does not work: you cannot delete yourself. Another admin has to do it.',
  'help.guide.permissions.title': 'Decide who may do what',
  'help.guide.permissions.goal': 'Set, per action, which role is allowed to do it on this TREK.',
  'help.guide.permissions.step.1':
    'Under Permission Settings, find the action in its group, such as Delete trips under Trip Management, and pick who may do it: Everyone, Trip members, Trip owner or Admin only. A changed row is marked customized.',
  'help.guide.permissions.step.2':
    'Click Save at the top right of the card. Reset to defaults puts every row back to its built-in level; click Save after it as well.',
  'help.guide.permissions.result':
    'The rule applies to every trip at once. People below the level no longer see the buttons and menus for it.',
  'help.guide.permissions.tip.1': 'Trip owner means the person who created the trip; admins may always do everything.',
  'help.guide.permissions.tip.2':
    'Each action is its own row, so you can, for example, let members plan places and days but leave deleting the trip to its owner.',
  'help.guide.default-user-settings.title': 'Set what new users start with',
  'help.guide.default-user-settings.goal':
    'Give every account sensible units, colour mode and currency without anyone opening Settings.',
  'help.guide.default-user-settings.step.1':
    'Under Default User Settings, pick Color Mode (Light, Dark or Auto), Temperature Unit, Distance Unit, Time Format, Week starts on, the Display currency and whether Blur Booking Codes is On or Off. Each choice saves at once.',
  'help.guide.default-user-settings.step.2':
    "A field you set gets a reset link beside its name; it restores TREK's built-in default.",
  'help.guide.default-user-settings.result':
    'New accounts, and everyone who never changed these settings, see your choices.',
  'help.guide.default-user-settings.tip.1':
    "A user's own choice under Settings always takes priority; these apply to everyone who has not changed that setting.",
  'help.guide.default-user-settings.tip.2':
    'Display currency only converts amounts for display. The amounts entered in Costs stay as they are.',
  'help.guide.default-map.title': 'Set the map defaults for new users',
  'help.guide.default-map.goal': 'Give every new account a working map without a personal token.',
  'help.guide.default-map.step.1':
    'Under Map, pick a Map Template or paste a tile URL, and enter a Shared CARTO key if you use CARTO tiles. The preview below shows the result.',
  'help.guide.default-map.step.2':
    'Further down, choose the Map engine: Standard (free), Mapbox (3D) or MapLibre (OpenFreeMap). For Mapbox and MapLibre pick the Map style; for Mapbox add the Shared Mapbox token and decide on 3D buildings & terrain and High-quality mode.',
  'help.guide.default-map.step.3':
    "Every field saves when you leave it. The reset link beside a field's name restores TREK's default value.",
  'help.guide.default-map.result':
    'New accounts start with these; anyone who set their own map under Settings keeps theirs.',
  'help.guide.default-map.tip.1':
    'A token or key entered here is shared by everyone who has none of their own, so watch its quota.',
  'help.guide.default-map.tip.2':
    'Existing accounts that never changed anything in the map tab also use these defaults.',
  'help.guide.own-routing-engine.title': 'Use your own routing servers',
  'help.guide.own-routing-engine.goal':
    'Route days and road trips through an OSRM or Valhalla server you run, instead of the public ones.',
  'help.guide.own-routing-engine.step.1':
    'Under Map on User Defaults, enter the address of your OSRM server under Own routing engine.',
  'help.guide.own-routing-engine.step.2':
    'For routes that avoid tolls, motorways or ferries, enter your Valhalla address under Own Valhalla instance. Each field saves when you leave it; then restart the TREK server and reload the page.',
  'help.guide.own-routing-engine.result': 'Routes in every trip are calculated on your servers.',
  'help.guide.own-routing-engine.tip.1':
    'The public OSRM servers allow about one request a second. This is enough for one day, but can be too slow for a road trip.',
  'help.guide.own-routing-engine.tip.2':
    'With only your own routing engine set, the public Valhalla is not used either. The reset link beside a field clears it again.',
  'help.guide.packing-templates.title': 'Build a packing template',
  'help.guide.packing-templates.goal': 'Give trips a packing list to start from instead of an empty one.',
  'help.guide.packing-templates.step.1': 'Click New Template, type a name and confirm with the tick.',
  'help.guide.packing-templates.step.2':
    "Click the template's name to open it, then Add category. The + at the top of a category adds items, and an item needs only a name.",
  'help.guide.packing-templates.step.3':
    'Everything is saved as you go. The pencil renames a template, a category or an item. The bin deletes an item at once. For a template or a category it asks first, because everything in it is deleted too.',
  'help.guide.packing-templates.result':
    "The template is offered on every trip's packing list; applying it copies the items, so a trip can change them freely.",
  'help.guide.packing-templates.tip.1':
    'One template for each kind of trip (beach, city, hiking) works better than one very long list.',
  'help.guide.packing-templates.tip.2': 'Deleting a template does not change trips that already applied it.',
  'help.guide.packing-templates.tip.3':
    "Save as template on a trip's packing list makes a template with each item's weight, quantity and bag. They appear beside the item here, and applying the template puts the items into the same bags.",
  'help.guide.categories.title': 'Manage the category set',
  'help.guide.categories.goal': 'Decide which categories places and collections can have, and how they look.',
  'help.guide.categories.step.1':
    "Click New Category, type the name in the dialog's title line, pick an Icon and a Color, and check the Preview. Click Create.",
  'help.guide.categories.step.2':
    'In the list, the pencil (Edit) opens a category, and Update saves it. The bin (Delete) removes it after you confirm.',
  'help.guide.categories.result':
    'The set applies everywhere at once: the place inspector, the map pins, Collections and the filters.',
  'help.guide.categories.tip.1': 'Places keep their category id, so renaming a category renames it on every place.',
  'help.guide.categories.tip.2':
    'When you delete a category, its places have no category. If that matters, assign them to another category first.',
  'help.guide.school-holiday-catalog.title': 'Maintain school holidays by hand',
  'help.guide.school-holiday-catalog.goal':
    'Keep the school holidays of a country or region that everyone can pick in Vacay.',
  'help.guide.school-holiday-catalog.step.1':
    'Under School holidays, pick the Country, or click + (Add country), enter the Country and its Country code (e.g. US) and Save. Add region adds each part of it that has its own dates.',
  'help.guide.school-holiday-catalog.step.2':
    'Click a region to open Region or school district: Add holiday period, give each one a Holiday name, Start date and End date, and Save. The bin removes a period or a region; a country can be deleted once it has no regions left.',
  'help.guide.school-holiday-catalog.result':
    'Users find the country and region under Settings in Vacay and see the periods on their year grid.',
  'help.guide.school-holiday-catalog.tip.1':
    'A region someone already picked in their Vacay calendar cannot be deleted.',
  'help.guide.auth-methods.title': 'Decide how people sign in',
  'help.guide.auth-methods.goal': 'Turn password sign-in, SSO and registration on or off, and require 2FA.',
  'help.guide.auth-methods.step.1':
    'Under Authentication Methods, switch Password Login and Password Registration on or off; each switch applies at once. With registration off, new accounts come only from invite links, SSO or Create User.',
  'help.guide.auth-methods.step.2':
    'SSO Login and SSO Auto-Provisioning need Single Sign-On (OIDC) configured below; auto-provisioning creates an account the first time someone signs in through SSO.',
  'help.guide.auth-methods.step.3':
    'Switch on Require two-factor authentication (2FA) to make everyone without 2FA set it up in Settings before they can use TREK.',
  'help.guide.auth-methods.result': 'The sign-in page offers exactly the methods you left on.',
  'help.guide.auth-methods.tip.1':
    'TREK will not let you switch off the last login method: its switch turns grey, and the tooltip says At least one login method must remain enabled.',
  'help.guide.auth-methods.tip.2':
    'With OIDC_ONLY set on the server, the password switches are locked and a note says so.',
  'help.guide.admin-passkeys.title': 'Offer passkey sign-in',
  'help.guide.admin-passkeys.goal': 'Let people sign in with a fingerprint, their face or a device PIN.',
  'help.guide.admin-passkeys.step.1': 'On the Settings tab, under Passkey login, switch on Enable passkey login.',
  'help.guide.admin-passkeys.step.2':
    'Enter the Relying Party ID (domain), such as trek.example.org, and the Allowed origins your TREK is reached at, then click Save. Leave both empty to use APP_URL.',
  'help.guide.admin-passkeys.result':
    'The sign-in page offers Sign in with a passkey, and people can add passkeys in their settings.',
  'help.guide.admin-passkeys.tip.1':
    'If TREK cannot determine a domain yet, a warning says so, and passkeys stay hidden until you set APP_URL or the Relying Party ID.',
  'help.guide.admin-passkeys.tip.2':
    'If you change the domain later, every passkey people already added stops working.',
  'help.guide.admin-passkeys.tip.3':
    'If a user lost the device with their passkeys, remove the passkeys with Reset passkeys in Edit User.',
  'help.guide.oidc.title': 'Connect single sign-on',
  'help.guide.oidc.goal': 'Let people sign in with your identity provider.',
  'help.guide.oidc.step.1':
    'Under Single Sign-On (OIDC), enter the Display Name for the button, the Issuer URL, the Client ID and the Client Secret from your provider. Fill in Discovery URL (optional) only if your provider does not publish it at the usual address, as with Authentik. Click Save.',
  'help.guide.oidc.step.2': 'Switch SSO Login on under Authentication Methods.',
  'help.guide.oidc.result':
    'The sign-in page shows the SSO button; with SSO Auto-Provisioning on, first-time users get an account automatically.',
  'help.guide.oidc.tip.1':
    "The redirect URI your provider needs is your TREK's address plus the OIDC callback path from the docs.",
  'help.guide.oidc.tip.2': 'Claim mapping decides which SSO groups become admins; see the OIDC page in the docs.',
  'help.guide.instance-keys.title': 'Enter the API keys',
  'help.guide.instance-keys.goal':
    'Add Google photos and ratings, Unsplash covers and Amap search for the whole instance.',
  'help.guide.instance-keys.step.1':
    'Under API Keys, the TREK Places API at the top already handles place search without a key. What is in it lists what it covers and what it does not.',
  'help.guide.instance-keys.step.2':
    'For photos, ratings and opening hours, paste a Google Maps API Key and click Test; it says Connected or Invalid. Open What the key may be used for and switch on only what you want billed: Place Photos, Place Autocomplete, Place Details, Place Enrichment and Search with Google only, plus a Daily limit for Google calls.',
  'help.guide.instance-keys.step.3':
    'Paste the Unsplash API Key for cover search and the Amap (高德地图) API Key for place search in mainland China, then click Save at the bottom of the card.',
  'help.guide.instance-keys.result':
    'Users get the features without keys of their own. Without a Google key, search runs on the TREK Places API and OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    'When a user has a personal key under Settings, TREK uses it instead of the instance key for that user.',
  'help.guide.instance-keys.tip.2': 'Keys can also come from environment variables; those show as read-only here.',
  'help.guide.instance-keys.tip.3':
    'Daily limit for Google calls limits how much TREK may spend on the key per day; the badge next to the title counts today’s calls. Once the limit is reached, searches use OpenStreetMap until the next day (UTC).',
  'help.guide.instance-keys.tip.4': 'The Amap key has to be a Web 服务 (web service) key, not a JS API key.',
  'help.guide.places-transit.title': 'Pick the search and transit providers',
  'help.guide.places-transit.goal': 'Choose which service answers place searches and public transport route requests.',
  'help.guide.places-transit.step.1':
    'Under Transit Provider, choose Transitous (free), keyless and strongest in Europe, or Google, which uses the Google key. The choice saves at once.',
  'help.guide.places-transit.step.2':
    'Under Place search provider, choose which service TREK asks when the TREK index and OpenStreetMap find nothing: Automatic (Google if a key exists, then Amap), Google Places, Amap (高德地图) or OpenStreetMap.',
  'help.guide.places-transit.result': 'Every search box and every transit route in TREK uses this choice.',
  'help.guide.places-transit.tip.1':
    'A choice without its key shows a warning here. Place search then uses only the TREK index and OpenStreetMap, and transit uses only Transitous.',
  'help.guide.places-transit.tip.2': 'Google transit routes are billed per request; Transitous is not.',
  'help.guide.file-types.title': 'Limit the file types',
  'help.guide.file-types.goal': 'Decide which file extensions uploads may have.',
  'help.guide.file-types.step.1':
    'Under Allowed File Types, edit the comma-separated list of extensions, or enter * to allow every type, and click Save.',
  'help.guide.file-types.result':
    'Uploads of any other type are refused with a clear message, in the documents, the journal and the covers.',
  'help.guide.file-types.tip.1':
    'Keep image types in the list; covers and journey photos are checked against the same list.',
  'help.guide.rotate-jwt-secret.title': 'Sign everyone out at once',
  'help.guide.rotate-jwt-secret.goal': 'End every session after a suspected leak.',
  'help.guide.rotate-jwt-secret.step.1':
    'At the bottom of the Settings tab, under Danger Zone, click Rotate next to Rotate JWT Secret.',
  'help.guide.rotate-jwt-secret.step.2': 'Read the warning and click Rotate & Log out.',
  'help.guide.rotate-jwt-secret.result':
    'A new signing secret is in place, and every user, you included, has to sign in again.',
  'help.guide.rotate-jwt-secret.tip.1': 'You are signed out too, so sign in again right afterwards.',
  'help.guide.rotate-jwt-secret.tip.2':
    'To sign out a single person instead, give them a New Password under Edit User. This ends only their sessions.',
  'help.guide.toggle-addon.title': 'Switch an addon on or off',
  'help.guide.toggle-addon.goal': 'Make a feature module available to everyone, or remove it.',
  'help.guide.toggle-addon.step.1':
    "Click the switch on the addon's tile. The navigation entry appears or disappears for everyone immediately.",
  'help.guide.toggle-addon.step.2':
    'Some tiles have sub-rows for their options, such as Bag Tracking under Lists or the photo providers under Journey; they show only while the addon is on.',
  'help.guide.toggle-addon.result':
    'When you switch an addon off, its data is kept. When you switch it back on, the data appears again.',
  'help.guide.toggle-addon.tip.1':
    'Switching MCP off removes the endpoint and the Integrations sections that depend on it.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas and Journey are the addons users ask for most; Documents needs storage for uploads.',
  'help.guide.document-providers.title': 'Offer a document store',
  'help.guide.document-providers.goal': 'Decide which stores a trip can sync its documents with.',
  'help.guide.document-providers.step.1':
    'The Documents tile lists the stores as rows: Paperless-ngx, Papra, Nextcloud, OpenCloud and Synology Drive. All five are switched off at the start, and the rows are only shown while Documents itself is on.',
  'help.guide.document-providers.step.2':
    'Turn on the switch on the Nextcloud row. The message reads Addon updated, and from now on trip owners find Document sync in the Files tab of their trips, with Nextcloud under Connect a provider.',
  'help.guide.document-providers.result':
    'The store is available on every trip of this TREK. Nothing is connected until a trip owner connects it.',
  'help.guide.document-providers.tip.1':
    'Only whether a store may be offered is decided here. The address and the credentials belong to a trip and are entered in its Files tab by the trip’s owner, never in the admin panel.',
  'help.guide.document-providers.tip.2':
    'Switching Documents off switches every store off too, and you cannot switch a store on while Documents is off: the server answers Enable the Documents addon first. A store on your own network also needs ALLOW_INTERNAL_NETWORK=true on the server.',
  'help.guide.install-plugin.title': 'Install a plugin',
  'help.guide.install-plugin.goal': 'Add a third-party plugin and give it exactly the permissions it asks for.',
  'help.guide.install-plugin.step.1':
    'Open Discover, find a plugin with Search plugins… or the Type filter, and click Install. For a package file, click Upload plugin (the cloud icon at the top right of the card), or drop the .zip on the page.',
  'help.guide.install-plugin.step.2':
    'Under Installed, read the row: what the plugin may access, the hosts it connects to, and whether it is Reviewed and Signed. Then switch Enable plugin on; the row shows Active.',
  'help.guide.install-plugin.step.3':
    "The row's ⋯ menu offers Restart, View error log, Allowed hosts and Change version…, plus the links to the source; Delete uninstalls the plugin and its data. A newer version shows as an update on the row, and one that asks for new rights stays off until you approve them.",
  'help.guide.install-plugin.result':
    'The plugin runs in its own process. Anything it adds, such as widgets, map layers or tools, appears where the plugin defines it.',
  'help.guide.install-plugin.tip.1': 'Rescan finds a plugin folder linked for development without a package.',
  'help.guide.install-plugin.tip.2': 'An unsigned plugin is marked as such; install it only when you trust its source.',
  'help.guide.storage-backends.title': 'Move uploads to S3 or mirror them',
  'help.guide.storage-backends.goal': 'Keep files on object storage, or copy every upload to a second backend.',
  'help.guide.storage-backends.step.1':
    'Under Backends, click Add backend, give it a Name, pick the Type, Local or S3, and fill in its fields. To keep a copy elsewhere, tick the Mirror targets. Click Apply, then Test on the new row to check the connection.',
  'help.guide.storage-backends.step.2':
    'Under Categories, assign each kind of upload, such as Trip documents, Journey photos or Backups, to a backend.',
  'help.guide.storage-backends.step.3':
    'Click Save changes at the bottom. If a category now points somewhere else, TREK asks whether to Move existing objects or Just route new writes.',
  'help.guide.storage-backends.step.4':
    'Health at the top lists failed writes to a mirror target. If it says No replica failures recorded, everything works.',
  'help.guide.storage-backends.result':
    'New uploads go to the assigned backend. Moved files are served from there, and what you chose not to move stays where it was.',
  'help.guide.storage-backends.tip.1':
    'A backend configured through environment variables is shown but cannot be edited here.',
  'help.guide.storage-backends.tip.2':
    'A mirror target gets a copy of every new write; Sync now on the row copies what was stored before. A slow target slows every upload on that backend.',
  'help.guide.storage-backends.tip.3':
    'TREK can download the photo caches again, so mirroring them usually wastes storage.',
  'help.guide.channels-instance.title': 'Configure the notification channels',
  'help.guide.channels-instance.goal': 'Decide which channels users may pick, and set up email.',
  'help.guide.channels-instance.step.1':
    'Switch on Email (SMTP) in the header of its card, enter SMTP Host, SMTP Port, SMTP User, SMTP Password and the From Address, and click Save. Send test email sends an email to you. Skip TLS certificate check is only for a local mail server with its own certificate.',
  'help.guide.channels-instance.step.2':
    'Switch on Webhook, Ntfy and Web Push to offer them. Users then enter their own URL or topic, or turn push on per device, under Settings, Notifications.',
  'help.guide.channels-instance.step.3':
    'Trip Reminders switches the reminder before a trip starts; In-App is always on.',
  'help.guide.channels-instance.result': 'The Notifications tab of every user shows the channels you switched on.',
  'help.guide.channels-instance.tip.1':
    'The Ntfy Server URL in the Admin Ntfy card is also the default server for users. Users can still set their own server.',
  'help.guide.channels-instance.tip.2':
    'Plugin channels appear automatically once a plugin with that capability is active.',
  'help.guide.channels-instance.tip.3':
    'Web Push needs HTTPS. On iPhone and iPad, people first add TREK to the Home Screen.',
  'help.guide.admin-channels.title': 'Get admin events on your phone',
  'help.guide.admin-channels.goal':
    'Get notified about new releases, failing storage mirrors and paddle region requests.',
  'help.guide.admin-channels.step.1':
    'Under Admin Ntfy, enter the Admin Topic and, if needed, the Ntfy Server URL and an Access Token (optional); under Admin Webhook, a URL. Click Save in each card.',
  'help.guide.admin-channels.step.2': 'Click Send test ntfy or Send test webhook to see a message arrive.',
  'help.guide.admin-channels.step.3':
    'In the Notifications card below, choose for each event which channels send it: New version available, Storage replica failure and Paddle region requested. Each switch saves immediately.',
  'help.guide.admin-channels.result':
    'Admin events are sent to every admin in the app and, where you switched them on, to the admin ntfy topic and webhook.',
  'help.guide.admin-channels.tip.1':
    'Keep the admin topic separate from your personal one, so that outage messages are not lost among trip messages.',
  'help.guide.admin-channels.tip.2':
    'The admin webhook and topic are separate from your own channels under Settings, Notifications.',
  'help.guide.notification-defaults.title': 'Set the notification defaults for users',
  'help.guide.notification-defaults.goal':
    "Decide how every user's notifications start, and block a channel for an event entirely.",
  'help.guide.notification-defaults.step.1':
    'On the Notifications tab, scroll to Defaults for users at the bottom. Each row is an event, each column a channel.',
  'help.guide.notification-defaults.step.2':
    'Click a cell to switch it to the next state: On, Off, Blocked. The tooltip names the next state, and each click saves at once.',
  'help.guide.notification-defaults.result':
    'Everyone who has not changed a cell starts from your choice, and blocked cells show as locked in their settings.',
  'help.guide.notification-defaults.tip.1':
    'Off is a default each user may still turn on; Blocked turns it off for everyone.',
  'help.guide.notification-defaults.tip.2':
    'A default applies only to people who have not changed that cell themselves.',
  'help.guide.mcp-tokens-admin.title': 'Revoke AI access',
  'help.guide.mcp-tokens-admin.goal': 'See and revoke every token and session that an AI client holds, for any user.',
  'help.guide.mcp-tokens-admin.step.1':
    'Under OAuth Sessions, find the client by name and owner; its chips show the scopes it was granted. The bin revokes the session after you confirm.',
  'help.guide.mcp-tokens-admin.step.2':
    'Under API Tokens, the same for tokens: name, owner, Created and Last Used. The bin deletes the token, and the client stops working at once.',
  'help.guide.mcp-tokens-admin.result': 'The user of the client has to connect it again. Nothing else changes.',
  'help.guide.mcp-tokens-admin.tip.1': 'Scopes tell you what a client could do; a read-only scope is safe to keep.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Switching the MCP addon off stops every client at once and hides this tab, but deletes nothing: the tokens work again once it is back on.',
  'help.guide.release-history.title': 'Check for a new release',
  'help.guide.release-history.goal': 'Know whether your TREK is current and what the next version brings.',
  'help.guide.release-history.step.1':
    'When a newer release exists, Update available shows under the page header with the version you run. View on GitHub opens the release, and How to Update shows the commands for Docker or the update guide for other installs.',
  'help.guide.release-history.step.2':
    'Release History lists every release with its notes. Show details expands them, the newest release has the Latest label, and Load more shows older releases.',
  'help.guide.release-history.result':
    'You update on the host, by pulling the new image or building the new tag; the data directory is kept.',
  'help.guide.release-history.tip.1': 'Make a backup before an update. The Backup tab is next to this one.',
  'help.guide.release-history.tip.2':
    'Pre-releases are shown but not announced as updates, unless you are running a pre-release.',
  'help.guide.create-backup.title': 'Make and restore a backup',
  'help.guide.create-backup.goal':
    'Back up the whole instance, keep a copy in another place, and be able to restore it.',
  'help.guide.create-backup.step.1':
    'Under Data Backup, click Create Backup at the top right. It saves the database and the uploads in one file on the server.',
  'help.guide.create-backup.step.2':
    'Download keeps a copy off the machine; the bin deletes old ones after you confirm.',
  'help.guide.create-backup.step.3':
    'Restore on a backup, or Upload Backup with a file, replaces all current data once you click Yes, restore under Restore Backup?.',
  'help.guide.create-backup.result':
    'A restore brings back users, trips, files and settings exactly as they were in that backup.',
  'help.guide.create-backup.tip.1':
    'Restoring is the one action here that cannot be undone. Make a fresh backup first.',
  'help.guide.create-backup.tip.2':
    'Backups are stored in the data directory. Copy them to another machine, so that they are safe if this machine fails.',
  'help.guide.auto-backup.title': 'Schedule backups',
  'help.guide.auto-backup.goal': 'Let the server back itself up and clear out old backups.',
  'help.guide.auto-backup.step.1':
    'Under Auto-Backup, switch on Enable auto-backup and pick the Interval (Hourly, Daily, Weekly or Monthly), Run at hour and, for weekly or monthly, the Day of week or Day of month.',
  'help.guide.auto-backup.step.2':
    'Under Delete old backups after, choose how long a backup is kept, from 1 day to Keep forever, and click Save.',
  'help.guide.auto-backup.result':
    'Backups appear in the list on schedule. Older backups are deleted when they are older than the age you chose.',
  'help.guide.auto-backup.tip.1': "Run at hour uses the server's time; the hint below it shows the server's timezone.",
  'help.guide.auto-backup.tip.2':
    'Storage on the server is finite: 7 or 14 days is usually enough, with a downloaded copy kept elsewhere.',
  'help.guide.audit-log.title': 'Read the audit log',
  'help.guide.audit-log.goal': 'Find out who did what, and when.',
  'help.guide.audit-log.step.1':
    'Read the rows, newest first: Time, User, Action, Resource, IP and Details. Actions are named by what happened, such as a failed login, an MFA change or a restore.',
  'help.guide.audit-log.step.2':
    'Refresh at the top right reloads the list. The badge beside the title shows how many entries are loaded out of the total, and Load more loads older entries.',
  'help.guide.audit-log.result': 'You have a record that you can show to anyone who asks why something changed.',
  'help.guide.audit-log.tip.1': "Times are shown in the server's timezone.",
  'help.guide.audit-log.tip.2': 'The log is append-only; nothing here can be edited or deleted from the app.',

  // ── Screen: notifications ───────────────────────────────────────────────────
  'help.ctx.notifications.title': 'Notifications',
  'help.ctx.notifications.summary':
    'All notifications TREK showed you inside the app, newest first: a booking someone changed, a new message in a trip chat, a calendar shared with you. The bell at the top right shows the newest ten, this page shows all of them.',
  'help.ctx.notifications.bullet.1':
    'The bell at the top right counts the notifications you have not read yet. Click it for the newest ten, and Show all notifications at its bottom for this page.',
  'help.ctx.notifications.bullet.2':
    'All and Unread at the top switch between every notification and only the ones you have not read. The list loads more as you scroll.',
  'help.ctx.notifications.bullet.3':
    'Each notification says who did what and where. Unread ones have a tinted background. A button under it, such as View Trip or View Vacay, takes you there and marks it as read.',
  'help.ctx.notifications.bullet.4':
    "Beside each notification's time, Mark as read (the double tick) and Delete (the bin) act on that one. Mark all read and Delete all at the top act on the whole list.",
  'help.ctx.notifications.bullet.5':
    'You choose in Settings, under Notifications, which events you receive here and which you receive by email, webhook, ntfy or push.',
  'help.guide.read-notifications.title': 'Read your notifications',
  'help.guide.read-notifications.goal': 'See what happened in your trips while you were away, and open it directly.',
  'help.guide.read-notifications.step.1':
    'Click the bell at the top right. The red number on it counts the notifications you have not read yet.',
  'help.guide.read-notifications.step.2':
    'The panel lists your newest ten. Each one says who did what and where, and the unread ones have a tinted background.',
  'help.guide.read-notifications.step.3':
    'Click the button under a notification, View Vacay here, to open what it is about. That also marks it as read.',
  'help.guide.read-notifications.tip.1':
    'The bell is on every screen with the navigation bar, and its number updates automatically when something new arrives.',
  'help.guide.read-notifications.tip.2':
    'A notification without a button is for information only. Read it in the panel and mark it as read there.',
  'help.guide.read-notifications.result':
    'You are on the screen the notification was about, and the number on the bell goes down by one.',
  'help.guide.filter-notifications.title': 'See all notifications, or only the unread ones',
  'help.guide.filter-notifications.goal': 'Go through all your notifications, or only the ones you have not read yet.',
  'help.guide.filter-notifications.step.1': 'Click the bell at the top right.',
  'help.guide.filter-notifications.step.2': 'At the bottom of the panel, click Show all notifications.',
  'help.guide.filter-notifications.step.3':
    'Click Unread to see only the notifications you have not read. All shows every one again.',
  'help.guide.filter-notifications.tip.1':
    'The page loads older notifications as you scroll down, so nothing is cut off after the first screen.',
  'help.guide.filter-notifications.result': 'The list shows only what is still unread, newest first.',
  'help.guide.mark-notifications-read.title': 'Mark notifications as read',
  'help.guide.mark-notifications-read.goal':
    'Remove the highlight and the number on the bell once you have seen what is new.',
  'help.guide.mark-notifications-read.step.1':
    "Click Mark as read, the double tick beside a notification's time, to mark only that one.",
  'help.guide.mark-notifications-read.step.2':
    'Click Mark all read at the top to mark every notification as read at once.',
  'help.guide.mark-notifications-read.tip.1': 'Opening a notification through its button marks it as read too.',
  'help.guide.mark-notifications-read.tip.2':
    'Marking as read only changes the background colour and the count. The notification stays in the list until you delete it.',
  'help.guide.mark-notifications-read.result':
    'No notification has a tinted background any more, and the red number on the bell is gone.',
  'help.guide.delete-notifications.title': 'Delete notifications',
  'help.guide.delete-notifications.goal': 'Keep the list short by removing what you no longer need.',
  'help.guide.delete-notifications.step.1':
    "Click Delete, the bin beside a notification's time, to remove only that one.",
  'help.guide.delete-notifications.step.2':
    'Delete all at the top deletes the whole list at once, after a dialog asks you to confirm.',
  'help.guide.delete-notifications.tip.1':
    'Deleting removes the notification for you only. The booking, message or share it was about stays as it is.',
  'help.guide.delete-notifications.tip.2':
    'A deleted notification cannot be restored. To hide a notification but keep it, mark it as read and use Unread.',
  'help.guide.delete-notifications.result': 'The notification is removed from the list and from the bell.',
  'help.guide.notification-settings.title': 'Choose what notifies you',
  'help.guide.notification-settings.goal':
    'Decide which events appear under the bell icon and which are also sent to you by email, webhook, ntfy or push.',
  'help.guide.notification-settings.step.1': 'Click your name at the top right.',
  'help.guide.notification-settings.step.2': 'Click Settings in the menu.',
  'help.guide.notification-settings.step.3':
    'Click Notifications in the Settings sidebar. Its first card has one row per event, and the In-App column decides what the bell shows.',
  'help.guide.notification-settings.tip.1': 'A lock in a cell means the admin turned that event off for everyone.',
  'help.guide.notification-settings.tip.2': 'There are no settings per trip: one switch applies to all your trips.',
  'help.guide.notification-settings.result': 'Settings is open on Notifications, with a switch per event and channel.',

  // ── Screen: trip ────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Trip',
  'help.ctx.trip.summary':
    'Everything about one trip: the plan with its days, map and places, and the tabs for tours, transports, bookings, lists, costs, files, collaboration and a linked journal. Each of these has its own help screen below this one.',
  'help.ctx.trip.bullet.1':
    'The tab bar under the top bar: Plan, Tours, Transports, Bookings, Lists, Costs, Files, Collab and, once a journal is linked, Journal. Addons and plugins decide which tabs exist on your TREK.',
  'help.ctx.trip.bullet.2':
    'Plan has three columns: the days on the left, the map in the middle, the places on the right. With the Road trip addon the days column starts with a Days and Road trip switch, with the Tours addon the places column starts with Places and Tours. Bookings and transports are part of the plan, at the stop and between stops; the tabs list them.',
  'help.ctx.trip.bullet.3':
    'Trip settings, the pill beside the trip’s name at the top left, opens the settings of the trip: People (members and guests), Sharing (the read-only public link and the invite link) and Journal.',
  'help.ctx.trip.bullet.4':
    'The title, dates, cover and currency are edited from My Trips, with the pencil on the trip card. The trip’s name at the top left takes you back there.',
  'help.ctx.trip.bullet.5':
    'The tab at the inner edge of a column collapses the column, and the map uses the free space. A collapsed column shows a small tile in the top corner of the map; click it to show the column again. Drag the thin divider next to a column to change its width.',
  'help.ctx.trip.bullet.6':
    'The undo arrow in the toolbar of the days undoes your recent changes to the plan, one at a time.',
  'help.guide.add-member.title': 'Add a member',
  'help.guide.add-member.goal': 'Give someone with a TREK account access to this trip.',
  'help.guide.add-member.step.1':
    'Click Trip settings, the pill beside the trip’s name at the top left. It opens on People.',
  'help.guide.add-member.step.2': 'Under Invite User, pick the person from Select user… and click Invite.',
  'help.guide.add-member.step.3':
    'The person now appears under Access. The Owner badge marks the owner. Remove access at the end of a row removes the person after you confirm.',
  'help.guide.add-member.result':
    'The member can see and edit the trip like you, within the levels the admin set under Permission Settings.',
  'help.guide.add-member.tip.1':
    'Someone missing from the list has no TREK account yet: add them as a guest, or let them register through an invite link.',
  'help.guide.add-member.tip.2':
    'The number next to Access counts the people in the trip; guests are listed separately below.',
  'help.guide.trip-invite-link.title': 'Invite by link',
  'help.guide.trip-invite-link.goal': 'Let people join the trip themselves.',
  'help.guide.trip-invite-link.step.1':
    'Click Trip settings beside the trip’s name and pick Sharing on the left. Under Trip invite link, click Create invite link.',
  'help.guide.trip-invite-link.step.2':
    'Click Copy and send the link. Anyone with a TREK account who opens it joins as a member.',
  'help.guide.trip-invite-link.step.3':
    'Regenerate replaces the link, and the old link stops working; Disable switches it off.',
  'help.guide.trip-invite-link.result': 'Anyone who opens the link joins the trip and is listed under Access.',
  'help.guide.trip-invite-link.tip.1':
    'Someone without an account cannot use it. An admin creates registration links under Admin, Users, and can link one to this trip.',
  'help.guide.trip-invite-link.tip.2':
    'Regenerate the link if you sent it to the wrong chat: the old link stops working immediately.',
  'help.guide.add-guest.title': 'Add a guest without an account',
  'help.guide.add-guest.goal': 'Add someone to the trip who does not use TREK.',
  'help.guide.add-guest.step.1':
    'Click Trip settings beside the trip’s name. On People, Guests is the last part, under Access.',
  'help.guide.add-guest.step.2': 'Type the name into Guest name and click Add guest.',
  'help.guide.add-guest.result': 'The guest can be assigned to costs, packing items and tasks, but cannot sign in.',
  'help.guide.add-guest.tip.1':
    'Rename (the pencil) changes a guest’s name. Remove access (the bin) removes the guest after you confirm: their assignments are deleted, and their share of each expense is divided among the others in its split.',
  'help.guide.add-guest.tip.2': 'If the person gets an account later, invite them as a member and remove the guest.',
  'help.guide.add-guest.tip.3':
    'Only the trip’s owner can add, rename and remove guests. A guest who paid for an expense cannot be removed until you change the payer or delete the payment.',
  'help.guide.public-link.title': 'Publish a read-only link',
  'help.guide.public-link.goal': 'Show the trip to people who should not edit it.',
  'help.guide.public-link.step.1': 'Click Trip settings beside the trip’s name and pick Sharing on the left.',
  'help.guide.public-link.step.2':
    'In the Public Link card, switch on what the link may show. Map & Plan is always on; Bookings, Packing, Costs and Chat are your choice.',
  'help.guide.public-link.step.3':
    'Under Options, Travel & stays only leaves out activities, day notes and empty days. Without photos leaves out the place photos.',
  'help.guide.public-link.step.4': 'Click Create link, then Copy, and send it.',
  'help.guide.public-link.step.5': 'You can change the choices while the link exists. Delete link turns the link off.',
  'help.guide.public-link.result':
    'Anyone with the link sees the chosen parts without logging in and cannot change anything.',
  'help.guide.public-link.tip.1':
    'The link is not listed anywhere, but anyone who has it can open it. Keep it as private as a password.',
  'help.guide.public-link.tip.2': 'For editing rights, add the person as a member instead.',
  'help.guide.public-link.tip.3': 'Hover over an option to read what it hides.',
  'help.guide.transfer-ownership.title': 'Transfer the trip or leave it',
  'help.guide.transfer-ownership.goal': 'Make someone else the owner, or leave a trip that is not yours.',
  'help.guide.transfer-ownership.step.1':
    'Click Trip settings beside the trip’s name. Under Access, click Make owner (the crown) on a member’s row and confirm.',
  'help.guide.transfer-ownership.step.2':
    'Leave trip on your own row removes you from the trip after you confirm. If you are the owner, transfer ownership first.',
  'help.guide.transfer-ownership.result':
    'The new owner manages members and can delete the trip; you stay a regular member.',
  'help.guide.transfer-ownership.tip.1':
    'The owner is the person who created the trip, until ownership is transferred. Only the owner can delete the trip.',
  'help.guide.transfer-ownership.tip.2':
    'Remove access on the row of another member works the other way: the owner removes that member from the trip.',
  'help.guide.link-journal.title': 'Link a journal to the trip',
  'help.guide.link-journal.goal': 'Show one of your Journey journals inside the trip, for the people you choose.',
  'help.guide.link-journal.step.1': 'Click Trip settings beside the trip’s name and pick Journal on the left.',
  'help.guide.link-journal.step.2': 'Click Link a journal and pick one of your journals from Choose a journal.',
  'help.guide.link-journal.step.3':
    'For each person of the trip, pick No access, Read or Edit. Everyone can read and Nobody set them all at once.',
  'help.guide.link-journal.step.4':
    'Read the yellow note: it names who gets the journal for the first time. Then click Link journal.',
  'help.guide.link-journal.result':
    'A Journal tab appears in the trip’s tab bar. Everyone you gave Read or Edit can open the journal in that tab, with live updates.',
  'help.guide.link-journal.tip.1':
    'You can link only journals you own. You cannot link a journal that you can only write in.',
  'help.guide.link-journal.tip.2':
    'From then on, the people you give access also see the journal in their own Journey list.',
  'help.guide.link-journal.tip.3':
    'Later, Journal in the Trip settings has Edit access, Change journal and Unlink. Unlinking removes the tab; people you added in the journal itself keep their access.',
  'help.guide.collapse-columns.title': 'Make room for the map',
  'help.guide.collapse-columns.goal': 'Collapse a column or make it wider.',
  'help.guide.collapse-columns.step.1':
    'Click the tab at the inner edge of the days column, the one with the panel icon, to collapse the column; the map uses the free space. The places column has the same tab.',
  'help.guide.collapse-columns.step.2':
    'When a column is collapsed, a small tile with the panel icon appears at the top corner of the map; its tooltip says Plan or Places. Click it to show the column again.',
  'help.guide.collapse-columns.step.3':
    'Drag the thin divider between a column and the map to change the column’s width.',
  'help.guide.collapse-columns.result': 'The widths are remembered. The columns are open again on your next visit.',
  'help.guide.collapse-columns.tip.1': 'You can collapse both columns at the same time to see only the map.',
  'help.guide.collapse-columns.tip.2':
    'On a narrow window only one column fits: opening one collapses the other. On a phone there are no columns; Travel, Plan and Places at the top switch between the views.',
  'help.guide.collapse-columns.tip.3': 'When the divider has focus, you can also move it with the arrow keys.',
  'help.guide.undo-change.title': 'Undo the last change',
  'help.guide.undo-change.goal': 'Undo your last change to the plan.',
  'help.guide.undo-change.step.1':
    'Click the undo arrow in the toolbar above the days; its tooltip names the change it will undo.',
  'help.guide.undo-change.result': 'The plan is back the way it was, and a short message names what was undone.',
  'help.guide.undo-change.tip.1':
    'Undo covers the plan: adding, assigning, removing, reordering, moving and locking places, clearing a day, optimizing a route, deleting places, category changes and imports.',
  'help.guide.undo-change.tip.2':
    'Click again to go further back: TREK keeps your last 30 changes on this trip, newest first, until you leave it.',

  // ── Screen: trip-places ─────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Places',
  'help.ctx.trip-places.summary':
    "The right column of the plan: every place of the trip, planned or not, with search, filters and sorting, and the ways to add places: by search, by hand or from a shared list. Places and Tours at its top switch between the places and the trip's tours.",
  'help.ctx.trip-places.bullet.1':
    "Places and Tours at the top of the column switch the list. Places is open when you arrive. Tours lists the trip's tours and imports GPX, KML and KMZ files with Import GPX or KML; a tour does not show in the places list.",
  'help.ctx.trip-places.bullet.2':
    'Add Place/Activity opens the form for a place you search or type. While a day is open the button reads New place, and To day next to it creates the place straight on that day.',
  'help.ctx.trip-places.bullet.3':
    'Import Places, the icon button beside it, offers List Import for a list shared from Google Maps or Naver Maps. Where an administrator has switched the Tours add-on off, it also offers Import file for .gpx, .kml and .kmz files, and a file can be dropped onto the column.',
  'help.ctx.trip-places.bullet.4':
    'Below them the Search, which also searches descriptions and notes, and the Select checkbox beside it. The row under it holds the filters: Show switches between All, Unplanned and Planned, each with its count. The tag button filters by category, the star by a minimum rating, the globe (once the trip covers more than one country or region) by country or region, and Sort by sets the order of the list.',
  'help.ctx.trip-places.bullet.5':
    "A row shows picture, name and description or address, and a star with the average rating once someone rated the place. Click it for the place's details, drag it onto a day, or right-click it (or click More options, its three dots) for Edit, + Day, Open Website, Google Maps, Save to Collection and Delete.",
  'help.ctx.trip-places.bullet.6':
    'With a day open, the round + at the end of a row (+ Day) adds the place to that day. It shows on every place that is not on that day yet. Planned then lists only that day, and the chip Showing the open day only tells you this. Its x, Show the whole trip, closes the day.',
  'help.ctx.trip-places.bullet.7':
    'The tick next to the search starts a selection. Use the bar at the bottom of the column to give several rows a new category at once, add them to a collection, mark them as visited or delete them.',
  'help.ctx.trip-places.bullet.8':
    'With Dawarich connected, From Dawarich at the top of the list shows the stays Dawarich recorded during the trip. Add as a place turns a stay into a place. Not a place I visited removes it from the list.',
  'help.guide.create-place.title': 'Create a place',
  'help.guide.create-place.goal': 'Add a place or activity by hand, with all the details the plan needs.',
  'help.guide.create-place.step.1':
    'Click Add Place/Activity at the top of the places column (New place while a day is open). The form opens with the cursor in the search.',
  'help.guide.create-place.step.2':
    'Type the place into Search places… and pick a result. The name at the top of the dialog, Address, Latitude, Longitude and Website fill in, and Place details on the left shows pictures, opening hours and a description. On a TREK with a Google key, Not the right place? Search Google instead under the results runs the same search through Google. With Collections on, Saved places on the right offers the places of your lists the same way.',
  'help.guide.create-place.step.3':
    'In Place details, click a picture under Pick a picture to make it the place’s image. Use this text copies the description into the form.',
  'help.guide.create-place.step.4':
    'Check the fields of the form. The name at the top of the dialog is the only required field. The Category pill under it picks one of the trip’s categories, and the + beside it creates a new one. Address, Latitude and Longitude come from the search or you type them. Description and Notes are for your own text. Website takes the link, Attach under Files adds a document, and Phone, E-mail and Add opening hours are for details the search did not find.',
  'help.guide.create-place.step.5':
    'Click Add. If a place with the same name or at the same location is already in the trip, TREK shows a warning and the button changes to Add anyway.',
  'help.guide.create-place.result':
    'The place is in the list and on the map, under Unplanned until it is put on a day.',
  'help.guide.create-place.tip.1':
    'Costs at the bottom of the form, with the Budget add-on on, opens the Costs editor for the place’s expense right after saving. An image or PDF pasted into the dialog is attached like a file under Files.',
  'help.guide.create-place.tip.2':
    'The TREK index and OpenStreetMap provide the search results on every TREK, and Place details is filled in automatically from Wikipedia, Wikivoyage and Wikimedia. TREK asks Google only when both find nothing, and only Google provides ratings.',
  'help.guide.create-place.tip.3':
    'You can also create a place on the map: right-click the spot, and the form opens with the coordinates and address filled in.',
  'help.guide.create-place.tip.4':
    'A link copied from Google Maps works in the search too: paste it, press Enter, and TREK reads the place from it. Once the form has a position, Places near this pin, the crosshair beside the search, lists what is around it.',
  'help.guide.place-to-open-day.title': 'Add a place directly to the open day',
  'help.guide.place-to-open-day.goal': 'Create or pick a place and add it to the day in one step.',
  'help.guide.place-to-open-day.step.1':
    'Click a day’s header in the days column. The day is open: its card is highlighted, and the places column shows the To day button next to New place.',
  'help.guide.place-to-open-day.step.2':
    'To day opens the same form as New place, but the place is added to the open day as soon as you click Add.',
  'help.guide.place-to-open-day.step.3':
    'To add an existing place to the open day, click the round + at the end of its row (+ Day), or right-click it and choose + Day. The + shows on every place that is not on that day yet.',
  'help.guide.place-to-open-day.step.4':
    'It also works the other way round, without opening a day first: drag the place’s row out of the column and drop it on a day card. If you drop it between two stops, it is placed exactly there.',
  'help.guide.place-to-open-day.result':
    'The place is listed under the day, at the end; drag it up or down to where it belongs.',
  'help.guide.place-to-open-day.tip.1':
    'The open day also affects the search: when a day is open, the map and the nearby search start from the places already on that day.',
  'help.guide.place-to-open-day.tip.2': 'Undo in the toolbar above the days undoes the assignment.',
  'help.guide.filter-places.title': 'Find a place in the list',
  'help.guide.filter-places.goal': 'Show only the places you are looking for in the column.',
  'help.guide.filter-places.step.1':
    'Show, the dropdown under the search, switches between All, Unplanned (not on any day yet) and Planned (on a day), each with its count. Where the Tours add-on is off and a GPX track was imported, Tracks is also offered.',
  'help.guide.filter-places.step.2':
    'Type into Search at the top. The list narrows as you type, by name, address, description and notes; the x in the field clears it.',
  'help.guide.filter-places.step.3':
    'The tag button next to Show lists the categories: tick one or more, No Category among them. The button shows how many are ticked, and Clear filter at the bottom of the list removes them all.',
  'help.guide.filter-places.step.4':
    'The star beside it sets a minimum rating: 5+, 4+ and so on keep only places whose average rating is at least that high. Places without a rating are hidden.',
  'help.guide.filter-places.step.5':
    'Once the trip covers more than one country or region, the globe filters the list to one country, or to one region in it, each listed with its count. Clear filter resets it to All countries.',
  'help.guide.filter-places.result': 'The number on Show says how many places match, and the filters combine.',
  'help.guide.filter-places.tip.1':
    'When a day is open, Planned lists that day only and says so: Showing the open day only, with Show the whole trip next to it.',
  'help.guide.filter-places.tip.2':
    'The map also applies Show, the categories and the rating, and with a day open, Planned on the map shows that day only. The search and the globe filter only the list.',
  'help.guide.edit-place.title': 'Change a place',
  'help.guide.edit-place.goal': 'Fix a name, move the pin, add a website or change the category.',
  'help.guide.edit-place.step.1':
    'Right-click the row and choose Edit, or click More options at the end of the row, or open the place and click Edit in its details.',
  'help.guide.edit-place.step.2':
    'Change what you need in Edit Place: the name and the Category pill at the top of the dialog, Address, Latitude and Longitude, Description, Notes, Website, Phone, E-mail and the opening hours. When the place is on exactly one day, or you opened it from a day, the form also has Start, End and Notes for this day.',
  'help.guide.edit-place.step.3': 'Click Update.',
  'help.guide.edit-place.result':
    'The change applies everywhere the place appears: the list, the map and every day it is on.',
  'help.guide.edit-place.tip.1':
    'Notes for this day belong to the place on that one day; Notes belong to the place itself.',
  'help.guide.edit-place.tip.2':
    'An End before the Start blocks Update; Time overlap with: only warns that another stop of the day has the same time.',
  'help.guide.edit-place.tip.3':
    'If you click outside the dialog, your changes are not lost: TREK first asks Discard your changes?, and Keep editing takes you back to the form.',
  'help.guide.delete-place.title': 'Delete a place',
  'help.guide.delete-place.goal': 'Remove a place from the trip permanently.',
  'help.guide.delete-place.step.1':
    'Right-click the row and choose Delete (More options at the end of the row has it too), or click Delete in the place’s details.',
  'help.guide.delete-place.step.2':
    'Click Delete in the confirmation question. If a night was booked at the place, or a booking is linked to it, the question says what is deleted with it.',
  'help.guide.delete-place.result':
    'The place is removed from the list, the map and every day. Undo in the toolbar above the days restores it.',
  'help.guide.delete-place.tip.1': 'To remove a place from one day only, use Remove from Day on that stop instead.',
  'help.guide.delete-place.tip.2':
    'To delete several places at once, click the tick next to the search to start a selection.',
  'help.guide.select-places.title': 'Change or delete several places at once',
  'help.guide.select-places.goal': 'Change many places at once instead of one by one.',
  'help.guide.select-places.step.1':
    'Click the tick next to the search field. The rows get round checkboxes, and a bar with the actions appears at the bottom of the column.',
  'help.guide.select-places.step.2':
    'Click the rows to tick them. Select all, the double tick in the bar, selects every row that the filters show.',
  'help.guide.select-places.step.3':
    'The bar counts the ticked places. Change category gives all of them one category; Save to Collection (with Collections on) copies them into one of your collections; Delete selected removes them after a confirmation.',
  'help.guide.select-places.step.4': 'Click Done, the X at the end of the bar, to end the selection.',
  'help.guide.select-places.result':
    'The change applies to every selected place; a deletion can be undone from the toolbar above the days.',
  'help.guide.select-places.tip.1':
    'The filters keep working while you select: filter to Unplanned first, then Select all selects only those places.',
  'help.guide.select-places.tip.2':
    'Mark visited in your lists appears in the bar when the Collections addon is on: it marks the places as visited in the collections they are saved in.',
  'help.guide.import-places-list.title': 'Import a shared Google Maps or Naver Maps list',
  'help.guide.import-places-list.goal': 'Import places from a shared list link.',
  'help.guide.import-places-list.step.1':
    'Click Import Places, the icon button next to the add button, and choose List Import.',
  'help.guide.import-places-list.step.2':
    'Under Provider, pick Google List or Naver List, then paste the list’s shared link into Link. A Google Maps directions link works too: its stops become places, in driving order.',
  'help.guide.import-places-list.step.3': 'Click Import.',
  'help.guide.import-places-list.result':
    'Every place of the list is in the trip, named as in the list; places already in the trip are skipped.',
  'help.guide.import-places-list.tip.1':
    'The list has to be shared publicly; the link of a private list imports nothing.',
  'help.guide.import-places-list.tip.2':
    'Enrich places via Google appears in the dialog when your TREK has a Google key: it looks every imported place up and fills in photos, address and details.',
  'help.guide.import-places-file.title': 'Import places from a GPX, KML or KMZ file',
  'help.guide.import-places-file.goal':
    'If the Tours add-on is off, import the pins and paths that Google My Maps, Google Earth or a GPS tracker exported, as places.',
  'help.guide.import-places-file.step.1':
    'Click Import Places, the icon button next to the add button, and choose Import file, or drop the file anywhere on the places column. Both are there only where an administrator has switched the Tours add-on off.',
  'help.guide.import-places-file.step.2':
    'Pick the file or drag it into the box. For a GPX, tick what to import: Waypoints, Routes, Tracks (with path geometry). For KML and KMZ, tick Points (Placemarks) and Paths (LineStrings).',
  'help.guide.import-places-file.step.3':
    'The box takes several files at once, but only .gpx, .kml and .kmz. Any other kind of file, or one over 10 MB, is refused in the dialog and not imported.',
  'help.guide.import-places-file.step.4':
    'Click Import. A message says how many places were imported. For a KML or KMZ file the dialog stays open with a summary of what was created and what was skipped.',
  'help.guide.import-places-file.result':
    'The places are in the list. A track has a coloured line on its row, is drawn on the map and gets its own Tracks filter.',
  'help.guide.import-places-file.tip.1':
    'A file that is too big is refused, and TREK shows the size limit; export it again without photos, or split it.',
  'help.guide.import-places-file.tip.2': 'You can undo the whole import from the toolbar above the days.',
  'help.guide.import-places-file.tip.3':
    'When Tours is on, which is the default, you import a file through Tours at the top of the column, with Import GPX or KML, and its lines become tours. The pins in the file are not imported there, because tours contain only lines.',
  'help.guide.sort-places.title': 'Sort the places list',
  'help.guide.sort-places.goal': 'Sort the list by name, by rating, or by what was added or changed last.',
  'help.guide.sort-places.step.1':
    'Click Sort by, the arrows button at the end of the filter row. A tick marks the current order, and the button’s tooltip shows its name.',
  'help.guide.sort-places.step.2':
    'Pick an order, Highest rated for example, or sort by name. The list updates at once.',
  'help.guide.sort-places.result': 'The list shows the places in the order you picked, until you choose another one.',
  'help.guide.sort-places.tip.1':
    'Any sort order other than Recently added highlights the button, so you can see at once that the list is sorted differently.',
  'help.guide.sort-places.tip.2':
    'Sorting only changes the list. The days keep their own order, and your browser remembers the order you picked.',
  'help.guide.place-by-hand.title': 'Add a place the search does not know',
  'help.guide.place-by-hand.goal':
    'Enter a place yourself, with its phone, e-mail and opening hours, when the place search finds nothing.',
  'help.guide.place-by-hand.step.1':
    'In the place dialog, type the name into the search and press Enter. When nothing is found, the dialog tells you and offers Add by hand.',
  'help.guide.place-by-hand.step.2':
    'Click Add by hand. The text you searched for becomes the name, and the dialog scrolls to the contact fields.',
  'help.guide.place-by-hand.step.3': 'Fill in Phone and E-mail if you know them.',
  'help.guide.place-by-hand.step.4':
    'Click Add opening hours and set when the place opens and closes on each day. The copy button gives every day the hours of the first one, and a day’s switch marks it Closed.',
  'help.guide.place-by-hand.step.5': 'Click Add.',
  'help.guide.place-by-hand.result':
    'The place is added to the list. Its details show the phone, the e-mail and the opening hours you entered, just like a place the search found.',
  'help.guide.place-by-hand.tip.1':
    'When you edit a place without its own hours, it copies the opening hours from Place details on the left automatically. If it already has hours, a button next to them copies the looked-up hours.',
  'help.guide.place-by-hand.tip.2':
    'Hours you entered replace the looked-up ones, so a café with seasonal hours shows the hours you know.',
  'help.guide.dawarich-stays.title': 'Turn a recorded stay into a place',
  'help.guide.dawarich-stays.goal':
    'Add the places where Dawarich recorded your stays during the trip, after you check each one.',
  'help.guide.dawarich-stays.step.1':
    'With Dawarich connected in Settings, Integrations, From Dawarich is shown above the places list. Its header says when TREK last checked and how many stays are waiting. Click it to open the list.',
  'help.guide.dawarich-stays.step.2':
    'The stays are grouped by day, each with when you arrived and left; a gauge icon marks a stay that Dawarich was unsure about. Click Add as a place, the pin beside a stay.',
  'help.guide.dawarich-stays.step.3':
    'Check the Name, Arrived and Left, choose a Day or leave it at Not on a day yet, add Notes if you like, and click Add place.',
  'help.guide.dawarich-stays.step.4':
    'If a stay was not a real visit, click Not a place I visited, the x beside it, to remove it. Show … already dealt with at the bottom of the list shows the stays you added or removed. Put back returns a removed stay to the list.',
  'help.guide.dawarich-stays.result':
    'The stay is a place of the trip, on the day you chose or under Unplanned, and the panel marks it as done.',
  'help.guide.dawarich-stays.tip.1':
    'Nothing goes into the trip until you click Add place. A place added from a stay shows this in its details: Added from your Dawarich recordings.',
  'help.guide.dawarich-stays.tip.2':
    'If you delete a place that came from a stay, the stay returns to the list as waiting.',

  // ── Screen: trip-days ───────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Days',
  'help.ctx.trip-days.summary':
    'The left column of the plan: one card per day with its stops in order, the notes, the bookings and transports of the day, and the route between the stops. This is where the trip is actually planned.',
  'help.ctx.trip-days.bullet.1':
    'The header at the top: Export (PDF, calendar, GPX) on the left; on the right the undo arrow, Expand all days / Collapse all days, Reorder days, and Show all booking routes once a booking has a route to draw.',
  'help.ctx.trip-days.bullet.2':
    'A day card: a tile with the day number and the forecast, the title (Day 1 until you name it) and the date, and under them pills for the night’s stay (green on check-in, red on check-out, dashed while it is not confirmed; its ticket opens the booking) and for a rental car. Click the header to open the day, the chevron collapses it, and the + (Add to day) opens a menu: Add place to this day, Add accommodation, Add transport, Public transit and Add Note. A right-click on the header offers the same, plus Clear day.',
  'help.ctx.trip-days.bullet.3':
    'Inside a day: the stops in order, each with picture, category icon, name, time and description, the bookings linked to it and who is going; notes; the bookings and transports of the day, coloured by their type. Hover over a stop to see its drag handle, the lock on its picture, the arrows, Add booking and the three dots (More options). You can also right-click stops and notes to open their menu.',
  'help.ctx.trip-days.bullet.4':
    'On the open day, once it has two stops, the route bar appears under them: Route shows the day on the map and shows the travel time of each leg between the stops, the three icons set Driving, Walking or Cycling for the day, then Optimize, Open in Google Maps and Open in CoMaps.',
  'help.ctx.trip-days.bullet.5':
    'You can add places to a day in several ways: drag a row from the places column, use + Day on that row, use Add place to this day from the day’s + or on an empty day, or use the place’s details.',
  'help.ctx.trip-days.bullet.6':
    'Total Cost at the bottom adds up the expenses from Costs that belong to the day’s stops and bookings, each one once, in your display currency.',
  'help.ctx.trip-days.bullet.7': 'While the trip is running, the plan opens on today’s day and scrolls to it.',
  'help.guide.read-day-plan.title': 'Read a day',
  'help.guide.read-day-plan.goal': 'Know what every part of a day card tells you before you change anything.',
  'help.guide.read-day-plan.step.1':
    'The header: a tile with the day number and the forecast, then Day 1 or the title you gave it and the date. Under them, pills for the night’s stay (green on check-in, red on check-out, dashed while not confirmed; the ticket on it opens the booking) and a rental car. Click the header to open the day (its details panel opens over the map). The + on the right (Add to day) adds a place, a stay, a transport, a transit connection or a note, and the chevron collapses the card.',
  'help.guide.read-day-plan.step.2':
    'A stop shows its picture, category icon and name, then its time once it has a Start, and its description. Notes for this day show under it. When you hover the row, its controls appear: the grip on the left drags it, the picture turns into a lock for route optimization, and at the right end are the arrows (Move up, Move down), Add booking and the three dots (More options).',
  'help.guide.read-day-plan.step.3':
    'A booking at a stop is shown on it as a Reservation badge, green when it is confirmed and amber while it is pending, with its time and its carrier. Click the badge to open the booking; the route button beside it draws its route. A transport has its own row, coloured by its type, with its time and Departure or Arrival. Click a booking to open its details; Edit there changes it.',
  'help.guide.read-day-plan.step.4':
    'With Route on, the connector between two stops says how long the leg takes and how far it is, in the day’s travel mode; click it to change the mode for that one leg.',
  'help.guide.read-day-plan.step.5':
    'The route bar under the stops of the open day: Route draws the day’s way on the map, the three icons pick Driving, Walking or Cycling, then Optimize reorders the stops, and Open in Google Maps and Open in CoMaps open the day there.',
  'help.guide.read-day-plan.result':
    'Every symbol on the card has a meaning; the guides below explain how to change each of them.',
  'help.guide.read-day-plan.tip.1':
    'Right-click a stop, or click its three dots, for its menu: Edit, Remove from day, Leave out of route, Open Website, Save to Collection, Delete. The navigation apps are in the place’s details, under Navigation.',
  'help.guide.read-day-plan.tip.2':
    'Hover over a stop and Add booking appears at the end of the row. A reservation created there is linked to this stop on this day.',
  'help.guide.place-onto-day.title': 'Put a place on a day',
  'help.guide.place-onto-day.goal': 'Make a place from the list a stop of a day, at the right position in the order.',
  'help.guide.place-onto-day.step.1':
    'Drag a row from the places column onto the day card. Drop it between two stops to put it exactly there, or on the day’s header to add it at the end.',
  'help.guide.place-onto-day.step.2':
    'Without dragging: open the day by clicking its head, then click the round + at the end of the place’s row (+ Day), or right-click the row and choose + Day.',
  'help.guide.place-onto-day.step.3':
    'Add place to this day, in the day’s + menu or on an empty day, opens the place form, and the new place is added to the day immediately.',
  'help.guide.place-onto-day.step.4':
    'With a day open, Add to Day in a place’s details puts it on that day; To day in the header of the places column creates a new place right on the open day.',
  'help.guide.place-onto-day.result':
    'The place is now a stop of the day. It appears on the map with the day’s number, and the places column counts it under Planned.',
  'help.guide.place-onto-day.tip.1':
    'A place can be on several days: put it on the second day from the places column. Dragging a stop from one day card to another moves it instead.',
  'help.guide.place-onto-day.tip.2': 'The undo arrow in the header undoes the assignment.',
  'help.guide.place-onto-day.tip.3':
    'You cannot drop a stop between two entries that have fixed times, or before a booking that already has a time; the plan stays in time order.',
  'help.guide.reorder-stops.title': 'Change the order of a day',
  'help.guide.reorder-stops.goal': 'Move a stop up or down, or to another day.',
  'help.guide.reorder-stops.step.1': 'Hover over the stop and drag it by its handle to the new position in the card.',
  'help.guide.reorder-stops.step.2':
    'Or use the arrows at the right end of the hovered stop (Move up, Move down): one step per click.',
  'help.guide.reorder-stops.step.3':
    'Drag the stop onto another day card to move it there; it is removed from the old day.',
  'help.guide.reorder-stops.step.4':
    "If a stop has a fixed time and a move would break the day’s order, TREK asks Remove time?, because the time sets the stop's position. Confirm removes the time so the stop can go anywhere. Cancel leaves the day as it was.",
  'help.guide.reorder-stops.result': 'The route and the travel times update to the new order immediately.',
  'help.guide.reorder-stops.tip.1':
    'A booking with a fixed time stays at the position of its time. If you drop it somewhere else in its day, it moves back. If you drag it onto another day card, it moves to that day.',
  'help.guide.reorder-stops.tip.2':
    'Optimize in the route bar orders the whole day by the shortest way when the day has three stops or more. Lock a stop first to keep it where it is.',
  'help.guide.set-stop-times.title': 'Give a stop a time',
  'help.guide.set-stop-times.goal': 'Set when a stop starts and ends, so the day works as a schedule.',
  'help.guide.set-stop-times.step.1':
    'Right-click the stop, or click its three dots, and choose Edit. When you open the form from the day, it has Start and End for that day, right under the location.',
  'help.guide.set-stop-times.step.2':
    'Enter Start and, if you like, End. Time overlap with: warns that another timed stop of the day overlaps. An End before the Start blocks Update.',
  'help.guide.set-stop-times.step.3':
    'Click Update. The stop gets a time badge and moves to the right position in the day for its time.',
  'help.guide.set-stop-times.result':
    'Timed stops keep their position in the order; untimed stops are sorted around them.',
  'help.guide.set-stop-times.tip.1':
    'The time belongs to the stop on that day; the same place on another day can have another time.',
  'help.guide.set-stop-times.tip.2':
    'To move a timed stop by hand, drag it. TREK asks Remove time?, and when you click Confirm, the time is removed.',
  'help.guide.set-stop-times.tip.3':
    'Notes for this day in the same form are for information that only applies on this day, for example a table reservation or a ticket number.',
  'help.guide.remove-from-day.title': 'Remove a stop from a day',
  'help.guide.remove-from-day.goal': 'Remove a place from a day without deleting it from the trip.',
  'help.guide.remove-from-day.step.1': 'Right-click the stop, or click its three dots, and choose Remove from day.',
  'help.guide.remove-from-day.step.2':
    'The stop is removed from the day. The place stays in the places column, under Unplanned if it is on no other day.',
  'help.guide.remove-from-day.result': 'The day, its route and its cost update. The undo arrow restores the stop.',
  'help.guide.remove-from-day.tip.1':
    'Delete in the same menu removes the place from the whole trip, every day included.',
  'help.guide.remove-from-day.tip.2': 'Remove from Day is also in the place’s details panel, next to Add to Day.',
  'help.guide.leave-stop-off-route.title': 'Leave a stop out of the route',
  'help.guide.leave-stop-off-route.goal':
    'Keep a stop on the day without the route going there, for a place you pass on foot or only want on the map.',
  'help.guide.leave-stop-off-route.step.1':
    'Right-click the stop, or click its three dots, and choose Leave out of route.',
  'help.guide.leave-stop-off-route.step.2':
    'An Off route badge appears beside the name. The stop stays on the day and on the map, but the day’s route and its leg times skip it.',
  'help.guide.leave-stop-off-route.step.3': 'To route it again, open the same menu and choose Add back to route.',
  'help.guide.leave-stop-off-route.result':
    'The stop is still part of the day and the PDF; while it is marked Off route, the route runs straight from the stop before it to the one after.',
  'help.guide.leave-stop-off-route.tip.1':
    'Only a stop with coordinates has this option, and the setting is for this day only: the same place on another day is still routed.',
  'help.guide.leave-stop-off-route.tip.2':
    'Remove from day takes the stop off the day instead; Leave out of route keeps it in the plan.',
  'help.guide.lock-stop.title': 'Lock a stop in place',
  'help.guide.lock-stop.goal': 'Keep a stop in its position when the route is optimized.',
  'help.guide.lock-stop.step.1':
    'Hover over the stop’s picture and click the lock: Keep position during route optimization.',
  'help.guide.lock-stop.step.2':
    'Optimize now sorts the other stops around it. Click the lock again (Click to unlock) to unlock it.',
  'help.guide.lock-stop.result': 'The lock shows on the picture; the stop keeps its position until you unlock it.',
  'help.guide.lock-stop.tip.1': 'A stop with a fixed time is locked by its time; it never moves during optimization.',
  'help.guide.lock-stop.tip.2':
    'The lock lasts only until you reload the page. After a reload, every stop is unlocked again; only timed stops stay fixed.',
  'help.guide.day-note.title': 'Add a note to a day',
  'help.guide.day-note.goal': 'Save a reminder, a ticket number or a backup plan in the day.',
  'help.guide.day-note.step.1': 'Click the + in the day’s header (Add to day) and choose Add Note.',
  'help.guide.day-note.step.2':
    'Type the note’s name at the top of the dialog, where it says Note. The day card shows this name. Write the rest under Daily Note: the toolbar above it formats the text (bold, lists, links, quotes), and Preview on the left shows how the row will look.',
  'help.guide.day-note.step.3':
    'Pick an Icon and a Colour, so the note is easy to tell apart from the stops, then click Add.',
  'help.guide.day-note.step.4':
    'The note appears in the day like a stop: drag it into place or use its arrows. Click it to edit it. Delete is in the dialog and in its three dots or right-click menu, and asks Delete note? first.',
  'help.guide.day-note.result': 'The note is part of the day and of the PDF, in the place you dragged it to.',
  'help.guide.day-note.tip.1': 'Links in a note open in a new tab, and a single line break stays a line break.',
  'help.guide.day-note.tip.2': 'Notes are per day. Put a note for the whole trip in Collab.',
  'help.guide.day-route.title': 'Show and optimize the day’s route',
  'help.guide.day-route.goal': 'See the route between the stops, pick how you travel, and let TREK sort the order.',
  'help.guide.day-route.step.1':
    'Open the day and click Route in the route bar under its stops: the route between the stops is drawn on the map, and the connectors between the stops show the time and distance of each leg.',
  'help.guide.day-route.step.2':
    'The three icons beside it set the travel mode of the day: Driving, Walking or Cycling. The legs recalculate. Plugins can add modes of their own.',
  'help.guide.day-route.step.3':
    'Click a connector to change the mode of that one leg: pick a mode, Public transit to search a connection for it where it is offered, or Use day default to use the day’s mode again.',
  'help.guide.day-route.step.4':
    'Optimize (the circular arrow) reorders the stops by the shortest way, from three stops on. Stops with a lock or a fixed time keep their place; with an accommodation on the day, the route starts there.',
  'help.guide.day-route.step.5':
    'Open in Google Maps or Open in CoMaps opens the whole day as a route in that app, for navigating on the way; CoMaps also uses the day’s travel mode.',
  'help.guide.day-route.result': 'The day is a route with times; Total Cost and the legs update as the order changes.',
  'help.guide.day-route.tip.1':
    'Routes come from OSRM by default; the admin can set TREK to use another routing engine under User Defaults.',
  'help.guide.day-route.tip.2': 'A leg that could not be routed shows no time. Check that both stops have coordinates.',
  'help.guide.day-route.tip.3': 'The undo arrow reverses an optimization.',
  'help.guide.day-route.tip.4':
    'For a stop you want on the day but not on the route, choose Leave out of route in its menu.',
  'help.guide.manage-days.title': 'Add, reorder and rename days',
  'help.guide.manage-days.goal': 'Change the days themselves, not only the places on them.',
  'help.guide.manage-days.step.1':
    'The days come from the trip’s dates. Change the dates in the trip’s edit form on the Dashboard, and days are added or removed at the start or end. Before a day with content is removed, a list shows which days are removed and what is on them.',
  'help.guide.manage-days.step.2':
    'Reorder days in the header opens a list: drag a day by its grip, or use Move up and Move down, and it moves with its places, notes and bookings. Below the list, Add with the next date adds a day after the last dated one and extends the trip by one; Without date appends a day without a date. A trip without dates has just Add day.',
  'help.guide.manage-days.step.3':
    'Delete day, the bin at the end of a row, asks first. It lists what is deleted with the day: its places, notes and bookings, a stay that checks in or out on it, and the days that move one date earlier. Delete day removes it, Cancel keeps it; the last day cannot be deleted.',
  'help.guide.manage-days.step.4':
    'To rename a day, open it and click the pencil next to its title in the details panel over the map. The name replaces Day 1 in the card and in the PDF.',
  'help.guide.manage-days.step.5':
    'Expand all days and Collapse all days in the header expand or collapse every card at once. To collapse a single card, click its chevron.',
  'help.guide.manage-days.result':
    'The dates stay with the position: when you move a day up, it gets the earlier date, and its stops, notes and bookings move with it.',
  'help.guide.manage-days.tip.1': 'Moving days can be undone with the undo arrow; deleting a day cannot.',
  'help.guide.manage-days.tip.2':
    'Total Cost at the bottom of the plan adds up the whole trip; the Costs tab breaks it down.',
  'help.guide.bookings-in-plan.title': 'Read bookings and transports in the plan',
  'help.guide.bookings-in-plan.goal': 'See where a booking appears once it exists, and which screen creates it.',
  'help.guide.bookings-in-plan.step.1':
    'A transport (flight, train, ferry, bus, car) is a row tinted by its type, with its time and Departure on the day it leaves or Arrival on the day it lands; the globe beside it names the time zone, and a flight with a stopover gets one row per leg. For a public transit connection, click the chevron to show its lines. Click a row and the booking opens; Edit there changes it.',
  'help.guide.bookings-in-plan.step.2':
    'A reservation linked to a stop (a restaurant, a tour) shows as a Reservation badge on that stop, with its time. The badge is green when confirmed and amber while pending. A booking with a day but no stop has its own row in the day.',
  'help.guide.bookings-in-plan.step.3':
    'A night at a hotel is an accommodation: its pill in the day header is green on check-in and red on check-out, and its ticket icon opens the booking. The day’s details panel lists it under Accommodation, and the route of each of those days starts there.',
  'help.guide.bookings-in-plan.step.4':
    'On the map, the route button on a booking row draws its route; Show all booking routes in the header draws them all.',
  'help.guide.bookings-in-plan.step.5':
    'Creating: Add booking on a hovered stop, Add transport and Public transit in the day’s + menu, and the Bookings and Transports tabs for the full list with import and files.',
  'help.guide.bookings-in-plan.result':
    'Each booking appears once in the plan. The tabs show the same bookings as a list.',
  'help.guide.bookings-in-plan.tip.1':
    'Confirmed and pending is a status you set on the booking; the plan shows it on the stop, the Bookings tab counts both.',
  'help.guide.bookings-in-plan.tip.2':
    'If you drop a booking with a time somewhere else in its day, it moves back to the position of its time. If you drag it onto another day card, it moves to that day. To change its time, edit the booking.',
  'help.guide.move-booking-day.title': 'Move a booking to another day',
  'help.guide.move-booking-day.goal':
    'Move a transport or a booking to another day directly from the plan, without opening its form.',
  'help.guide.move-booking-day.step.1':
    'Hover the booking’s row in the day: the grip on its left shows it can be dragged.',
  'help.guide.move-booking-day.step.2':
    'Drag the row onto the header of another day card. A one-day booking moves to that day completely. For a booking that spans several days, the Departure row moves the day it starts and the Arrival row moves the day it ends.',
  'help.guide.move-booking-day.step.3':
    'The row now appears on the new day, at its own time. Open the booking if you also need to change the time.',
  'help.guide.move-booking-day.result': 'The booking belongs to the new day in the plan, with its time unchanged.',
  'help.guide.move-booking-day.tip.1':
    'The faded rows on the days in between a multi-day booking cannot be dragged, and neither can a single leg of a flight with stopovers.',
  'help.guide.move-booking-day.tip.2':
    'Inside its own day, a booking with a time always moves back to the position of its time.',
  'help.guide.export-plan.title': 'Export the plan',
  'help.guide.export-plan.goal': 'Export the plan as a document, to your calendar or to a GPS device.',
  'help.guide.export-plan.step.1': 'Click Export at the left of the header bar above the days.',
  'help.guide.export-plan.step.2':
    'Document: PDF opens the print view of every day with its stops, notes and bookings, starting with a route overview map; My plan as PDF keeps only what you take part in. In the view, Page break per day starts each day on a new page, Transport notes adds the notes of your transports, and Save as PDF downloads it.',
  'help.guide.export-plan.step.3':
    'Calendar: Download .ics saves the bookings as a calendar file; Subscribe to calendar gives a link that your calendar app refreshes automatically.',
  'help.guide.export-plan.step.4':
    'Maps & GPS (GPX): Whole trip exports places, day routes and tracks; Places only the pins; Days as routes one route per day, for offline maps and GPS devices.',
  'help.guide.export-plan.result': 'The file downloads; nothing in the trip changes.',
  'help.guide.export-plan.tip.1':
    'To open a single day in a map app, use its route bar: Open in Google Maps or Open in CoMaps.',
  'help.guide.export-plan.tip.2':
    'Subscribe to calendar needs calendar feeds switched on in your settings and the right to share the trip; Dashboard has a guide for it.',
  'help.guide.export-plan.tip.3':
    'Exporting only needs read access: every member of the trip can export the PDF, the .ics and the GPX.',
  'help.guide.clear-day.title': 'Clear a day',
  'help.guide.clear-day.goal':
    'Remove all places from a day at once, for example to plan the day again from the start.',
  'help.guide.clear-day.step.1': 'Right-click the header of the day in the plan.',
  'help.guide.clear-day.step.2': 'Pick Clear day and confirm.',
  'help.guide.clear-day.result':
    'The day is empty and its places are back in the list as unplanned. The undo arrow above the days puts them back.',
  'help.guide.clear-day.tip.1': 'Only the places are removed. The day keeps its notes and its bookings.',
  'help.guide.clear-day.tip.2': 'This menu entry only appears on a day with places on it.',

  // ── Screen: trip-place ──────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Place details',
  'help.ctx.trip-place.summary':
    'The card that opens over the map when you pick a place: everything the trip knows about it, the star ratings everyone gave it, its picture and its files, and the buttons that add it to the open day, open it in a map app or save it to a list.',
  'help.ctx.trip-place.bullet.1':
    'Click a row in the places column, a stop inside a day, or a marker on the map, and the card opens over the map. If you open it from a day, the card knows which stop you mean, and it also shows the stop’s participants and its booking. A tour (a hike, a ride or a walk from the Tours tab) opens its own tour card instead of this one.',
  'help.ctx.trip-place.bullet.2':
    'The header shows the round picture, the name, the address on one line and labels for what is known: open or closed, the category, the time, the price, the phone number, the e-mail and the coordinates. Click the picture to use one of your own or a photo from the place’s files. Double-click the name to rename the place. The X on the right closes the card. The picture, renaming, Edit and Delete are only available to travellers who may change places.',
  'help.ctx.trip-place.bullet.3':
    'Below it: the stars every traveller gave the place, the description and the notes, and Notes for this day when the stop has one.',
  'help.ctx.trip-place.bullet.4':
    'Opening Hours, Track color, Track Stats and Files come next, where they apply. Upload in the Files heading adds files from your computer, and the list also shows the files pinned to this stop and those of its booking, including a hotel’s confirmation. Plugins can add their own rows below.',
  'help.ctx.trip-place.bullet.5':
    'The row at the bottom: Add to Day or Remove from Day while a day is open, then Navigation (or the name of your map app, once you picked one in Settings), Open Website and Save to Collection. On the right, the red bin deletes the place and Edit opens its form.',
  'help.ctx.trip-place.bullet.6':
    "A place you picked from the search shows what the TREK index or OpenStreetMap know about it: Open or Closed among the pills at the top, with a green or red ring around the picture, based on the local time of the place; its phone number, also as a pill; Opening Hours further down, with today's hours in the row and the whole week after a click; and its website under Open Website. Google’s rating shows only on a place found through Google, on a TREK with a Google key. Opening hours, a phone number and an e-mail that you typed into the place’s form yourself replace the looked-up ones, and also decide the colour of the ring.",
  'help.guide.read-place.title': 'What the card tells you about a place',
  'help.guide.read-place.goal': 'Read everything the trip knows about one place, in one card.',
  'help.guide.read-place.step.1':
    'In the days column, click the stop you want to read. The card opens over the map and the stop stays marked in its day.',
  'help.guide.read-place.step.2':
    'At the top: the round picture, the name and the address on one line; its tooltip shows the full address. The pills under them say Open or Closed right now, by the place’s local time, with a green or red ring around the picture to match. They also show the category, the time, the phone number and the e-mail (click them to open your phone or mail app) and, on a wide screen, the exact coordinates. The X on the right closes the card.',
  'help.guide.read-place.step.3':
    'Rating is the first section below the header: the stars every traveller gave the place, with the average and how many voted. It shows Not rated yet while nobody has voted.',
  'help.guide.read-place.step.4':
    'Then the description and, below it, the notes. Both are the text from the place’s form, with formatting: lists, links and bold all work.',
  'help.guide.read-place.step.5':
    'Participants shows who is going to this stop. Everyone is included until you remove someone.',
  'help.guide.read-place.step.6':
    'Opening Hours, further down: the row shows the hours of the day you are viewing. Click it to see the whole week, with that day in bold. Files is next to it.',
  'help.guide.read-place.step.7':
    'The row at the bottom is what you can do from here: put the place on the open day or take it off, open it in a map app or on its website, save it to a list, and on the right delete it (the red bin) or edit it.',
  'help.guide.read-place.result':
    'The card stays open until you close it with the X or pick another place. The opening hours for the week stay expanded, and the stop it belongs to stays marked in the days column.',
  'help.guide.read-place.tip.1':
    'When you pick the place in the places column, the card shows the place but not a stop. So it shows no participants and only the bookings that belong to the place itself, such as a hotel’s stay. Pick the stop inside the day to see everything.',
  'help.guide.read-place.tip.2':
    'If you may change places, double-click the name to rename the place without opening the form. Enter saves, Escape cancels the change.',
  'help.guide.read-place.tip.3':
    'A place typed in by hand has only the details entered in its form. Click Edit and fill in Phone, E-mail and the opening hours yourself, or pick the place from the suggestions under Search places… and click Update to have them looked up. Google’s rating needs a Google key.',
  'help.guide.rate-place.title': 'Rate a place',
  'help.guide.rate-place.goal': 'Give a place your own stars, and see the ratings everybody else gave it.',
  'help.guide.rate-place.step.1':
    'Open the place. The row of stars is directly under the header and shows the average of the votes so far, with the number of votes in brackets.',
  'help.guide.rate-place.step.2':
    'Click the star you want. The stars fill as you move the pointer over them, so you see which rating you will give.',
  'help.guide.rate-place.step.3':
    'Your vote is added to the average at once, and the faces next to it show who voted. Hover over the row to see everyone’s stars.',
  'help.guide.rate-place.step.4':
    'The same average is shown on the place’s row in the places column, so you can easily find the best places in the list.',
  'help.guide.rate-place.result':
    'Everyone in the trip can see your stars on the place. The star in the filter row above the list can now show only the places with at least a minimum rating.',
  'help.guide.rate-place.tip.1': 'Every traveller may rate, even on a trip where only some of you may change places.',
  'help.guide.rate-place.tip.2':
    'Click the star you already gave to remove your rating. When nobody has rated the place, it shows Not rated yet again.',
  'help.guide.rate-place.tip.3':
    'Up to six voters are shown as faces next to the stars. The tooltip lists all of them and marks you.',
  'help.guide.place-image.title': 'Put your own picture on a place',
  'help.guide.place-image.goal': 'Replace the automatic thumbnail with a photo of your own.',
  'help.guide.place-image.step.1': 'Open the place from the places column.',
  'help.guide.place-image.step.2':
    'Point at the round picture in the header: a camera appears and the tooltip reads Upload image. Click it and pick your file. If the place already has photos among its files, TREK first asks you to choose: Upload from device, or one of the pictures under From attached files.',
  'help.guide.place-image.step.3': 'The top of the card now shows your picture, with a small red X at its corner.',
  'help.guide.place-image.step.4':
    'The same picture also appears on the place’s row in the places column, and on its marker on the map.',
  'help.guide.place-image.result':
    'Your picture is used for the place everywhere: the card, the places column, the stop in the day, the marker on the map and a shared trip.',
  'help.guide.place-image.tip.1':
    'JPG, PNG, GIF and WebP are accepted, and a HEIC from an iPhone is converted when you upload it.',
  'help.guide.place-image.tip.2':
    'The X at the corner removes your picture, and the automatic picture is shown again. The place itself does not change.',
  'help.guide.place-image.tip.3':
    'If you have not added a picture, TREK searches for one using the place’s coordinates. If it finds none, it shows the category’s icon. Only travellers who may change places can set one.',
  'help.guide.place-image-from-file.title': 'Use an attached photo as the place’s picture',
  'help.guide.place-image-from-file.goal':
    'Use a photo that is already in the place’s files as its picture, without uploading it again.',
  'help.guide.place-image-from-file.step.1':
    'Open a place that has a photo among its Files. The Files block near the bottom of the card shows how many files the place has.',
  'help.guide.place-image-from-file.step.2':
    'Click the round picture in the header. Since the place has photos, a small window asks where the picture should come from.',
  'help.guide.place-image-from-file.step.3':
    'Under From attached files, click the photo you want. Upload from device above it picks a new one from your computer instead.',
  'help.guide.place-image-from-file.step.4':
    'The photo is now the place’s picture. Click the small red X at its corner to remove it again.',
  'help.guide.place-image-from-file.result':
    'The photo is the place’s picture on the card, in the places column, in the day and on the map.',
  'help.guide.place-image-from-file.tip.1': 'Only JPG, PNG, GIF and WebP files are offered; a PDF ticket is not.',
  'help.guide.place-image-from-file.tip.2': 'A photo pinned to the stop or attached to its booking is offered too.',
  'help.guide.place-image-from-file.tip.3': 'Only travellers who may change places can change the picture.',
  'help.guide.place-own-hours.title': 'Correct a place’s opening hours, phone or e-mail',
  'help.guide.place-own-hours.goal':
    'Put the hours you actually checked on the card, when the looked-up ones are wrong or missing.',
  'help.guide.place-own-hours.step.1':
    'Open the place and click Edit at the bottom right of the card. The place’s form opens.',
  'help.guide.place-own-hours.step.2': 'Below Website, fill in Phone and E-mail if you know them.',
  'help.guide.place-own-hours.step.3':
    'Opening Hours below them shows the week, one row per day. Where TREK found hours for the place they are already filled in; otherwise click Add opening hours first. Type when each day opens and closes, and click Closed on a day it does not open.',
  'help.guide.place-own-hours.step.4':
    'The buttons at the right of Opening Hours: the copy button gives every day Monday’s hours, and the X removes your hours again. Where TREK found hours of its own, Take over from the place details puts those back.',
  'help.guide.place-own-hours.step.5':
    'Click Update. The card now shows your hours under Opening Hours, and Open or Closed at the top is based on them.',
  'help.guide.place-own-hours.result':
    'The card shows your phone number, your e-mail and your opening hours, and the ring around the picture is green or red based on your hours.',
  'help.guide.place-own-hours.tip.1':
    'Hours you enter replace the ones TREK looked up, so a café with seasonal times shows what you know.',
  'help.guide.place-own-hours.tip.2':
    'The phone number and the e-mail appear as pills in the card’s header. Click one to open it in your phone or mail app.',
  'help.guide.place-own-hours.tip.3':
    'Click Remove opening hours, then Update, to show the automatically found hours on the card again.',
  'help.guide.place-day-assign.title': 'Add the place to the open day, or remove it',
  'help.guide.place-day-assign.goal': 'Use the button on the card instead of dragging the row across the planner.',
  'help.guide.place-day-assign.step.1':
    'Click a day’s header in the days column. That day is now the open day, and the card applies to it.',
  'help.guide.place-day-assign.step.2':
    'Click a place that is not on that day in the places column. Its card opens and the row at the bottom offers Add to Day.',
  'help.guide.place-day-assign.step.3':
    'Click Add to Day. The stop is added at the end of the day and the button changes to Remove from Day.',
  'help.guide.place-day-assign.step.4':
    'The stop is now in the day, at the end of the list. Drag it up to the right position.',
  'help.guide.place-day-assign.step.5':
    'Remove from Day removes the stop from the day again, and the card shows Add to Day again.',
  'help.guide.place-day-assign.result':
    'The stop is added to the day or removed from it. The place itself does not change.',
  'help.guide.place-day-assign.tip.1':
    'The button only exists while a day is open. Without an open day, there is no day to add the place to.',
  'help.guide.place-day-assign.tip.2':
    'If you remove a stop from a day, the place stays in the trip and in the places column. Delete removes it everywhere.',
  'help.guide.place-day-assign.tip.3':
    'A stop that a lodging booking added to the day shows neither button. You add and remove that night in the day’s overnight block.',
  'help.guide.place-participants.title': 'Say who is going to this stop',
  'help.guide.place-participants.goal': 'Choose who goes to one stop without changing who is on the trip.',
  'help.guide.place-participants.step.1':
    'Click the stop inside the day. The card opens and Participants lists everybody in the trip.',
  'help.guide.place-participants.step.2':
    'Click a traveller’s chip to remove them from this stop. When you hover over the chip, the name is crossed out.',
  'help.guide.place-participants.step.3':
    'A dashed + appears as soon as somebody is missing. Click it to see who is not on the stop.',
  'help.guide.place-participants.step.4':
    'Click a name to add that person again. When everybody is added again, the stop belongs to the whole group again.',
  'help.guide.place-participants.result':
    'The stop shows only the travellers you chose. The rest of the group is free at that time.',
  'help.guide.place-participants.tip.1':
    'Participants only appears when a stop is selected, so pick the place inside the day, not in the places column. It also appears only on a trip with more than one traveller.',
  'help.guide.place-participants.tip.2':
    'If nobody is chosen, everybody is going. That is why you cannot remove the last traveller from a stop.',
  'help.guide.place-participants.tip.3':
    'A guest, who has no account of their own, can be a participant like anybody else.',
  'help.guide.place-booking.title': 'The booking on a stop',
  'help.guide.place-booking.goal': 'See the booking that belongs to a stop, open it, and link a new one to it.',
  'help.guide.place-booking.step.1':
    'Open the stop the booking belongs to. The card lists it under Bookings as a small card of its own, with the booking’s name and Confirmed or Pending.',
  'help.guide.place-booking.step.2':
    'The booking card shows the Date, the Time and the Booking Code, labels for other details of the booking (a flight number, a platform, check-in), and any notes the booking has.',
  'help.guide.place-booking.step.3': 'Click the booking card. The booking opens over the map.',
  'help.guide.place-booking.step.4':
    'Edit at the bottom of the booking opens its own form. In that form, Link to day assignment links a booking to a stop, and it already shows this stop. Close the form again.',
  'help.guide.place-booking.step.5':
    'A new booking for a stop starts in the days column: hover over the stop and click Add booking, the ticket icon at its end. The form opens as New Reservation, already linked to the stop.',
  'help.guide.place-booking.result':
    'The booking is linked to the stop: it is shown on the card and in the day, and its files are also listed under Files here.',
  'help.guide.place-booking.tip.1':
    'A booking shows on the stop it is pinned to, and a hotel booking also shows on the hotel wherever you open it. A booking with no stop is shown on the Bookings tab.',
  'help.guide.place-booking.tip.2':
    'Several bookings can share one stop, for example lunch and a tour that start at the same place.',
  'help.guide.place-booking.tip.3':
    'For a train, a flight or a ferry, Edit opens the transport form instead, the one the Transports tab uses.',
  'help.guide.place-files.title': 'Keep a place’s tickets with the place',
  'help.guide.place-files.goal': 'Attach the ticket, the voucher or the map to the place it belongs to.',
  'help.guide.place-files.step.1':
    'Open the place. Files is under its details, beside Opening Hours when the place has them, and shows Files while the place has none.',
  'help.guide.place-files.step.2': 'Click Upload at the right of the Files heading and pick the file.',
  'help.guide.place-files.step.3': 'The button shows how many files the place has, and the list opens automatically.',
  'help.guide.place-files.step.4': 'Each row shows the file’s name and size. Click it to open the file.',
  'help.guide.place-files.result':
    'The file is attached to the place and counted on the card. It also appears on the trip’s Files tab.',
  'help.guide.place-files.tip.1':
    'Files also lists what is pinned to this stop and what is attached to its booking, so a hotel confirmation shows up on the hotel.',
  'help.guide.place-files.tip.2':
    'Upload accepts several files at once, and a photo among them can become the place’s picture.',
  'help.guide.place-files.tip.3':
    'If you do not have the right to upload files, the Upload button is not shown; files already on the place are still shown.',
  'help.guide.place-navigation.title': 'Open a place in a map app or on its website',
  'help.guide.place-navigation.goal': 'Open the place in the navigation app you use to get there.',
  'help.guide.place-navigation.step.1': 'Open the place and click Navigation in the row at the bottom.',
  'help.guide.place-navigation.step.2':
    'The list is the map apps that fit this place: Google Maps, Waze, Apple Maps, OpenStreetMap and CoMaps, plus Other map app on Android.',
  'help.guide.place-navigation.step.3':
    'Click the one you use. Where possible, TREK sends the place itself to the app, not only its coordinates, so you arrive at the right entrance.',
  'help.guide.place-navigation.step.4':
    'Open Website next to it opens the place’s own website, with its opening times and tickets, in a new tab.',
  'help.guide.place-navigation.result':
    'The map app opens on the place, the website opens in a new tab, and nothing in the trip changes. If TREK is installed as an app, the map app opens instead of a new tab.',
  'help.guide.place-navigation.tip.1':
    'Waze starts navigating straight away. The other apps open the place, and you tap once more to start navigation.',
  'help.guide.place-navigation.tip.2':
    'Which apps are offered depends on the place and on your device: Apple Maps is not offered on Android, 高德地图 is only offered for a place in China, and Waze, Apple Maps and CoMaps need the place’s coordinates. Other map app opens the place in any map app on your Android phone.',
  'help.guide.place-navigation.tip.3':
    'Pick your map app once in Settings, under Open places in. The button then shows its name and opens it straight away. It does the same when only one app applies to a place.',
  'help.guide.place-to-collection.title': 'Save a place to one of your lists',
  'help.guide.place-to-collection.goal': 'Save a place you found on this trip for the next one.',
  'help.guide.place-to-collection.step.1':
    'Open the place and click Save to Collection in the row at the bottom of the card.',
  'help.guide.place-to-collection.step.2':
    'Save to list shows every list you own or share. A filled bookmark on the right marks the lists that already contain this place.',
  'help.guide.place-to-collection.step.3': 'Click the list. The place is added to it immediately.',
  'help.guide.place-to-collection.step.4': 'Close the dialog with the X, and the button in the card reads Saved.',
  'help.guide.place-to-collection.result':
    'The place is in your list with its picture, its notes and its address, ready for the next trip.',
  'help.guide.place-to-collection.tip.1':
    'The button is only there while the Collections addon is on, which the admin switches on under Addons.',
  'help.guide.place-to-collection.tip.2':
    'A place can be in several lists at once, with a different status in each: an idea in one, visited in another.',
  'help.guide.place-to-collection.tip.3':
    'Mark visited, under the place’s name at the top of the picker, marks the place as visited in the list. If the place is in several of your lists, the button says Visited everywhere and marks it in all of them at once. View opens your lists in Collections.',
  'help.guide.place-track.title': 'Read a track and give it its own colour',
  'help.guide.place-track.goal': 'See how long an imported walk is, and see which line on the map is this walk.',
  'help.guide.place-track.step.1':
    'A track’s row in the places column shows a short line in the colour of the track on the map. Click it.',
  'help.guide.place-track.step.2': 'Track Stats gives the length of the path, in the units you set.',
  'help.guide.place-track.step.3': 'Track color above it shows the colour in use. Click the row to open the swatches.',
  'help.guide.place-track.step.4': 'Pick a colour. The line on the map and the stroke on the row change with it.',
  'help.guide.place-track.step.5':
    'The dashed cell on the left, Automatic color, gives the track its default colour again. The pipette on the right opens your system’s colour picker for any other colour.',
  'help.guide.place-track.result':
    'The track is drawn in the colour you picked, in the card, on its row in the places column and on the map.',
  'help.guide.place-track.tip.1':
    'Only a place with a path has these two blocks: a place imported from a GPX, KML or KMZ file before Tours existed, or on a TREK where Tours is off. When Tours is on, a new GPX file becomes a tour, which opens its own tour card.',
  'help.guide.place-track.tip.2':
    'A track recorded with heights also shows its highest and lowest point, the metres up and down, and the profile of the walk.',
  'help.guide.place-track.tip.3':
    'An import gives every track it adds its own colour, so two walks never have the same colour.',

  // ── Screen: trip-day-detail ─────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Day details',
  'help.ctx.trip-day-detail.summary':
    'The panel that opens over the map when you click a day header. It shows the day as a whole: its name and its date, the weather where you will be, the bookings on that day and the nights booked for it.',
  'help.ctx.trip-day-detail.bullet.1':
    'Click a day’s header in the days column and the panel opens over the middle of the map. Click the same header again, or the X at its right, to close the panel and deselect the day. Opening a place, from the places column or the map, closes the panel and shows the place instead.',
  'help.ctx.trip-day-detail.bullet.2':
    'The header shows the day’s name and its date. The pencil next to the name renames the day. The double chevron collapses the panel to a narrow bar so you can see the map again.',
  'help.ctx.trip-day-detail.bullet.3':
    'At the top, you see the weather of the day. Forecast for shows the place the forecast is for: the day’s first stop, or the hotel you wake up in.',
  'help.ctx.trip-day-detail.bullet.4':
    'Reservations lists the bookings of that day, each with its kind, the stop it belongs to and its times. Green means confirmed, amber still pending, and a public transit journey is blue and has no status. A click on a row opens the booking.',
  'help.ctx.trip-day-detail.bullet.5':
    'Accommodation shows every night booked over this day, with Check-in and Check-out on the days they happen, the check-in window, the check-out time and the confirmation number. When the stay has a booking, a Reservation box under it names the booking with Pending or Confirmed. Click it to open the booking.',
  'help.ctx.trip-day-detail.bullet.6':
    "Add accommodation adds a night's stay on this day: pick the property from the trip’s places, choose which days it covers, and add the times and the code. The + in a day’s header, with the tooltip Add to day, also has Add accommodation: it opens this panel with the form already open.",
  'help.guide.day-panel.title': 'Open a day and read its details',
  'help.guide.day-panel.goal':
    'See all of one day, with its weather, its bookings and where you sleep, without leaving the map.',
  'help.guide.day-panel.step.1':
    'Click a day’s header in the days column. The day is selected and its details open over the middle of the map.',
  'help.guide.day-panel.step.2':
    'The header shows the name of the day, Day 1 until you give it a name, with its date below it.',
  'help.guide.day-panel.step.3':
    'The weather of the day is at the top. Forecast for shows which place it is for: the day’s first stop, or the hotel where you spent the night before.',
  'help.guide.day-panel.step.4': 'Reservations below it lists the bookings that fall on this day, with their times.',
  'help.guide.day-panel.step.5':
    'Accommodation shows the nights booked over this day, with Check-in and Check-out on the days they happen.',
  'help.guide.day-panel.step.6':
    'The double chevron in the header collapses the panel to a narrow bar. The X next to it closes the panel and deselects the day.',
  'help.guide.day-panel.result':
    'When you collapse the panel to its bar, the map is free and the day stays selected. When you close it, the day is deselected and the plan stays as it was.',
  'help.guide.day-panel.tip.1':
    'Clicking anywhere on the panel’s header bar also collapses it. The chevron is only one way to do this.',
  'help.guide.day-panel.tip.2':
    'When you open a place, from the places column or the map, the day’s panel closes and the place’s details are shown instead. Click the day’s header again to show the day again.',
  'help.guide.day-panel.tip.3':
    'Plan by the calendar? Turn on Date first in day headings in Settings, under General, and the header shows the date first, with Day 1 or the day’s name underneath.',
  'help.guide.day-weather.title': 'Read the day’s weather',
  'help.guide.day-weather.goal': 'See the weather for the place where you actually are that day.',
  'help.guide.day-weather.step.1':
    'Forecast for shows the place the numbers are for: the day’s first stop, or, on a day without a stop, the hotel you stay in the night before.',
  'help.guide.day-weather.step.2':
    'The big number is the day’s temperature. Next to it are the low and the high, and the weather condition in words.',
  'help.guide.day-weather.step.3':
    'The pills to the right of it: the chance of rain, how much of it, the strongest wind, and sunrise and sunset.',
  'help.guide.day-weather.step.4':
    'At the bottom, the day hour by hour, every second hour: the time, the icon, the temperature and the chance of rain. An hour over 50 percent is shaded blue.',
  'help.guide.day-weather.result':
    'The day’s card in the days column also shows the weather in small text under its number, so you can quickly see the weather for the whole trip.',
  'help.guide.day-weather.tip.1':
    'Degrees and wind use the Temperature Unit under General in Settings: if you pick °F Fahrenheit, the same forecast is shown in °F and mph.',
  'help.guide.day-weather.tip.2':
    'A day with no located stop and no hotel from the night before shows no weather at all: the forecast is always for a place, never for the trip.',
  'help.guide.day-weather.tip.3':
    'More than 16 days ahead, no forecast is available. The numbers are then the averages of earlier years for that date. They are marked with Ø, and a note underneath says so.',
  'help.guide.rename-day.title': 'Give the day a name',
  'help.guide.rename-day.goal': 'Give a day a name such as Arrival in Kyoto or Rest day instead of Day 5.',
  'help.guide.rename-day.step.1': 'Open the day. Its header reads Day 5, with the date underneath.',
  'help.guide.rename-day.step.2': 'Click the pencil next to the name.',
  'help.guide.rename-day.step.3': 'The name turns into a field. Type the name you want.',
  'help.guide.rename-day.step.4':
    'Press Enter, or click somewhere else. Escape cancels the change. The day’s card in the days column shows the name too.',
  'help.guide.rename-day.result':
    'The name replaces Day 5 in the panel and on the day’s card in the days column; the date does not change.',
  'help.guide.rename-day.tip.1':
    'If you clear the field and save, the day is called Day 5 again: the number shows when there is no name.',
  'help.guide.rename-day.tip.2':
    'The name belongs to the day, not to its date. If you reorder the days, the name moves with everything else on that day.',
  'help.guide.add-accommodation.title': 'Book a night on a day',
  'help.guide.add-accommodation.goal':
    'Add the hotel to the plan once, with the days it covers, its times and its confirmation number.',
  'help.guide.add-accommodation.step.1':
    'The property has to be a place of the trip first. Create it in the places column like any other place: the picker only offers places that already exist.',
  'help.guide.add-accommodation.step.2': 'Open the day you arrive on and click Add accommodation under Accommodation.',
  'help.guide.add-accommodation.step.3':
    'Apply to days sets which nights the stay covers: Start is the check-in day, End the check-out day, and All covers the whole trip. The top of the dialog shows the range and the number of nights.',
  'help.guide.add-accommodation.step.4':
    'Fill in Check-in, Until and Check-out, and put the booking’s number under Confirmation. All four may stay empty.',
  'help.guide.add-accommodation.step.5':
    'Pick the property under Select accommodation. Category above the list narrows it to one category.',
  'help.guide.add-accommodation.step.6': 'Click Save.',
  'help.guide.add-accommodation.result':
    'The stay shows on every day it covers, Check-in on the first and Check-out on the last. The property becomes a stop on the check-in day, so the map shows the route there, and a Hotel booking appears on the Bookings tab.',
  'help.guide.add-accommodation.tip.1':
    'The picker opens on the day you came from, with check-out on the next day; you can change both before you save.',
  'help.guide.add-accommodation.tip.2':
    'Give the hotel the Hotel category when you create it. Then Category above the list shows only your hotels with one click.',
  'help.guide.add-accommodation.tip.3':
    'The times are all optional: a stay with no check-in and no code still covers its nights, and its route is still drawn.',
  'help.guide.add-accommodation.tip.4':
    'A faster way: the + in the day’s header, with the tooltip Add to day, has Add accommodation. It opens the day with this form already open.',
  'help.guide.add-accommodation.tip.5':
    'GPX tracks and tour places are never offered as a place to stay, only ordinary places of the trip.',
  'help.guide.edit-accommodation.title': 'Change or cancel a booked night',
  'help.guide.edit-accommodation.goal': 'Move a stay, correct its times, or remove it from the plan.',
  'help.guide.edit-accommodation.step.1':
    'The card shows the property and its address, Check-in or Check-out on the days they happen with the times, the confirmation number, and under Reservation the booking that came with it.',
  'help.guide.edit-accommodation.step.2':
    'The pencil at its right, Edit accommodation, opens the stay for editing. The popup title is now Edit accommodation.',
  'help.guide.edit-accommodation.step.3':
    'Correct Check-in, Until, Check-out and Confirmation. The days above them and the property below can be changed here too.',
  'help.guide.edit-accommodation.step.4': 'Click Save.',
  'help.guide.edit-accommodation.step.5':
    'The X next to the pencil, Remove, removes the stay. It does not ask for confirmation, and the Hotel booking that belongs to the stay is deleted too.',
  'help.guide.edit-accommodation.result':
    'The change applies at once to every day the stay covers, and to the Hotel booking on the Bookings tab.',
  'help.guide.edit-accommodation.tip.1':
    'A night in the middle of a stay has no Check-in and no Check-out label: only the first and the last day of the range have one.',
  'help.guide.edit-accommodation.tip.2':
    'Cancelling a stay also removes the stop it added to the check-in day and any cost linked to its booking. If this was a mistake, book the night again.',
  'help.guide.edit-accommodation.tip.3':
    'With Blur Booking Codes on in Settings, under General, the confirmation number stays blurred. Hover it or click it to read it.',
  'help.guide.confirm-stay-booking.title': 'Confirm the booking of a stay',
  'help.guide.confirm-stay-booking.goal': 'Mark the hotel booking behind a stay as confirmed, straight from the day.',
  'help.guide.confirm-stay-booking.step.1':
    'Open the day you check in. On the stay’s card, under Reservation, you see the Hotel booking for that night, with Pending or Confirmed. Click that box.',
  'help.guide.confirm-stay-booking.step.2':
    'The booking opens over the plan. The first pill in its header shows its status.',
  'help.guide.confirm-stay-booking.step.3':
    'Click Pending at the top. Its tooltip shows Set to Confirmed, and the dot turns green.',
  'help.guide.confirm-stay-booking.step.4':
    'Close the booking with the X at its top right. Under Reservation, the stay’s card now shows Confirmed.',
  'help.guide.confirm-stay-booking.result':
    'The hotel booking is confirmed, on the stay’s card and on the Bookings tab alike.',
  'help.guide.confirm-stay-booking.tip.1': 'Click the pill again and the booking is back to Pending.',
  'help.guide.confirm-stay-booking.tip.2':
    'The same pill works in every booking, also in the bookings under Reservations on the day.',
  'help.guide.day-bookings.title': 'The day’s bookings at a glance',
  'help.guide.day-bookings.goal': 'See in one place what is already booked for this day and whether it is confirmed.',
  'help.guide.day-bookings.step.1':
    'Reservations lists the bookings of the day: the ones dated on it, and the ones pinned to one of its stops. A booking pinned to a stop on another day shows at that stop only.',
  'help.guide.day-bookings.step.2':
    'A row shows what kind of booking it is, its name and, when it belongs to a stop, that stop in grey after it. Its times are shown at the right end, before the status dot.',
  'help.guide.day-bookings.step.3':
    'The colour shows the status of a booking: green is confirmed, amber still pending, and a public transit journey is blue, without a status. Hotels are not in this list, they have their own section below.',
  'help.guide.day-bookings.step.4':
    'Click a row and the booking opens. The pill in its header switches it between Pending and Confirmed, and Edit at the bottom changes the rest. New bookings are created on the Bookings tab, transports on the Transports tab.',
  'help.guide.day-bookings.result':
    'Everything dated on that day, and everything linked to one of its stops, is in this list.',
  'help.guide.day-bookings.tip.1':
    'A booking appears on the day of its own date. If you change the date on the Bookings or Transports tab, the booking moves to the other day automatically.',
  'help.guide.day-bookings.tip.2':
    'No Reservations block means the day has no bookings: it is hidden rather than shown empty.',

  // ── Screen: trip-map ────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Map',
  'help.ctx.trip-map.summary':
    'The middle of the plan: every place of the trip as a pin, every tour as a line, the routes between them, and the buttons along the edges of the map to lock the view, to switch to satellite, to show the whole trip at once and to show the places in the area you are looking at.',
  'help.ctx.trip-map.bullet.1':
    'A pin is a place: its own photo when it has one, otherwise its category colour with the category icon. Hover over a pin for a card with its picture, its name and its address, plus its rating and its category if the place has them. Drag a pin onto a day card to plan the place there. A stay whose booking is still pending is shown faded, with a dashed ring.',
  'help.ctx.trip-map.bullet.2':
    'Pins that are too close together are grouped into one dark circle with a count. Click the circle and the map zooms in to the pins inside it. With Compact markers for unplanned places on, in Settings > General under Travel & map, places that are on no day yet are small dots without their photo, so the planned stops are easier to see.',
  'help.ctx.trip-map.bullet.3':
    'Click a pin to open the place in a card at the bottom of the map, with its rating, its files and the next actions. Click an empty part of the map to close the card.',
  'help.ctx.trip-map.bullet.4':
    'With a day open in the days column, its stops show a small white badge with their number in that day. A place that is in the day twice shows both of its numbers. The filters above the places list (Show, the categories and the star for a minimum rating) also filter the pins on the map.',
  'help.ctx.trip-map.bullet.5':
    'The row of icons at the top searches the part of the map you can see: Restaurants, Cafés, Bars & nightlife, Accommodation, Sights, Museums & culture, Nature & parks and Activities. Categories that a plugin adds come after a thin divider line. When the row is wider than the map, the mouse wheel scrolls it sideways. Search this area runs the search again after you move the map.',
  'help.ctx.trip-map.bullet.6':
    'Right-click anywhere on the map to open the place form at that point, with the address already looked up. There are two round buttons at the bottom left: the lock, Lock the map view, keeps the map view where it is while you click through days and places, and the button below it, Switch to satellite view, replaces the drawn map with satellite images.',
  'help.ctx.trip-map.bullet.7':
    'Show whole trip at the bottom right draws every travel day at once and lists what each day covers. The route icon on a booking’s row draws that booking, and the route icon in the toolbar above the days draws all bookings. Click the end of a drawn booking to open its details.',
  'help.ctx.trip-map.bullet.8':
    'With the Dawarich addon on, the round Dawarich button under Show whole trip shows the route your phone actually recorded. Show recorded route draws it as a dashed line under the planned route, one colour per day. When there is no line, the button’s label tells you why.',
  'help.ctx.trip-map.bullet.9':
    'Every tour of the trip is a line in its colour, with a pin where it starts. Click the line to open the tour’s card. On a day that has a tour, the day’s route goes to where the tour starts and continues from where it ends. The eye next to a tour in the Tours list, Hide on the map, removes its line from your map.',
  'help.guide.map-markers.title': 'Read the map',
  'help.guide.map-markers.goal': 'Understand what every pin, badge and bubble on the map means.',
  'help.guide.map-markers.step.1':
    'The map shows every place of the trip. Where pins are too close together to tell apart, they are grouped into one dark circle with the number of pins inside it. Click the circle and the map zooms in to those pins, or, at the deepest zoom, spreads the pins apart.',
  'help.guide.map-markers.step.2':
    'A pin shows the place’s own photo when it has one, otherwise its category colour with the category icon. A stay whose booking is still pending is shown faded, with a dashed ring. When you hover over a pin, a card opens beside it: the same photo, larger, the name and the address, with the rating and the category if the place has them.',
  'help.guide.map-markers.step.3':
    'Click a pin and the place opens in a card over the bottom of the map: the picture, the name and the address at the top, then the stars, the description and the files, including the files of its booking. Along the bottom are the actions: Add to Day while a day is open (Remove from Day when the place is already on it), Navigation, Open Website, Save to Collection (Saved once it is in one), and on the right the bin and Edit. The X at the top, or a click on an empty part of the map, closes it.',
  'help.guide.map-markers.step.4':
    'Open a day in the days column and its stops get numbers: the small white badge at a pin’s corner shows the stop’s position in the day. A place that appears twice in the day shows both of its numbers. When no day is open, there are no numbers, and the corner shows the place’s rating instead, if it has one.',
  'help.guide.map-markers.step.5':
    'Drag a pin from the map onto a day card in the days column, and the place is planned on that day, the same as when you drag its row from the places list.',
  'help.guide.map-markers.result':
    'Nothing on the trip has changed: the map only shows the trip. Each pin shows which place it is, which day it is on and in which order.',
  'help.guide.map-markers.tip.1':
    'When you collapse a day in the days column, its stops are hidden on the map. Expand the day again to show them.',
  'help.guide.map-markers.tip.2':
    'The filters above the places list also decide what the map shows: Show (Unplanned, Planned), the categories under the tag button and a minimum rating under the star all reduce the number of pins. The country filter narrows the list only.',
  'help.guide.map-markers.tip.3':
    'There are no zoom buttons on this map: the wheel zooms, a double click zooms in a step, and dragging the map itself moves it.',
  'help.guide.map-markers.tip.4':
    'With Compact markers for unplanned places on, in Settings > General under Travel & map, places that are on no day yet are small dots without their photo or rating. The place you pick is always drawn in full.',
  'help.guide.map-nearby-places.title': 'Find places around you on the map',
  'help.guide.map-nearby-places.goal':
    'Search for restaurants, sights or a hotel in the part of town shown on the map, and add one to the trip.',
  'help.guide.map-nearby-places.step.1':
    'The row of icons at the top of the map is the category search: Restaurants, Cafés, Bars & nightlife, Accommodation, Sights, Museums & culture, Nature & parks and Activities. Categories a plugin adds follow after a thin divider; hover an icon for its name.',
  'help.guide.map-nearby-places.step.2':
    'Click a category. TREK searches for that kind of place in the visible part of the map and places a pin in the category’s colour for every result. Only one category at a time: clicking another one replaces it, and clicking the active one turns it off.',
  'help.guide.map-nearby-places.step.3':
    'When you move the map, a second button appears under the row: Search this area runs the same search for the new view. Moving the map does not start a new search by itself. This keeps the number of requests low.',
  'help.guide.map-nearby-places.step.4':
    'Hold the pointer over a pin to see the name of what the search found. Click the pin and the place form opens with its details already filled in: the name at the top of the dialog, Address, Latitude and Longitude, and the website and phone number if the search found them.',
  'help.guide.map-nearby-places.step.5':
    'Check what it filled in and add what the search could not know. The category pill under the name is already set when the trip has a matching category, such as a restaurant for a restaurant; otherwise it reads No Category until you pick one. Add a Description and notes of your own.',
  'help.guide.map-nearby-places.step.6':
    'Click Add. If a place of the same name or on the same spot is already in the trip, TREK tells you, and the button changes to Add anyway.',
  'help.guide.map-nearby-places.result':
    'The place is in the places list and on the map as one of the trip’s own pins, under Unplanned until you put it on a day. The search pins stay until you switch the category off.',
  'help.guide.map-nearby-places.tip.1':
    'The row is hidden when Explore places on the map is off in Settings > General, under Travel & map.',
  'help.guide.map-nearby-places.tip.2':
    'The results come from the TREK Places index and from OpenStreetMap, so this is one of the few things on the plan that needs a connection.',
  'help.guide.map-nearby-places.tip.3':
    'A search covers only the area on screen, so zoom in to the street you are interested in. A search over a whole city returns only the first sixty results, in no clear order.',
  'help.guide.map-nearby-places.tip.4':
    'A category whose search failed gets a red dot, and Search this area turns red with a warning sign: click it to try again.',
  'help.guide.map-add-place.title': 'Create a place by right-clicking the map',
  'help.guide.map-add-place.goal': 'Put a place exactly where you want it, without searching for it first.',
  'help.guide.map-add-place.step.1':
    'Right-click the spot on the map. The place form opens with the heading Add Place/Activity.',
  'help.guide.map-add-place.step.2':
    'Latitude and Longitude are already set to that point. TREK looks up the coordinates and fills in Address with what it finds there. If the look-up finds a name, TREK also fills in the name at the top of the dialog. Nothing is saved yet, so correct anything that is wrong.',
  'help.guide.map-add-place.step.3':
    'Type a name you will recognise into the field at the top of the dialog. Pick a category from the pill below it, which shows No Category until you pick one. Then add any other details for the plan: Description, Notes, Website.',
  'help.guide.map-add-place.step.4':
    'Click Add. The place is added to the list as unplanned, even when a day is open: a right-click on the map sets the location, not the day.',
  'help.guide.map-add-place.result':
    'The place is in the list and on the map, under Unplanned until you put it on a day.',
  'help.guide.map-add-place.tip.1':
    'The address is looked up from the coordinates, so it can show a street rather than a name, and in open country it can be empty. You can overwrite both fields.',
  'help.guide.map-add-place.tip.2':
    'On the MapLibre GL and Mapbox GL maps a middle click does the same, and on a touch screen a long press.',
  'help.guide.map-satellite.title': 'Switch to satellite',
  'help.guide.map-satellite.goal': 'Switch from the drawn map to aerial images, and back.',
  'help.guide.map-satellite.step.1':
    'The base layer switch is the lower of the two round buttons at the bottom left of the map, under the lock. Its icon always shows the layer it switches to, and its tooltip says which: Switch to satellite view. Click it.',
  'help.guide.map-satellite.step.2':
    'The map now shows aerial images. They are detailed enough to see single buildings, and you do not need a key of your own. Everything TREK draws stays on top: the pins, the day’s route, the tracks and the booking routes.',
  'help.guide.map-satellite.step.3': 'The button now reads Switch to map view. Click it to go back to the map view.',
  'help.guide.map-satellite.result': 'The map is drawn again, and the layer you chose is remembered on your account.',
  'help.guide.map-satellite.tip.1':
    'The choice is saved on your account, not on the trip, so every trip opens the way you left it, whichever map renderer you use.',
  'help.guide.map-satellite.tip.2':
    'The satellite images have no labels: street names, districts and house numbers are only on the drawn map, so switch back when you are looking for an address.',
  'help.guide.map-lock.title': 'Lock the map',
  'help.guide.map-lock.goal': 'Keep the map where it is while you click through days and places.',
  'help.guide.map-lock.step.1':
    'The lock is the upper of the two round buttons at the bottom left of the map; hovering it says Lock the map view. Click it. While it is closed, opening a day or picking a place no longer zooms or pans the map, and the button now reads Let the map follow the selection.',
  'help.guide.map-lock.result': 'The map stays where you left it while you work through the plan.',
  'help.guide.map-lock.tip.1':
    'Click the lock again, now Let the map follow the selection, and the map goes back to following what you pick. The lock is there on a computer only; on a phone the map always follows.',
  'help.guide.map-lock.tip.2':
    'This browser remembers the lock for every trip. When you open a trip, the map still zooms to the trip once, so it never opens on an empty area.',
  'help.guide.map-whole-trip.title': 'See the whole trip and its distances',
  'help.guide.map-whole-trip.goal':
    'Show every travel day of the trip instead of only the open day, and see how far you travel on each day.',
  'help.guide.map-whole-trip.step.1':
    'The round Show whole trip button is at the bottom right of the map. Click it and every travel day of the trip is drawn at once, each in its own colour, so you can tell neighbouring days apart.',
  'help.guide.map-whole-trip.step.2':
    'The card above the button lists those days: a colour dot, the day’s name, an icon for each way you travel on it, and the distance it covers. Total distance is at the top.',
  'help.guide.map-whole-trip.step.3':
    'Click a day in the card to select it: its row is shaded and the day opens in the days column. Scroll the mouse wheel over a city to zoom in. The days that pass through the city are shown side by side, each in its colour.',
  'help.guide.map-whole-trip.step.4': 'The button now says Hide whole trip. Click it to show only the open day again.',
  'help.guide.map-whole-trip.result':
    'Each travel day is drawn in its own colour, and the card shows what each day covers and the total for the trip.',
  'help.guide.map-whole-trip.tip.1':
    'The total is calculated a few legs at a time. While … is shown after it, the number is only a partial sum. It is final when every leg is calculated.',
  'help.guide.map-whole-trip.tip.2':
    'If the router cannot calculate a leg, the leg stays a straight line and is not counted. The card tells you this, so the total does not look lower without a warning.',
  'help.guide.map-whole-trip.tip.3':
    'A day with fewer than two located stops and no drive to or from its hotel has no route to draw, so it does not appear in the card at all.',
  'help.guide.map-whole-trip.tip.4':
    'Whether the whole trip is shown is saved per trip in your account, so the trip opens the same way in another browser.',
  'help.guide.map-booking-routes.title': 'Show a booking’s route on the map',
  'help.guide.map-booking-routes.goal':
    'Show the flights, trains and drives you have booked on the map, and remove them again.',
  'help.guide.map-booking-routes.step.1':
    'Booking routes are off until you turn one on. At the right end of a transport’s row in the days column there is a small route icon: Show booking routes.',
  'help.guide.map-booking-routes.step.2':
    'Click it and the booking appears on the map: a flight as a great circle arc, a drive along the real roads, a train as the chain of its stations. Confirmed is drawn solid, Pending dashed, and the ends of the route are blue pills with the transport’s icon.',
  'help.guide.map-booking-routes.step.3':
    'Click an end pill and the booking’s details open: status, type and days as pills in the coloured header, the times at both ends, the other details below, and at the bottom On map, which switches this route off again, Change route on a public transit connection, the bin that deletes the booking, and Edit. The X in the header closes the details.',
  'help.guide.map-booking-routes.step.4':
    'The route icon in the toolbar above the days works for the whole trip at once: Show all booking routes draws every booking that has a route.',
  'help.guide.map-booking-routes.step.5':
    'This replaces your earlier choices, so any routes you switched on booking by booking are reset. Press it again, now labelled Hide all booking routes, to hide all booking routes.',
  'help.guide.map-booking-routes.result':
    'The bookings you asked for are drawn on the map, and the choice is kept for this trip in this browser until you change it.',
  'help.guide.map-booking-routes.tip.1':
    'The ends show the airport code or the station’s name only when Booking route labels is on in Settings > General, under Travel & map; otherwise they show the icon alone.',
  'help.guide.map-booking-routes.tip.2':
    'Always show booking routes, in the same section, shows them from the start on every trip where you have not set this yourself yet.',
  'help.guide.map-booking-routes.tip.3':
    'A booking needs a start and an end with coordinates before it can be drawn, so a hotel or a restaurant has no route icon.',
  'help.guide.map-dawarich-trail.title': 'Show the route you actually travelled',
  'help.guide.map-dawarich-trail.goal':
    'Show the route Dawarich recorded on your phone on the map, as a dashed line next to your planned route, and see day by day how the trip really went.',
  'help.guide.map-dawarich-trail.step.1':
    'The round Dawarich button is at the bottom right of the map, under Show whole trip. When you hover over it, it shows Show recorded route. Click it. TREK requests the data for the trip’s dates from your Dawarich, and a ring spins around the button while TREK waits for the answer.',
  'help.guide.map-dawarich-trail.step.2':
    'The recorded route appears as a dashed line, one colour per day, drawn under the planned route so the plan stays readable. The button now reads Hide recorded route. Each day ends at local midnight. When you collapse a day in the days column, its dashed line and its stops are hidden on the map.',
  'help.guide.map-dawarich-trail.step.3':
    'Click Show whole trip as well, and every planned day is drawn as a solid line next to the dashed recording. Where the two lines match, the day went as planned. Where the dashed line leaves the planned route, it did not.',
  'help.guide.map-dawarich-trail.result':
    'What you planned and what you actually did are shown on the map together, as dashed and solid lines. The card above the buttons still lists the planned days and their distances.',
  'help.guide.map-dawarich-trail.tip.1':
    'On or off is saved per trip on your account, so it is the same in every browser and on every device. While the route is on, TREK asks Dawarich again every two minutes, so a trip in progress updates without reloading the page. The route itself is never stored, so it is not in TREK’s database, not in backups and not available offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'The button’s label tells you why the map is empty: Loading the recorded route… while it loads, Nothing was recorded on these dates, The recorded route could not be loaded, or The recorded route needs a connection when TREK is offline.',
  'help.guide.tour-map-lines.title': 'Find your tours on the map',
  'help.guide.tour-map-lines.goal':
    'Tell the trip’s tours apart on the map, open one from its line, and hide the ones you do not need right now.',
  'help.guide.tour-map-lines.step.1':
    'Every tour of the trip is drawn on the map as a line in its colour, with its pin where it starts. If you picked a colour for the tour, the line uses it. Otherwise the line uses its category’s colour.',
  'help.guide.tour-map-lines.step.2':
    'Click the line, or the pin at its start. The tour’s card opens over the bottom of the map, and its line is drawn wider with a white border, so you can see it among the other lines. The X in the card’s header closes it.',
  'help.guide.tour-map-lines.step.3':
    'Open a day the tour is on in the days column and the tour becomes part of the day’s route: the route runs to where the tour starts and goes on from where it ends.',
  'help.guide.tour-map-lines.step.4':
    'To remove a tour from the map, switch the right column to Tours, point at the tour and click the eye, Hide on the map. Its line and pin disappear from the map, and the row stays in the list, dimmed, with a crossed out eye, Show on the map, that shows it again.',
  'help.guide.tour-map-lines.result':
    'The tours you want are on the map, each in its colour, and the one you hid is shown dimmed in the Tours list.',
  'help.guide.tour-map-lines.tip.1':
    'When you collapse a day in the days column, its tours and its stops are hidden on the map.',
  'help.guide.tour-map-lines.tip.2':
    'Hiding a tour only affects you and is saved in this browser for this trip: the tour, its days and its colour stay the same for everyone. Show all, above the Tours list, shows every hidden tour again, and the phone map always shows every tour.',
  'help.guide.tour-map-lines.tip.3':
    'Leave out of route, in the menu of the tour’s row in the day plan, means the day’s route no longer goes to the start and end of the tour. Add back to route connects them again.',
  'help.guide.map-compass.title': 'Turn the map and find north again',
  'help.guide.map-compass.goal':
    'Rotate the map to face the direction you are going, and turn it back to north with one click.',
  'help.guide.map-compass.step.1':
    'Turn the map with a right-button drag, or hold Ctrl and drag with the left button; on a touch screen, turn two fingers. The round compass next to the row of category icons at the top of the map turns with it: its arrow always points north, so it tilts by the same angle as the map.',
  'help.guide.map-compass.step.2':
    'Click the compass. The button, called Reset north, turns the map back so north is at the top, makes the view flat again, and the arrow points up again.',
  'help.guide.map-compass.result':
    'The map points north and is level again. Nothing on the trip has changed: the compass only changes the view.',
  'help.guide.map-compass.tip.1':
    'The compass exists on the MapLibre GL and Mapbox GL maps only; the Leaflet map cannot be rotated, so it has no compass. Map Provider in Settings, under Map, decides which map you use, and Save Map saves the choice.',
  'help.guide.map-compass.tip.2':
    'The click also removes the tilt. Drag up or down with the right mouse button to tilt the view, and Reset north makes it level and resets the rotation. On Mapbox GL with 3D Buildings & Terrain on, this also flattens the 3D view until you tilt it again.',

  // ── Screen: trip-transports ─────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transports',
  'help.ctx.trip-transports.summary':
    'All the ways you travel between the stops: flights, trains, buses, cars, taxis, bicycles, cruises, ferries, cable cars and the public-transit connections TREK looks up for you. The tab lists them. You can also create and view them on the plan, and they are drawn on the map.',
  'help.ctx.trip-transports.bullet.1':
    'The tab shows the rides only. Accommodation, restaurants, events and tickets are on the Bookings tab, so the same entry never shows up twice.',
  'help.ctx.trip-transports.bullet.2':
    'The bar at the top has Search, Filter for the status, the types and the travelers, the three views Cards, List and Timeline, View options, and Export as spreadsheet (CSV), which downloads what is shown. Transport at the right adds a ride by hand. The icons before it, Import booking confirmations and Import from AirTrail, appear when the server can read confirmations or an AirTrail is connected. On an empty tab the same actions appear in the middle as Transport, Import from file and AirTrail.',
  'help.ctx.trip-transports.bullet.3':
    'Cards is the view the tab opens in: Confirmed first, then Pending. You can collapse each section by clicking its heading. The planned public-transit connections have no status and are shown among the confirmed rides in time order, unless View options gives them a section of their own, Automated public transit. List groups by day, and Timeline shows every ride across the trip’s days.',
  'help.ctx.trip-transports.bullet.4':
    'The top band of a card is coloured by its status: green for confirmed, amber for pending, blue for a planned connection. It shows the status dot, the type, the title, the pencil and the bin. Below it: Date, Time, Booking Code, Route and the airline and flight number or the train number, platform and seat. Click the card to open its details.',
  'help.ctx.trip-transports.bullet.5':
    'You can also create transports on the plan: the + in a day’s header (its tooltip reads Add to day), or a right-click on the header, offers Add transport and Public transit. The travel-time connector between two stops opens the same search for that one leg.',
  'help.ctx.trip-transports.bullet.6':
    'A transport with both ends set draws a line on the map. The route icon on its row in the day plan and On map in its details switch that line on. Show all booking routes in the toolbar above the days switches the lines of the whole trip on or off.',
  'help.guide.transports-list.title': 'Read the Transports tab',
  'help.guide.transports-list.goal': 'Understand what the list shows before you change anything on it.',
  'help.guide.transports-list.step.1':
    'Transports is a tab of the trip, after Plan (and Tours, when that addon is on). It holds the rides only: hotels, restaurants, events and tickets are on the Bookings tab.',
  'help.guide.transports-list.step.2':
    'Search at the left of the bar filters the rides as you type. Filter, the funnel beside it, opens the choices: Status with All, Confirmed and Pending, then every type in use with its count. Tick one or several types to show only those. A number on the funnel shows how many filters are active, and the bar shows how many rides are shown, such as 1 of 4. Reset filters at the bottom of the menu shows all rides again.',
  'help.guide.transports-list.step.3':
    'Cards, List and Timeline next to it show the transports as cards, as rows grouped by day, or as bars across the trip’s days. View options, the sliders icon, sets Group by and Sort by for Cards and List and the lanes for Timeline. Reset view goes back to the defaults. In Cards, Public transit as its own section shows the planned connections under Automated public transit.',
  'help.guide.transports-list.step.4':
    'Each card shows all the details. The band at the top is green for Confirmed and amber for Pending, and shows the status dot, the type and the title. Below it, Date shows the days it spans with their dates. Then come Time, Booking Code, Route with the type’s icon between the stops, and the airline and flight number or the train number, platform and seat. Click the card to open its details.',
  'help.guide.transports-list.step.5':
    'Click the status dot to switch the ride between Pending and Confirmed; its tooltip says which way, such as Set to Pending. The pencil in the header opens the transport’s form, and the bin deletes it after the question Delete booking?, which lists what is deleted, including linked costs.',
  'help.guide.transports-list.result':
    'Each card shows whether the ride is booked, and you can use the bar to filter or sort the list at any time.',
  'help.guide.transports-list.tip.1':
    'The tab remembers your settings: the view, the grouping and the sort in this browser, the collapsed sections for each trip, and the filters until you close the browser tab.',
  'help.guide.transports-list.tip.2':
    'Import booking confirmations and Import from AirTrail, the two icons before Transport, appear only when the server can read confirmations and when an AirTrail instance is connected. Without them, you fill the list by hand or with the transit search.',
  'help.guide.add-transport.title': 'Add a transport to a day',
  'help.guide.add-transport.goal':
    'Add the transport that takes you from one stop to the next to the day it happens on.',
  'help.guide.add-transport.step.1':
    'In the header of the day of the ride, click the +, whose tooltip reads Add to day, and choose Add transport. A right-click on the day’s header offers the same menu. The form opens with that day already filled in.',
  'help.guide.add-transport.step.2':
    'The type pill in the header shows the type of transport, Flight by default. Click it for Flight, Train, Bus, Car, Taxi, Bicycle, Cruise, Ferry, Cable car or Other, and the form changes to match: a flight gets an airport at every stop, a train a chain of stations, a cruise Embarkation, Port of call and Disembarkation, a car Pickup and Return and Stops along the way.',
  'help.guide.add-transport.step.3':
    'Type the title directly into the top band, where the grey example text is. It is the only required field: until you fill it in, the line under it reads Title * and Add stays grey. Use a title you would recognise on a departure board.',
  'help.guide.add-transport.step.4':
    'Under Route, From and To take a station, a port or an address. The trip’s own places are offered before you type. Type at least three letters to search, and pick a result. A name that you only type and do not pick from the results is not saved, and nothing is shown on the map.',
  'help.guide.add-transport.step.5':
    'Date and Start time say when it starts, End date and End time when it ends; for a ride that arrives the next day, set the next day there. Booking Code and Notes further down are optional. Click the Pending pill in the header to change it to Confirmed.',
  'help.guide.add-transport.step.6': 'Click Add.',
  'help.guide.add-transport.result':
    'The transport is a row on the day, at its time among the stops, and a card on the Transports tab under Pending or Confirmed.',
  'help.guide.add-transport.tip.1':
    'The row is placed by its start time, after the last stop that starts earlier. Drag it by its grip to another position in the day, or onto another day.',
  'help.guide.add-transport.tip.2':
    'Use Attach file under Files to add the ticket. Create expense under Costs saves the booking and opens the Costs editor for the fare.',
  'help.guide.add-transport.tip.3':
    'Travelers, the first block of the form, sets who takes this transport. Once the trip has more than one member and a transport names someone, Filter on the tab also offers Travelers, which shows only one person’s transports.',
  'help.guide.car-stops.title': 'Plan a drive with stops along the way',
  'help.guide.car-stops.goal':
    'Give a rental car or your own car its pickup, its return and the places you stop at in between.',
  'help.guide.car-stops.step.1':
    'In the header of the day you pick up the car, click the +, whose tooltip reads Add to day, and choose Add transport.',
  'help.guide.car-stops.step.2':
    'Click the type pill in the header and choose Car. The form changes: Date and Start time become Pickup and Pickup time, End date and End time become Return and Return time, and Stops along the way appears under From and To.',
  'help.guide.car-stops.step.3':
    'Type a title into the header. Under Route, pick where you collect the car in From and where you return it in To; the trip’s own places are offered before you type. Pickup and Pickup time say when you collect it, Return and Return time when you return it.',
  'help.guide.car-stops.step.4':
    'Under Stops along the way, click Add stop for every place the drive passes through and pick it, with a time beside it if you like. A stop without a picked place is removed when you save.',
  'help.guide.car-stops.step.5':
    'The order of the stops is the route. Move up and Move down at a stop’s left change it, and Remove stop, the cross at its right, removes it.',
  'help.guide.car-stops.step.6': 'Click Add.',
  'help.guide.car-stops.result':
    'The drive is a card on the Transports tab and a row on its day, and its line on the map runs from the pickup through every stop, in their order, to the return.',
  'help.guide.car-stops.tip.1': 'There is no separate rental type: a rental and your own car are both a Car.',
  'help.guide.car-stops.tip.2': 'Move up and Move down only appear once the drive has two stops or more.',
  'help.guide.import-transport-file.title': 'Import a flight from its e-ticket',
  'help.guide.import-transport-file.goal':
    'Let TREK read a flight, a train or a ferry from the ticket the carrier sent, and check it before it is saved.',
  'help.guide.import-transport-file.step.1':
    'In the bar of the Transports tab, click the download icon before Transport, whose tooltip reads Import booking confirmations. The dialog of that name opens, the same one the Bookings tab has. On an empty tab, Import from file in the middle does the same.',
  'help.guide.import-transport-file.step.2':
    'Drop the ticket on the box, or click the box and pick the file: EML, PDF, PKPass, HTML and TXT, up to five files of 10 MB each, and photos of a ticket (JPG, PNG, WEBP) when your server has an AI model to read them. The box shows the names of the files you chose.',
  'help.guide.import-transport-file.step.3':
    'Click Import. The dialog closes at once, and the file is read in the background.',
  'help.guide.import-transport-file.step.4':
    'A card at the bottom right shows the progress under the file’s name. Parsing files… changes to a tick when reading is done, and the card offers Import. Click it.',
  'help.guide.import-transport-file.step.5':
    'A flight opens in Add transport, already filled in: the type pill on Flight, the airline and the flight number as the title in the header, both airports under Route with Departure and Arrival, their times and their time zones, Airline and Flight No., the Booking Code and the ticket under Files. Check it and click Add.',
  'help.guide.import-transport-file.result':
    'The flight is a card under Pending on the Transports tab and a row on the day it departs, with the ticket under Files. When both airports are known, the flight is shown as a curve on the map.',
  'help.guide.import-transport-file.tip.1':
    'The two tabs use the same import. A file that contains a flight and a hotel opens the flight in Add transport and then the hotel in New Reservation, no matter which tab you started from.',
  'help.guide.import-transport-file.tip.2':
    'Airports are placed by their code. If a station or a port could not be located, its name is shown in amber on the import card at the bottom right. Pick it by hand under Route before you click Add, or the transport is not shown on the map.',
  'help.guide.plan-transit.title': 'Plan a public-transit connection',
  'help.guide.plan-transit.goal':
    'Let TREK look up the real trains and buses between two points of a day and put the one you pick into the plan.',
  'help.guide.plan-transit.step.1':
    'Click the + in the header of the day and choose Public transit. The search opens for that day: the day is shown as a pill in the header, and Manual and Automated next to it switch between this search and the normal form.',
  'help.guide.plan-transit.step.2':
    'From and To take a stop or a station. While the box is still empty, TREK suggests the day’s accommodation, the stations and airports of the day’s bookings and the day’s own stops. When you type two letters, it searches the stations of the timetable instead. Swap between the two boxes switches From and To.',
  'help.guide.plan-transit.step.3':
    'Depart or Arrive with a time says when you want to travel, and Best route, Fewer transfers or Less walking says how the answers should be ordered.',
  'help.guide.plan-transit.step.4':
    'The chips below show which modes may be used: Train, Subway, Tram, Bus, Ferry and Cable car. Switch one off to exclude it; at least one stays on. Then click Search.',
  'help.guide.plan-transit.step.5':
    'Each result shows departure and arrival, how long it takes, how many transfers and how much walking, and the lines as badges, in their own colours when the timetable provides them. Click one to expand it and see each leg, with the stops where you board and change, the platforms and the walks between the lines.',
  'help.guide.plan-transit.step.6': 'Click Add to day.',
  'help.guide.plan-transit.result':
    'The connection is a row on the day with its line badges. Click its chevron to see each leg. It is also a card on the Transports tab among the confirmed rides, shown in blue.',
  'help.guide.plan-transit.tip.1':
    'The connections come from Transitous, a free community service that uses public timetable data: no key, no account. An admin can set the search to use Google instead.',
  'help.guide.plan-transit.tip.2':
    'Nothing found? The feeds cover a region and a period. Try another time, switch more modes on, or pick a station rather than the place itself. The message names the service that answered. A trip without dates has no day to search on, so it offers the ordinary form only.',
  'help.guide.plan-transit.tip.3':
    'The same search opens for a single leg: click the travel-time connector between two stops and choose Public transit. From, To and the departure time are filled in for you.',
  'help.guide.change-transit-route.title': 'Open and change a planned connection',
  'help.guide.change-transit-route.goal': 'Read the connection line by line, rename it, or search for the route again.',
  'help.guide.change-transit-route.step.1':
    'On the Transports tab, a planned connection is a card with a blue top band, listed in time order with the confirmed transports. When Public transit as its own section is switched on under View options, it is shown under Automated public transit instead. Click the card. The connection opens as a booking.',
  'help.guide.change-transit-route.step.2':
    'The tiles at the top show the departure and the arrival with their stops, the Duration, the Transfers and the Walking. Below them, Itinerary shows the connection line by line, with the times, the platforms and the walks between the lines.',
  'help.guide.change-transit-route.step.3':
    'Change route at the bottom of the booking opens the search again, already filled in with the two ends of this connection and its day.',
  'help.guide.change-transit-route.step.4':
    'Click Search, open another connection and click Add to day; it replaces the old one. Edit, at the far right of the bottom of the booking, opens the normal transport form instead, where you can edit the Booking Code, the travelers, the notes and the files.',
  'help.guide.change-transit-route.result':
    'The journey now uses the new itinerary, and its card on the Transports tab shows the new lines and times.',
  'help.guide.change-transit-route.tip.1':
    'Click the title in the header of the booking to rename the connection without changing the route. You write its notes in the transport form that opens with Edit.',
  'help.guide.change-transit-route.tip.2':
    'The bin at the bottom of the booking deletes the connection after a confirmation; the day keeps its stops.',
  'help.guide.leg-travel-mode.title': 'Change how one leg is travelled',
  'help.guide.leg-travel-mode.goal':
    'Set one leg of a driving day to walking, or plan that leg with the transit search.',
  'help.guide.leg-travel-mode.step.1':
    'The connectors between the stops only appear once the day’s route is on. Click the day’s header to open it, then click Route in the bar under its stops.',
  'help.guide.leg-travel-mode.step.2':
    'Each connector shows the travel time and the distance of that leg, with the icon of the mode it was routed in: a car for driving, a foot for walking, a bike for cycling.',
  'help.guide.leg-travel-mode.step.3':
    'Click the connector. The menu offers Driving, Walking and Cycling, Public transit for this one leg, and Use day default.',
  'help.guide.leg-travel-mode.step.4': 'Choose Walking. Only this leg changes; the rest of the day keeps its own mode.',
  'help.guide.leg-travel-mode.result':
    'The leg shows the foot icon and its walking time, and the day’s other legs keep the day’s mode.',
  'help.guide.leg-travel-mode.tip.1':
    'The mode belongs to the leg, not to the day: the Driving, Walking and Cycling buttons of the whole day never overwrite a leg you set by hand. Use day default makes the leg follow those buttons again.',
  'help.guide.leg-travel-mode.tip.2':
    'Public transit in the same menu opens the connection search for exactly this leg, with both ends and the departure time already filled in.',
  'help.guide.leg-travel-mode.tip.3':
    'The times come from a public router over real roads and footpaths. If the router cannot calculate a leg, the leg keeps its straight line and shows no time.',
  'help.guide.transport-details.title': 'Open a transport and use its details',
  'help.guide.transport-details.goal':
    'See all details of a ride in one place, copy its booking code, rename it, or jump to it on the map.',
  'help.guide.transport-details.step.1':
    'On the Transports tab, click a card. Its details open over the tab, with the header in the same colour as the card. A transport’s row in the day plan opens the same details.',
  'help.guide.transport-details.step.2':
    'The pills in the header show the status, the type, the day and the Booking Code. Click the status pill to switch between Pending and Confirmed. The small copy icon in the code’s pill, Copy booking code, copies the code to your clipboard.',
  'help.guide.transport-details.step.3':
    'The tiles below give the departure and the arrival with their stations or airports, then the platform and the seat when they are set. A ride with stops in between lists them under Route, and one booked leg by leg lists each leg’s code under Segment codes. Travelers, Notes, Costs and Files follow; Show in files opens the ticket on the Files tab.',
  'help.guide.transport-details.step.4':
    'Click the title to rename the ride without opening the form. Rename opens with the name filled in: type the new one and click Save.',
  'help.guide.transport-details.step.5':
    'On map at the bottom of the details shows the ride’s line and opens the Plan on its day. Edit at the far right opens the full form, and the bin beside it deletes the ride after you confirm.',
  'help.guide.transport-details.result':
    'The Plan is open on the ride’s day, with its line drawn on the map and the route icon on its row switched on.',
  'help.guide.transport-details.tip.1': 'On map again, on a ride whose line is drawn, switches the line off.',
  'help.guide.transport-details.tip.2':
    'Escape or a click outside the details closes them. If Rename or the delete question is open, that closes first.',
  'help.guide.edit-transport.title': 'Change or delete a transport',
  'help.guide.edit-transport.goal': 'Fix a time, a platform or a booking code, or remove the transport from the trip.',
  'help.guide.edit-transport.step.1':
    'In the day plan a transport is a row between the stops, coloured by its type. Click it to open its booking: the status, the type, the days and the Booking Code (with a button to copy it) as pills at the top, and the departure and arrival times with their airports or stations below.',
  'help.guide.edit-transport.step.2':
    'Edit at the bottom of the booking opens the form that created it, with Edit transport above the title in its header. You can change everything there: the title, the status and type pills, the route, the days and times, the Booking Code.',
  'help.guide.edit-transport.step.3':
    'A flight’s route is a chain of airports, a train’s a chain of stations, a cruise’s a chain of ports. Add stop (Add port on a cruise) puts another one in between, and every leg keeps its own times and its own flight or train number.',
  'help.guide.edit-transport.step.4':
    'Click Update. To remove the transport completely, use the bin at the left of the same bar, the bin at the bottom of its booking or the bin on its card in the Transports tab, and confirm.',
  'help.guide.edit-transport.result':
    'The change shows everywhere the transport appears: the Transports tab, the day it runs on, and its line on the map.',
  'help.guide.edit-transport.tip.1':
    'The same form opens from both places: through Edit in the booking that opens from a row of the day plan, and through the pencil on the card in the Transports tab. A planned public-transit connection opens as a booking too; Change route there opens the search again, and Edit opens this form.',
  'help.guide.edit-transport.tip.2':
    'To move a transport to another day, you do not need the form: drag its row from one day card to the other.',
  'help.guide.transport-on-map.title': 'Show a transport on the map',
  'help.guide.transport-on-map.goal': 'See the actual route of a flight, a drive or a connection.',
  'help.guide.transport-on-map.step.1':
    'A transport with both ends set shows a small route icon on its row in the day plan. Click it; its tooltip changes to Hide booking routes.',
  'help.guide.transport-on-map.step.2':
    'The route is drawn on the map, with a pill marker at each end that shows the transport’s icon.',
  'help.guide.transport-on-map.step.3':
    'Click an end marker and the booking opens over the map. Its header shows the status, the type, the days and the Booking Code. Below them are the times with their airports or stations, the airline and the flight number. Click Close in its header to close it.',
  'help.guide.transport-on-map.step.4':
    'The route icon in the toolbar above the days works for the whole trip at once: Show all booking routes, and Hide all booking routes to hide them again.',
  'help.guide.transport-on-map.step.5':
    'A planned public-transit connection has no route icon of its own. It is drawn with the day’s Route toggle, so Hide all booking routes does not hide it while that day’s route is still on.',
  'help.guide.transport-on-map.result':
    'The routes are shown on the map with a marker at each end, and they stay there until you switch them off.',
  'help.guide.transport-on-map.tip.1':
    'A flight, a cruise and a ferry are drawn as a curve. A car, a bus, a taxi and a bicycle follow the real roads. A train or a planned connection goes through the stations where it stops.',
  'help.guide.transport-on-map.tip.2':
    'A confirmed booking is a solid line, a pending one a dashed one. The Booking route labels setting shows the airport code or the station name in the end markers.',
  'help.guide.transport-on-map.tip.3':
    'Show all booking routes does not add to the routes you already show: it replaces what you set with the single icons. After you press it, all routes are either shown or hidden.',
  'help.guide.export-transports-csv.title': 'Export the transports as a spreadsheet',
  'help.guide.export-transports-csv.goal':
    'Export the trip’s rides from TREK as a CSV file, for a spreadsheet, a travel agent or a print-out.',
  'help.guide.export-transports-csv.step.1':
    'Narrow the list first if you only want part of it. Search, Filter and the sort under View options all count: the file holds what the tab shows, in the order it shows it.',
  'help.guide.export-transports-csv.step.2':
    'Click the spreadsheet icon after View options, whose tooltip reads Export as spreadsheet (CSV).',
  'help.guide.export-transports-csv.result':
    'Your browser saves a file named after the trip, such as autumn-in-japan-transports.csv, with one row per ride: Type, Title, Status, Start, End, From, To, Location, Confirmation and Notes.',
  'help.guide.export-transports-csv.tip.1': 'The icon is only in the bar while the tab holds at least one ride.',
  'help.guide.export-transports-csv.tip.2':
    'The Bookings tab has the same icon and writes a file of its own, which ends in bookings.csv.',
  'help.guide.airtrail-import.title': 'Import flights from AirTrail',
  'help.guide.airtrail-import.goal':
    'Import the flights you already have in AirTrail into the trip at once, and keep them updated from AirTrail after that.',
  'help.guide.airtrail-import.step.1':
    'When the AirTrail addon is on and your instance is connected under Integrations in Settings, the bar of the Transports tab shows a plane icon, Import from AirTrail, before Transport. Click it.',
  'help.guide.airtrail-import.step.2':
    'Import from AirTrail lists the flights of your account in two groups. During this trip contains the flights dated inside the trip, already ticked. Other flights contains the rest, not ticked. A flight that is already in the trip is greyed out and marked Imported.',
  'help.guide.airtrail-import.step.3':
    'Every row is a tick box with the airline and flight number, the two airports and the date. Click a row to include or exclude the flight. Flights under Other flights are imported only when you tick them.',
  'help.guide.airtrail-import.step.4':
    'Connecting flights are grouped together: each one leaves from the airport where the previous one landed, within a day. The checkbox below, Import as one flight with a layover in that airport, is already on. Leave it on for one booking with a stop, or switch it off to import the legs as separate flights.',
  'help.guide.airtrail-import.step.5':
    'Click the button at the bottom right, which shows the number of ticked flights, as in Import 2. The message afterwards says how many flights were imported.',
  'help.guide.airtrail-import.step.6':
    'The flights appear as cards under Confirmed, each with a blue AirTrail pill next to its title, and as rows on the days they run. A connecting flight is one card, and its route goes through the layover.',
  'help.guide.airtrail-import.result':
    'The flights from AirTrail are cards on the Transports tab and rows on their days, each with the AirTrail pill that shows where it came from.',
  'help.guide.airtrail-import.tip.1':
    'A flight that is already in the trip with the same number and date is skipped, and a message says how many were skipped. The undo arrow in the toolbar above the days undoes the whole import.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail remains the main source of the data. TREK reads its changes when you open the trip and every few minutes in the background. A flight deleted in AirTrail keeps its card in TREK, and its label changes to Not synced. Edits made in TREK are sent back to AirTrail only when Write changes back to AirTrail is switched on under Integrations.',
  'help.guide.airtrail-import.tip.3':
    'A joined connection is not one single AirTrail flight that can be synced, so it is a one-time import: it keeps the blue pill, and when you hover over the pill, it tells you this. The same happens to a synced flight when you add a stop to it by hand.',

  // ── Screen: trip-bookings ───────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Bookings',
  'help.ctx.trip-bookings.summary':
    'This tab holds everything booked for the trip except transport: places to stay, tables, tickets, tours and parking. Every booking is a card, a list row or a bar on the timeline, with its code, its documents, its travellers and its cost. Click a booking to open its details.',
  'help.ctx.trip-bookings.bullet.1':
    'Manual Booking at the right end of the bar opens New Reservation. It creates six kinds of bookings: Accommodation, Restaurant, Event, Tour, Parking and Other. Flights, trains and other transport are on the Transports tab and never appear here.',
  'help.ctx.trip-bookings.bullet.2':
    'The download icon before Manual Booking, Import booking confirmations, uploads confirmations so TREK can read them automatically: EML, PDF, PKPass, HTML or TXT, five files of 10 MB at most, and photos when the AI model reads pictures. The icon is only there when the server can read them.',
  'help.ctx.trip-bookings.bullet.3':
    'Search looks through titles, types, places, notes, booking codes and travellers. Filter, the funnel next to it, narrows the tab by Status, by Type with a count for each, and by Travelers once a booking names people. A number on the funnel shows how many filters are active.',
  'help.ctx.trip-bookings.bullet.4':
    'The three icons after Filter switch the view: Cards, List and Timeline. View options, the sliders beside them, groups and sorts cards and list or sets the lanes of the timeline, and the spreadsheet icon after it, Export as spreadsheet (CSV), downloads what the tab shows as a file. By default, cards are grouped into Confirmed and Pending, and the list by day. Click a section’s heading to collapse it.',
  'help.ctx.trip-bookings.bullet.5':
    'A card has a header coloured by its status, with the status dot (a click switches between Pending and Confirmed), the type, the title, the pencil and the bin. Below it, the details the booking has: Date, Time, Booking Code, Check-in and Check-out, Location / Address, Accommodation, Linked to (the stop in the plan), Link, Notes, Travelers, Files and the linked costs.',
  'help.ctx.trip-bookings.bullet.6':
    'A click on a card, a row or a bar opens the booking’s detail, with On map (when the booking has a place), the bin and Edit at its foot. Deleting asks once (Delete booking?, which tells you if costs are deleted with it). Then the booking and its linked expenses are deleted, and for an accommodation its nights are removed from the day plan.',
  'help.guide.booking-views.title': 'Switch the view and open a booking',
  'help.guide.booking-views.goal':
    'See the bookings as cards, as a list or on a timeline, and open one to see all its details.',
  'help.guide.booking-views.step.1':
    'The three icons after Filter in the bar are the views, and each shows its name when you point at it: Cards, List and Timeline. The tab opens in Cards, a card per booking in the sections Confirmed and Pending. Click List, the middle one.',
  'help.guide.booking-views.step.2':
    'List puts one row per booking under a heading per day, with the day and the time on the right; the arrow keys move from row to row. Click Timeline, the last of the three.',
  'help.guide.booking-views.step.3':
    'Timeline shows the bookings across the days of the trip: one lane per type, and a bar from each start to its end. A pending booking has a dashed outline. Trip fits the whole trip into the width; click a day’s heading to see that day by the hour.',
  'help.guide.booking-views.step.4':
    'Day shows one day on an hour scale, and the length of each bar shows its time. The arrows beside the day’s name go to the day before and the day after. While the trip is running, Today jumps to the current day, and the Trip and Day switch at the right goes back to the whole trip.',
  'help.guide.booking-views.step.5':
    'Hover over a bar to see its day, times and place, then click it to open the booking’s detail. A card in Cards and a row in List open the same popup.',
  'help.guide.booking-views.step.6':
    'The header of the detail view shows the title and pills for the status (a click switches it), the type, the day and the booking code, with a button that copies it. Below are the times as tiles, then the place, the travellers, notes, costs and files, if the booking has them, and at the bottom On map, the bin and Edit.',
  'help.guide.booking-views.result':
    'The booking opens in its detail view: Edit opens its form, On map shows it on the plan, and Close or Escape returns you to the view you came from.',
  'help.guide.booking-views.tip.1':
    'View options, the sliders icon after the view icons, lets you group and sort Cards and List with Group by and Sort by. In Timeline it offers One lane per type and Show the other tab. Show the other tab shows the entries of the Transports tab, dimmed, in a thin lane at the top. Reset view restores the defaults, and each tab remembers its view in this browser.',
  'help.guide.booking-views.tip.2':
    'A booking before or after the trip, or without a date, cannot appear on the timeline. It is shown below the chart as a small card under Before the trip, After the trip or No date.',
  'help.guide.booking-views.tip.3':
    'The same detail opens wherever a booking shows up: on the Transports tab, in the day plan, in a day’s details and in a place’s. A click on its title renames the booking.',
  'help.guide.group-sort-bookings.title': 'Group and sort the bookings',
  'help.guide.group-sort-bookings.goal':
    'Arrange the cards or the list by status, by day or by type, in the order you want.',
  'help.guide.group-sort-bookings.step.1':
    'In Cards or List, click View options, the sliders after the three view icons.',
  'help.guide.group-sort-bookings.step.2':
    'Under Group by, pick Status, Day, Type or No grouping. The tab sorts itself into those sections at once.',
  'help.guide.group-sort-bookings.step.3':
    'Under Sort by, pick Date, Title, Type or Status. The row under them flips the order: Earliest first or Latest first for dates, A to Z or Z to A for the rest.',
  'help.guide.group-sort-bookings.step.4':
    'Click a section’s heading to collapse it. The number beside it says how many bookings are inside, and a second click opens it again.',
  'help.guide.group-sort-bookings.result':
    'The bookings appear in the sections and the order you picked, and this browser keeps the choice for the next visit.',
  'help.guide.group-sort-bookings.tip.1':
    'Cards and List keep their own grouping: Cards start in Status, List in Day. A dot on View options shows that something differs from the default, and Reset view at the bottom of the panel restores the default.',
  'help.guide.group-sort-bookings.tip.2':
    'In Timeline the same button holds One lane per type and Show the other tab instead.',
  'help.guide.create-booking.title': 'Create a booking',
  'help.guide.create-booking.goal':
    'Put a restaurant, an event, a tour, a parking space or anything else into the trip by hand.',
  'help.guide.create-booking.step.1':
    'Click Manual Booking at the right end of the bar. New Reservation opens, with the title and two pills in a header at the top.',
  'help.guide.create-booking.step.2':
    'Click the type label in the top band, which reads Other on a new booking, and pick the Booking Type. This tab creates six types: Accommodation, Restaurant, Event, Tour, Parking and Other. The form changes with your choice: only Accommodation uses a range of days instead of dates.',
  'help.guide.create-booking.step.3':
    'Type the title into the band at the top, the field above the pills. It is the only required field, and Add stays greyed out until you enter something.',
  'help.guide.create-booking.step.4':
    'Set Date and Start time, and End date and End time if the booking has an end. The calendars only offer days inside the trip. An end date and time that are not after the start show in red and block Add. An end time before the start time with no end date only warns you: if the booking ends the next day, set an end date.',
  'help.guide.create-booking.step.5':
    'Enter the Booking Code from the confirmation, then click the status pill in the header, next to the type. It shows Pending on a new booking and changes to Confirmed. The status decides which section the card appears in.',
  'help.guide.create-booking.step.6': 'Click Add at the bottom of the form.',
  'help.guide.create-booking.result':
    'The booking appears as a card in its section. The colour of its header shows its status, and the card shows its type, its date and times and its code. Everyone else in the trip sees it at once.',
  'help.guide.create-booking.tip.1':
    'Location / Address offers real addresses while you type; picking one replaces what you wrote, and an address you typed yourself is kept as it is.',
  'help.guide.create-booking.tip.2':
    'In Link, enter the booking’s own page at the provider. The card and the detail view show it as a link that opens in a new tab.',
  'help.guide.create-booking.tip.3':
    'Notes use Markdown, so a list or a bold line is shown as a list or bold text on the card and in the detail view.',
  'help.guide.create-booking.tip.4':
    'Offline, the booking is saved on this device and syncs once you are back online. New files need a connection, so remove them or save later. If you click outside the form by mistake, or press Escape, TREK asks Discard your changes? before anything you typed is lost.',
  'help.guide.booking-hotel.title': 'Book a place to stay',
  'help.guide.booking-hotel.goal':
    'Enter an accommodation so it counts as a booking and as nights in the day plan at once.',
  'help.guide.booking-hotel.step.1':
    'Click Manual Booking and choose Accommodation with the type pill in the top band. The date fields are replaced by a block of hotel fields.',
  'help.guide.booking-hotel.step.2':
    'Pick the hotel under Accommodation. The list contains the trip’s places, without imported tracks and tours. When you pick one, its name goes into an empty title and its address into Location / Address.',
  'help.guide.booking-hotel.step.3':
    'Set From and To: the first night and the morning you leave. Both offer the days of the trip with their dates, and TREK keeps To after From.',
  'help.guide.booking-hotel.step.4':
    'Fill in Check-in, Check-in until and Check-out, and the Booking Code from the confirmation.',
  'help.guide.booking-hotel.step.5': 'Click Add.',
  'help.guide.booking-hotel.result':
    'The card shows the range of days under Date, the check-in and check-out times and the address. The stay now also appears on those days of the plan.',
  'help.guide.booking-hotel.tip.1':
    'Accommodation is the only type without a Date and a Start time. Its dates are From and To, and you pick days of the trip, not calendar dates.',
  'help.guide.booking-hotel.tip.2':
    'Leave Accommodation empty and type the address instead: the place is looked up, created and pinned on the map for you.',
  'help.guide.booking-hotel.tip.3': 'When you delete the booking, its nights are also removed from the day plan.',
  'help.guide.link-booking.title': 'Link a booking to the plan',
  'help.guide.link-booking.goal': 'Link a booking to its stop and its place, so it appears where you need it.',
  'help.guide.link-booking.step.1':
    'Hover over the card you want to link and click the pencil in its header. Edit Reservation opens.',
  'help.guide.link-booking.step.2':
    'Open Link to day assignment. The list shows your plan: a heading for each day, then that day’s stops, numbered and with their times. Pick the stop the booking belongs to.',
  'help.guide.link-booking.step.3':
    'Place / Activity links the place itself. Pick it there, and the title and Location / Address are filled in if they are empty.',
  'help.guide.link-booking.step.4': 'Click Update.',
  'help.guide.link-booking.result':
    'The card shows the day and the stop under Linked to, and the booking appears with that stop in the day plan.',
  'help.guide.link-booking.tip.1':
    'No link (standalone) at the top of the list removes the link again. Accommodation has no stop picker: it is linked through its nights.',
  'help.guide.link-booking.tip.2':
    'Picking a stop on a dated day fills an empty Date for you. A date you have already set is not changed.',
  'help.guide.booking-on-map.title': 'Find a booking on the map',
  'help.guide.booking-on-map.goal': 'Jump from a booking to its place in the plan and on the map.',
  'help.guide.booking-on-map.step.1':
    'Click the card of a booking that has a place, linked under Place / Activity or, for a stay, under Accommodation. Its detail opens.',
  'help.guide.booking-on-map.step.2': 'Click On map at the bottom of the details.',
  'help.guide.booking-on-map.result':
    'The detail closes and the Plan tab opens on the booking’s day, with its place selected on the map.',
  'help.guide.booking-on-map.tip.1':
    'On map is only there for a booking with a place. Pick one under Place / Activity in the form, and the button appears.',
  'help.guide.booking-on-map.tip.2': 'A stay opens on its first night.',
  'help.guide.booking-travelers.title': 'Say who a booking is for',
  'help.guide.booking-travelers.goal': 'Mark which travellers a booking is for, and then show only their bookings.',
  'help.guide.booking-travelers.step.1':
    'Open the booking with the pencil on its card. Travelers is next to the Booking Code. It shows Assign travelers while nobody is assigned to the booking.',
  'help.guide.booking-travelers.step.2':
    'Click it and pick the people this booking is for; named guests are in the list too. A selected person gets a tick and their avatar appears in the field. Click the name again to remove them.',
  'help.guide.booking-travelers.step.3': 'Click Update.',
  'help.guide.booking-travelers.step.4':
    'Click Filter in the bar: under Travelers, click a person to see only their bookings. Several can be on at once.',
  'help.guide.booking-travelers.result':
    'The card lists the people it is for, and Filter narrows the tab to the bookings of the people you pick.',
  'help.guide.booking-travelers.tip.1':
    'On the card and in the detail view, the travellers are only shown; you cannot change them there. You set them here, in the form.',
  'help.guide.booking-travelers.tip.2':
    'Travelers appears in Filter once the trip has more than one member and at least one booking names someone. Your choice is kept until you close the browser tab.',
  'help.guide.booking-files.title': 'Keep the voucher with the booking',
  'help.guide.booking-files.goal': 'Attach the confirmation, the ticket or the pass to the booking it belongs to.',
  'help.guide.booking-files.step.1':
    'Open the booking with the pencil on its card. Files is next to Link; click Attach file there. On a booking that already exists, the document is uploaded immediately and TREK shows File uploaded.',
  'help.guide.booking-files.step.2':
    'The document is listed by its name, with a button to open it and an X next to it.',
  'help.guide.booking-files.step.3':
    'Link existing file offers the documents of the trip that are not on this booking yet. Pick one and it is attached without uploading anything again.',
  'help.guide.booking-files.step.4': 'Click Update.',
  'help.guide.booking-files.result':
    'The card and the details view list the documents under Files. Click a document to open it. Show in files, above the list in the details view, takes you to the Files tab.',
  'help.guide.booking-files.tip.1':
    'On a booking you are still creating, the document is uploaded when you click Add. Uploading needs a connection.',
  'help.guide.booking-files.tip.2':
    'The X next to a document removes the link, not the document. The document stays in the trip’s Files tab.',
  'help.guide.booking-files.tip.3':
    'The administrator sets which file types can be attached, under Allowed File Types. Documents, text and pictures are allowed by default.',
  'help.guide.booking-cost.title': 'Turn a booking’s price into a cost',
  'help.guide.booking-cost.goal': 'Add the cost of a booking to Costs, split between the people who pay for it.',
  'help.guide.booking-cost.step.1':
    'Open the booking with the pencil on its card and go to the bottom of the form. Under Costs you find Create expense and Link existing expense, with the note Saves the booking, then opens the Costs editor.',
  'help.guide.booking-cost.step.2':
    'Click Create expense. The booking is saved, its form closes and the Costs editor opens as Add expense.',
  'help.guide.booking-cost.step.3':
    'The name in the header is already the booking’s title, and Day is already the booking’s day. Put in the Total amount and check the Currency beside it.',
  'help.guide.booking-cost.step.4':
    'The pill in the header is the Category, already set to the one that matches the booking type. Under Who paid? pick who paid, and under Split choose how the amount is shared.',
  'help.guide.booking-cost.step.5': 'Click Add expense.',
  'help.guide.booking-cost.result':
    'The card shows the amount at the bottom, the booking’s form lists the expense under Linked expenses, and the same expense appears in the Costs tab, linked to this booking.',
  'help.guide.booking-cost.tip.1':
    'The category depends on the type: Restaurant becomes Food & drink, Accommodation becomes Accommodation, Parking becomes Parking, and Event and Tour both become Other.',
  'help.guide.booking-cost.tip.2':
    'A booking can have several expenses. Link existing expense offers the expenses in Costs that are not linked to anything yet. On a linked expense, Unlink, keep the expense removes the link and keeps the expense in Costs, while the bin deletes it.',
  'help.guide.booking-cost.tip.3':
    'Costs is in the form only while the Costs addon is on, which the administrator switches under Addons.',
  'help.guide.filter-bookings.title': 'Find a booking',
  'help.guide.filter-bookings.goal': 'Filter a long tab by a word, a status, a type or a person.',
  'help.guide.filter-bookings.step.1':
    'Type into Search in the bar. It searches titles, types, places and addresses, notes, booking codes and the travellers’ names, and the tab shows fewer results as you type. Escape clears the box.',
  'help.guide.filter-bookings.step.2':
    'Click Filter, the funnel next to the search. The panel contains Status, Type and, once a booking has people assigned, Travelers.',
  'help.guide.filter-bookings.step.3': 'Under Status, pick Confirmed or Pending to see only those; All shows both.',
  'help.guide.filter-bookings.step.4':
    'Under Type, click one or more types to keep only those. Each type shows how many bookings it has, and a tick marks the selected ones.',
  'help.guide.filter-bookings.step.5':
    'A number on Filter shows how many filters are on, and a chip next to the search shows how many of all the bookings are left. Click the chip, or Reset filters at the bottom of the panel, to see everything again.',
  'help.guide.filter-bookings.result':
    'The tab shows only what you picked, in Cards, List and Timeline alike, and the filters stay for this trip until you close the browser tab.',
  'help.guide.filter-bookings.tip.1':
    'Type is only shown when the tab has more than one type, and it lists only the types in the tab. So if the tab has no tour, Type has no Tour option.',
  'help.guide.filter-bookings.tip.2':
    'If nothing matches the filter, the tab shows Nothing matches these filters, with Reset filters right below it.',
  'help.guide.export-bookings-csv.title': 'Export the bookings as a spreadsheet',
  'help.guide.export-bookings-csv.goal':
    'Export the trip’s bookings as a CSV file to open in Excel, Numbers or any other spreadsheet.',
  'help.guide.export-bookings-csv.step.1':
    'To export only part of the tab, narrow it first with Search or Filter. The file holds exactly what the tab shows.',
  'help.guide.export-bookings-csv.step.2':
    'Open View options, the sliders after the view icons, and pick an order under Sort by. The rows follow it, one row per booking and without sections.',
  'help.guide.export-bookings-csv.step.3':
    'Click Export as spreadsheet (CSV), the spreadsheet icon after View options.',
  'help.guide.export-bookings-csv.result':
    'Your browser downloads a file named after the trip and the tab, for example autumn-in-japan-bookings.csv, with one row for every booking the tab showed.',
  'help.guide.export-bookings-csv.tip.1':
    'The columns are Type, Title, Status, Start, End, From, To, Location, Confirmation and Notes.',
  'help.guide.export-bookings-csv.tip.2':
    'The columns are separated by semicolons, and Excel opens the file with accents intact.',
  'help.guide.export-bookings-csv.tip.3':
    'The button is there as soon as the tab has a booking. The Transports tab exports its own entries the same way.',
  'help.guide.import-booking-file.title': 'Import a booking from its confirmation',
  'help.guide.import-booking-file.goal':
    'Let TREK read the booking from the email or the PDF the provider sent, so you do not have to type it again.',
  'help.guide.import-booking-file.step.1':
    'Click the download icon in the bar, Import booking confirmations; its name appears when you hover over it. The dialog of the same name opens.',
  'help.guide.import-booking-file.step.2':
    'Drop the confirmations on the box, or click it and pick them: EML, PDF, PKPass, HTML and TXT, up to five files of 10 MB each, and photos (JPG, PNG, WEBP) when the AI model can read pictures. The ones you chose are named on the box.',
  'help.guide.import-booking-file.step.3':
    'Click Import. The dialog closes at once, because the reading happens in the background.',
  'help.guide.import-booking-file.step.4':
    'A card at the bottom right shows the progress under the file’s name. It stays visible while you move through the app and after a reload. Parsing files… changes to a tick when reading is done, and the card offers Import. Click it.',
  'help.guide.import-booking-file.step.5':
    'Every booking that was found opens in New Reservation, one after another, already filled in. For a hotel this is its name as the title and, if the trip has the place, under Accommodation, its Location / Address, From and To on its nights, Check-in and Check-out, the Booking Code, the confirmation under Files and, with Costs on, the price as Linked expense. Check it and click Add.',
  'help.guide.import-booking-file.result':
    'The booking appears as a card in Pending with its nights, its code and the confirmation under Files. The stay appears on those days of the plan. If Costs is on, the price is added as an expense linked to the booking.',
  'help.guide.import-booking-file.tip.1':
    'The import icon is shown only when the server can read confirmations. This needs either the extractor or the AI Parsing addon. The administrator turns the AI Parsing addon on under Addons. A tab with no bookings also shows it as the button Import from file.',
  'help.guide.import-booking-file.tip.2':
    'If nothing could be read, the card tells you. With AI Parsing on, it offers Try AI parsing, which sends the same files directly to the model. A finished parse is kept for ten minutes; start the review within that time.',
  'help.guide.import-booking-file.tip.3':
    'The confirmation is attached only when its type is on the Allowed File Types of the admin settings. PDF is allowed by default; a mail, EML, has to be added first, or the booking is saved without it.',
  'help.guide.import-booking-file.tip.4':
    'Reading a confirmation needs a connection. Offline, Import says so, and you try again once TREK is back online.',
  'help.guide.edit-booking.title': 'Change a booking',
  'help.guide.edit-booking.goal':
    'Correct a time, add the code that arrived later, or move a booking from Pending to Confirmed.',
  'help.guide.edit-booking.step.1':
    'Hover over the card and click the pencil in its header. Edit Reservation opens with all the details of the booking.',
  'help.guide.edit-booking.step.2':
    'Change what needs changing, for example the Booking Code that the operator sent later.',
  'help.guide.edit-booking.step.3':
    'Click the Pending pill in the band at the top. It changes to Confirmed, and the band becomes green.',
  'help.guide.edit-booking.step.4': 'Click Update.',
  'help.guide.edit-booking.result':
    'The card moves: a confirmed booking appears in the Confirmed section with a green dot and a green top band, and everyone in the trip sees it move.',
  'help.guide.edit-booking.tip.1':
    'If you cannot read a Booking Code, Blur Booking Codes is switched on in Settings, under General. Hover over the code, or click it, to read it.',
  'help.guide.edit-booking.tip.2':
    'If you change the type, the category of a linked expense changes with it, unless you picked a category by hand in the Costs editor.',
  'help.guide.edit-booking.tip.3':
    'Edit at the bottom of a booking’s detail view opens the same form. You can also switch the status without any form: click the dot on a card or a row, or the status pill in the detail view.',
  'help.guide.edit-booking.tip.4':
    'If you have changed something, a click outside the form, or Escape, asks Discard your changes? Keep editing takes you back to the form.',
  'help.guide.delete-booking.title': 'Delete a booking',
  'help.guide.delete-booking.goal': 'Remove a cancelled booking from the trip.',
  'help.guide.delete-booking.step.1':
    'Point at the card and click the bin in its header. The bin at the bottom of a booking’s detail does the same.',
  'help.guide.delete-booking.step.2':
    'Delete booking? names the one you picked and says it will be permanently deleted. When costs are linked to it, it says that they are deleted too.',
  'help.guide.delete-booking.step.3': 'Click Delete.',
  'help.guide.delete-booking.result':
    'The card is deleted for everyone in the trip. You cannot undo deleting a booking, so the confirmation question is your last chance to cancel.',
  'help.guide.delete-booking.tip.1':
    'Deleting a booking also removes the expenses linked to it. Deleting an accommodation also removes its nights from the day plan.',
  'help.guide.delete-booking.tip.2':
    'Documents that were attached stay in the trip’s Files tab; only their link to the booking is removed.',

  // ── Screen: trip-lists ──────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Lists',
  'help.ctx.trip-lists.summary':
    'Two lists for one trip: the packing list, with who brings what and how much it weighs, and the to-do list of everything that has to happen before and during the trip. The tab is shown while the Lists addon is on.',
  'help.ctx.trip-lists.bullet.1':
    'Packing List and To-Do in the bar at the top switch between the two and count what is on each; the buttons at the right end of the bar belong to whichever one is open.',
  'help.ctx.trip-lists.bullet.2':
    'The packing list is grouped into lists, for example Documents or Clothing, with any name you choose. Each list is a card. Its header has a grip to drag the whole list to another position, a colour dot, a packed-of-total badge, three dots with Rename, Check All, Uncheck All and Delete List, and an arrow that collapses the card. Add list in the bar above creates a new one.',
  'help.ctx.trip-lists.bullet.3':
    'A row has a drag handle, a checkbox and a name, then a small avatar of the person who brings the item. An item with a quantity above one also gets a packed counter such as 3/10 with a minus and a plus. Then come the quantity as a small badge and, while Bag Tracking is on, the weight in grams and a bag circle, then the bin and a three-dot menu with Move to List, Sharing, Rename and Delete. Controls a row does not use are dimmed until you hover over them.',
  'help.ctx.trip-lists.bullet.4':
    'Shared and My list split the packing list in two: the list everyone sees, and your own. All, Open and Done beside them narrow whichever one is open. A to Z at the far end of the row shows each list’s items in name order, and a second click goes back to your own order. The progress card above counts what is packed.',
  'help.ctx.trip-lists.bullet.5':
    'Apply template and Save as template fill a list or save it, so you do not have to type it. The two icons after them, Export and Import, export the list as a printout, a PDF or a file, and import a list. The red button at the right end of the progress card shows how many items are ticked and removes them.',
  'help.ctx.trip-lists.bullet.6':
    'To-Do has its own sidebar: the progress card, the filters All, My Tasks, Overdue and Done, one row per list, and Add list below them. The tasks are in a card. Its header shows the filter name and the sort order, Priority or Due date. Click a task to open it in the pane on the right. Add new task in the bar opens the New task dialog.',
  'help.guide.packing-categories.title': 'Build the packing list',
  'help.guide.packing-categories.goal':
    'Group what you are taking into lists, add items to them and choose who is responsible for each list.',
  'help.guide.packing-categories.step.1':
    'Click Add list in the bar above the lists. A small dialog opens. Type the name into its top band, where it says List name (e.g. Clothing), and click Add.',
  'help.guide.packing-categories.step.2':
    'The new list starts with a placeholder row that shows only three faint dots. Click Add item at the bottom of the row, type the item into Item name... and press Enter: the first item replaces the placeholder, and the field stays open for the next one.',
  'help.guide.packing-categories.step.3':
    'Rename a row by clicking its name, or with Rename in the three dots at its right end.',
  'help.guide.packing-categories.step.4':
    'The dashed circle with a person in the list’s top band assigns trip members to the list. Pick a name. To remove that person again, click the chip that appears.',
  'help.guide.packing-categories.step.5':
    'The three dots next to the count open more options: Rename, Check All, Uncheck All, and Delete List. Delete List deletes the list and all its items without asking again. The arrow at the far right collapses the list.',
  'help.guide.packing-categories.result':
    'The new list appears in the grid with its items under it and its colour dot, and its badge counts what is already packed.',
  'help.guide.packing-categories.tip.1':
    'A list exists only through its items. If you delete the last item, the row becomes a placeholder so the list keeps its position and its colour; if you delete that row too, the list is deleted.',
  'help.guide.packing-categories.tip.2':
    'When you assign someone to a list, they get a packing notification. This does not change who can see the items. That is set under Sharing, in the three dots menu of a row.',
  'help.guide.packing-categories.tip.3':
    'Two lists may have the same name. TREK keeps them apart internally, so the names stay the way you typed them.',
  'help.guide.arrange-packing-list.title': 'Put the packing list in your order',
  'help.guide.arrange-packing-list.goal':
    'Move whole lists and single items to where you want them, or see each list in name order.',
  'help.guide.arrange-packing-list.step.1':
    'Drag the handle at the left end of a list’s header, before its colour dot, and drop the list onto another card. An outline in your accent colour marks the target card, and the list takes that card’s place for everyone on the trip.',
  'help.guide.arrange-packing-list.step.2':
    'Inside a list, the grip at the left of a row drags that item up or down. A line in your accent colour at the left edge of a row shows where it lands.',
  'help.guide.arrange-packing-list.step.3':
    'A to Z at the far right of the row with Shared and My list shows each list’s items in name order, so you can quickly see whether something is already on it. Click it again to go back to your own order.',
  'help.guide.arrange-packing-list.result':
    'The lists are in the order you dragged them into, and the items are sorted A to Z until you switch this off. TREK still saves your own order.',
  'help.guide.arrange-packing-list.tip.1':
    'While A to Z is on, you cannot drag items, but you can still drag whole lists.',
  'help.guide.arrange-packing-list.tip.2':
    'TREK remembers A to Z in this browser, so the list opens sorted next time too. It only changes what you see, never the order the others see.',
  'help.guide.check-off-packing.title': 'Tick things off while you pack',
  'help.guide.check-off-packing.goal': 'Mark what is in the bag, follow the progress bar, and remove the packed items.',
  'help.guide.check-off-packing.step.1':
    'Click the box at the left of a row. The name is struck through and the progress bar updates.',
  'help.guide.check-off-packing.step.2':
    'The progress card above the lists shows how many items are packed out of all items on the list, as a number, as a percentage and as a bar.',
  'help.guide.check-off-packing.step.3':
    'To check a whole list at once: the three dots in its header have Check All and Uncheck All.',
  'help.guide.check-off-packing.step.4':
    'All, Open and Done next to Shared and My list filter the grid. Open shows only what is still missing, so a list that is fully packed is hidden.',
  'help.guide.check-off-packing.step.5':
    'The red Remove … checked button at the right end of the progress card, with the number of ticked items in it, deletes all of them at once after one confirmation from the browser.',
  'help.guide.check-off-packing.result':
    'Only open items are listed, and the bar above shows how much of the packing is done.',
  'help.guide.check-off-packing.tip.1': 'A ticked item can still be renamed: click its name.',
  'help.guide.check-off-packing.tip.2':
    'Check All and Uncheck All work on one list at a time, from that list’s own three dots.',
  'help.guide.check-off-packing.tip.3':
    'When every item is checked the counter is replaced by All packed! and the bar turns green.',
  'help.guide.check-off-packing.tip.4':
    'For an item with a quantity above one, you can also mark the pieces as packed one by one. See Pack several of one thing.',
  'help.guide.count-packed-pieces.title': 'Pack several of one thing',
  'help.guide.count-packed-pieces.goal': 'Give an item a quantity and mark its pieces as packed one by one.',
  'help.guide.count-packed-pieces.step.1':
    'Click the quantity badge in a row, the small number with an x after it, type how many you take, for example 5, and press Enter.',
  'help.guide.count-packed-pieces.step.2':
    'A counter appears before the quantity: 0/5, with a minus and a plus. Click the plus for every piece that goes into the bag.',
  'help.guide.count-packed-pieces.step.3':
    'While only some of the pieces are packed, the counter is in your accent colour and the checkbox has an outline in that colour. Click the minus to remove a piece from the count.',
  'help.guide.count-packed-pieces.step.4':
    'Once the counter reaches the quantity, the item is ticked off automatically and counts as packed.',
  'help.guide.count-packed-pieces.result':
    'The row shows how many of the pieces are packed, and the item is ticked off once the last one is in.',
  'help.guide.count-packed-pieces.tip.1':
    'Ticking the box packs all the pieces at once, and unticking it unpacks them all again.',
  'help.guide.count-packed-pieces.tip.2':
    'With Bag Tracking on, Packed in the Bags card counts only the pieces already counted in.',
  'help.guide.count-packed-pieces.tip.3': 'A quantity of one shows no counter; it only has the tick box.',
  'help.guide.apply-packing-template.title': 'Apply a packing template',
  'help.guide.apply-packing-template.goal':
    'Add a ready-made list to the trip, and save this trip’s list for the next trip.',
  'help.guide.apply-packing-template.step.1': 'Click Apply template in the bar above the list.',
  'help.guide.apply-packing-template.step.2':
    'Pick a template. Each line shows its name and how many items it contains.',
  'help.guide.apply-packing-template.step.3':
    'The items are added to the view you are in: Shared adds them to the shared list everyone sees, My list adds them to your own list.',
  'help.guide.apply-packing-template.step.4':
    'To keep this trip’s list for the next trip, click Save as template. A small dialog opens. Type a name into the field at the top, where Template name is shown, and click Save.',
  'help.guide.apply-packing-template.result':
    'The template’s lists and items are added to the trip, next to what was already there.',
  'help.guide.apply-packing-template.tip.1':
    'A template copies each item’s list, quantity, weight and bag, and creates a bag the trip does not have yet. Ticks are not copied, and nothing already on the list is removed.',
  'help.guide.apply-packing-template.tip.2':
    'Apply template is only there once a template exists. Without one the button does not appear at all.',
  'help.guide.apply-packing-template.tip.3':
    'Save as template appears for an instance admin only, and only while the list has items. It saves the shared items plus your own items, never another member’s private items.',
  'help.guide.import-packing-list.title': 'Paste a whole packing list',
  'help.guide.import-packing-list.goal': 'Turn a list you already have somewhere else into packing items at once.',
  'help.guide.import-packing-list.step.1':
    'Click Import, the icon with the down arrow at the right end of the bar above the list.',
  'help.guide.import-packing-list.step.2':
    'One item per line: Category, Name, Weight in g (optional), Bag (optional), checked/unchecked (optional). The grey sample in the box shows all four formats, and the numbers on its left edge count the lines you type. A Markdown list works too: a heading names the list, and "- [ ]" and "- [x]" become items.',
  'help.guide.import-packing-list.step.3':
    'Or load the lines from a file with Load CSV/TXT/MD, at the bottom left of the dialog. It takes a .csv, a .txt or a .md file and replaces whatever is in the box.',
  'help.guide.import-packing-list.step.4':
    'Click Import 3 at the bottom right; the number on it counts the lines TREK understood.',
  'help.guide.import-packing-list.result':
    'Every line becomes a row, in the list named in its first field. Items that were already there do not change.',
  'help.guide.import-packing-list.tip.1':
    'Commas, semicolons and tabs all separate fields, and double quotes keep a field together, so "Shirt, blue" stays one name. A line with a single value is just a name. A line without its own list goes into Other. "3x" in front of a name sets the quantity.',
  'help.guide.import-packing-list.tip.2':
    'If the trip does not have the bag named in the fourth field yet, TREK creates it. Import and Apply template are the two ways to add weights and bags for many items at once.',
  'help.guide.export-packing-list.title': 'Print or export the packing list',
  'help.guide.export-packing-list.goal':
    'Print the list, save it as a PDF, or export it as a file for another app or the next trip.',
  'help.guide.export-packing-list.step.1':
    'Click Export, the icon with the up arrow in the bar above the list, just before Import.',
  'help.guide.export-packing-list.step.2':
    'Markdown checklist (.md) and CSV for import (.csv) save the list as a file right away.',
  'help.guide.export-packing-list.step.3':
    'Click Print or save as PDF. The preview shows the list as a page: the trip, its dates and how much is packed on top, then every list as a card, each item with a box to tick.',
  'help.guide.export-packing-list.step.4':
    'Click Print or save as PDF under the preview. The browser opens its print dialog: pick a printer, or Save as PDF to save a file.',
  'help.guide.export-packing-list.result':
    'The printout and the files contain the view that is open, Shared or My list, with the quantities, weights and checkmarks.',
  'help.guide.export-packing-list.tip.1':
    'The CSV is the format Import reads, bags included, so you can use it as your own packing template: import it into the next trip.',
  'help.guide.export-packing-list.tip.2':
    'The Markdown file opens as a checklist in Obsidian, Notion or GitHub, and you can import it again with Import.',
  'help.guide.share-packing-item.title': 'Decide who sees an item and who brings it',
  'help.guide.share-packing-item.goal':
    'Move an item between the group pool, your own list and the people you are bringing it for.',
  'help.guide.share-packing-item.step.1':
    'Above the lists, Shared is the list everyone sees and My list is your own. Each shows how many items it has. Click My list to see yours.',
  'help.guide.share-packing-item.step.2': 'Back in Shared, open the three dots at the end of a row and click Sharing.',
  'help.guide.share-packing-item.step.3':
    'There are three levels: Shared, visible to everyone in the group; Personal, which only you can see; and Shared with…, where you pick the people the item is for.',
  'help.guide.share-packing-item.step.4': 'A Personal item is only on My list. Switch to My list to find it.',
  'help.guide.share-packing-item.step.5':
    'Open Sharing again and tick a name under Shared with…. The item shows on that person’s list too, and the row gets a small badge counting the people it is shared with.',
  'help.guide.share-packing-item.result': 'The item is in the tier you chose, and the row shows who is bringing it.',
  'help.guide.share-packing-item.tip.1':
    'Only the person bringing an item can change its sharing. Someone you shared it with sees it on their own My list with a small hand badge, which shows your name when they hover over it. They can tick it off.',
  'help.guide.share-packing-item.tip.2':
    'On a shared item that somebody else brings, the three-dot menu shows two other entries instead of Sharing: I can bring that too, which adds you next to them, and Copy to my list, which makes a private copy for you.',
  'help.guide.share-packing-item.tip.3':
    'New items get their sharing from the view where you add them. Items added in Shared are shared with everyone. Items added in My list are Personal, unless every item of that list is shared with the same people: then the new item is shared with them too.',
  'help.guide.packing-bags.title': 'Weigh the bags',
  'help.guide.packing-bags.goal':
    'Add a weight to every item, sort the items into bags and keep each bag under its airline limit.',
  'help.guide.packing-bags.step.1': 'Click the weight badge before the circle and type the item’s weight in grams.',
  'help.guide.packing-bags.step.2': 'The circle after the weight is the item’s bag. Click it.',
  'help.guide.packing-bags.step.3':
    'If there is no bag yet, click Add bag, type a name and press Enter. The bag is created and the item is put into it.',
  'help.guide.packing-bags.step.4':
    'The Bags card appears to the right of the lists as soon as one bag exists. Each bag shows its name, who carries it, a fill bar, how many items are in it and its weight. Under the bags come Unassigned and Total weight, with Packed below it: the weight already packed, and a thin bar for its share.',
  'help.guide.packing-bags.step.5':
    'Click Set limit next to the bag’s weight and type the limit in kilograms, as airlines state it.',
  'help.guide.packing-bags.step.6':
    'The dashed plus at the end of the bag’s name line, just before the cross, opens Assign members. Tick the members who carry the bag: they appear beside the plus, and Per person at the foot of the card lists what each of them carries.',
  'help.guide.packing-bags.result':
    'The Bags card on the right shows each bag’s weight against its limit, what is in no bag, what each person carries, and the total with how much of it is packed.',
  'help.guide.packing-bags.tip.1':
    'The weight field, the bag circle and the Bags card only exist while an admin has Bag Tracking switched on under the Lists addon. On a narrower window the bags open from the Bags button above the progress card instead.',
  'help.guide.packing-bags.tip.2':
    'The server calculates a bag’s weight from every member’s items, including the ones you cannot see, so the number is the real weight of the bag.',
  'help.guide.packing-bags.tip.3':
    'A bag without a limit is compared with the heaviest bag, so you can compare the bars. If you give the bag a limit, its bar is measured against that limit instead.',
  'help.guide.packing-bags.tip.4':
    'The weight of a bag carried by several people is split evenly between them under Per person. This weight has a dotted underline and shows a note about this when you point at it.',
  'help.guide.create-todo.title': 'Add a task',
  'help.guide.create-todo.goal': 'Write down a task, with a list, a priority, a date and an assigned person.',
  'help.guide.create-todo.step.1': 'Click Add new task at the right end of the bar.',
  'help.guide.create-todo.step.2':
    'The New task dialog opens with the cursor in its header. Type the name in the Task name field, and add anything you want to remember under Description.',
  'help.guide.create-todo.step.3':
    'List groups the task. Pick one, or use the plus next to it to name a new one in a small dialog.',
  'help.guide.create-todo.step.4': 'Priority has four buttons: None, P1, P2 and P3, from red to blue.',
  'help.guide.create-todo.step.5':
    'Due date, next to List, opens a calendar, and Assigned to assigns the task to a person.',
  'help.guide.create-todo.step.6': 'Click Create task.',
  'help.guide.create-todo.result':
    'The task is in the list with the priority, the due date and the list as badges and the assignee’s avatar at the end of the row, and it opens in the pane on the right.',
  'help.guide.create-todo.tip.1':
    'Only the name is required. Everything else can be filled in later from the pane on the right.',
  'help.guide.create-todo.tip.2': 'With a list selected in the sidebar, a new task starts in that list.',
  'help.guide.create-todo.tip.3':
    'Enter in the name field creates the task straight away, without touching the other fields.',
  'help.guide.todo-filters.title': 'Find and change a task',
  'help.guide.todo-filters.goal': 'Show only the tasks that matter now, then edit the task you found.',
  'help.guide.todo-filters.step.1':
    'Tasks in the sidebar: All shows everything still open, My Tasks shows what is assigned to you, Overdue shows tasks with a date in the past, and Done shows finished tasks. Each shows its count. Click Overdue.',
  'help.guide.todo-filters.step.2':
    'Under Lists there is one row per list. Pick one to show that list, finished tasks included.',
  'help.guide.todo-filters.step.3':
    'The sort at the top of the list changes the order of what is on screen: Priority puts P1 first, Due date puts the nearest deadline first. You can use only one of the two at a time, and a second click goes back to your own order.',
  'help.guide.todo-filters.step.4': 'Click a task to open it in the pane on the right.',
  'help.guide.todo-filters.step.5':
    'Change what you need: the name, Priority, List, Due date or Assigned to. Description shows its text with working links; click into it to edit. Then click Save changes at the bottom of the pane. The box in the pane’s header marks the task as done, and Delete beside Save changes deletes it at once.',
  'help.guide.todo-filters.result':
    'The list shows only the tasks you asked for, and the pane on the right edits the one you picked.',
  'help.guide.todo-filters.tip.1':
    'A list row counts only the open tasks, but when you select it, the finished tasks are shown too. All, My Tasks and Overdue hide finished tasks; Done shows only finished tasks.',
  'help.guide.todo-filters.tip.2':
    'Priority and Due date in the sort cannot be used together. While either one is on, you cannot drag the rows into your own order.',

  // ── Screen: trip-costs ──────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Costs',
  'help.ctx.trip-costs.summary':
    'The trip’s money: every expense in a dated ledger or a table, who entered it and who owes for it, in the currency of the receipt. The right-hand column shows who has to pay whom to settle the balance.',
  'help.ctx.trip-costs.bullet.1':
    'The bar at the top shows the trip’s dates and the travelers the costs are shared between. It also contains Search expenses…, Filter (the funnel), Export CSV (the download icon) and the List / Table switch.',
  'help.ctx.trip-costs.bullet.2':
    'At its right end, Settle up records every open transfer at once, Scan receipt fills in an expense from a photo when the AI Parsing addon can read images, and Add expense opens the editor.',
  'help.ctx.trip-costs.bullet.3':
    "Four cards under the bar: You owe and You're owed are your own side of the settlement, Outstanding amount is what is recorded but has no payer yet, and Total trip spend adds everything up, with Your share and You paid under it.",
  'help.ctx.trip-costs.bullet.4':
    'The ledger is grouped by day, newest first, each day headed by how many entries it holds and what was spent on it. A row shows the category as a coloured tab, the name, the payer chips with what each paid, and under them Split with every traveler’s part (a tick marks who has paid theirs), then the note and the amount, plus you lent or you borrowed when the split means that others owe you money or you owe money.',
  'help.ctx.trip-costs.bullet.5':
    'The right-hand column shows the results: Settle up lists who pays whom, Balances shows each traveler’s surplus or deficit, Final budget shows what the trip costs each of them, and By category shows what the money was spent on.',
  'help.ctx.trip-costs.bullet.6':
    'A recorded payment appears in the same ledger as its own row, with a pencil and Undo beside it. An expense has a pencil and a bin, and the bin asks before it deletes the expense. An expense with receipts has a Receipt chip beside its name that opens them.',
  'help.ctx.trip-costs.bullet.7':
    'Table in the bar shows the same expenses as a sheet, grouped by category, with Persons and Days and the amount per person and per day. Summary then replaces By category. Costs remembers the view you picked.',
  'help.guide.add-expense.title': 'Add an expense',
  'help.guide.add-expense.goal': 'Record what something cost, who paid it and who it is shared with.',
  'help.guide.add-expense.step.1':
    'Click Add expense at the right end of the bar. The editor opens, dated today, paid by you and with everybody already in the split.',
  'help.guide.add-expense.step.2':
    'Type what the expense was for in the field at the top of the dialog. While it is empty, it shows e.g. Dinner, souvenirs, gas…. This is the name of the expense, and you cannot save the expense without one.',
  'help.guide.add-expense.step.3':
    'The pill under the name is the Category, Food & drink until you pick another. There are fourteen and they cannot be changed. The header changes to the colour of the category you pick, and so do the tab on the row and its bar in By category.',
  'help.guide.add-expense.step.4':
    'Enter the amount from the receipt into Total amount. Currency next to it is first set to the currency that Costs is shown in; if you change it, the editor shows the converted amount. Day is first set to today, and the expense is grouped under this day in the list.',
  'help.guide.add-expense.step.5':
    'Under Who paid?, click the person who actually paid. You is preselected. No one paid yet records the amount without anyone owing money for it, and Multiple people paid in the switch next to the heading splits the bill between several payers.',
  'help.guide.add-expense.step.6':
    'Split below starts on Equally, with everyone ticked and each share next to the name. Keep it or change it. Click Add expense at the bottom of the dialog to save.',
  'help.guide.add-expense.result':
    'The expense is in the ledger under its day, counted into Total trip spend, and the settle-up column has recalculated who owes whom.',
  'help.guide.add-expense.tip.1':
    'If you do not change the defaults, the expense is dated today, paid by you and split equally between everyone: only the name and the amount have to be filled in.',
  'help.guide.add-expense.tip.2':
    'The ± next to the amount turns the expense into a refund. A negative total means money is paid back, and the split is reversed.',
  'help.guide.add-expense.tip.3':
    'Attach, beside Receipts & Invoices at the bottom of the dialog, takes images and PDFs. They are uploaded when you save and are stored in the trip’s Files, and a Receipt chip appears beside the name in the list.',
  'help.guide.expense-payers.title': 'Set who paid',
  'help.guide.expense-payers.goal':
    'Record who paid for an expense. This is the other half of the settlement calculation.',
  'help.guide.expense-payers.step.1':
    'Open an expense with the pencil next to its row and look at Who paid?. One person paid is the default in the switch next to the heading: every traveler is a chip, and the outlined chip is the person who paid. Click another chip to change it.',
  'help.guide.expense-payers.step.2':
    'No one paid yet, the dashed chip after the travelers, records the amount without making anyone owe anything. The expense still counts toward Total trip spend.',
  'help.guide.expense-payers.step.3':
    'Multiple people paid, the other option of that switch, lists every traveler with a box to tick, and each ticked person gets an amount field. Tick the people who paid and type how much each of them paid; the amounts must add up to the total.',
  'help.guide.expense-payers.step.4':
    'An expense nobody has paid for is marked Unfinished on its row and counted in the Outstanding amount card, which adds up the spending that has no payer yet.',
  'help.guide.expense-payers.result':
    'Who paid decides who gets paid back, the split decides who pays, and Balances is the difference between the two.',
  'help.guide.expense-payers.tip.1':
    'Who paid? and Split are independent: you can pay for a dinner you were not at, and be split into one you did not pay for.',
  'help.guide.expense-payers.tip.2':
    'With several payers, the amounts must add up to the total. When you tick one more payer, the rest is split again among the amounts you have not typed yourself. While the amounts do not match, the editor shows the total they must add up to and does not save.',
  'help.guide.expense-payers.tip.3':
    'Setting an expense back to No one paid yet does not remove it: the amount stays in Total trip spend and the row becomes Unfinished.',
  'help.guide.split-expense.title': 'Split a bill between the travelers',
  'help.guide.split-expense.goal':
    'Decide who owes for an expense: everyone equally, by amount, or item by item from the receipt.',
  'help.guide.split-expense.step.1':
    'In the expense editor, Split lists every traveler with a box to tick. Untick a name to leave them out of this expense: the name greys out, loses its share and owes nothing for it.',
  'help.guide.split-expense.step.2':
    'Equally, in the switch next to the heading, is the default: every ticked traveler gets the same share, shown next to the name. The badges under the list show how many people share it and how much each share is.',
  'help.guide.split-expense.step.3':
    'Custom replaces the shares with amount fields. Type what each traveler owes. The badge underneath updates as you type and turns green with Split matches total. You cannot save while the amounts do not match the total.',
  'help.guide.split-expense.step.4':
    'Ticket splits the receipt line by line: Add item, then a name and a price per line, and next to Splitting: the travelers who share that line.',
  'help.guide.split-expense.step.5':
    'Individual shares under the lines shows what each traveler owes in the end, and Total amount at the top is the sum of the lines. Click Save at the bottom of the dialog.',
  'help.guide.split-expense.result':
    'All balances are calculated from the split. It is saved with the expense, shows on its row as Split with each traveler’s part, and can be changed later without changing anything else.',
  'help.guide.split-expense.tip.1':
    'A traveler you untick owes nothing for this one expense; the others pay their share.',
  'help.guide.split-expense.tip.2':
    'Equally splits to the exact cent: the extra cent goes to a different person on each expense, so the same person does not always pay it.',
  'help.guide.split-expense.tip.3':
    'Ticket mode calculates Total amount itself and greys the field out: the total is the sum of the receipt’s lines.',
  'help.guide.split-expense.tip.4':
    'A custom split can also be entered in percent: switch Enter shares as to %, and the shares have to make 100 % together before the expense saves.',
  'help.guide.expense-currency.title': 'Enter an expense in another currency',
  'help.guide.expense-currency.goal': 'Enter the amount on the receipt, and TREK saves the exchange rate.',
  'help.guide.expense-currency.step.1':
    'Open Add expense. Type the name at the top of the dialog and enter the amount in Total amount exactly as it is on the receipt, not a converted amount.',
  'help.guide.expense-currency.step.2':
    'Open Currency next to the amount and pick the currency of the receipt. The list contains every code TREK knows and you can search it: type the three letters.',
  'help.guide.expense-currency.step.3':
    'A row of badges appears under the fields: the amount you typed and its current value, marked live rate. This is only a preview. It is not the value that is saved.',
  'help.guide.expense-currency.step.4':
    'Click Add expense at the bottom of the dialog. The rate is fixed at that moment: this expense keeps the value it had on the day you entered it.',
  'help.guide.expense-currency.step.5':
    'In the ledger, the row shows both amounts under the name: what you typed, an arrow, and the amount in the trip’s currency. Every total, balance and settle-up on the Costs tab uses the second amount.',
  'help.guide.expense-currency.result':
    'The expense keeps the amount and the currency you typed. The ledger shows both, and the trip’s totals and balances are counted in the trip’s currency.',
  'help.guide.expense-currency.tip.1':
    'The rate is fixed when you save, so a settled debt does not change when the exchange rate changes the week after. A new rate is saved only when you change the expense’s currency.',
  'help.guide.expense-currency.tip.2':
    'Display currency in Settings changes only how amounts are shown. The stored amounts never change. If it is empty, every trip is shown in its own currency.',
  'help.guide.expense-currency.tip.3':
    'The trip currency is set on the trip itself, under Edit Trip, and needs the Edit trip details permission. If you change it, every frozen rate is recalculated for the new currency. The amounts themselves are not converted.',
  'help.guide.expense-receipts.title': 'Attach a receipt to an expense',
  'help.guide.expense-receipts.goal':
    'Keep the receipt or invoice with the expense it belongs to, and open it again from the ledger.',
  'help.guide.expense-receipts.step.1':
    'Click the pencil beside the expense’s row. The editor opens on it, with Receipts & Invoices near the bottom.',
  'help.guide.expense-receipts.step.2':
    'Click Attach beside Receipts & Invoices and pick the photo or the PDF; you can also pick several at once. Each file is listed under the heading, with a bin to remove it.',
  'help.guide.expense-receipts.step.3':
    'Click Save at the bottom of the dialog. The files are uploaded with the expense and also appear in the trip’s Files.',
  'help.guide.expense-receipts.step.4':
    'Back in the ledger, the row has a Receipt chip beside its name, with the number in brackets when there are several. Click it to open the receipt.',
  'help.guide.expense-receipts.step.5':
    'The preview shows the receipt, with Open in new tab and Download at the top. With several receipts, the arrow keys move between them, and Esc closes the preview.',
  'help.guide.expense-receipts.result':
    'The receipt is saved with the expense: the chip on its row opens it, and the file is in the trip’s Files as well.',
  'help.guide.expense-receipts.tip.1':
    'In the editor, a click on a listed file’s name opens the same preview. Esc then closes only the preview, not the expense.',
  'help.guide.expense-receipts.tip.2':
    'The bin beside a receipt removes it from the expense when you save. The file itself stays in Files; delete it there to remove it completely.',
  'help.guide.expense-receipts.tip.3':
    'Attaching needs a connection and the permission to upload files, because a receipt is stored as one of the trip’s files.',
  'help.guide.filter-costs.title': 'Find an expense, or one day’s spending',
  'help.guide.filter-costs.goal': 'Filter a long list of expenses to show only what you are looking for.',
  'help.guide.filter-costs.step.1':
    'Type into Search expenses… in the bar. It matches the expense’s name as you type, and Esc clears it again.',
  'help.guide.filter-costs.step.2':
    "Filter, the funnel next to the search, opens the filters. The switch at the top is your own view of the ledger: All, Paid by me for what you paid for, and I'm owed for the expenses where you paid more than your share.",
  'help.guide.filter-costs.step.3':
    'Under Category, pick one of the fourteen categories, and only that category’s expenses are shown. The funnel shows how many filters are on.',
  'help.guide.filter-costs.step.4':
    'Under Day, pick one of the days with expenses. A banner replaces the day headers and shows that day in full, how many expenses it has and its total.',
  'help.guide.filter-costs.step.5':
    'Export CSV, the download icon next to the funnel, saves every expense to a file, with the original amount, its currency and the converted amount.',
  'help.guide.filter-costs.result':
    'You can combine the filters, and the day groups update with their own totals for the expenses that remain.',
  'help.guide.filter-costs.tip.1':
    "Recorded payments have no name and no category, so a search or a category filter hides them, and so does I'm owed. The day filter keeps them, under the day the payment happened.",
  'help.guide.filter-costs.tip.2':
    'Export CSV always exports every expense, whatever is filtered on screen, one row per expense.',
  'help.guide.filter-costs.tip.3':
    'Reset filters, at the bottom of the filter menu once a filter is on, switches them all off at once.',
  'help.guide.settle-up.title': 'See who owes whom and settle the debts',
  'help.guide.settle-up.goal':
    'Turn many shared expenses into the fewest transfers that settle all debts, and record the transfers when they are made.',
  'help.guide.settle-up.step.1':
    'The Settle up card in the right-hand column lists the transfers that would settle all debts: who pays whom, shown as two avatars with the names in their tooltip, and how much. The number in its header shows how many are still open.',
  'help.guide.settle-up.step.2':
    'Settle next to a transfer records it as done. The transfer disappears from the card and the balances are updated.',
  'help.guide.settle-up.step.3':
    'The recorded transfer is a row in the ledger, under the day it happened, marked Payment with the two travelers and the amount.',
  'help.guide.settle-up.step.4':
    'Next to that row, the pencil corrects a payment and Undo cancels it, and the transfer goes back to the Settle up card.',
  'help.guide.settle-up.step.5':
    'Add payment in the card’s header records a transfer that did not follow a suggestion. Pick From and To, the amount, its currency and the day it happened, add a Note such as how it was paid if you like, then click Add payment at the bottom of the dialog.',
  'help.guide.settle-up.step.6':
    'Settle up in the bar at the top records every open transfer at once, without asking, for example when the group settles all debts at the end of a trip.',
  'help.guide.settle-up.result':
    "Every recorded transfer is a row in the ledger and removes a line from the Settle up card. When the card shows Everyone's square, the trip is fully paid.",
  'help.guide.settle-up.tip.1':
    'The card shows the fewest transfers, not every debt: if three people owe each other in a circle, this is reduced to one or two payments.',
  'help.guide.settle-up.tip.2':
    'Settle only records a transfer. It does not send money. Pay with your usual payment method, then click Settle.',
  'help.guide.settle-up.tip.3':
    'A payment can be made in any currency, so paying a yen debt in euros is normal: the dialog has its own currency picker and freezes that rate too.',
  'help.guide.final-budget.title': 'See what the trip cost each traveler',
  'help.guide.final-budget.goal': 'See the figures for each person: the balance today, and the real cost per person.',
  'help.guide.final-budget.step.1':
    'Balances shows every traveler’s position: a green bar to the right if the trip owes them, a red bar to the left if they owe it, and the amount next to the name.',
  'help.guide.final-budget.step.2':
    'Final budget below it answers a different question: not who owes what right now, but what the trip costs each traveler once everything has been paid back.',
  'help.guide.final-budget.step.3':
    'Click a name to see the calculation: Expenses paid, then Net reimbursements and Pending reimbursements under it.',
  'help.guide.final-budget.step.4':
    "Below the three lines, there is a list under each traveler's name with the rows that make up that line: the expenses that traveler paid for, the transfers already recorded and the transfers still open. Each list adds up exactly to the line with the same name.",
  'help.guide.final-budget.result':
    'Balances shows who is owed money and who owes money today. Final budget shows what the trip costs each of you once everything is paid back.',
  'help.guide.final-budget.tip.1':
    'Recording a payment does not change anyone’s final budget. It only moves an amount from pending reimbursements to net reimbursements.',
  'help.guide.final-budget.tip.2':
    'An expense with no payer stays out of both cards, the same way it stays out of the settle-up suggestions.',
  'help.guide.final-budget.tip.3':
    'Someone who has left the trip keeps a row in Balances and Final budget as long as money is still owed to them or by them.',
  'help.guide.expense-from-booking.title': 'Turn a booking into an expense',
  'help.guide.expense-from-booking.goal':
    'Attach what a flight, a hotel or a place actually cost to the record it belongs to.',
  'help.guide.expense-from-booking.step.1':
    'Find the booking on the Transports or Bookings tab and click the pencil at the top of its card.',
  'help.guide.expense-from-booking.step.2':
    'Scroll to Costs near the end of the form. It has Create expense, which saves the booking first, and Link existing expense for an expense that is already in Costs.',
  'help.guide.expense-from-booking.step.3':
    'Click Create expense. The booking is saved, the form closes, and the Costs editor opens with the booking’s title as the name, its type matched to a category and the booking’s day as the expense’s day.',
  'help.guide.expense-from-booking.step.4':
    'Fill in the amount and its currency, who paid and the split as for any expense, and click Add expense. When you open the booking again, the expense is shown under Linked expenses, with a pencil to edit it, Unlink, keep the expense to remove the link but keep the expense, and a bin to delete it.',
  'help.guide.expense-from-booking.result':
    'The booking shows its cost, and the expense is a normal row on the Costs tab, with a payer, a split and a currency like any other.',
  'help.guide.expense-from-booking.tip.1':
    'Deleting the booking also deletes its linked expenses, and the confirmation question tells you this. Remove expense in the booking’s Costs block does the opposite: it deletes the expense and keeps the booking. Unlink, keep the expense keeps both.',
  'help.guide.expense-from-booking.tip.2':
    'A place has the same block in its form, with Create expense saving the place first.',
  'help.guide.costs-table.title': 'Plan the costs in a table',
  'help.guide.costs-table.goal':
    'Read and change the expenses as a table, sorted by category and calculated per person and per day.',
  'help.guide.costs-table.step.1':
    'Click Table, the second icon of the List / Table switch in the bar. A table of the same expenses replaces the ledger, and the search and the filters apply to it too.',
  'help.guide.costs-table.step.2':
    'The table is grouped by category. Each group header shows its name, how many expenses it has and its subtotal; click the header to collapse the group. The columns are Name, Date, Total, Persons and Days, then Per Person, Per Day and P. p / Day, calculated from them on a grey background. A Total row at the bottom adds them all up.',
  'help.guide.costs-table.step.3':
    'Click a cell to change it directly: a name, a total, Persons or Days. Type, then press Enter or click elsewhere to save it, or press Esc to cancel; the date opens the calendar. Per Person and the other calculated columns update immediately.',
  'help.guide.costs-table.step.4':
    'A total with a lock cannot be changed here: someone paid it, or it was entered in another currency, and its tooltip says which. Clicking it opens the expense instead, so the balances and the fixed exchange rate stay correct.',
  'help.guide.costs-table.step.5':
    'Add expense at the end of a category adds a row named New Entry to it, with the date of the latest entry there. The name field is already open so you can change it. Enter a total the same way.',
  'help.guide.costs-table.step.6':
    'In this view the right-hand column shows Summary in place of By category. It adds the expenses up four ways: Category, Day, Payer, with No payer yet for the unpaid ones, and Status, Paid against Open.',
  'help.guide.costs-table.result':
    'Every expense is shown in its category with its amount per person and per day. When you change a total in a cell, the cards above and Summary update immediately.',
  'help.guide.costs-table.tip.1':
    'Costs remembers the view in this browser: it opens on the table until you click List again.',
  'help.guide.costs-table.tip.2':
    'An expense split Custom or Ticket has no single share per person, so its Per Person and P. p / Day stay empty.',
  'help.guide.costs-table.tip.3':
    'You edit payers, the split, the note and the receipts in the expense itself: More options at the end of a row has Edit, and Delete to remove the row.',

  // ── Screen: trip-files ──────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Files',
  'help.ctx.trip-files.summary':
    'Every document of the trip in one list: tickets, confirmations, passes and pictures. Each one has a note, a link to the place or the booking it belongs to, and a trash from which you can restore it.',
  'help.ctx.trip-files.bullet.1':
    'Drop files here, the dashed box under the bar, accepts files you drop on it. A click on it opens the file picker. The box shows the file types this TREK accepts and the limit per file (Max 50 MB, unless an administrator set another).',
  'help.ctx.trip-files.bullet.2':
    'The bar at the top contains Files and the filter tabs All, PDFs, Images and Documents, each with its count. A star tab appears after All as soon as a file is starred, and a Collab Notes tab appears at the end as soon as a note has an attachment.',
  'help.ctx.trip-files.bullet.3':
    'A row shows a thumbnail or the file’s type, who uploaded it, the name, the note under it, the size and the date, and one badge per link: the place, the booking or the transport by its name (hover over it to see Day Plan, Booking or Transport), and From Collab Notes.',
  'help.ctx.trip-files.bullet.4':
    'At the end of a row there are up to five icons, each named when you point at it: Star, Assign (the pencil), Open, Download and Delete. Delete does not ask: the file goes to the trash, where you can restore it. Offline, a note, a link, a star and the trash still work and are sent once TREK is back online; only uploading and removing a further link need a connection.',
  'help.ctx.trip-files.bullet.5':
    'A picture or a video opens full screen, with the arrow keys and a row of thumbnails. Every other document opens in a dialog with its name at the top and Open in new tab and Download below it. A wallet pass is downloaded straight away.',
  'help.ctx.trip-files.bullet.6':
    "The trash icon at the right end of the bar (Trash) switches the list to the deleted files. There you can restore each one or delete it permanently, and Empty Trash in the bar deletes them all. Document sync is to the left of the trash icon when the trip is connected to a document store, or for the trip's owner or an administrator as soon as a store is switched on.",
  'help.guide.files-upload.title': 'Add a document to the trip',
  'help.guide.files-upload.goal':
    'Upload a ticket, a confirmation or a photo from your downloads folder to the trip, where everyone in the trip can open it.',
  'help.guide.files-upload.step.1':
    'Open the trip and click Files in the tab bar. The trip’s documents are listed there, with the upload box above them.',
  'help.guide.files-upload.step.2':
    'Click Drop files here and pick one or several files. They are uploaded one after the other and the box reads Uploading... while it runs. Inside the box, below or click to browse, you see the file types this TREK accepts and the maximum size of a file.',
  'help.guide.files-upload.step.3':
    'When the last file has finished uploading, Assign File opens for it automatically (if the trip has any places or bookings), with the file’s name at the top of the dialog. Add a note... under Note adds a note to the file, and the lists below it link it to a place or a booking. Close it with the × at the top right; closing it does not lose anything.',
  'help.guide.files-upload.step.4':
    'The new files appear at the top of the list; only starred files are above them. A row shows who uploaded the file, the name, the size and the date. A picture gets a thumbnail, every other file shows its type.',
  'help.guide.files-upload.result':
    'The documents are in the trip, and everyone who can see the trip can open and download them.',
  'help.guide.files-upload.tip.1':
    'You can also drag a file from the desktop directly onto the box. The box is highlighted while the file is over it.',
  'help.guide.files-upload.tip.2':
    'Press Ctrl+V to add a picture from the clipboard to the list, so you do not have to save a screenshot of a booking first.',
  'help.guide.files-upload.tip.3':
    'Uploading needs the right to upload files; without it the box is not there at all. A type that is not on the list is refused with a message and nothing is uploaded. A file over the limit (50 MB unless an administrator set another) is refused before anything is sent, and the message names the limit. Uploading also needs a connection: offline, TREK says so and uploads nothing.',
  'help.guide.files-link.title': 'Link a document to a place or a booking',
  'help.guide.files-link.goal': 'Make the ticket easy to find from the day it belongs to, not only from this list.',
  'help.guide.files-link.step.1':
    'Click the pencil at the end of the row (Assign). Assign File opens, with the file’s name at the top of the dialog.',
  'help.guide.files-link.step.2':
    'Under Note, Add a note... accepts one line, which then appears under the file’s name in the list. It is saved when you press Enter or leave the box.',
  'help.guide.files-link.step.3':
    'Under Place, on the left, you see the trip’s places, grouped by day with the date, and Unassigned at the end for places that are on no day. Click one to tick it.',
  'help.guide.files-link.step.4':
    'Under Booking and Transport, on the right, are the trip’s bookings. Click the one the document belongs to; it gets a tick too.',
  'help.guide.files-link.step.5':
    'Close with the × at the top right. There is no save button here: every click was saved immediately.',
  'help.guide.files-link.result':
    'The row shows the note and one badge per link: one with the place’s name and one with the flight’s name. Hovering over a badge shows Day Plan or Transport. The document is also attached to the place and to the flight.',
  'help.guide.files-link.tip.1':
    'A file can have several links at once, so the same confirmation can belong to the hotel’s booking and to the hotel’s place at the same time.',
  'help.guide.files-link.tip.2':
    'Click a ticked entry again to remove that link; the file itself stays. Offline, the note and new ticks are saved and sent when TREK is back online; only removing another link needs a connection.',
  'help.guide.files-link.tip.3':
    'It works the other way round as well: a document attached to a place or to a booking is in this list too, with the same badge on its row.',
  'help.guide.files-star.title': 'Keep the important documents on top',
  'help.guide.files-star.goal': 'Mark the few documents you will really need, so you find them quickly in a long list.',
  'help.guide.files-star.step.1':
    'Click the star at the end of a row (Star). It turns gold, a second star appears in front of the file’s name, and when you hover over the button it now says Unstar.',
  'help.guide.files-star.step.2':
    'The list is sorted again: starred files appear above all other files, newest first within each group.',
  'help.guide.files-star.step.3':
    'A star now appears in the filter tabs in the bar, right after All, with the number of starred files next to it. Click it to see only those files.',
  'help.guide.files-star.result':
    'Starred files are shown at the top of the list, and one tab shows only starred files.',
  'help.guide.files-star.tip.1':
    'The star tab only exists while a file is starred. When you unstar the last file, the tab disappears.',
  'help.guide.files-star.tip.2':
    'Starring needs the same right as Assign, Edit file metadata. A member without it sees the stars, but a click on Star changes nothing for them.',
  'help.guide.files-filter.title': 'Find a document in the list',
  'help.guide.files-filter.goal': 'Show only the type of document you are looking for.',
  'help.guide.files-filter.step.1':
    'The filter tabs are in the bar at the top, next to Files: All, PDFs, Images and Documents, each with the number of files next to it.',
  'help.guide.files-filter.step.2': 'Click PDFs: the list shows only the PDF files.',
  'help.guide.files-filter.step.3':
    'Two more tabs appear only when the trip has matching files. Click Collab Notes, which appears as soon as a note in the Collab tab has an attachment: the list then shows only those files. A star tab appears in the same way, as soon as a file is starred.',
  'help.guide.files-filter.step.4': 'All brings the whole list back.',
  'help.guide.files-filter.result':
    'The list shows only the files of the selected tab, and the count on each tab shows how many files that is.',
  'help.guide.files-filter.tip.1':
    'There are no folders here and you cannot rename files. To tell documents apart, use the note in Assign File, the links to places and bookings, and the star.',
  'help.guide.files-filter.tip.2':
    'The list is always sorted with starred files first, then newest first, so a document uploaded today is shown above one from last month.',
  'help.guide.files-preview.title': 'Read a document without leaving TREK',
  'help.guide.files-preview.goal':
    'View a ticket or a picture right away, and download it to your device when you need it there.',
  'help.guide.files-preview.step.1':
    'Click a picture’s name or its thumbnail. It opens full screen, with the file’s name and its place among the pictures at the top left. A video opens the same way and plays there.',
  'help.guide.files-preview.step.2':
    'Use the round arrows at the sides, the left and right arrow keys or the strip of thumbnails at the bottom to move through every picture the list currently shows.',
  'help.guide.files-preview.step.3':
    'Open in new tab and Download are the round buttons at the top right, next to the ×. Click the ×, press Escape or click the dark background to close the picture.',
  'help.guide.files-preview.step.4':
    'A document that is not a picture opens in a dialog instead: its name at the top with Open in new tab and Download as pills under it, and for a PDF the page itself below. The × at the top right, Escape or a click beside the dialog closes it.',
  'help.guide.files-preview.step.5':
    'The arrow at the end of a row (Download) saves the file straight to your device, without opening it first.',
  'help.guide.files-preview.result':
    'The document is shown on screen, and the same two buttons open it in a browser tab or save it to your disk.',
  'help.guide.files-preview.tip.1': 'On a touch screen, swipe through the pictures instead of clicking the arrows.',
  'help.guide.files-preview.tip.2':
    'A wallet pass never opens a preview. It is downloaded at once, so the phone can open it in its wallet app.',
  'help.guide.files-preview.tip.3':
    'Open in new tab and Download both load the file with your session, so a link copied from the address bar does not work for anyone else.',
  'help.guide.files-trash.title': 'Delete a document and restore it',
  'help.guide.files-trash.goal': 'Delete what the trip no longer needs, and restore files that you still need.',
  'help.guide.files-trash.step.1':
    'Click the bin at the end of a row (Delete). The file is removed from the list at once and the message Moved to trash appears. There is no confirmation question.',
  'help.guide.files-trash.step.2':
    'The trash icon at the right end of the bar (Trash) switches the list to the deleted files. The title of the bar shows Trash, and the filter tabs and the upload box are hidden.',
  'help.guide.files-trash.step.3':
    'A row in the trash is greyed out and has two icons: Restore, which restores the file, and Delete, which deletes it permanently after a confirmation.',
  'help.guide.files-trash.step.4':
    'Click Restore. The message File restored appears, and the file is removed from the trash. Its note and links are kept.',
  'help.guide.files-trash.step.5':
    'Empty Trash, in the bar next to the trash icon, permanently deletes everything that is still in the trash. The browser asks for confirmation once before it does this. The trash icon switches back to the files.',
  'help.guide.files-trash.result': 'The file is back in the list where it was before.',
  'help.guide.files-trash.tip.1':
    'Delete on a row does not ask first. That is why there is a trash: nothing is removed from TREK until you delete it here. All of this works offline too, and is sent once TREK is back online.',
  'help.guide.files-trash.tip.2':
    'Deleting and restoring a file needs the right to delete files. A member without it sees neither Delete on the row nor the buttons in the trash.',
  'help.guide.files-trash.tip.3': 'A file deleted for good in the trash cannot be brought back.',
  'help.guide.files-sync.title': 'Sync the documents with your document store',
  'help.guide.files-sync.goal':
    'Connect the trip to your own document store, so that files uploaded here are saved there and files saved there appear here.',
  'help.guide.files-sync.step.1':
    'Click Document sync, next to the trash icon at the right end of the bar. The dialog opens with the trip’s name under its title. On the left, under Connect a provider, are the stores that an administrator has switched on, each with a line that says how it stores files: Paperless-ngx and Papra by tag, Nextcloud and Synology Drive in a folder, OpenCloud in a space. On the right it says Nothing connected yet.',
  'help.guide.files-sync.step.2':
    'Click your store, here Nextcloud. A smaller dialog opens for the connection. It has the name of the store and asks for the sign-in details that this store needs.',
  'help.guide.files-sync.step.3':
    'Fill in Address and the store’s own sign-in: an API token for Paperless-ngx, an API key and the Organisation ID for Papra, Username and an App password for Nextcloud, Username and an App token for OpenCloud, and for Synology Drive Username, Password and, if the account asks for one, a Two-factor code. Use an app password or token wherever the store offers one, never your account password. Nextcloud and Synology Drive also take an optional Base folder, where TREK looks for trip folders, here /Reisen. Accept a self-signed certificate at the bottom is only for a store on your own network with such a certificate.',
  'help.guide.files-sync.step.4':
    'Click Test connection. TREK connects to the storage with what you typed, and the footer reads Reached it, signed in as followed by the account’s name. If the credentials are refused or the address cannot be reached, the footer shows this instead. In both cases nothing is saved.',
  'help.guide.files-sync.step.5':
    'Click Connect. The connection is saved with the trip, and TREK asks where in the store the trip’s documents should be: the tag, folder or space that holds them. Only what is in there is synced. Make a new one creates it when you click Create, with a name taken from the trip’s title. Under Or use one you already have, you see the existing ones. Click one, here the folder Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'The dialog opens again: your store is listed under This trip on the left, and its card on the right shows where it syncs to, when it last ran, and Sync now. The first sync starts automatically; click Sync now to run a sync at any time. After a sync, the Not synced yet badge next to the name changes to a green dot, which shows In sync when you hover over it. The flow bar shows how many documents TREK and the store each have, with the lanes Out to the store and In from the store between them. Close the dialog with the × at the top right.',
  'help.guide.files-sync.result':
    'The documents that were already in the store appear at the top of the list, uploaded in your name, and every document of the trip is also in the store, except the documents from Collab Notes. From now on, TREK checks the store in the background, and changes in the list are copied to the store.',
  'help.guide.files-sync.tip.1':
    'Only the trip’s owner or an instance administrator can connect a trip, because the credentials give access to the whole account at the store. Once the trip is connected, every member sees Document sync and can open it, read the card and press Sync now.',
  'help.guide.files-sync.tip.2':
    'A store on your own network needs ALLOW_INTERNAL_NETWORK=true on the TREK server, and its address has to be the machine’s address on the network, never localhost. Without that, Test connection answers That address is not allowed.',
  'help.guide.files-sync.tip.3':
    'Disconnect, the icon next to Sync now, asks for confirmation once. Then it ends the connection and keeps every document on both sides. If you connect a tag, folder or space a second time, TREK treats it as new and imports everything in it again. So after a Disconnect, connect an empty one, not the old one.',
  'help.guide.files-sync.tip.4':
    'If the card shows a yellow notice with Reconnect, the storage no longer accepts the saved sign-in. Click Reconnect, enter a new app password or token, and the sync starts again.',
  'help.guide.files-sync-settings.title': 'Choose the sync direction for documents',
  'help.guide.files-sync-settings.goal':
    'Decide whether documents are only imported from your store, only exported to it, or both, and what happens when a document is deleted or changed in both places.',
  'help.guide.files-sync-settings.step.1':
    'Click Document sync at the right end of the bar. With the trip bound, your store’s card opens on the right; with more than one store, click the one you want under This trip on the left.',
  'help.guide.files-sync-settings.step.2':
    'The flow bar shows TREK and your store with the documents each holds, and two lanes between them: Out to the store and In from the store. Click Out to the store to switch it off. The lane is greyed out and the line under the lanes reads Only coming in. Click it again to switch it back on.',
  'help.guide.files-sync-settings.step.3': 'Click Settings under the flow bar to show the rest of the options.',
  'help.guide.files-sync-settings.step.4':
    'Under When a document is deleted, pick what happens to the copy on the other side. Keep both copies leaves the store’s copy where it is. Move to recycle bin sends it to the store’s recycle bin when the document is deleted in TREK.',
  'help.guide.files-sync-settings.step.5':
    "When both sides changed decides which copy is kept when a document was edited in both places: Ask me, Keep the TREK copy or Keep the store's copy. Sync automatically lets TREK check for changes in the background; when it is off, the card says Paused and only Sync now runs a sync. Every change here is saved immediately.",
  'help.guide.files-sync-settings.result':
    'From the next run on, the trip syncs only in the direction you chose, and deletions and conflicting edits are handled by the rules you set.',
  'help.guide.files-sync-settings.tip.1':
    'One lane always stays on: clicking the only lane that is still on does nothing.',
  'help.guide.files-sync-settings.tip.2':
    'With Ask me, a document edited in both places waits under Needs a look, below the card. Click Resolve and pick Keep the TREK version, Keep the provider version or Keep both.',
  'help.guide.files-sync-settings.tip.3':
    'Instant updates, a link with Copy beside it, is there only for stores where TREK cannot subscribe to changes automatically. Paste the link into the store and changes arrive right away instead of at the next check.',
  'help.guide.files-sync-settings.tip.4':
    'Only the trip’s owner or an administrator can change any of this. Other members see the flow bar with a line such as Documents move both ways, but no Settings.',

  // ── Screen: trip-collab ─────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collab',
  'help.ctx.trip-collab.summary':
    'The tab where the group plans together, in five cards: the chat on the left, Notes and Links next to it, Polls and What’s Next below them. Everything written here appears on every other member’s screen at once, without a reload.',
  'help.ctx.trip-collab.bullet.1':
    'The chat is the card on the left. Write into Type a message... and press Enter; Shift and Enter make a new line. The smiley adds an emoji, and Attach images adds up to four pictures to the message.',
  'help.ctx.trip-collab.bullet.2':
    'Hover over a message for Reply and, on your own messages, Delete; right-click it for the eight quick reactions. A deleted message is replaced by a note that says who deleted it.',
  'help.ctx.trip-collab.bullet.3':
    'Notes is the shared notes area: New Note in its header creates a note, and the gear beside it opens Manage Categories for their names and colours. Once there are categories, a row of pills under the header filters the cards: All, or one category. A note card shows its category as a coloured dot and its link as a round button, and its three dots (More options) contain Expand, Pin, Edit and Delete.',
  'help.ctx.trip-collab.bullet.4':
    'Links collects the web addresses for the trip. Add link takes a title and an http or https address. Edit link, Pin link and Delete link are at the end of the chip, and pinned links stay at the front.',
  'help.ctx.trip-collab.bullet.5':
    'Use polls to make decisions. New Poll asks a question with at least two options. Click an option to vote for it. The lock (Close) and the bin (Delete) on the right of a poll’s header end the voting or remove the poll.',
  'help.ctx.trip-collab.bullet.6':
    'What’s Next lists the stops of the trip that are still ahead, up to eight of them, with their times and the people on them. It only reads the day plan; the times are set there.',
  'help.ctx.trip-collab.bullet.7':
    'Everything here needs a connection. Offline, a message, a note, a link, a poll or a vote is not saved, and TREK says This needs a connection. Try again once TREK is back online. Members who may not edit Collab can read everything, but New Note, Add link and New Poll are not there for them and the message box is greyed out.',
  'help.guide.write-note.title': 'Write a shared note',
  'help.guide.write-note.goal':
    'Put what the whole group needs, such as a rule, an address or a reminder, where everyone can find it.',
  'help.guide.write-note.step.1':
    'Click New Note in the header of the Notes card. The note dialog opens, with the cursor already in the title field.',
  'help.guide.write-note.step.2':
    'Type the title where it says Note title, at the top of the dialog. It is the only required field: Create stays greyed out until the title has text, and pressing Enter in the title creates the note immediately.',
  'help.guide.write-note.step.3':
    'Content contains the text and supports Markdown: a bold word, a list, a heading. The card shows the first three lines, and Expand in its menu opens the whole note.',
  'help.guide.write-note.step.4':
    'Under Category, pick the one the note belongs to. Its colour is used for the header of the dialog now and for the header of the card later. The first category is already picked for you. The pills are the categories that already exist, and you create a new one under Manage Categories. While the trip has no categories yet, this row is not there.',
  'help.guide.write-note.step.5':
    'Website takes a link that belongs to the note. The card then shows a round link button at the top that opens it.',
  'help.guide.write-note.step.6':
    'Click Create. Only Cancel and its cross close the dialog, so a click outside it or Esc does not lose what you wrote.',
  'help.guide.write-note.result':
    'The note is a card in the Notes panel, with its top in the category’s colour, and all other members see it immediately.',
  'help.guide.write-note.tip.1':
    'The three dots on a card (More options) open Expand, Pin, Edit and Delete. Pin keeps the note at the top of the panel, with a frame in its colour. All other notes are sorted by when they were last changed.',
  'help.guide.write-note.tip.2':
    'The gear next to New Note opens Manage Categories. There you can give a category a colour, rename it everywhere at once, or add it before any note uses it. Nothing changes until you click Save.',
  'help.guide.write-note.tip.3':
    'Attach files adds a document to the note, if you may upload files to the trip. Attach opens the file picker, and you can also paste an image or a PDF into the dialog.',
  'help.guide.write-note.tip.4':
    'Notes has its own switch under Addons, below Collab: an admin can turn it off and keep the chat, the links, the polls and What’s Next running.',
  'help.guide.manage-notes.title': 'Read, pin and edit a note',
  'help.guide.manage-notes.goal':
    'Open a note in full, keep the important one on top, and correct or remove what is out of date.',
  'help.guide.manage-notes.step.1':
    'Click the three dots in the header of a note card (More options). The menu holds Expand, Pin, Edit and Delete.',
  'help.guide.manage-notes.step.2':
    'Expand opens the whole note: the full text, its Website and its Files. Click a file to preview it. Edit at the bottom switches directly to the editor; the cross at the top right closes the note again.',
  'help.guide.manage-notes.step.3':
    'Pin, in the same menu, keeps the note at the top of the panel, with a frame in its category’s colour and a pin beside the title. Unpin in the same menu returns the note to its normal position.',
  'help.guide.manage-notes.step.4':
    'Edit opens the note dialog with everything filled in. Change what you need, here one more line under Content, and click Save.',
  'help.guide.manage-notes.step.5':
    'Delete asks first, Delete note?, because the note is deleted for every member, together with its files. Click Delete to confirm.',
  'help.guide.manage-notes.result':
    'The note is gone from the Notes card, for every member at once. A note you only pinned or changed stays, and the others see it the way you left it.',
  'help.guide.manage-notes.tip.1':
    'Expand is only in the menu when the note has text. A member who may not edit Collab sees Expand alone.',
  'help.guide.manage-notes.tip.2':
    'While you edit, the red cross on a file that is already attached deletes it at once, before you click Save, and it does not go to the trash. Every file of a note also appears in the trip’s Files tab.',
  'help.guide.note-categories.title': 'Sort notes into categories',
  'help.guide.note-categories.goal':
    'Give the group’s notes named, coloured categories, and show one category at a time.',
  'help.guide.note-categories.step.1':
    'Click the gear beside New Note in the header of the Notes card. Manage Categories opens, with a row for every category: its colour, its name, six colour dots and a bin.',
  'help.guide.note-categories.step.2':
    'Type a name into New category... at the bottom and press Enter or click the plus beside it. The new category gets the next colour and a row of its own.',
  'help.guide.note-categories.step.3':
    'Click a category’s name to rename it. Type the new name and press Enter; Esc keeps the old one.',
  'help.guide.note-categories.step.4':
    'The colour dots in a row set that category’s colour: Indigo, Red, Amber, Emerald, Blue or Violet. Here Accommodation turns amber.',
  'help.guide.note-categories.step.5':
    'Click Save. All notes in a renamed or recoloured category change at once, for every member. Cancel discards your changes.',
  'help.guide.note-categories.step.6':
    'Back in the Notes card, the pills under the header filter the cards. Click a category to see only its notes; All, or the same pill again, shows them all.',
  'help.guide.note-categories.result':
    'The notes show the new names and colours, and the Notes card shows only the category you picked.',
  'help.guide.note-categories.tip.1':
    'The bin only removes a category that no note uses. A category that notes still use stays in the list until you move those notes to another category.',
  'help.guide.note-categories.tip.2':
    'A category without notes is only kept in your browser. The other members see it once a note is filed under it.',
  'help.guide.note-categories.tip.3':
    'On a card the category is only the coloured dot in its header. Hover over the dot to see its name.',
  'help.guide.shared-links.title': 'Collect the trip’s links',
  'help.guide.shared-links.goal':
    'Keep the booking portal, the shared album and the timetable in one place, so you do not have to search the chat for them.',
  'help.guide.shared-links.step.1':
    'Click Add link in the header of the Links card. The dialog opens with the cursor in the field at the top.',
  'help.guide.shared-links.step.2':
    'Type the name in Link title, paste the address into Link under it, then click Save link.',
  'help.guide.shared-links.step.3':
    'The chip shows the name and the website it links to. Click it to open the page in a new tab.',
  'help.guide.shared-links.step.4':
    'The three round buttons at its end are Edit link, Pin link and Delete link. Pin link moves the chip to the front of the panel and shows it in the accent colour. Delete link asks you to confirm first, because the link is removed for every member.',
  'help.guide.shared-links.result':
    'The link is a chip in the Links panel, pinned to the front, and it appears on every member’s screen immediately.',
  'help.guide.shared-links.tip.1':
    'Only an http or https address is accepted. Anything else is refused, and the dialog stays open with what you typed.',
  'help.guide.shared-links.tip.2':
    'Pinned links come first, then the newest. The small icon next to a title is the site’s own favicon, loaded from the site itself, so without internet the chip shows a plain link icon instead.',
  'help.guide.shared-links.tip.3':
    'Links is a switch of its own under Addons, below Collab, so an admin can turn the panel off without touching the rest of the tab.',
  'help.guide.create-poll.title': 'Ask the group',
  'help.guide.create-poll.goal':
    'Turn a question that nobody answers in the chat into a poll that everybody can vote on.',
  'help.guide.create-poll.step.1': 'Click New Poll in the header of the Polls card. The dialog opens.',
  'help.guide.create-poll.step.2':
    'Write the question under Question. Markdown supported under the box means that bold text, a line break or a short list works here.',
  'help.guide.create-poll.step.3':
    'Fill in Option 1 and Option 2 under Options. You need at least two options that are not empty, and an option can have several lines.',
  'help.guide.create-poll.step.4':
    'Add option under them adds a third, a fourth, as many as you need. The small cross next to a row, shown once you have more than two, removes that option.',
  'help.guide.create-poll.step.5':
    "Multiple choice lets everyone tick more than one option. If it is off, a person's vote moves to the new option when they pick a different one.",
  'help.guide.create-poll.step.6': 'Click Create Poll.',
  'help.guide.create-poll.result': 'The poll appears at the top of the Polls panel, open, with 0 votes in its header.',
  'help.guide.create-poll.tip.1': 'The question is rendered as Markdown; the options stay plain text.',
  'help.guide.create-poll.tip.2':
    'Create Poll stays greyed out until there is a question and at least two options with text.',
  'help.guide.create-poll.tip.3':
    'A deadline can only be set in the phone app. A poll with a deadline shows the time left in an amber chip in its header and is closed once the time runs out.',
  'help.guide.create-poll.tip.4':
    'Polls has its own switch under Addons, below Collab: an admin can turn it off and keep the other four panels on.',
  'help.guide.vote-poll.title': 'Vote and read the result',
  'help.guide.vote-poll.goal': 'Vote, see the results of the group, and change your vote.',
  'help.guide.vote-poll.step.1':
    'Click the option you want. Its circle shows a tick, the option gets a frame in the accent colour and the bar behind it grows.',
  'help.guide.vote-poll.step.2':
    'Now you can see the whole result: the bar shows the share, the percentage is on the right, and the small circles are the people who picked that option, up to three of them.',
  'help.guide.vote-poll.step.3':
    'Changed your mind? Click another option. On a poll without Multiple choice, your vote moves to the new option instead of adding a second vote.',
  'help.guide.vote-poll.step.4':
    'The number of votes is shown in a chip under the question. Clicking the option you already chose removes your vote, and the count goes down.',
  'help.guide.vote-poll.result':
    'Your option is ticked, the bars show how the group voted, and the circles show who chose which option.',
  'help.guide.vote-poll.tip.1':
    'The percentages and who voted for what only appear once you have voted yourself, or once the poll is closed. The number of votes in the header is there for everyone.',
  'help.guide.vote-poll.tip.2':
    'A vote is never anonymous: hover one of the circles on an option to see the name of the person who voted.',
  'help.guide.close-poll.title': 'Close a poll, or remove it',
  'help.guide.close-poll.goal': 'Stop the voting once the group has decided, and delete a poll nobody needs any more.',
  'help.guide.close-poll.step.1':
    'Close, the lock on the right of a poll’s header, ends the voting. You can no longer click the options.',
  'help.guide.close-poll.step.2':
    'A closed poll moves to the bottom of the panel, under a Closed heading when open polls are above it. It has a Closed chip and shows everybody the result, whether they voted or not. The winning option is in bold on a green bar; if it is the one you picked, the bar uses your accent colour instead.',
  'help.guide.close-poll.step.3':
    'Delete, the bin on the right of the header, deletes the poll. On a closed poll it is the only button, because the lock is gone. There is no confirmation, and the votes are deleted too.',
  'help.guide.close-poll.result':
    'A deleted poll disappears from every member’s panel. A poll you only closed stays visible at the bottom, with its result.',
  'help.guide.close-poll.tip.1':
    'Closing cannot be undone: there is no reopen. A poll closed by accident has to be asked again.',
  'help.guide.close-poll.tip.2':
    'Delete removes the poll and all its votes for everyone, immediately and without a confirmation.',
  'help.guide.whats-next.title': 'Read What’s Next',
  'help.guide.whats-next.goal': 'See what the group is doing next without opening the plan.',
  'help.guide.whats-next.step.1':
    'The card lists the upcoming stops of the trip, up to eight of them, in time order, under a heading per day: Today, Tomorrow or the date, with the day’s title next to it if it has one. The header shows how many there are.',
  'help.guide.whats-next.step.2':
    'On the left of each stop is its time: the start, to, and the end when the stop has one, or TBD when no time is set yet.',
  'help.guide.whats-next.step.3':
    'Next to it are the name, the address and, as chips, the people on that stop. If nobody is assigned to the stop, everyone in the trip is listed.',
  'help.guide.whats-next.result':
    'A list of what is coming, to read only: it follows the plan, and nothing here changes it.',
  'help.guide.whats-next.tip.1':
    'You set nothing here. The times come from the day plan; when you change them there, this list updates immediately.',
  'help.guide.whats-next.tip.2':
    'Only what is still ahead is listed: a stop is removed from the list once its start time has passed, a stop of today without a time stays until the day is over, and at the end of a trip the panel is empty.',
  'help.guide.whats-next.tip.3':
    'What’s Next has its own switch under Addons, below Collab. It is a desktop panel: the Collab tab of the phone app does not show it.',
  'help.guide.trip-chat.title': 'Talk to the group',
  'help.guide.trip-chat.goal':
    'Send a message, reply to a specific message, react to another message, and delete your own message.',
  'help.guide.trip-chat.step.1':
    'Write into Type a message... and press Enter. The round arrow next to the box does the same. Shift and Enter make a new line instead.',
  'help.guide.trip-chat.step.2':
    'The smiley opens the emoji picker, with Smileys, Reactions and Travel in it. The emoji you pick is added to the text you are writing. It is not sent by itself.',
  'help.guide.trip-chat.step.3':
    'Hover somebody else’s message: a small round button appears at its corner. That is Reply.',
  'help.guide.trip-chat.step.4':
    'The message you reply to is quoted above the box. Write and send your message, and the quote is sent with it. Click the cross on the quote to remove it.',
  'help.guide.trip-chat.step.5':
    'Right-click a message to see the eight quick reactions. Your reaction appears under the message. Click the same reaction again to remove it.',
  'help.guide.trip-chat.step.6':
    'Your own messages have Delete, the bin icon, next to Reply. It deletes the message at once, and a note says that you deleted it. You cannot undo this.',
  'help.guide.trip-chat.result':
    'Your reply is the newest message, and the quoted message is shown at its top. Your reaction appears under the other message. For the message you deleted, a note says that you deleted it.',
  'help.guide.trip-chat.tip.1':
    'Enter sends, Shift and Enter make a new line. A message with only one to three emoji is shown large.',
  'help.guide.trip-chat.tip.2':
    'With Attach images you can add up to four pictures to one message. You can also paste them or drop them onto the box.',
  'help.guide.trip-chat.tip.3':
    'A message with a link in it gets a preview card underneath, fetched by your own TREK, so a link to something only you can reach stays a plain link.',
  'help.guide.trip-chat.tip.4':
    'Chat has its own switch under Addons, below Collab: an admin can turn it off and keep the notes, the links, the polls and What’s Next on.',
  'help.guide.trip-chat.tip.5':
    'The chat shows the latest messages first. Load older messages at the top of the chat loads the earlier messages.',

  // ── Screen: trip-roadtrip ───────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Road trip',
  'help.ctx.trip-roadtrip.summary':
    'The plan shown as one drive: the same days and the same places, connected as stops with the driving between them, in a rail in the left column and on the map. It shows the distance and the driving time, where you need to refuel, and what is along the road.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Days and Road trip at the top of the left column switch between the day plan and the drive. Nothing is copied and nothing is changed: Days shows the plan exactly as it was.',
  'help.ctx.trip-roadtrip.bullet.2':
    'The top of the rail shows totals for the trip: Distance, Driving time and Stops. Below it is a card for every day with a drive: the day’s number and date on a tile, then pills for its kilometres and driving time, how many stops it has, whatever it crosses, and a Track badge. A flight, train or ferry you booked appears in the sequence as a separate card.',
  'help.ctx.trip-roadtrip.bullet.3':
    'A numbered stop is a place the day is for. A stop on the way, such as fuel, charging or a rest area, shows the icon of its type instead of a number and is not counted. Click a number to change which it is, click the Stay badge to set how long you stay, and drag a stop to move it within its day or onto another day.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Between two stops, a drive band shows the distance and time of the leg. Click it for Ways to drive this leg, or click the route on the map to send the leg through a via point.',
  'help.ctx.trip-roadtrip.bullet.5':
    "The right column becomes Along the route: pick what to look for and the day on one line, how wide the corridor is, then Search. The plus on a result, Add, adds it to the drive at the point where you actually pass it, and the bed icon on a hotel adds a night's stay. Manual adds a place that the search did not find, and the three dots beside the title import a Google Maps route.",
  'help.ctx.trip-roadtrip.bullet.6':
    'Driving settings under it holds the limits, the car and its range, the daily travel times, what to avoid, how the line is drawn and whether current warnings show on the map. They belong to the trip, so everyone plans with the same car.',
  'help.guide.roadtrip-mode.title': 'View the trip as one drive',
  'help.guide.roadtrip-mode.goal': 'Switch the plan to road trip mode and understand what the rail shows.',
  'help.guide.roadtrip-mode.step.1':
    'Click Road trip in the Days and Road trip switch at the top of the left column. The day plan is replaced by the drive, and the map shows every day that has a route.',
  'help.guide.roadtrip-mode.step.2':
    'The card at the top of the rail totals the whole trip: Distance, Driving time and Stops. It stays in place when you scroll the days.',
  'help.guide.roadtrip-mode.step.3':
    "Below it is a card for every day with a drive; a day with no drive is left out. The card's header shows the day’s number with the date under it, then pills for the drive's distance and time and for the number of stops that day.",
  'help.guide.roadtrip-mode.step.4':
    'Inside the card, the day is shown as a sequence: a numbered stop for each place, a drive section between each pair, and the arrival time at the right edge. A flight, train or ferry you booked appears in the sequence as its own card.',
  'help.guide.roadtrip-mode.step.5':
    'Click a day’s header to collapse it; the arrow at its end rotates. A collapsed day is also hidden on the map. Click the header again to show it again.',
  'help.guide.roadtrip-mode.result':
    'The left column shows the drive and the map shows every day of it. Days switches straight back to the plan, unchanged.',
  'help.guide.roadtrip-mode.tip.1':
    'The choice is saved per trip on your account, so after a reload, in another browser or on another device, the trip opens in road trip view again.',
  'help.guide.roadtrip-mode.tip.2':
    'The switch is only shown after an admin has turned the Road trip addon on, under Addons in the admin panel.',
  'help.guide.roadtrip-mode.tip.3': 'On a phone there is no switch: the addon adds its own Road trip tab next to Plan.',
  'help.guide.roadtrip-stops.title': 'Stops on the way, and how long you stay',
  'help.guide.roadtrip-stops.goal': 'Make a place on the drive a stop on the way, and set how long each stop takes.',
  'help.guide.roadtrip-stops.step.1':
    'Click the number in front of a stop in the rail. Its label is Make it a stop on the way, and it opens the kinds of stop as a row of coloured discs under it.',
  'help.guide.roadtrip-stops.step.2':
    'Pick a kind. Hover over a disc to see its name: Accommodation, Fuel, Charging, Rest area, Campsite, Food or Sights. The number changes to that kind’s icon and the stops below it are numbered again.',
  'help.guide.roadtrip-stops.step.3':
    'A stop on the way is not a destination, so the day’s header counts one stop fewer.',
  'help.guide.roadtrip-stops.step.4':
    'Click the icon again, Change what kind of stop this is, and choose Back to a destination to give the stop its number again.',
  'help.guide.roadtrip-stops.step.5':
    'Every stop has a Stay badge, which shows a plus while nothing is planned. Click it to open Time at this stop.',
  'help.guide.roadtrip-stops.step.6':
    'Set the length with the slider, with the minus and plus buttons or with one of the presets. Leave changes, while Arrive stays at the time the drive arrives. Then click Save.',
  'help.guide.roadtrip-stops.result':
    'The Stay badge of the stop you changed shows the new length, and every arrival time after it is moved to match. A stop that you changed to a kind and back is a numbered destination again.',
  'help.guide.roadtrip-stops.tip.1':
    'A stay belongs to the place, not to one visit: a place planned on two days has the same stay on both days.',
  'help.guide.roadtrip-stops.tip.2':
    'Stops on the way show under Days as well. Turning Show in Days too off, under Service stops in the Driving settings, keeps them in Road trip only.',
  'help.guide.roadtrip-stops.tip.3': 'No stay, in the same dialog, removes the time again.',
  'help.guide.roadtrip-stops.tip.4':
    'Click a stop on the way or a booked night to open its card over the map. With Road trip on, Edit there opens the compact dialog the search uses instead of the place form, and More details in that dialog opens the full form.',
  'help.guide.roadtrip-stops.tip.5':
    'A stop with an end time in the day plan lasts until that time. Its dialog says when the drive leaves, and Remove end time lets you set the length yourself again.',
  'help.guide.roadtrip-reorder.title': 'Reorder a stop or move it to another day',
  'help.guide.roadtrip-reorder.goal':
    'Change the order of the drive, or move a stop to another day, directly in the rail.',
  'help.guide.roadtrip-reorder.step.1':
    'Drag a stop by its row and drop it on another stop of the same day. It takes that stop’s place, and the day is routed again in the new order.',
  'help.guide.roadtrip-reorder.step.2':
    'To move a stop to another day, drop it on a stop in that day’s card. While you drag, a day with fewer than two stops appears as a dashed card at the end of the rail, and you can drop on that too.',
  'help.guide.roadtrip-reorder.step.3':
    'From the keyboard, focus a stop and press Alt with the up or down arrow to move it one place within its day.',
  'help.guide.roadtrip-reorder.result':
    'The stops are in the order you set, and the distance, driving time and arrival times of every day you changed are calculated again.',
  'help.guide.roadtrip-reorder.tip.1': 'Moving a stop here moves it in the day plan too: Days shows the same order.',
  'help.guide.roadtrip-reorder.tip.2':
    'Booked rides and their terminals stay where the booking puts them; only places can be dragged.',
  'help.guide.roadtrip-reorder.tip.3':
    'TREK does not ask about a time you pinned: the rail recalculates the day at once and marks any stop that can no longer be reached in time.',
  'help.guide.roadtrip-corridor.title': 'Find fuel, food and a place to sleep along the route',
  'help.guide.roadtrip-corridor.goal':
    'Search along the road you actually drive, and add what you find to the correct leg.',
  'help.guide.roadtrip-corridor.step.1':
    'Under Looking for, open the list and tick what you need. You can combine Fuel, Charging, Rest area, Campsite, Accommodation, Food and Sights: the list stays open for a second choice, and the field then shows an icon for each kind.',
  'help.guide.roadtrip-corridor.step.2':
    'Pick the day in the dropdown at the end of the same line. It offers the days the rail has a card for, and Search waits until the route for the day you picked is calculated.',
  'help.guide.roadtrip-corridor.step.3':
    'Under Within, choose how far either side of the road to look, 2 km, 5 km or 10 km, then click Search.',
  'help.guide.roadtrip-corridor.step.4':
    'The results are grouped by type, in the order you pass them. Each one shows how far it is from the route and how far into the day’s drive it is.',
  'help.guide.roadtrip-corridor.step.5':
    'Click Add, the plus on a hit. Add as a stop says which day and position it is added to, and asks for the Kind of stop and the Time at this stop; a charger also shows Availability and prices. Add puts it on the drive, and More details opens the full place form instead.',
  'help.guide.roadtrip-corridor.result':
    'The stop you added appears on the route at the point where you pass it, with its kind’s icon. The day is routed again through the stop, and this clears the list: search again for the next stop.',
  'help.guide.roadtrip-corridor.tip.1':
    'Nothing is searched until you press Search: one search sends many requests to a shared service.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filter by name filters the results without a new search, and Clear results empties the list and removes its pins. Click a result to show it on the map.',
  'help.guide.roadtrip-corridor.tip.3':
    'You can also drag a result from the map onto the route. This lets you choose the leg yourself when you drive the same road twice. Manual, next to Search, adds a place that the search did not find, by looking it up by name.',
  'help.guide.roadtrip-corridor.tip.4':
    'Below the filter, pick one stop of the day, or Halfway between two, to keep only what lies within 25, 50 or 100 km of that point. With chargers in the list, Any plug and Any power narrow them by socket and power.',
  'help.guide.roadtrip-overnight.title': 'Spend a night along the route',
  'help.guide.roadtrip-overnight.goal':
    'Find a place to sleep on the road and add the night to the drive as a booking.',
  'help.guide.roadtrip-overnight.step.1':
    'In Along the route, tick Accommodation under Looking for, or Campsite for a pitch, pick the day you want to stop on, and click Search.',
  'help.guide.roadtrip-overnight.step.2':
    'A hotel shows a bed icon instead of the plus. Click it, Add as an overnight stay, to open Add as a stop for the night. A campsite has the usual Add.',
  'help.guide.roadtrip-overnight.step.3':
    "At the top of the dialog, Overnight adds a night's stay and Pause makes it a stop for a while. A hotel opens with Overnight, a campsite with Pause. A night asks only for its Check-in, which you can leave empty.",
  'help.guide.roadtrip-overnight.step.4':
    'Find accommodation, beside it, shows the name to copy and links to booking sites: trivago or CHECK24 for a hotel, PiNCAMP or Pitchup for a campsite. Check the place, the dates and the guests on the site.',
  'help.guide.roadtrip-overnight.step.5':
    'Click Add. The night is booked from this day to the next, and the place is added to the drive as that day’s night.',
  'help.guide.roadtrip-overnight.result':
    'The place appears on the drive as the overnight stop for that day, and the stay is booked in the trip like any other.',
  'help.guide.roadtrip-overnight.tip.1':
    'The night lasts until the next day. For other dates, change the booking: change the dates under Days, together with the rest of the stay.',
  'help.guide.roadtrip-overnight.tip.2':
    'Switching a booked night back to Pause, from Edit in its card, asks Drop the overnight stay? first. Make it a pause removes the night, with its booking and any expense linked to it, and keeps the stop on the drive.',
  'help.guide.roadtrip-overnight.tip.3':
    'With Start and end each day at your stay switched on, under Route line in Driving settings, the next day’s drive starts from where you slept.',
  'help.guide.roadtrip-via.title': 'Route a leg through a via point',
  'help.guide.roadtrip-via.goal': 'Make a leg use the road you want, without adding a stop to it.',
  'help.guide.roadtrip-via.step.1':
    'Show the leg you want on the map: click a stop in the rail, then close the card that opens over the map.',
  'help.guide.roadtrip-via.step.2':
    'Click the drawn route. A via point is added on the leg you clicked, and the leg is routed again through it.',
  'help.guide.roadtrip-via.step.3':
    'The rail updates: the day’s header shows the new distance and driving time, and every arrival after the via point changes with it.',
  'help.guide.roadtrip-via.step.4':
    'Hover over the handle to see what it does: Drag to reshape the route, right-click to remove. Drag it to another place, and the leg is drawn again through the new point.',
  'help.guide.roadtrip-via.step.5': 'Right-click the handle to remove it. The leg uses the direct route again.',
  'help.guide.roadtrip-via.result':
    'The leg follows the road you chose, and the distance, driving time and arrival times of the day are calculated again.',
  'help.guide.roadtrip-via.tip.1':
    'A via is not a stop: it has no number, no stay and no arrival time, and it is not counted in the day’s stops.',
  'help.guide.roadtrip-via.tip.2':
    'The handles are shown only from zoom level 9, so a map that shows the whole trip shows the line without them.',
  'help.guide.roadtrip-via.tip.3':
    'A click more than two kilometres from any drawn leg is ignored, and so is a click on a flight, a train or a ferry.',
  'help.guide.roadtrip-alternatives.title': 'Try another way to drive a leg',
  'help.guide.roadtrip-alternatives.goal':
    'See the other routes the router offers for one part of the drive, and choose one.',
  'help.guide.roadtrip-alternatives.step.1':
    'Click a drive band in the sidebar, the row between two stops that shows the distance and time of the leg. Its label is Other ways.',
  'help.guide.roadtrip-alternatives.step.2':
    'Ways to drive this leg opens over the map, with one entry per road and its length. The map draws each road with its driving time: your current road in full blue, the others in a lighter blue.',
  'help.guide.roadtrip-alternatives.step.3':
    'Hover over an entry to highlight that road. Current is the road you are using and Fastest is the quickest; the others show how much slower they are, or which road class they avoid.',
  'help.guide.roadtrip-alternatives.step.4': 'Click an entry to use that route, or Close to keep the current route.',
  'help.guide.roadtrip-alternatives.result':
    'The leg now uses the road you chose, and the distance in the side column and the arrival times after it change too.',
  'help.guide.roadtrip-alternatives.tip.1':
    'When you choose another road, TREK first checks it with the road trip’s router. Then it keeps the leg on that road with as few via points as needed, and replaces any via points the leg already had. A road the router cannot follow is not saved. Choosing the router’s own road removes the via points again.',
  'help.guide.roadtrip-alternatives.tip.2':
    'No motorway, No tolls and No ferry come from a second engine with its own speed model, so their times cannot be compared with the others.',
  'help.guide.roadtrip-limits.title': 'Set the car and the driving limits',
  'help.guide.roadtrip-limits.goal': 'Tell TREK what vehicle you drive and how far you want to drive without a break.',
  'help.guide.roadtrip-limits.step.1':
    'Driving settings is under the search in the right column. Its badges show what is set; click it to open.',
  'help.guide.roadtrip-limits.step.2':
    'Under Driving, Longest drive at once and Driving per day are minutes. An empty field means off, and nothing is flagged.',
  'help.guide.roadtrip-limits.step.3':
    'Under Vehicle, say what you drive. Petrol refills only at fuel stops, Electric only at charging ones, Either at both.',
  'help.guide.roadtrip-limits.step.4':
    'Type Range on one tank, or Range on one charge, yourself. Or open Work it out from the car, under Fill up to: it takes Tank size and Consumption, or Battery, Consumption and Battery wear, and calculates the range.',
  'help.guide.roadtrip-limits.step.5':
    'Avoid where possible, in the left column, is a preference and not a ban: if a day has no other way, it still uses the road and shows a note in its header.',
  'help.guide.roadtrip-limits.step.6':
    'Click Close. The card’s badges show what is set, and the rail marks every leg and every day that exceeds a limit.',
  'help.guide.roadtrip-limits.result':
    'The card’s badges show what is set, and every leg and day over a limit has a badge in the rail.',
  'help.guide.roadtrip-limits.tip.1':
    'The settings belong to the trip, so everyone on it plans with the same car and the same limits.',
  'help.guide.roadtrip-limits.tip.2':
    'Fill up to says how far a stop fills the tank or battery, because nobody charges to 100 % on the road. A fuel or charging stop can override it with the battery badge on its row.',
  'help.guide.roadtrip-limits.tip.3':
    'Under Route line, Connect the days also routes the drive from the last stop of one day to the first stop of the next day. Start and end each day at your stay starts and ends each day at the accommodation booked for those nights. A colour per day shows each day in its own colour.',
  'help.guide.roadtrip-day-window.title': 'Give the driving day a start and an end',
  'help.guide.roadtrip-day-window.goal': 'Stop driving at a time you choose, and set where the day should end.',
  'help.guide.roadtrip-day-window.step.1':
    'Open Driving settings in the right column and find Daily travel times, in the dialog’s left column.',
  'help.guide.roadtrip-day-window.step.2':
    'Set a Day start time. On its own it does nothing: both times are needed, as the note under them says.',
  'help.guide.roadtrip-day-window.step.3':
    'Set a Day end time. The drive now stops at that time and continues the next morning, shown as an End of day row and a Continue journey row in the side column.',
  'help.guide.roadtrip-day-window.step.4':
    'Under End the day, choose Along the route to pause on the road at the end time, or At the last place to stop before the next drive would pass it.',
  'help.guide.roadtrip-day-window.step.5': 'Click Close. The Driving settings card shows the two times as a badge.',
  'help.guide.roadtrip-day-window.result':
    'The drive is split into travel days of the length you set, and what does not fit continues on calculated days after the last one. Your days and their places are not changed.',
  'help.guide.roadtrip-day-window.tip.1':
    'If you clear either time, this feature is turned off again. Times you set on a stop yourself always take priority.',
  'help.guide.roadtrip-day-window.tip.2':
    'With daily travel times set the days are always connected: the drive from one day’s last stop to the next day’s first is routed and counted.',
  'help.guide.roadtrip-day-window.tip.3':
    'Each day ending is also a marker on the map: a moon with the day number. Drag it along the route, or onto a place, to end the day somewhere else. Right-click it to restore the automatic ending. Restore automatic day endings in this dialog undoes all these changes. To end a day at one stop, click the stop and turn on End the day here in its card.',
  'help.guide.roadtrip-refuel.title': 'Fill up before the tank is empty',
  'help.guide.roadtrip-refuel.goal':
    'Find a place to refuel on the part of the route the car can still reach, and add it to the drive.',
  'help.guide.roadtrip-refuel.step.1':
    'With a range set, the side column shows a band on the leg where the fuel or battery runs out: Tank runs out here, or Battery runs out here for an electric car. Below it, you see how far into the leg that is.',
  'help.guide.roadtrip-refuel.step.2':
    'The lamp icon on the band is the button: Find fuel, or Find charging for an electric car. It searches along the road before that point and shows Looking along the route… while it searches.',
  'help.guide.roadtrip-refuel.step.3':
    'Up to three stations are shown, each with its distance from the route and how much range you would have left.',
  'help.guide.roadtrip-refuel.step.4':
    'The plus on an offer adds it as a fuel stop. Add as a stop opens with the type and the time already filled in, and Add puts it on the leg at the point where the route actually passes it.',
  'help.guide.roadtrip-refuel.result':
    'The stop appears on the correct leg with its own icon, and the range is counted again from that stop. The band moves to the point where the tank is now empty, or disappears if you can reach the end of the drive without another stop.',
  'help.guide.roadtrip-refuel.tip.1':
    'The range counts from the last fuel or charging stop, across days. Your vehicle type decides which stops count: Petrol only fuel, Electric only charging.',
  'help.guide.roadtrip-refuel.tip.2':
    'The search looks at the road before the point where the fuel runs out, keeps a reserve and counts the detour twice, so every place it offers is really reachable.',
  'help.guide.roadtrip-refuel.tip.3':
    'If there are no results, you can search again: the lamp changes to Try again, because the place search is a shared service that sometimes times out.',
  'help.guide.roadtrip-stop-fill.title': 'Set how full one stop is',
  'help.guide.roadtrip-stop-fill.goal':
    'Give one fuel or charging stop its own fill level, such as 80 % at a fast charger or 100 % overnight.',
  'help.guide.roadtrip-stop-fill.step.1':
    'On a fuel or charging stop in the rail, click the battery badge. It shows the level the stop fills to: faded while it uses your Fill up to value, solid once it has its own value.',
  'help.guide.roadtrip-stop-fill.step.2':
    'Under Fills to, pick 50 to 100. The line under the buttons shows how far you can drive from here with that.',
  'help.guide.roadtrip-stop-fill.step.3':
    'To use your own setting for the stop again, open the badge again and click Use my default.',
  'help.guide.roadtrip-stop-fill.result':
    'At this stop the tank is filled to the amount you picked. The range after it, including any Tank runs out here band, is calculated from that.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Only stops where your car can refuel show the badge: fuel stops for Petrol, charging stops for Electric, both for Either.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'If you pick the value the stop already has, the stop goes back to your default value.',
  'help.guide.roadtrip-bookings.title': 'Include your flight, train or ferry in the drive',
  'help.guide.roadtrip-bookings.goal':
    'See where a booked ride fits into the drive, and when you have to arrive there.',
  'help.guide.roadtrip-bookings.step.1':
    'Book the ride as a Flight, Train, Ferry, Cruise or Bus booking on its day, with both ends located. The drive includes it automatically: the road ends at the terminal the ride leaves from and starts again where it arrives.',
  'help.guide.roadtrip-bookings.step.2':
    'In the rail the ride is a card in its type’s colour, with the timetable in the arrival column and its start and end points under the title.',
  'help.guide.roadtrip-bookings.step.3':
    'The Check-in or Boarding pill says by when the drive has to get you to the terminal: the departure is set that much earlier than the timetable.',
  'help.guide.roadtrip-bookings.step.4': 'Click the card to open the booking.',
  'help.guide.roadtrip-bookings.result':
    'Every booked ride appears in the drive at the point where it happens, and the route before and after it goes to and from its terminals.',
  'help.guide.roadtrip-bookings.tip.1':
    'The time at the terminal is set earlier than the timetable, to allow for check-in: one hour for a flight or a cruise, half an hour for a ferry, ten minutes for a train or a bus.',
  'help.guide.roadtrip-bookings.tip.2':
    'A table or a ticket booked at a stop shows as a pill on that stop; anything that belongs to no stop is listed under Also booked this day.',
  'help.guide.roadtrip-bookings.tip.3':
    'A ride that is on none of the trip’s days is not part of the drive: a note at the top of the rail names it, with Open booking to give it a date.',
  'help.guide.roadtrip-track.title': 'Make a day follow an imported track',
  'help.guide.roadtrip-track.goal': 'Use a scenic route you imported as a GPX or KML track for a day’s drive.',
  'help.guide.roadtrip-track.step.1': 'Click the Track badge in a day’s header. The dialog opens on that day.',
  'help.guide.roadtrip-track.step.2':
    'Pick a track. Each one shows its length and whether it follows this day’s route or how far away it is. The nearest track comes first.',
  'help.guide.roadtrip-track.step.3':
    'Click Follow this track. TREK adds via points where the drive is furthest from the track and calculates the route again, and repeats this several times.',
  'help.guide.roadtrip-track.step.4':
    'The dialog says how many via points were placed and how close the drive now stays to the track, or that the drive already followed the track. Drop via points, at the bottom left, removes them, and the router plans the day again. Closing the dialog keeps the track.',
  'help.guide.roadtrip-track.result':
    'The day’s drive follows the track instead of the road the router would have picked. Hover over its Track badge to see the name of the track. When via points keep the drive on the track, the badge is also highlighted.',
  'help.guide.roadtrip-track.tip.1':
    'The dialog lists the trip’s places that have a path: a GPX or KML imported with Import file in the places column under Days, with Routes or Tracks (with path geometry) ticked for a GPX, or Paths (LineStrings) for a KML. Import file is only offered while the Tours addon is off; with Tours on, a GPX becomes a tour, which this dialog does not list. Until the trip has a track, no day shows the badge.',
  'help.guide.roadtrip-track.tip.2':
    'Following a track replaces the via points the day’s legs already had, so shape a leg by hand after the track, not before.',
  'help.guide.roadtrip-google-import.title': 'Import a route from Google Maps',
  'help.guide.roadtrip-google-import.goal': 'Turn a route you planned in Google Maps into stops on one of your days.',
  'help.guide.roadtrip-google-import.step.1':
    'Click the three dots at the top of Along the route and choose Import Google Maps route.',
  'help.guide.roadtrip-google-import.step.2':
    'Paste the link of a route you shared from Google Maps and click Preview.',
  'help.guide.roadtrip-google-import.step.3':
    'Check the stops it found. Each one shows where it is; a stop marked Location unresolved is skipped.',
  'help.guide.roadtrip-google-import.step.4': 'Under Day, pick the day the stops go on, then click Import.',
  'help.guide.roadtrip-google-import.result':
    'The route’s stops are added after the last stop of that day, and the route in the rail and on the map goes through them.',
  'help.guide.roadtrip-google-import.tip.1':
    'TREK calculates its own route between the stops; it does not copy Google’s road.',
  'help.guide.roadtrip-google-import.tip.2': 'The link needs at least two stops TREK can place, and at most 30.',
  'help.guide.roadtrip-google-import.tip.3':
    'The import needs a connection, and permission to edit both places and days.',
  'help.guide.roadtrip-hazards.title': 'Show current warnings on the map',
  'help.guide.roadtrip-hazards.goal': 'See weather warnings and disaster alerts around your drive on the map.',
  'help.guide.roadtrip-hazards.step.1': 'Open Driving settings in the right column.',
  'help.guide.roadtrip-hazards.step.2':
    'Under Current warnings, at the bottom of the dialog’s right column, turn on Show hazard areas, then click Close.',
  'help.guide.roadtrip-hazards.step.3':
    'The warnings are drawn on the map as areas. Click one for what it is about, which service reported it and when it was last updated.',
  'help.guide.roadtrip-hazards.result':
    'The map shows the current warnings around your trip, and the route does not change.',
  'help.guide.roadtrip-hazards.tip.1':
    'Warnings are not road closures: the route never changes because of them, and they are current notices, not a forecast for your dates.',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD covers Germany and GDACS reports disasters worldwide. A warning given only as a point says its affected area is unknown.',
  'help.guide.roadtrip-hazards.tip.3':
    'The feeds are refreshed every ten minutes and need a connection. Like the other driving settings, the switch is saved for the trip.',

  // ── Screen: trip-tours ──────────────────────────────────────────────────────
  'help.ctx.trip-tours.title': 'Tours in the plan',
  'help.ctx.trip-tours.summary':
    'The right column of the Plan tab in Tours mode: every tour of the trip in one list, next to the days. From here you put tours on days, filter the list, hide lines on the map and import GPX or KML files. Routes are drawn and changed on the Tours tab.',
  'help.ctx.trip-tours.bullet.1':
    'The Places and Tours switch at the top of the right column swaps the places list for the tours. It is there only while the Tours add-on is on, and tours never show in the Places list then.',
  'help.ctx.trip-tours.bullet.2':
    'At the top, Import GPX or KML brings files in as tours. The filter button under it (All at first, with the number of tours) narrows the list by status, source, routing limit and type.',
  'help.ctx.trip-tours.bullet.3':
    'A row: the coloured bar is the tour’s line on the map, the round tile shows the routing limit (T1 to T6) or the type, a small GPX or wanderer badge marks an import, and the badges give the days, the time, the distance and the ascent. A moon with a number shows the number of stages of a multi-day tour.',
  'help.ctx.trip-tours.bullet.4':
    'Hover over a row to see its eye (Hide on the map) and its round + (Add to day). Drag a row onto a day in the left column to plan it there, or click it to open the tour’s card over the map.',
  'help.ctx.trip-tours.bullet.5':
    'In the days column a tour is a row like a stop. With a Start it reads start → end, the end calculated from the tour’s time, and More options contains Edit, Remove from day, Leave out of route and Save to Collection.',
  'help.ctx.trip-tours.bullet.6':
    'Changing a route and deleting a tour happen on the Tours tab, under Tours of this trip.',
  'help.guide.tour-show-list.title': 'Show the trip’s tours in the plan',
  'help.guide.tour-show-list.goal':
    'Replace the places column with the trip’s tours, to see and pick them next to the days.',
  'help.guide.tour-show-list.step.1':
    'On the Plan tab, click Tours in the switch at the top of the right column. The column now lists the tours instead of the places.',
  'help.guide.tour-show-list.step.2':
    'Each row is one tour. The coloured bar is its line on the map, and the round tile shows the routing limit (T1 to T6) of a hike planned in TREK or the icon of its type. The badges under the name show the days it is on, its time, distance and ascent. On a multi-day tour, the moon with a number shows how many stages it has.',
  'help.guide.tour-show-list.step.3': 'Click a row. The tour’s card opens over the map.',
  'help.guide.tour-show-list.step.4':
    'The card shows the tour’s measures and, under Trip days, the days it is on. To change the route itself, open the Tours tab and click the tour under Tours of this trip.',
  'help.guide.tour-show-list.step.5': 'Click Places in the same switch to get the places list back.',
  'help.guide.tour-show-list.tip.1': 'Click a tour’s line on the map, and the list marks that tour and scrolls to it.',
  'help.guide.tour-show-list.tip.2':
    'No tours yet? Import GPX or KML at the top of the list imports a file, and Plan new tour on the Tours tab creates a new one.',
  'help.guide.tour-show-list.tip.3':
    'With the Tours add-on on, tracks never appear in the Places list: every imported track is a tour and is listed here.',
  'help.guide.tour-show-list.result':
    'The right column lists the trip’s tours, and the one you clicked is open in its card.',
  'help.guide.tour-add-to-day.title': 'Put a tour on a day',
  'help.guide.tour-add-to-day.goal': 'Plan when you do a tour, so it appears in the day with its line on the map.',
  'help.guide.tour-add-to-day.step.1':
    'Hover over the tour in the list and click the round + on the right of its row (Add to day).',
  'help.guide.tour-add-to-day.step.2':
    'Pick the day. The menu lists every day of the trip with its date and title; a day that already has the tour is greyed out.',
  'help.guide.tour-add-to-day.step.3':
    'Added to day 10 confirms it, the row gets a Day badge, and the day in the left column lists the tour with its time, distance and ascent.',
  'help.guide.tour-add-to-day.step.4':
    'Or drag the row out of the list and drop it on a day in the left column. If you drop it between two stops, it is placed there.',
  'help.guide.tour-add-to-day.step.5':
    'A tour with stages asks next, in the same menu. Stages from this day on puts stage 1 on that day and each next stage on the day after; Whole tour on this day puts all of it on that one day.',
  'help.guide.tour-add-to-day.tip.1':
    'Dragging a tour with stages onto a day asks the same in a small dialog. Cancel leaves the plan as it was.',
  'help.guide.tour-add-to-day.tip.2':
    'When the trip ends before the last stage, the option shows the last stage that fits, and the stages after it stay without a day.',
  'help.guide.tour-add-to-day.tip.3':
    'You can add a tour to a day only once. If you drop it on a day that already has it, TREK only shows This tour is already on that day.',
  'help.guide.tour-add-to-day.tip.4':
    'With a day open (click its header), the tour’s card offers Add to Day for that day too. The undo arrow above the days undoes the assignment.',
  'help.guide.tour-add-to-day.result': 'The tour is listed under its day, and its line is part of that day on the map.',
  'help.guide.tour-day-times.title': 'Give a tour a start time on its day',
  'help.guide.tour-day-times.goal': 'See when a tour ends and whether it overlaps with what comes next that day.',
  'help.guide.tour-day-times.step.1':
    'In the days column, point at the tour’s row, click More options (the three dots) and choose Edit.',
  'help.guide.tour-day-times.step.2':
    'Set Start and leave End empty. The line under the fields says the end TREK works out: the start plus the tour’s time.',
  'help.guide.tour-day-times.step.3':
    'Click Update. The row now shows start → end. A calculated end time is lighter, with ≈ for an estimate, ≥ while a stay has no time yet and +1 past midnight. Hover it to see how it was calculated.',
  'help.guide.tour-day-times.step.4':
    'If the tour ends after the next item of the day begins, a note under the row tells you, for example Ends at 13:30, after Lunch at Gostner Schwaige starts at 12:30. Nothing is moved.',
  'help.guide.tour-day-times.tip.1': 'An end time you enter replaces the calculated one.',
  'help.guide.tour-day-times.tip.2':
    'A day with one stage of a multi-day tour gets no calculated end time, because the tour’s time is the time of the whole route.',
  'help.guide.tour-day-times.tip.3':
    'Leave out of route in the same menu keeps the tour on the day but leaves it out of the day’s route on the map. Add back to route undoes it.',
  'help.guide.tour-day-times.tip.4':
    'Save to Collection in the same menu keeps the tour in a collection with its route, as the card’s Collection button does.',
  'help.guide.tour-day-times.result':
    'The tour appears in the day’s timeline with its start and end, like any timed stop.',
  'help.guide.tour-remove-from-day.title': 'Remove a tour from a day',
  'help.guide.tour-remove-from-day.goal': 'Unplan a tour without deleting it.',
  'help.guide.tour-remove-from-day.step.1':
    'In the days column, point at the tour’s row, click More options and choose Remove from day.',
  'help.guide.tour-remove-from-day.step.2':
    'The tour stays in the list on the right. Its Day badge is gone, and the filter counts it under Unplanned again.',
  'help.guide.tour-remove-from-day.step.3':
    'Or click the day’s header to open the day, click the tour in the list, and click Remove from Day at the foot of its card.',
  'help.guide.tour-remove-from-day.tip.1':
    'You remove a multi-day tour from one day at a time, because each day has its own stage.',
  'help.guide.tour-remove-from-day.tip.2':
    'There is no Delete in these menus or on the card. A tour is deleted on the Tours tab, with the bin on its row under Tours of this trip.',
  'help.guide.tour-remove-from-day.result':
    'The day no longer lists the tour, and its row in the list has no Day badge.',
  'help.guide.tour-filter-list.title': 'Filter the tour list',
  'help.guide.tour-filter-list.goal':
    'Narrow a long list to the tours you want: not yet planned, from a file, of one type.',
  'help.guide.tour-filter-list.step.1':
    'Click the filter button under Import GPX or KML. It shows the status it filters by, All at first, with the number of tours beside it.',
  'help.guide.tour-filter-list.step.2':
    'Under Status, pick Unplanned for the tours on no day yet, or Planned for those already on a day. Each line says how many tours match.',
  'help.guide.tour-filter-list.step.3':
    'Where the list mixes them, Source (TREK, GPX import, wanderer), Routing limit (T1 to T6) and Type (Hike, Bike tour and so on) narrow it further. Click a ticked value again to clear it.',
  'help.guide.tour-filter-list.step.4':
    'Close the menu. The button now shows the status, the number of tours left and +1 for each further filter you set.',
  'help.guide.tour-filter-list.tip.1':
    'Routing limit is the highest difficulty the route was planned to allow, not the difficulty measured on the trail.',
  'help.guide.tour-filter-list.tip.2':
    'A section shows up only when the tours differ in it, so a short list may offer just Status.',
  'help.guide.tour-filter-list.tip.3':
    'If nothing is left, the list says No tour matches these filters, and Reset filters clears them all. Filters change only what the list shows, never a tour or a day.',
  'help.guide.tour-filter-list.result':
    'Only the tours you filtered for are in the list; the others are still in the trip.',
  'help.guide.tour-hide-on-map.title': 'Hide a tour’s line on the map',
  'help.guide.tour-hide-on-map.goal':
    'Hide tours you do not need right now from the map, without changing them for anyone.',
  'help.guide.tour-hide-on-map.step.1':
    'Point at a tour in the list and click the eye that appears on the right of its row (Hide on the map).',
  'help.guide.tour-hide-on-map.step.2':
    'The tour’s line is hidden on the map. Its row stays in the list, dimmed, and shows a crossed-out eye (Show on the map). Click it to show the line again.',
  'help.guide.tour-hide-on-map.step.3':
    'While any tour is hidden, a line above the list says Hidden on the map, with how many. Show all puts every tour back at once.',
  'help.guide.tour-hide-on-map.tip.1':
    "Hiding affects only you and is saved in this browser for this trip: the tour, its days and its colour do not change, and the tour stays visible on other people's maps.",
  'help.guide.tour-hide-on-map.tip.2':
    'The phone map always shows every tour, and the Tours tab has no eye: hiding works here on the Plan tab.',
  'help.guide.tour-hide-on-map.result':
    'Only the tours you want are on your map, and the hidden ones stay in the list, dimmed.',
  'help.guide.tour-import-plan-tab.title': 'Import a track from the Plan tab',
  'help.guide.tour-import-plan-tab.goal': 'Import a GPX or KML track as a tour while you plan the days.',
  'help.guide.tour-import-plan-tab.step.1':
    'On the Plan tab, click Tours in the switch at the top of the right column.',
  'help.guide.tour-import-plan-tab.step.2':
    'Click Import GPX or KML at the top of the list and pick your files (GPX, KML or KMZ).',
  'help.guide.tour-import-plan-tab.step.3':
    'The Import preview shows each track before anything is saved. Under Import as, choose the type (Hike, Bike tour and so on), then click Import 1 tour.',
  'help.guide.tour-import-plan-tab.tip.1':
    'A track that is already in the trip is marked Already in the trip and is not imported twice.',
  'help.guide.tour-import-plan-tab.tip.2':
    'The import stays in the list here and does not open in a planner. Put it on a day with its round +, or open the Tours tab to look at it there.',
  'help.guide.tour-import-plan-tab.result':
    'The track is a tour of the trip: a row in the list with a GPX badge, and a line on the map.',

  // ── Screen: trip-tour-detail ────────────────────────────────────────────────
  'help.ctx.trip-tour-detail.title': 'Tour details',
  'help.ctx.trip-tour-detail.summary':
    'The card that opens over the map when you pick a tour on the Plan tab: its days, its measures and profile, where it came from, and the buttons that send it to your phone, copy it, save it in a collection or link it to the packing list.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Click a tour in the Tours list (switch the right column from Places to Tours first), its row inside a day, or its line on the map, and its card opens over the map. The map stays usable while the card is open.',
  'help.ctx.trip-tour-detail.bullet.2':
    'The header shows the round tile of the tour, its name with a pencil to rename it, a coloured dot for the colour of its line, and pills for the type, where it came from, the planned time, the distance, the ascent and the descent. The X on the right closes the card, and so does Escape.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Below come Trip days, with a tile for every day the tour is on, the measures with the elevation profile, and then, as far as they apply: the stations of a city walk, the checks and the wind of a paddle tour, Actual track, Packing list, Description, Notes, Origin and Files.',
  'help.ctx.trip-tour-detail.bullet.4':
    'The row at the bottom: Add to Day or Remove from Day while a day is open, Navigation to the start, the tour’s web page, GPX, Share where your device can share files, Collection and Copy.',
  'help.ctx.trip-tour-detail.bullet.5':
    'The card is for reading and for what goes with a tour. The route itself is changed in the Tours tab: open it and click the tour under Tours of this trip. A tour is deleted there as well, not here.',
  'help.guide.tour-detail-read.title': 'Open a tour and read its card',
  'help.guide.tour-detail-read.goal':
    'See all the trip’s information about a tour: its days, its distance and heights, its profile and its source.',
  'help.guide.tour-detail-read.step.1':
    'At the top of the right column, switch from Places to Tours, then click a tour. Its card opens over the map. Its row inside a day, or its line on the map, opens the same card.',
  'help.guide.tour-detail-read.step.2':
    "The header shows the tour's name and a summary in pills: what kind of tour it is, where it came from when it was imported, the time it is planned to take, the distance, the ascent and the descent.",
  'help.guide.tour-detail-read.step.3':
    'Point at the time to see how it is made up: the time in motion, the breaks and the planned total.',
  'help.guide.tour-detail-read.step.4':
    'Trip days shows a tile for every day the tour is on, with its date. Not on any day of the trip yet means it is still unplanned.',
  'help.guide.tour-detail-read.step.5':
    'Below come the measures: Distance, Minimum altitude, Maximum altitude, Ascent and Descent, the times under them, and the elevation profile in the colour of the tour’s line.',
  'help.guide.tour-detail-read.step.6':
    'Scroll on for the Description and the Notes, then Origin: planned in TREK, the file it was imported from, or the wanderer trail it came from, with the date.',
  'help.guide.tour-detail-read.step.7': 'Close the card with the X at its top, or press Escape.',
  'help.guide.tour-detail-read.tip.1':
    'An amber use with caution pill means the import has incomplete heights or measurements. Keep this in mind when you read its ascent and its profile.',
  'help.guide.tour-detail-read.tip.2':
    'A paddle tour shows no heights and no profile: its points are on the banks, so the heights would be wrong.',
  'help.guide.tour-detail-read.tip.3':
    'Some tours show more: a city walk its stations, a paddle tour its checks and the wind, a tour already done its Actual track, and a tour linked to a list its Packing list.',
  'help.guide.tour-detail-read.tip.4':
    'The card does not change the route. To move a point or redraw a leg, open the Tours tab and click the tour under Tours of this trip.',
  'help.guide.tour-detail-read.tip.5':
    'On a phone the card opens as a sheet from the bottom, for reading and for taking the tour with you.',
  'help.guide.tour-detail-read.result':
    'The tour’s card is open beside the plan, and you know which days it is on, how long and how steep it is, and where it came from.',
  'help.guide.tour-rename-colour.title': 'Rename a tour and change its colour',
  'help.guide.tour-rename-colour.goal':
    'Give a tour a name you recognise and a line colour that is easy to see on the map.',
  'help.guide.tour-rename-colour.step.1':
    'Open the tour’s card and click the pencil beside its name. The name turns into a field.',
  'help.guide.tour-rename-colour.step.2':
    'Type the new name and click the round check button, or press Enter. Escape keeps the old name.',
  'help.guide.tour-rename-colour.step.3':
    'Click the coloured dot at the corner of the tour’s round tile, Track colour. The Track colour section opens under the head.',
  'help.guide.tour-rename-colour.step.4':
    'Pick a colour. Automatic color, the first cell, resets the line to its default colour, and Choose custom color, the last one, lets you pick any colour. The line on the map and the stripe in the Tours list change at once.',
  'help.guide.tour-rename-colour.tip.1':
    'Name and colour belong to the trip, so everyone in it sees them. To hide a tour on your own map without changing it for anyone else, use the eye in the Tours list.',
  'help.guide.tour-rename-colour.tip.2': 'The pencil and the dot only work for members who may edit places.',
  'help.guide.tour-rename-colour.result':
    'The tour shows its new name everywhere in the trip, and its line is drawn in the colour you picked.',
  'help.guide.tour-take-along.title': 'Download a tour to your phone or GPS',
  'help.guide.tour-take-along.goal':
    'Get directions to the start of a tour, open its page on the web, or download its route as a GPX file.',
  'help.guide.tour-take-along.step.1':
    'Open the tour’s card. Navigation at the bottom of the card opens the start of the tour in a map app, and lists the apps first when there are several. It takes you to the start, not along the route.',
  'help.guide.tour-take-along.step.2':
    'Where the tour has a web page, the button beside it shows the site’s name (Komoot, AllTrails, Outdooractive or Wanderer) or Website for any other. It opens the page in a new tab.',
  'help.guide.tour-take-along.step.3':
    'Click GPX to download the saved tour as a GPX file: its whole route with the heights it has, ready for a navigation app or a GPS device.',
  'help.guide.tour-take-along.tip.1':
    'On a device that can share files, Share appears next to GPX and sends the same file directly to another app.',
  'help.guide.tour-take-along.tip.2':
    'Pick a preferred map app in Settings, and Navigation opens that app at once instead of listing them.',
  'help.guide.tour-take-along.tip.3':
    'The file comes from the server, so it needs a connection. A tour made offline can be downloaded once it has synced.',
  'help.guide.tour-take-along.tip.4':
    'In the Tours tab the same download is at the top of the left column. While the tour has unsaved changes, the download asks you to save first.',
  'help.guide.tour-take-along.result':
    'You have the way to the start in your map app and the whole route as a GPX file.',
  'help.guide.tour-copy-keep.title': 'Copy a tour or keep it in a collection',
  'help.guide.tour-copy-keep.goal':
    'Make a variant of a tour in this trip, or keep it for later trips in one of your collections.',
  'help.guide.tour-copy-keep.step.1':
    'Open the tour’s card and click Copy at the bottom. TREK makes a new, independent tour without its days, and the original stays as it is.',
  'help.guide.tour-copy-keep.step.2':
    'The copy opens immediately, with the name of the original followed by (copy). Click the pencil to give it its own name.',
  'help.guide.tour-copy-keep.step.3':
    'To keep a tour for other trips, open it and click Collection at the bottom of its card.',
  'help.guide.tour-copy-keep.step.4': 'Pick the list under Collection, check Name in the collection, and click Keep.',
  'help.guide.tour-copy-keep.tip.1':
    'Both are copies: later changes to the tour change neither the copy nor the version you saved in the collection.',
  'help.guide.tour-copy-keep.tip.2':
    'Save to Collection in a tour’s menu in the day plan opens this same dialog, so the route is saved there too.',
  'help.guide.tour-copy-keep.tip.3':
    'In the Tours tab the bookmark at the top of the left column does the same for the open tour. While it has unsaved changes it asks you to save the tour first.',
  'help.guide.tour-copy-keep.tip.4':
    'Collection is only there while the Collections addon is on. A list you may only read cannot be picked, and with no list yet the dialog offers Open collections.',
  'help.guide.tour-copy-keep.result':
    'The trip has a second tour to change freely, and the collection holds its own copy, ready to be added to another trip.',
  'help.guide.tour-packing-link.title': 'Link a tour to the packing list',
  'help.guide.tour-packing-link.goal':
    'Show what to pack for a tour right in its card, from the trip’s packing list or one of its lists.',
  'help.guide.tour-packing-link.step.1': 'Open the tour’s card and scroll to Packing list. Click Link a packing list.',
  'help.guide.tour-packing-link.step.2':
    'Under Link to, pick Whole packing list or one of its lists. Each row shows how many items it holds.',
  'help.guide.tour-packing-link.step.3': 'Click Link.',
  'help.guide.tour-packing-link.step.4':
    'The card now shows the list, how many of its items are packed, a bar and the first items. Packed ones are struck through.',
  'help.guide.tour-packing-link.step.5':
    'Click Open packing list to tick things off. TREK switches to the Lists tab, on the packing list.',
  'help.guide.tour-packing-link.tip.1':
    'It is only a link. Nothing is copied or moved, and the items stay in Lists. Tick one there and the tour shows it at once.',
  'help.guide.tour-packing-link.tip.2':
    'Change in the header of the section links the tour to another list. Remove link in that dialog removes the link, and the list stays unchanged.',
  'help.guide.tour-packing-link.tip.3':
    'Linking needs the right to edit places. Everyone else sees the linked list but cannot change the link.',
  'help.guide.tour-packing-link.result':
    'You are on the packing list in the Lists tab, and the tour’s card shows every item you tick.',
  'help.guide.tour-files.title': 'Attach files to a tour',
  'help.guide.tour-files.goal':
    'Add a booking, a map or a description of the route to the tour, and open it again from the tour’s card.',
  'help.guide.tour-files.step.1':
    'Open the tour’s card and scroll to Files at its end. Click Upload in the header of the section and choose one or more files.',
  'help.guide.tour-files.step.2': 'The row under it now counts them, and the list opens.',
  'help.guide.tour-files.step.3': 'Click a file to open it.',
  'help.guide.tour-files.tip.1': 'The files are the trip’s files as well, so they also show in the Files tab.',
  'help.guide.tour-files.tip.2': 'Upload is only shown to members who may change the tour and add files.',
  'help.guide.tour-files.result': 'The files are attached to the tour and open from its card.',
  'help.guide.tour-activity-link.title': 'Link the track you actually took',
  'help.guide.tour-activity-link.goal': 'Link a recorded GPX track to a planned tour without changing the plan.',
  'help.guide.tour-activity-link.step.1':
    'Open the planned tour’s card and scroll to Actual track. Click Add actual track.',
  'help.guide.tour-activity-link.step.2':
    'Under Done on, check the day you did it. Pick No day if it does not belong to one.',
  'help.guide.tour-activity-link.step.3': 'Pick the recording under Track, or click Import GPX to bring in a new file.',
  'help.guide.tour-activity-link.step.4': 'Check what it measured under Actual, then click Link.',
  'help.guide.tour-activity-link.step.5':
    'The track now appears under Actual track, with its own values and its own profile beside the plan.',
  'help.guide.tour-activity-link.tip.1':
    'The plan stays as it is. The track is only linked, and Unlink removes the link again.',
  'help.guide.tour-activity-link.tip.2':
    'You can only link an imported track that was not used to plan a tour, and you can link each track to only one tour.',
  'help.guide.tour-activity-link.tip.3':
    'Time taken runs from the first to the last time stamp in the track, breaks included.',
  'help.guide.tour-activity-link.result':
    'The track is linked to the tour, and the card shows the plan and what you did side by side.',
  'help.guide.tour-activity-compare.title': 'Compare the plan with what you did',
  'help.guide.tour-activity-compare.goal':
    'Read where the actual track differs from the plan, and change or unlink it.',
  'help.guide.tour-activity-compare.step.1':
    'Open the tour’s card. Plan and actual shows Distance, Ascent, Descent and Time with breaks of the plan next to those of the track, with the Difference.',
  'help.guide.tour-activity-compare.step.2':
    'Farthest from the plan shows the largest distance between the track and the planned line, and Off the plan shows how much of the track was off that line.',
  'help.guide.tour-activity-compare.step.3':
    'Click Compare on map to draw the actual track dotted beside the plan. End comparison removes it again.',
  'help.guide.tour-activity-compare.step.4':
    'Change below the track picks another recording. Unlink removes it from the tour, and the track stays in the trip as an import.',
  'help.guide.tour-activity-compare.tip.1':
    'Compare on map is only available while the card is shown beside the map, not on a phone.',
  'help.guide.tour-activity-compare.tip.2':
    'The tour activities in the Atlas count a linked track instead of the planned values.',
  'help.guide.tour-activity-compare.result':
    'You can quickly compare the day with the plan, on the card and on the map.',
  'help.guide.tour-origin-check.title': 'See where a tour came from',
  'help.guide.tour-origin-check.goal':
    'Find out whether a tour was drawn in TREK or imported, from which file, and whether it was changed since.',
  'help.guide.tour-origin-check.step.1':
    'Open the tour’s card and scroll to Origin. Source names where it came from: GPX import with the name of the file, KML or KMZ import, or wanderer with its address.',
  'help.guide.tour-origin-check.step.2':
    'Imported shows the day it was imported. Here shows its current state: As imported, Edited in TREK, or Planned over, recorded track kept.',
  'help.guide.tour-origin-check.step.3':
    'A tour you drew in the Tours tab shows planned in TREK, with the day it was Created.',
  'help.guide.tour-origin-check.tip.1':
    'A tour taken over from another trip names that trip and the tour under Taken over from.',
  'help.guide.tour-origin-check.tip.2':
    'A tour from wanderer has an arrow beside its source, Open in wanderer, and Check source in the header of the section. The check asks wanderer whether the trail changed since the import. Import as new snapshot then imports the new version as a separate tour. This tour keeps its days and notes.',
  'help.guide.tour-origin-check.tip.3':
    'No wanderer connection means your account is not connected yet. Connect it in Settings, under Integrations.',
  'help.guide.tour-origin-check.result':
    'You know where the tour came from, when, and whether it has changed since then.',

  // ── Screen: trip-tour-planner ───────────────────────────────────────────────
  'help.ctx.trip-tour-planner.title': 'Tours',
  'help.ctx.trip-tour-planner.summary':
    "The trip's tour planner: the editor on the left, every tour of the trip on the right and the map between them. Here you draw a tour point by point, route it along real paths and roads, add its details and save it into the trip.",
  'help.ctx.trip-tour-planner.bullet.1':
    "Tours sits in the trip's tab bar right after Plan while the Tours addon is on. The tab is there on a computer and a tablet; on a phone, tours are viewed and put on days from the Plan tab, but not drawn.",
  'help.ctx.trip-tour-planner.bullet.2':
    'The left rail is the editor. With nothing open it offers Plan new tour. An open tour shows its name, its type, its waypoints, the cards of its type and its details, with Discard and Save at the bottom.',
  'help.ctx.trip-tour-planner.bullet.3':
    'Tours of this trip, the right rail, lists every tour with the filter and Trip totals above the list. While a tour is open, Tour summary at the top gives its distance, its climb, its time and its elevation profile. The plus at the top, Add tour, plans, imports or takes over a tour.',
  'help.ctx.trip-tour-planner.bullet.4':
    "While Add point is on (Set points in the map's pill), a click on the map sets a point. Drag a pin to move it, click the drawn route to add a shaping point there, and pick a place of the trip with Trip places.",
  'help.ctx.trip-tour-planner.bullet.5':
    "Search place or address at the top of the map moves the map. The pill at the bottom left switches between the maps the tour's type offers, such as Topo or Satellite, and contains the switches of the open tour, such as Set points and 3D.",
  'help.ctx.trip-tour-planner.bullet.6':
    'An unsaved draft is kept: open the Tours tab again and it is restored, marked Unsaved draft restored. Back to Tours and Discard ask you before they discard changes.',
  'help.guide.tour-open-workspace.title': 'Find your way around the Tours tab',
  'help.guide.tour-open-workspace.goal': 'Open the tour planner and know what each part of it is for.',
  'help.guide.tour-open-workspace.step.1':
    "Click Tours in the trip's tab bar, right after Plan. The map fills the screen, with a rail on each side.",
  'help.guide.tour-open-workspace.step.2':
    'The left rail is the editor. With no tour open it offers Plan new tour, which starts a tour on the map.',
  'help.guide.tour-open-workspace.step.3':
    'The right rail, Tours of this trip, lists every tour of the trip, with the filter and Trip totals above the list.',
  'help.guide.tour-open-workspace.step.4':
    'The plus at the top of the right rail, Add tour, offers Import GPX or KML, Import walk from Google Maps and Take over a tour from another trip. While a tour is open, Plan new tour is there as well.',
  'help.guide.tour-open-workspace.step.5':
    'Search place or address at the top of the map moves the map to a place, so you can start where the tour is.',
  'help.guide.tour-open-workspace.step.6':
    'The pill at the bottom left switches the map, Map or Satellite at first. With a tour open it offers the maps of its type, such as Topo or Hiking, and switches such as Set points and 3D.',
  'help.guide.tour-open-workspace.step.7':
    'Click a tour in the right rail. A tour planned in TREK opens in the editor. An imported track opens unchanged, as GPX tour, for viewing.',
  'help.guide.tour-open-workspace.tip.1':
    "Collapse, on the tab at the inner edge of each rail, hides the rail to give the map more space; Plan and Tours of this trip show the rails again. Drag a rail's edge to make it wider or narrower.",
  'help.guide.tour-open-workspace.tip.2':
    'Drop GPX, KML or KMZ files anywhere on this tab to import them as tours of the trip.',
  'help.guide.tour-open-workspace.tip.3':
    'Opening another tour while the editor holds unsaved changes asks first: Discard changes, or keep editing.',
  'help.guide.tour-open-workspace.result':
    "The Tours tab: the editor on the left, the trip's tours on the right, the map between them.",
  'help.guide.tour-draw-route.title': 'Draw a new tour',
  'help.guide.tour-draw-route.goal':
    'Set the points of a new tour on the map and let TREK work out the route between them.',
  'help.guide.tour-draw-route.step.1':
    'Click Plan new tour at the top of the left rail. The rail changes to New tour, a hike unless you choose another type.',
  'help.guide.tour-draw-route.step.2':
    'Type where the tour starts into Search place or address and pick the result. The map moves there.',
  'help.guide.tour-draw-route.step.3':
    "Check that Add point under Waypoints is on (it is the same switch as Set points in the map's pill), then click the map where the tour starts.",
  'help.guide.tour-draw-route.step.4':
    'Point set appears at the bottom of the map. Undo next to it removes the point again.',
  'help.guide.tour-draw-route.step.5':
    'Click the next spots in the order you walk them. Each click adds the point as the new end, and from two points on TREK plans the route along the paths.',
  'help.guide.tour-draw-route.step.6':
    'Under Waypoints each point gets a row with its number, named after the place once the name has loaded. While TREK is working, a small dot beside New tour shows its status.',
  'help.guide.tour-draw-route.tip.1':
    'While Set points is on, the pointer is a crosshair. Turn it off to drag the map around without adding points. In 3D it starts off, because in 3D you drag the map to look around.',
  'help.guide.tour-draw-route.tip.2':
    "Topo or Hiking in the map's pill shows the paths, which makes it easier to click on one. A point too far from any way the type can use gets a notice instead of a route.",
  'help.guide.tour-draw-route.tip.3':
    'If a draft has unsaved changes, Plan new tour in the Add tour menu asks first: Start a new tour?, with Discard and start.',
  'help.guide.tour-draw-route.tip.4':
    'An unsaved draft is kept. Open the Tours tab of the trip again and it is restored, marked Unsaved draft restored.',
  'help.guide.tour-draw-route.result':
    'A numbered route on the map and its points under Waypoints, ready to be named and saved.',
  'help.guide.tour-type-profile.title': 'Choose what the tour is',
  'help.guide.tour-type-profile.goal':
    'Pick the tour type, and for a bike tour its profile, so the route follows the right ways.',
  'help.guide.tour-type-profile.step.1':
    'Click Tour type under Tour name. It shows the current type with a line on how it is planned.',
  'help.guide.tour-type-profile.step.2':
    'Pick the type in the list: Hike, City / sightseeing walk, Run, Bike tour, Paddle tour, Horse ride or Ski & winter. Each says what it plans, and a new type plans the route again.',
  'help.guide.tour-type-profile.step.3':
    'A bike tour asks for its Profile under the type: Touring, Road, Gravel or MTB. The line under it says what the profile prefers.',
  'help.guide.tour-type-profile.step.4':
    'The route is planned again for the profile, and Tour summary on the right shows its distance and its time.',
  'help.guide.tour-type-profile.tip.1':
    'A change of type counts as one step in the history: Undo waypoint edit in the rail head restores the old type and its route.',
  'help.guide.tour-type-profile.tip.2':
    'Some types ask for more before they can be saved: a Run its Planned pace, a Paddle tour its boat and its water, a Ski & winter tour its discipline.',
  'help.guide.tour-type-profile.result': 'The tour is routed for the type and the profile you chose.',
  'help.guide.tour-edit-points.title': 'Move, reorder and remove points',
  'help.guide.tour-edit-points.goal': 'Change where the tour goes by moving its points on the map or in the list.',
  'help.guide.tour-edit-points.step.1':
    'Drag a numbered pin on the map to where the point should be. The route is planned again through the new spot.',
  'help.guide.tour-edit-points.step.2':
    'Click a row under Waypoints to select its point. Its pin is highlighted on the map.',
  'help.guide.tour-edit-points.step.3':
    'To change the order, point at a row and drag it by the grip that appears at its left edge.',
  'help.guide.tour-edit-points.step.4':
    'Or open More actions (the three dots) on the row and choose Move waypoint up or Move waypoint down.',
  'help.guide.tour-edit-points.step.5': 'Remove waypoint, the bin beside it, takes the point out of the tour.',
  'help.guide.tour-edit-points.step.6':
    'Undo waypoint edit and Redo waypoint edit in the header of the rail undo or redo every change, one at a time.',
  'help.guide.tour-edit-points.tip.1':
    'The first point has a Start badge and the last one End. Moving a point to the top or the bottom makes it the start or the end.',
  'help.guide.tour-edit-points.tip.2':
    'A row shows the coordinates until the place name has loaded. Undo and Redo have no keyboard shortcut.',
  'help.guide.tour-edit-points.result':
    'The points are where and in the order you want them, and the route has been planned again.',
  'help.guide.tour-shaping-points.title': 'Change the route with a shaping point',
  'help.guide.tour-shaping-points.goal': 'Move the route onto another path without adding a stop.',
  'help.guide.tour-shaping-points.step.1':
    'Click the drawn route on the map where it should run differently. A small dot appears there: a shaping point.',
  'help.guide.tour-shaping-points.step.2':
    'Drag the dot onto the path the route should take. The route is planned again through it.',
  'help.guide.tour-shaping-points.step.3':
    'Under Waypoints it is listed with a Shaping point badge and no number, so the stops keep their numbers.',
  'help.guide.tour-shaping-points.step.4':
    'To turn a stop into a shaping point or back, open More actions on its row and choose Make it a shaping point or Make it a stop.',
  'help.guide.tour-shaping-points.tip.1': 'The start and the end are always stops.',
  'help.guide.tour-shaping-points.tip.2': 'A shaping point cannot end a stage of a multi-day tour.',
  'help.guide.tour-shaping-points.tip.3':
    'On a horse ride a click on the line adds nothing, because no router shapes it.',
  'help.guide.tour-shaping-points.result': 'The route runs where you dragged it, and the stops are numbered as before.',
  'help.guide.tour-loop-reverse.title': 'Make a round trip or reverse the tour',
  'help.guide.tour-loop-reverse.goal': 'Make the tour end at its start, or reverse its direction.',
  'help.guide.tour-loop-reverse.step.1':
    'Click Return to start in the header of the Waypoints card. The tour gets a last leg back to its first point.',
  'help.guide.tour-loop-reverse.step.2':
    'The last row now shows Back to start, and the route on the map ends where it began.',
  'help.guide.tour-loop-reverse.step.3':
    'Click Reverse direction beside it to walk the whole tour in the opposite direction.',
  'help.guide.tour-loop-reverse.tip.1':
    'Once the tour is a loop, Return to start says The tour already returns to its start.',
  'help.guide.tour-loop-reverse.tip.2':
    'Remove the Back to start row to make it a one-way tour again. A leg drawn by hand stays drawn by hand when the tour is reversed.',
  'help.guide.tour-loop-reverse.tip.3':
    'On a hike, Round hike from the start beside them looks for round hikes of a length you choose.',
  'help.guide.tour-loop-reverse.result':
    'A loop that ends where it started, or the same tour in the opposite direction.',
  'help.guide.tour-leg-by-hand.title': 'Draw a leg by hand, or plan it again',
  'help.guide.tour-leg-by-hand.goal':
    'Join two points with a straight line where the router finds no way, or plan a leg again.',
  'help.guide.tour-leg-by-hand.step.1':
    'Open More actions on the point the leg starts at and choose Draw the next leg by hand.',
  'help.guide.tour-leg-by-hand.step.2':
    'The leg becomes a dashed straight line, and under the row the list shows Drawn by hand, not routed, with its length.',
  'help.guide.tour-leg-by-hand.step.3':
    'To let the router plan it again, open the same menu and choose Route the next leg again.',
  'help.guide.tour-leg-by-hand.step.4':
    'Plan the next leg again asks the router once more for that one leg, without touching the others.',
  'help.guide.tour-leg-by-hand.tip.1':
    'No router checked a leg drawn by hand: it may cross water, private land or a cliff.',
  'help.guide.tour-leg-by-hand.tip.2':
    'A point that no path reaches shows a notice with Show point and its number. Move the point onto a path, or draw the leg to it by hand.',
  'help.guide.tour-leg-by-hand.result':
    'The leg is a straight line where you chose, marked as drawn by hand, or is routed again.',
  'help.guide.tour-trip-places.title': 'Use a place of the trip as a stop',
  'help.guide.tour-trip-places.goal': 'Add a place you already planned in the trip as a stop of the tour.',
  'help.guide.tour-trip-places.step.1':
    "Click Trip places beside Add point under Waypoints. The trip's places appear under it.",
  'help.guide.tour-trip-places.step.2':
    "Search the trip's places, or look under Near the tour: the places within two kilometres of the route, nearest first, each with its distance.",
  'help.guide.tour-trip-places.step.3':
    'Click a place. It is added as the new end of the tour, and the list stays open for the next one.',
  'help.guide.tour-trip-places.step.4':
    'Its row says Place of the trip under the name. Unlink from the place in More actions keeps the point but removes the link.',
  'help.guide.tour-trip-places.tip.1': 'A place already in the tour is marked In the tour and cannot be picked twice.',
  'help.guide.tour-trip-places.tip.2':
    'Removing the stop or unlinking it leaves the place in the trip as it is, including its days.',
  'help.guide.tour-trip-places.tip.3': "The trip's other tours are never offered as a stop.",
  'help.guide.tour-trip-places.result': "The tour has a new stop for the trip's place, with the same name.",
  'help.guide.tour-details-times.title': 'Name the tour and plan its time',
  'help.guide.tour-details-times.goal': 'Give the tour a name, a description and a link, and add breaks to its time.',
  'help.guide.tour-details-times.step.1':
    'Tour name at the top of the left rail contains the name. On a new tour the grey text there, Untitled hike for instance, is only a placeholder: type your own.',
  'help.guide.tour-details-times.step.2': 'Under Details, write a Description and add a Website if there is one.',
  'help.guide.tour-details-times.step.3': 'Enter Breaks, such as 0:45. They are added to the estimated time.',
  'help.guide.tour-details-times.step.4':
    'Planned shows the total. Type your own to override it; it is then marked Manual override.',
  'help.guide.tour-details-times.tip.1': 'Times can be typed as 2:56, 2 h 56 or 176 minutes.',
  'help.guide.tour-details-times.tip.2':
    'On a hike, Details also holds the Maximum trail difficulty and the Route choice, which the hike guides explain. A city walk has no Breaks: the time you stay at its stops is used instead.',
  'help.guide.tour-details-times.tip.3':
    'Click the arrow beside Details to collapse it. It opens automatically when one of its fields has a value that Save does not accept.',
  'help.guide.tour-details-times.result': 'The tour now has its name, its notes and the time you plan for it.',
  'help.guide.tour-save.title': 'Save a tour',
  'help.guide.tour-save.goal': 'Keep the drawn tour in the trip.',
  'help.guide.tour-save.step.1': 'Type a name into Tour name. Save stays greyed out without one.',
  'help.guide.tour-save.step.2':
    'Wait until the dot beside New tour has disappeared. Save needs the route and all its heights.',
  'help.guide.tour-save.step.3':
    'Click Save at the bottom of the left rail. Tour saved appears, and the title of the rail changes to Edit tour.',
  'help.guide.tour-save.step.4': 'The tour is now listed under Tours of this trip, on no day yet.',
  'help.guide.tour-save.tip.1':
    'Discard beside Save discards the unsaved changes after a confirmation. It does not change a saved tour.',
  'help.guide.tour-save.tip.2':
    'Back to Tours at the top of the rail closes the editor, and asks first if there are unsaved changes.',
  'help.guide.tour-save.tip.3':
    'Save also does not work while a field has an invalid value, such as a website that is not an address. Details opens automatically to show it.',
  'help.guide.tour-save.result': 'The tour is saved in the trip, ready to be put on a day.',
  'help.guide.tour-edit-saved.title': 'Change a saved tour',
  'help.guide.tour-edit-saved.goal': 'Open a tour you planned before, change it and save it again.',
  'help.guide.tour-edit-saved.step.1':
    'Click the tour under Tours of this trip. It opens in the left rail as Edit tour, and the map shows its route.',
  'help.guide.tour-edit-saved.step.2':
    'Change what you need, as for a new tour: move or add points, switch the type, or edit the details, as here the Description.',
  'help.guide.tour-edit-saved.step.3':
    'Click Save. Tour saved appears, and the tour keeps its days, its files and its notes.',
  'help.guide.tour-edit-saved.step.4':
    'Click Back to Tours to close it. With unsaved changes it asks Discard unsaved tour changes? first.',
  'help.guide.tour-edit-saved.tip.1': 'Save stays greyed out on a tour you have not changed.',
  'help.guide.tour-edit-saved.tip.2':
    'An imported GPX or KML track opens as GPX tour, to look at. Plan an editable version there makes a tour you can change.',
  'help.guide.tour-edit-saved.tip.3':
    'Download GPX and Keep in a collection in the rail head work once the changes are saved.',
  'help.guide.tour-edit-saved.result': 'The saved tour now contains your changes.',
  'help.guide.tour-summary-profile.title': 'Read the tour summary and the elevation profile',
  'help.guide.tour-summary-profile.goal':
    'See how long and how steep the tour is, and where on the route each height is.',
  'help.guide.tour-summary-profile.step.1':
    'Tour summary at the top of Tours of this trip gives the Distance, Ascent and Descent of the tour in the editor, its estimated time, the breaks and the planned total.',
  'help.guide.tour-summary-profile.step.2': 'The info dot beside the estimated time says how it is worked out.',
  'help.guide.tour-summary-profile.step.3':
    'Move the pointer along Elevation profile. It shows the distance and the height at that point, and a dot marks the same spot on the map.',
  'help.guide.tour-summary-profile.step.4':
    'Collapse elevation profile, the arrow beside its title, hides the profile; click it again to show it.',
  'help.guide.tour-summary-profile.tip.1': "Click the card's title to collapse the whole summary.",
  'help.guide.tour-summary-profile.tip.2':
    'A route that climbs a via ferrata gets a warning badge with its grade above the figures.',
  'help.guide.tour-summary-profile.tip.3':
    'A paddle tour shows no heights, because on the water the only available heights would be those of the banks.',
  'help.guide.tour-summary-profile.result':
    'You know how long the tour is, how much it climbs, how long it takes and where it gets steep.',
  'help.guide.tour-list-manage.title': "Manage the trip's tours",
  'help.guide.tour-list-manage.goal':
    "See the totals of the trip's tours, put one on a day and narrow the list to what you need.",
  'help.guide.tour-list-manage.step.1':
    'Trip totals is above the list. When collapsed, it shows the number of tours and how many are Planned and Unplanned. The arrow on its right opens a line per type with its distance, ascent, descent and times added up.',
  'help.guide.tour-list-manage.step.2':
    "Point at a tour and click the round plus on its row, Add to day, to open the trip's days.",
  'help.guide.tour-list-manage.step.3': 'Pick the day. The tour is added to that day, and its row shows the day.',
  'help.guide.tour-list-manage.step.4':
    'The button above Trip totals is the filter. It names the status it shows, All at first, with the number of tours.',
  'help.guide.tour-list-manage.step.5':
    'Pick Unplanned for the tours on no day yet, or narrow by Source, Routing limit or Type. Each line shows how many tours match it, and the totals follow the filter.',
  'help.guide.tour-list-manage.tip.1':
    'Each tour counts once in the totals, even on several days. A sum with ≥ in front does not include some tours. Hover it to see how many.',
  'help.guide.tour-list-manage.tip.2':
    'A day that already has the tour is greyed out in the day menu. For a multi-day tour, TREK asks whether its stages start on that day or the whole tour goes on that day.',
  'help.guide.tour-list-manage.tip.3':
    'The bin on a row deletes the tour. The Plan tab lists the same tours when its right column is switched to Tours.',
  'help.guide.tour-list-manage.result':
    'You see the totals for the tours the filter shows, and each tour is on the day you want.',
  'help.guide.tour-delete.title': 'Delete a tour',
  'help.guide.tour-delete.goal': 'Remove a tour from the trip for good.',
  'help.guide.tour-delete.step.1':
    "Point at the tour under Tours of this trip and click the bin on the right of its row, Delete with the tour's name.",
  'help.guide.tour-delete.step.2':
    'Read what is deleted with it: the route, the editable waypoints and the day assignments. Click Delete permanently.',
  'help.guide.tour-delete.tip.1': 'This cannot be undone, and Undo does not bring a tour back.',
  'help.guide.tour-delete.tip.2': "To only remove it from a day, use Remove from day in the day's menu instead.",
  'help.guide.tour-delete.tip.3':
    "A tour is deleted here, on the Tours tab. The bin is there only for travellers who may edit the trip's places.",
  'help.guide.tour-delete.result': 'The tour is gone from the list, the map and every day.',
  'help.guide.tour-saved-elsewhere.title': 'When the tour was saved elsewhere',
  'help.guide.tour-saved-elsewhere.goal':
    'Decide what happens when someone else saved the tour while you were changing it.',
  'help.guide.tour-saved-elsewhere.step.1':
    'This tour was saved elsewhere appears at the top of the rail while you edit. Your changes are kept until you decide.',
  'help.guide.tour-saved-elsewhere.step.2':
    'Load newer replaces your changes with the newer version, after a confirmation.',
  'help.guide.tour-saved-elsewhere.step.3':
    'If you click Save anyway, Changed in the meantime opens instead, and nothing is overwritten.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Choose Save as new tour to keep both, Load newer to load the other version, or Overwrite to replace the other version with yours.',
  'help.guide.tour-saved-elsewhere.tip.1':
    'Save as new tour names your copy after the tour, with (my version) behind it.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'The same happens when you changed the tour on another device. A tour you have not changed simply reloads, and a note says so.',
  'help.guide.tour-saved-elsewhere.result': 'No changes are lost unless someone chooses to discard them.',

  // ── Screen: trip-tour-import ────────────────────────────────────────────────
  'help.ctx.trip-tour-import.title': 'Importing tours',
  'help.ctx.trip-tour-import.summary':
    'Here you import tours that already exist somewhere else into the trip: a GPX, KML or KMZ file from a watch or an app, a tour of another of your trips, or a trail from your own wanderer. An import is kept exactly as it was recorded, and you can plan an editable version from it.',
  'help.ctx.trip-tour-import.bullet.1':
    'The + at the top of Tours of this trip is Add tour. It offers Import GPX or KML, Import walk from Google Maps and Take over a tour from another trip. Files can also be dropped anywhere on the Tours tab.',
  'help.ctx.trip-tour-import.bullet.2':
    'Import preview shows every track of the files on a map, with its distance, ascent, descent and points, before anything is saved. Under Import as you say what the tracks are.',
  'help.ctx.trip-tour-import.bullet.3':
    'An import opens as a GPX tour, or a wanderer tour: its line, the Tour summary and the elevation profile, exactly as imported. Its row in the list has the GPX import badge.',
  'help.ctx.trip-tour-import.bullet.4':
    'Editable version turns an import into a tour with waypoints you can move. Replace the import keeps the recorded track, and the Recorded track card in the editor takes you back to it.',
  'help.ctx.trip-tour-import.bullet.5':
    'Once wanderer is connected under Settings, Integrations, a wanderer button appears next to Plan new tour while no tour is open. It lists your own trails to import.',
  'help.guide.tour-import-gpx.title': 'Import a GPX, KML or KMZ file as a tour',
  'help.guide.tour-import-gpx.goal':
    'Turn a track from a GPS watch, an app or Google Earth into a tour of the trip, checked before anything is saved.',
  'help.guide.tour-import-gpx.step.1':
    'Open the Tours tab of the trip. At the top of Tours of this trip on the right, click the + (Add tour).',
  'help.guide.tour-import-gpx.step.2':
    'Choose Import GPX or KML and pick one or more .gpx, .kml or .kmz files, up to 10 MB each.',
  'help.guide.tour-import-gpx.step.3':
    'The Import preview opens, and nothing is saved yet. The map shows the whole course, and every track of the files is a numbered row with its distance, ascent, descent and points. A recorded track also says when it was made and how long it took.',
  'help.guide.tour-import-gpx.step.4':
    'Under Import as, check what the tracks are. Hike is preset. A Bike tour or a Run asks for its profile, a Paddle tour for its boat and water, Ski & winter for its discipline.',
  'help.guide.tour-import-gpx.step.5': 'Click Import 1 tour (or Import 3 tours for a file with three tracks).',
  'help.guide.tour-import-gpx.tip.1':
    'You can also drag the files from your computer onto the Tours tab and drop them there. The same preview opens.',
  'help.guide.tour-import-gpx.tip.2':
    'Every track or route in a file becomes a tour of its own. Tracks are never joined.',
  'help.guide.tour-import-gpx.tip.3':
    'A track the trip already has is greyed out as Already in the trip and is skipped.',
  'help.guide.tour-import-gpx.tip.4':
    'A KML or KMZ file also lists under Not imported what it contained besides its lines: pins, areas and other items.',
  'help.guide.tour-import-gpx.tip.5':
    'A file without heights says No heights in the file. The line and the distance are still right, but ascent and descent stay unknown.',
  'help.guide.tour-import-gpx.result':
    'The tour is in Tours of this trip, on no day yet. A single one opens straight away on the map as a GPX tour.',
  'help.guide.tour-view-import.title': 'Look at an imported track',
  'help.guide.tour-view-import.goal': 'See an imported tour’s course, measures and elevation as it came in.',
  'help.guide.tour-view-import.step.1':
    'In the Tours tab, click a tour with the GPX import badge in Tours of this trip.',
  'help.guide.tour-view-import.step.2':
    'The left column shows it as a GPX tour: Tour summary with its distance, heights and recorded time, and the elevation profile under it. The map shows its line.',
  'help.guide.tour-view-import.step.3': 'Back to Tours, the arrow at the top left, closes it again.',
  'help.guide.tour-view-import.tip.1':
    'An import cannot be edited point by point. Plan an editable version, in the Editable version card above, makes a tour from it that you can change.',
  'help.guide.tour-view-import.tip.2':
    'The download icon in the header saves it as a GPX file again, and the bookmark saves it in a collection.',
  'help.guide.tour-view-import.tip.3': 'A trail from wanderer opens the same way, as a wanderer tour.',
  'help.guide.tour-view-import.result':
    'You see the recorded track exactly as it was imported, with nothing recalculated.',
  'help.guide.tour-plan-from-import.title': 'Plan an editable tour from an import',
  'help.guide.tour-plan-from-import.goal':
    'Get waypoints you can move from a recorded track, and see how close the new route stays to it.',
  'help.guide.tour-plan-from-import.step.1':
    'Open the imported tour in the Tours tab. In the Editable version card on the left, click Plan an editable version.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK takes control points from the track and routes them again. The map draws the import dotted and the suggestion solid, and the card compares their lengths, the share Within 50 m of the track and the Largest deviation.',
  'help.guide.tour-plan-from-import.step.3':
    'Click Replace the import to plan this tour again in place: its days and notes stay, and the recorded track is kept so you can restore it. Plan as new tour does not change the import and creates a second tour next to it.',
  'help.guide.tour-plan-from-import.step.4':
    'The tour opens in the editor with its waypoints. Change it if you like, then click Save at the bottom of the column.',
  'help.guide.tour-plan-from-import.tip.1': 'Discard removes the suggestion. Nothing is stored until you save.',
  'help.guide.tour-plan-from-import.tip.2':
    'When the card says the suggestion is far from the track over longer sections, check those parts on the map before you plan with it.',
  'help.guide.tour-plan-from-import.tip.3':
    'A paddle or ski import is joined by straight lines between its points instead of being routed.',
  'help.guide.tour-plan-from-import.tip.4': 'A Horse ride has no editable version: it is kept as ridden.',
  'help.guide.tour-plan-from-import.result':
    'The tour now has waypoints you can drag, and its Origin says Planned over, recorded track kept.',
  'help.guide.tour-restore-recorded.title': 'Go back to the recorded track',
  'help.guide.tour-restore-recorded.goal':
    'Undo the replanning of an import and get the original track back, even much later.',
  'help.guide.tour-restore-recorded.step.1':
    'In Tours of this trip, click the tour you planned over. The Recorded track card in the editor says the track it was recorded with is kept.',
  'help.guide.tour-restore-recorded.step.2': 'Click Restore recorded track.',
  'help.guide.tour-restore-recorded.step.3':
    'Confirm with Restore recorded track. The waypoints and the routed line are removed, and the days and notes stay.',
  'help.guide.tour-restore-recorded.tip.1':
    'The card is shown only for a tour that was replaced with Replace the import and then saved.',
  'help.guide.tour-restore-recorded.tip.2':
    'A tour made with Plan as new tour has no recorded track of its own. The import it came from is still in the list.',
  'help.guide.tour-restore-recorded.result': 'The tour is a GPX tour again and shows the line it was recorded with.',
  'help.guide.tour-take-over.title': 'Take a tour over from another trip',
  'help.guide.tour-take-over.goal':
    'Reuse a tour you already planned or imported in another of your trips, without drawing it again.',
  'help.guide.tour-take-over.step.1':
    'Open the Tours tab of the trip the tour should go to. At the top of Tours of this trip, click the + (Add tour).',
  'help.guide.tour-take-over.step.2': 'Choose Take over a tour from another trip.',
  'help.guide.tour-take-over.step.3':
    'Find the tour: type into Search by name, or narrow the list with the Trip and Type filters.',
  'help.guide.tour-take-over.step.4':
    'Click the tour. The right side shows its line, its measures and the trip it comes from.',
  'help.guide.tour-take-over.step.5': 'Give it another name under Name in this trip if you like.',
  'help.guide.tour-take-over.step.6': 'Click Take over.',
  'help.guide.tour-take-over.tip.1':
    'The copy is a separate tour. It is not on any day yet, and later changes to the original do not affect the copy, or the other way round. Its Origin names the trip it was taken over from.',
  'help.guide.tour-take-over.tip.2':
    'Only your other trips are listed, and only the first 100 tours. Search or filter to find the rest.',
  'help.guide.tour-take-over.tip.3':
    'Taking a tour over needs a connection. If the editor has unsaved changes, the copy is still added to the list, but it does not open, so your work stays open.',
  'help.guide.tour-take-over.result':
    'A message confirms the take-over, and the tour opens in the editor, ready to put on a day.',
  'help.guide.tour-import-wanderer.title': 'Import a trail from wanderer',
  'help.guide.tour-import-wanderer.goal': 'Import one of the trails in your own wanderer into the trip as a tour.',
  'help.guide.tour-import-wanderer.step.1':
    'In the Tours tab, with no tour open, click wanderer next to Plan new tour.',
  'help.guide.tour-import-wanderer.step.2':
    'Type into Search trails. Search this map area shows only the trails that are in the visible part of the map.',
  'help.guide.tour-import-wanderer.step.3':
    'Click a trail. It appears on the map, and the column shows what its GPX file measures, its description and whether it is public or private in wanderer.',
  'help.guide.tour-import-wanderer.step.4': 'Click Import into trip.',
  'help.guide.tour-import-wanderer.tip.1':
    'The button is there once wanderer is connected under Settings, Integrations. Before that, the list offers Connect in settings.',
  'help.guide.tour-import-wanderer.tip.2':
    'The import is a copy: later changes in wanderer leave the tour as it is. Check source in the tour’s Origin tells you when the trail changed.',
  'help.guide.tour-import-wanderer.tip.3':
    'A trail already in the trip is marked In this trip and offers Open the tour. A trail that has changed since the import offers Import as new version beside the old one.',
  'help.guide.tour-import-wanderer.tip.4': 'Open in wanderer opens the trail on your instance.',
  'help.guide.tour-import-wanderer.result': 'The trail is a tour of the trip and opens on the map as a wanderer tour.',

  // ── Screen: trip-tour-map ───────────────────────────────────────────────────
  'help.ctx.trip-tour-map.title': 'Tour map',
  'help.ctx.trip-tour-map.summary':
    'The map in the middle of the Tours tab, for the tour you have open: the maps that suit its type, the pistes or seamarks shown on top of them, the places along its route, and the same tour in 3D on the real landscape.',
  'help.ctx.trip-tour-map.bullet.1':
    'The pill at the bottom left of the map has the base maps the open tour’s type offers: Map, Topo, Hiking on a hike, Cycling on a bike tour, and Satellite. What you pick there applies only to the planner and never changes the map setting in Settings.',
  'help.ctx.trip-tour-map.bullet.2':
    'After the divider in the pill come the switches of the tour’s type: Set points while you edit a tour, Via ferratas on a hike, Seamarks on a paddle tour and the pistes on a ski tour. 3D at the end shows the tour on a 3D landscape.',
  'help.ctx.trip-tour-map.bullet.3':
    'Search place or address at the top of the map moves the map to a town, a hut or a summit without adding anything to the tour.',
  'help.ctx.trip-tour-map.bullet.4':
    'Along the tour, a card in the left panel, searches for viewpoints, water, huts, food and more close to the route and lists the results. You can add a place from the list to the tour as a stop.',
  'help.ctx.trip-tour-map.bullet.5':
    'In 3D the route is shown on the terrain, coloured by how steep it is, with a legend that sums up its grades and a flyover that follows it from the start to the end.',
  'help.guide.tour-map-layers.title': 'Choose the map for a tour',
  'help.guide.tour-map-layers.goal':
    'Plan on the map that fits the kind of tour best: contour lines for the climbs, marked trails or cycle routes, or aerial imagery.',
  'help.guide.tour-map-layers.step.1':
    'Open the Tours tab and click a tour under Tours of this trip on the right. It opens in the planner, and the pill at the bottom left of the map lists the maps this kind of tour offers.',
  'help.guide.tour-map-layers.step.2':
    'Click Topo for contour lines and shaded relief, the map that shows how steep the ground is. The map you picked stays highlighted in the pill.',
  'help.guide.tour-map-layers.step.3':
    'On a hike, click Hiking for the marked trails and their numbers; a bike tour offers Cycling for the cycle routes instead. Satellite gives aerial imagery, and Map takes you back to the standard map.',
  'help.guide.tour-map-layers.result':
    'The tour is drawn on the map that suits it, and the pill shows which one is on.',
  'help.guide.tour-map-layers.tip.1':
    'The map you pick stays for every tour you open until you reload the page. A tour whose type does not offer it opens on Map, and the map in the Plan tab and the setting in Settings do not change.',
  'help.guide.tour-map-layers.tip.2':
    'Hiking and Cycling come from volunteer servers and are only there while your admin allows them. When one stops answering, its segment shows a ! and you can switch to another map; your tour stays as it is.',
  'help.guide.tour-map-layers.tip.3':
    'A paddle tour and a city walk offer Map and Satellite only; a run, a ski tour and a horse ride offer Map, Topo and Satellite.',
  'help.guide.tour-along-search.title': 'Find places along a tour',
  'help.guide.tour-along-search.goal':
    'Look for viewpoints, water, huts or a place to eat close to the route of the tour you are planning.',
  'help.guide.tour-along-search.step.1':
    'Open a tour in the Tours tab and scroll the left panel down to Along the tour, under the tour’s stops. The card is there once the tour has a route.',
  'help.guide.tour-along-search.step.2':
    'Click What to look for and tick the kinds you want, up to six at a time: Viewpoints, Summits, Huts and shelters, Drinking water, Food and more. The list offers what fits the tour’s type, and a tour starts with three of them ticked.',
  'help.guide.tour-along-search.step.3':
    'Under Within this distance of the route, pick how far from the line to look: 250 m, 500 m, 1 km or 2 km.',
  'help.guide.tour-along-search.step.4': 'Click Search along the tour. TREK only searches: the tour does not change.',
  'help.guide.tour-along-search.step.5':
    'The places found are listed with their distance from the route and drawn on the map in their colour. A star marks the best known ones, and In the tour those that are a stop already. The button now reads Search again.',
  'help.guide.tour-along-search.result':
    'The places along the route are in the list and on the map, ready to be looked at.',
  'help.guide.tour-along-search.tip.1':
    'After you change the route, the kinds or the distance, Search again is highlighted and says the list was found for the route as it was before. Click it to bring the list up to date.',
  'help.guide.tour-along-search.tip.2': 'On a city walk, four themes above the list select the right kinds for you.',
  'help.guide.tour-along-search.tip.3':
    'The results come from OpenStreetMap and TREK’s places index, so the search needs a connection. When nothing is found, Widen to tries the next distance; when a server is busy, Try again shows a countdown until you can try again.',
  'help.guide.tour-along-add-stop.title': 'Add a place along the tour as a stop',
  'help.guide.tour-along-add-stop.goal': 'Route the tour past a viewpoint, a hut or a spring you found along it.',
  'help.guide.tour-along-add-stop.step.1':
    'Click a place in the Along the tour list, or its pin on the map. Its card opens over the map: what it is, how far it is from the route and how far along the tour it is.',
  'help.guide.tour-along-add-stop.step.2':
    'Where it goes suggests the section where the place fits best. Click it to choose between which two stops it comes in instead, or As the new end. The map shows the new route as a dashed line before anything changes.',
  'help.guide.tour-along-add-stop.step.3':
    'Click Add as a stop. The badge beside it is a rough guess of the detour, measured in a straight line.',
  'help.guide.tour-along-add-stop.step.4':
    'The route is planned again past the place, and Along the tour says how much distance and time the tour gained. Undo in the same line removes the stop again.',
  'help.guide.tour-along-add-stop.result':
    'The tour now passes the place, with its new distance and time in Tour summary. Save the tour to keep the change.',
  'help.guide.tour-along-add-stop.tip.1':
    'The place becomes a stop of the tour, not a place of the trip, so it does not appear in the places list.',
  'help.guide.tour-along-add-stop.tip.2':
    'A place that becomes the new end is marked Extends the tour: the old end is no longer the end, and the tour continues to this place.',
  'help.guide.tour-along-add-stop.tip.3':
    'A section where you cannot add a stop (a via ferrata or a portage added as a fixed line, or a section drawn by hand) stays dimmed in the list, with the reason beside it.',
  'help.guide.tour-3d-terrain.title': 'See a tour in 3D',
  'help.guide.tour-3d-terrain.goal': 'Look at the tour on the real landscape, coloured by how steep it is.',
  'help.guide.tour-3d-terrain.step.1':
    'Open a tour in the Tours tab and click 3D at the end of the pill at the bottom left. The map tilts and shows the terrain in 3D, with the route drawn on it.',
  'help.guide.tour-3d-terrain.step.2':
    'The route is coloured by grade. Click Grade in the row at the bottom to draw it in the tour’s colour instead, and click it again to show the grades again.',
  'help.guide.tour-3d-terrain.step.3':
    'Click the Grade mix pill on the right. It expands to show how much of the tour runs under 5 %, 5 to 10 %, 10 to 18 %, 18 to 27 % and 27 % and more. When it is collapsed, it shows the highest point and the steepest stretch.',
  'help.guide.tour-3d-terrain.step.4':
    'Drag the Relief slider to make the hills up to three times as tall, which helps on gentle ground.',
  'help.guide.tour-3d-terrain.step.5': 'Click 3D again to go back to the flat map and continue planning.',
  'help.guide.tour-3d-terrain.result':
    'You have seen the tour on the 3D terrain with its steep sections in colour, and the flat map is back for planning.',
  'help.guide.tour-3d-terrain.tip.1': 'Overview in the same row shows the whole route again after you moved the view.',
  'help.guide.tour-3d-terrain.tip.2':
    'The map you picked is also used in 3D, and so are the via ferratas, the pistes and the seamarks. While you edit a tour, you can drag its points on the terrain, and with Set points on a click adds one.',
  'help.guide.tour-3d-terrain.tip.3':
    'The landscape needs a connection: its heights come from the open Mapzen terrain tiles. A paddle tour is drawn in its own colour without grades, because water is flat.',
  'help.guide.tour-3d-flyover.title': 'Fly along a tour',
  'help.guide.tour-3d-flyover.goal': 'Watch the whole tour from the start to the end before you walk, ride or ski it.',
  'help.guide.tour-3d-flyover.step.1':
    'Switch the tour to 3D. While the landscape along the route loads, a ring fills where the play button appears; once it is full, click Play flyover. The camera follows a dot along the route, and the cursor on the elevation profile in Tour summary moves with it.',
  'help.guide.tour-3d-flyover.step.2':
    'Under Speed, pick 1×, 2× or 4×. At 1× most tours take about 45 seconds from the start to the end.',
  'help.guide.tour-3d-flyover.step.3':
    'Pause stops the flight where it is, and Play flyover continues from there. Start over goes back to the beginning and starts the flight again.',
  'help.guide.tour-3d-flyover.step.4': 'Click Overview to show the whole tour again.',
  'help.guide.tour-3d-flyover.result': 'You have seen the tour from the air, start to end, at the speed you chose.',
  'help.guide.tour-3d-flyover.tip.1':
    'Scroll the mouse wheel during the flyover to zoom in or out; the camera stays on the dot. You cannot drag the map until you pause.',
  'help.guide.tour-3d-flyover.tip.2':
    'The flyover starts only after the landscape along the whole route is loaded, so it does not stop halfway to load map data. Point at the ring to see how much is loaded.',
  'help.guide.tour-3d-flyover.tip.3':
    'While the flight is paused, move along the elevation profile to move the dot to that point. Play flyover continues from there.',
  'help.guide.tour-map-overlays.title': 'Show pistes or seamarks over the map',
  'help.guide.tour-map-overlays.goal':
    'Show the ski pistes and lifts, or the buoys and harbour marks, on the map while you plan a ski or paddle tour.',
  'help.guide.tour-map-overlays.step.1':
    'Open a ski tour in the Tours tab. The pistes are on from the start: their switch is the snowy mountain in the pill at the bottom left, Pistes, cross-country trails and lifts. Click it to hide them on the map, and click it again to show them.',
  'help.guide.tour-map-overlays.step.2': 'Click Piste key, the small square of coloured dots beside the switch.',
  'help.guide.tour-map-overlays.step.3':
    'The key says what the colours mean: the downhill runs from Novice to Freeride, Cross-country trails, Winter and snowshoe trails, Toboggan runs, and Lifts and cable cars. Full key at OpenSnowMap opens every symbol. Press Escape to close it.',
  'help.guide.tour-map-overlays.step.4':
    'On a paddle tour the pill offers Seamarks instead. Click it to show buoys, beacons and harbour marks on the water.',
  'help.guide.tour-map-overlays.result': 'The pistes or seamarks are drawn over the map, and the legend explains them.',
  'help.guide.tour-map-overlays.tip.1':
    'The pistes are mapped data, not a live report: they say nothing about what is open or groomed, the snow or avalanches. When you zoom out beyond the ski area, the switch reads Zoom in to see the pistes.',
  'help.guide.tour-map-overlays.tip.2':
    'With no tour open the pistes switch is there too, so you can look at a ski area before you plan anything. On a hike the pill offers Via ferratas instead, with the number of routes in view.',
  'help.guide.tour-map-overlays.tip.3':
    'When a layer stops loading, its switch shows a ! and an explanation; the map and your route still work without it.',

  // ── Screen: trip-tour-stages ────────────────────────────────────────────────
  'help.ctx.trip-tour-stages.title': 'Multi-day tours',
  'help.ctx.trip-tour-stages.summary':
    'A multi-day tour is one route split into stages, one for each day you travel. Here you set where each day ends, see the measurements of every stage and put the stages on the days of the trip.',
  'help.ctx.trip-tour-stages.bullet.1':
    'Days in the editor makes the open tour a Day tour or a Multi-day tour. When you switch back to a day tour, all stage ends are removed after you confirm, and the route stays as it is.',
  'help.ctx.trip-tour-stages.bullet.2':
    'End stage here in a stop’s More actions menu ends a stage at that stop. Waypoints then shows a Stage N heading for each stage with its distance and time, and the stop that ends a stage has a moon icon.',
  'help.ctx.trip-tour-stages.bullet.3':
    'Tour summary lists every stage under Stages, from the stop it starts at to the one it ends at. A click on a stage selects its last stop and marks the spot in the elevation profile.',
  'help.ctx.trip-tour-stages.bullet.4':
    'In Tours of this trip, a multi-day tour shows a moon with its number of stages. That button, Show stages, expands the list of stages with the day each one is on and the Whole tour totals.',
  'help.ctx.trip-tour-stages.bullet.5':
    'The plus on a tour’s row, Add to day, puts the stages on the trip one a day from the day you pick, or the whole tour on that one day.',
  'help.guide.tour-multi-day.title': 'Plan a tour over several days',
  'help.guide.tour-multi-day.goal': 'Split one route into stages, one for each day you are on the move.',
  'help.guide.tour-multi-day.step.1': 'In Tours of this trip, click the tour to open it in the editor.',
  'help.guide.tour-multi-day.step.2':
    'Under Days, click Multi-day tour. A note says where the first stage end is placed.',
  'help.guide.tour-multi-day.step.3':
    'Point at the stop where the first day ends, click More actions and choose End stage here.',
  'help.guide.tour-multi-day.step.4':
    'Waypoints now splits into Stage 1 and Stage 2, each with its distance and time. The stop that ends a stage shows a moon icon.',
  'help.guide.tour-multi-day.step.5':
    'Tour summary lists every stage under Stages. Click one to see where it ends: its last stop is selected and the elevation profile marks the spot.',
  'help.guide.tour-multi-day.step.6':
    'To make it a day tour again, click Day tour and confirm Make it a day tour? with Remove stage ends. The route stays as it is.',
  'help.guide.tour-multi-day.tip.1':
    'End stage here works on a day tour too: the tour then becomes a multi-day tour automatically. The first and the last stop and a shaping point cannot end a stage.',
  'help.guide.tour-multi-day.tip.2':
    'To join two stages again, choose Remove stage end in the menu of the stop with the moon. Removing that stop joins them too, and a notice offers Undo.',
  'help.guide.tour-multi-day.tip.3':
    'A stage’s time does not include breaks. A time in the warning colour, More than a day on the move, is longer than one day.',
  'help.guide.tour-multi-day.tip.4':
    'Stages are saved when you click Save. When a change removes a stage that is on a day of the trip, a notice says that saving removes it from that day.',
  'help.guide.tour-multi-day.result': 'One route with its stages, each measured on its own. Click Save to keep them.',
  'help.guide.tour-stages-on-days.title': 'Put a multi-day tour on the trip’s days',
  'help.guide.tour-stages-on-days.goal': 'Put each stage on a day of its own, or the whole tour on one day.',
  'help.guide.tour-stages-on-days.step.1':
    'In Tours of this trip, point at the multi-day tour and click the plus, Add to day.',
  'help.guide.tour-stages-on-days.step.2': 'Pick the day you start the first stage.',
  'help.guide.tour-stages-on-days.step.3':
    'Choose Stages from this day on: stage 1 goes on that day and each next stage on the day after. Whole tour on this day puts the whole route on that one day instead.',
  'help.guide.tour-stages-on-days.step.4':
    'Click the button with the moon and the number of stages, Show stages, to show them.',
  'help.guide.tour-stages-on-days.step.5':
    'Each stage shows the day it is on. Click its day to move the stage to another day, or choose No day to take it off.',
  'help.guide.tour-stages-on-days.step.6':
    'The arrow beside it, Open this stage in the planner, opens the tour in the editor at that stage.',
  'help.guide.tour-stages-on-days.tip.1':
    'When the trip ends before the last stage, the option says which stage is the last one that fits. The stages after it get no day.',
  'help.guide.tour-stages-on-days.tip.2':
    'Whole tour on this day is greyed out on a day that already holds the tour. Stages from this day on still works there and replaces the whole tour on that day.',
  'help.guide.tour-stages-on-days.tip.3':
    'Dragging a multi-day tour onto a day in the Plan tab asks the same in a dialog, and so does Add to Day in the tour’s card.',
  'help.guide.tour-stages-on-days.tip.4':
    'In the day plan, each stage shows as Stage N with its own distance and time. Undo above the days in the Plan tab undoes the whole distribution in one step.',
  'help.guide.tour-stages-on-days.result':
    'Every stage is on its day of the trip, and the stage you opened is in the editor.',

  // ── Screen: trip-tour-hike ──────────────────────────────────────────────────
  'help.ctx.trip-tour-hike.title': 'Hikes and runs',
  'help.ctx.trip-tour-hike.summary':
    "A hike or a run open in the Tours tab: the editor on the left, the map in the middle, the tour's summary and the trip's other tours on the right. A hike keeps to the trail difficulty you allow, a run is timed by your own pace, and both show what OpenStreetMap records along the way.",
  'help.ctx.trip-tour-hike.bullet.1':
    'Tour type at the top of the editor decides how the route is planned. Hike uses paths up to the Maximum trail difficulty under Details; Run uses runnable ways and asks for your Planned pace.',
  'help.ctx.trip-tour-hike.bullet.2':
    'Waypoints lists the stops in order. Add point is on from the start, so a click on the map sets the next one; Trip places beside it turns a hut or a hotel of the trip into a stop.',
  'help.ctx.trip-tour-hike.bullet.3':
    'The header of the Waypoints card has the route tools: Reverse direction, Return to start and, on a hike, Round hike from the start. More actions on a stop has Compare ways for the next leg.',
  'help.ctx.trip-tour-hike.bullet.4':
    'Trail details, below the waypoints, shows the SAC grade, the surface and the way type of every section from OpenStreetMap and colours the route on the map by them. Nothing in it changes the tour.',
  'help.ctx.trip-tour-hike.bullet.5':
    'On a hike, Via ferratas in the row of map buttons at the bottom left shows the via ferratas nearby. The card of a via ferrata adds it to the route as a separate leg.',
  'help.ctx.trip-tour-hike.bullet.6':
    'Tour summary on the right gives distance, climb, the estimated walking or running time, breaks and the planned total, with the elevation profile under them. Save at the bottom of the editor saves the tour.',
  'help.guide.tour-hike-plan.title': 'Plan a hike within a difficulty you set',
  'help.guide.tour-hike-plan.goal':
    'Start a hike, set its stops, choose the hardest trail grade the route may use, and save it.',
  'help.guide.tour-hike-plan.step.1':
    'Click Plan new tour at the top of the left column. The editor opens as New tour.',
  'help.guide.tour-hike-plan.step.2': 'Open Tour type and pick Hike: on foot, within a difficulty you set.',
  'help.guide.tour-hike-plan.step.3': 'Type a name under Tour name.',
  'help.guide.tour-hike-plan.step.4':
    'Add point is on from the start: click the map where the hike starts and where it ends. Trip places beside it picks a hut or a hotel of the trip instead. From two points on, TREK works out the walking route.',
  'help.guide.tour-hike-plan.step.5':
    'Under Details, open Maximum trail difficulty and pick how hard the trails may get, from T1 (Hiking) to T6 (Difficult alpine hiking). The route is planned again within it.',
  'help.guide.tour-hike-plan.step.6': 'Click Save at the bottom of the left column.',
  'help.guide.tour-hike-plan.result':
    'The hike is listed under Tours of this trip with its distance, climb and walking time, ready to be put on a day.',
  'help.guide.tour-hike-plan.tip.1':
    'A new hike starts at T2 (Mountain hiking). T3 adds a warning that such paths can be exposed and need sure footing and no fear of heights.',
  'help.guide.tour-hike-plan.tip.2':
    'T4 and above first ask Enable alpine routing? Confirm only if the route may cross exposed or unmarked terrain; the question comes once per editing session.',
  'help.guide.tour-hike-plan.tip.3':
    'Route choice under the difficulty sets preferences for the route: Avoid steep climbs, Avoid steps and Avoid ferries. Where there is no other way, the route still goes there.',
  'help.guide.tour-hike-plan.tip.4':
    'The walking time follows the hiking signpost rule (DIN 33466) and leaves out breaks. Add them under Breaks in Details, and they show in the planned total.',
  'help.guide.tour-hike-trail-details.title': 'See grades, surfaces and way types along a hike',
  'help.guide.tour-hike-trail-details.goal':
    'Read what OpenStreetMap records for the ways under a hike, and find those stretches on the map.',
  'help.guide.tour-hike-trail-details.step.1':
    'Open the hike from Tours of this trip and find Trail details below the Waypoints card. Switch on Show along the route.',
  'help.guide.tour-hike-trail-details.step.2':
    'Pick what to show: SAC for the hiking grade, Surface, or Way type. The route on the map uses the same colours as the list.',
  'help.guide.tour-hike-trail-details.step.3':
    'The badges sum it up: how much of the route is Known, the Highest known grade and, shown separately, the Routing limit the hike was planned with.',
  'help.guide.tour-hike-trail-details.step.4':
    'Click a grade in the list to draw only those stretches on the map. Click it again to show the whole route.',
  'help.guide.tour-hike-trail-details.step.5':
    'Click Surface to read the same route by what you walk on, from asphalt to natural ground and rock.',
  'help.guide.tour-hike-trail-details.result':
    'You know which parts of the hike are graded how, what they are made of, and where they lie on the map.',
  'help.guide.tour-hike-trail-details.tip.1':
    'Ways that have no value in OpenStreetMap are listed under Unknown, and unknown does not mean easy. If some show Could not be asked this time, click Try again.',
  'help.guide.tour-hike-trail-details.tip.2':
    "A grade higher than the hike's limit shows an Above the limit badge in its row.",
  'help.guide.tour-hike-trail-details.tip.3':
    'Nothing in the card changes the tour, and it needs a connection. An imported hike shows the same card in its view, without a routing limit.',
  'help.guide.tour-hike-round.title': 'Find a round hike of about a given length',
  'help.guide.tour-hike-round.goal': 'Let TREK suggest loops of the length you want, starting from one stop of a hike.',
  'help.guide.tour-hike-round.step.1':
    'With the hike open, click Round hike from the start in the head of the Waypoints card. From another stop, open its More actions and choose Round hike from here.',
  'help.guide.tour-hike-round.step.2':
    'The Round hike card opens over the map. Check the start under From and type the Distance you want. The pill beside it shows the range of lengths a round hike can have.',
  'help.guide.tour-hike-round.step.3':
    'Click Find rounds. Round A, Round B and so on appear in the list and on the map, each in its own colour.',
  'help.guide.tour-hike-round.step.4':
    'Click a round to pick it. Its row shows distance, climb and time, and how much it differs from the distance you asked for.',
  'help.guide.tour-hike-round.step.5':
    'Click Take this round, then Replace when you are asked whether to replace the planned route.',
  'help.guide.tour-hike-round.result':
    'The hike follows the round you chose, back to its start. Round taken at the bottom of the map has Undo, and Save keeps it.',
  'help.guide.tour-hike-round.tip.1':
    "Rounds stay within the hike's Maximum trail difficulty; the T pill in the card shows which.",
  'help.guide.tour-hike-round.tip.2':
    'Distances from 1 to 60 km are accepted, and rounds within 20 % of yours are offered.',
  'help.guide.tour-hike-round.tip.3':
    'Search again goes back to the distance, and Cancel closes the card without changing anything.',
  'help.guide.tour-hike-compare-ways.title': 'Compare other ways for one section of a hike',
  'help.guide.tour-hike-compare-ways.goal':
    'See which other paths a hike could take between two stops, and take one of them.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Point at the stop where the section starts, click More actions on its row and choose Compare ways for the next leg.',
  'help.guide.tour-hike-compare-ways.step.2':
    'Other ways for this section opens over the map with the Current way and Way A, Way B and so on. Each is drawn on the map in its colour, and pointing at a row highlights its line.',
  'help.guide.tour-hike-compare-ways.step.3':
    'The badges on a row say how much longer, higher or slower it is than the current way. Click the one you want.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Click Take this way. TREK checks with the router that the route really follows it.',
  'help.guide.tour-hike-compare-ways.result':
    'That one section follows the way you picked and the rest of the hike stays as it was. Way taken at the bottom of the map has Undo.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Only hikes offer this, and only for a leg the router planned, not one drawn by hand.',
  'help.guide.tour-hike-compare-ways.tip.2':
    'When the router knows no other way, the card says so. When the router cannot follow the way you chose, the section stays as it is and the card tells you.',
  'help.guide.tour-hike-compare-ways.tip.3': 'Cancel closes the card and does not change the route.',
  'help.guide.tour-ferrata-add.title': 'Put a via ferrata on a hike',
  'help.guide.tour-ferrata-add.goal': 'Find the via ferratas around your hike and make one of them part of the route.',
  'help.guide.tour-ferrata-add.step.1':
    'With a hike open, click Via ferratas in the row of map buttons at the bottom left. The badge counts the via ferratas in view; zoom in if it asks you to.',
  'help.guide.tour-ferrata-add.step.2':
    'Click a via ferrata on the map, its dashed line or its sign. Its card shows the name, the grade and the length.',
  'help.guide.tour-ferrata-add.step.3':
    'Click Add to tour. The via ferrata is added at the end of the route as a leg of its own, with a point at each end.',
  'help.guide.tour-ferrata-add.step.4':
    "In Waypoints, the leg between those two points shows the via ferrata's name, grade and length.",
  'help.guide.tour-ferrata-add.step.5':
    'Tour summary on the right shows the Via ferrata badge with its grade, and the head of the editor warns The route climbs a via ferrata.',
  'help.guide.tour-ferrata-add.result':
    'The hike follows the via ferrata on its own line from OpenStreetMap. Click the map to continue from the top. The router plans only the way to the via ferrata and the way after it.',
  'help.guide.tour-ferrata-add.tip.1':
    "A via ferrata requires equipment and experience. The badge's tooltip says how much of it the route climbs.",
  'help.guide.tour-ferrata-add.tip.2':
    'Via ferratas are offered on hikes only. A via ferrata the route already climbs shows Part of the tour on its card instead of Add to tour.',
  'help.guide.tour-ferrata-add.tip.3':
    'The section on the via ferrata is highlighted on the elevation profile, so you can see at which point of the day you reach it.',
  'help.guide.tour-ferrata-add.tip.4':
    "View in OpenStreetMap on the card opens the via ferrata's own data. The badge turns amber when nothing can load, with the reason in its tooltip.",
  'help.guide.tour-run-plan.title': 'Plan a run at your own pace',
  'help.guide.tour-run-plan.goal': 'Plan a run on runnable ways and get its time from your pace.',
  'help.guide.tour-run-plan.step.1': 'Click Plan new tour, open Tour type and pick Run.',
  'help.guide.tour-run-plan.step.2':
    'Pick a Profile: Running for mostly paved ways in town, in parks and along rivers, Trail running for forest tracks and natural paths.',
  'help.guide.tour-run-plan.step.3': 'Type your Planned pace as minutes and seconds per kilometre, for example 7:30.',
  'help.guide.tour-run-plan.step.4':
    'Set the start and the end on the map, or pick them with Trip places. Under the pace, you see the running time: the distance times the pace.',
  'help.guide.tour-run-plan.step.5': 'Give the run a name under Tour name and click Save.',
  'help.guide.tour-run-plan.result':
    'The run is listed under Tours of this trip with its Running time (planned), and its profile and pace are saved with it.',
  'help.guide.tour-run-plan.tip.1': 'Without a pace the run cannot be saved.',
  'help.guide.tour-run-plan.tip.2':
    'Climbs, descents and how technical the way is are not in the time: it is distance times pace and nothing else.',
  'help.guide.tour-run-plan.tip.3': 'When your distances are in miles, the pace is per mile too.',
  'help.guide.tour-run-plan.tip.4': 'Trail running takes paths up to mountain paths (T2), never harder ones.',
  'help.guide.tour-run-ways.title': 'See which ways a run uses',
  'help.guide.tour-run-ways.goal': 'Check how much of a run is unpaved and how hard its paths get.',
  'help.guide.tour-run-ways.step.1':
    'Open the run from Tours of this trip and switch on Show along the route in Trail details, below the Waypoints card.',
  'help.guide.tour-run-ways.step.2':
    'The top of the card now shows how much of the run is unpaved and the most difficult graded path on it.',
  'help.guide.tour-run-ways.step.3':
    'Click Surface, then a surface in the list to draw only those stretches on the map.',
  'help.guide.tour-run-ways.result': 'You know which parts of the run are not on asphalt before you go.',
  'help.guide.tour-run-ways.tip.1': "Nothing here changes the run's route or its time.",
  'help.guide.tour-run-ways.tip.2':
    'Switch the Profile to Trail running to let the route take more natural paths, or to Running to keep it on firm ground.',

  // ── Screen: trip-tour-walk ──────────────────────────────────────────────────
  'help.ctx.trip-tour-walk.title': 'City walk',
  'help.ctx.trip-tour-walk.summary':
    'A tour on foot from stop to stop, planned in the Tours tab: how long you stay at each stop, which ones matter, the sights along the way, and when you reach each one on the walk’s day, checked against its opening hours.',
  'help.ctx.trip-tour-walk.bullet.1':
    'Tour type City / sightseeing walk turns a tour into a walk. Its points are stops with a Label, a stay and an importance. A walk has no hiking limit and no Breaks field: the stays are used instead.',
  'help.ctx.trip-tour-walk.bullet.2':
    'Waypoints lists the stops in order. A ring around a stop’s number marks it Must see (full) or Optional (dashed), a small shield marks it Protected, and a pill under its name shows how long you stay.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Once the walk is on a day with a start time, Times for at the top of Waypoints names that day, and every stop shows its arrival, its stay and what its opening hours say.',
  'help.ctx.trip-tour-walk.bullet.4':
    'Along the tour finds sights by Walk theme within a distance of the route, and Add as a stop plans one into the walk where you choose.',
  'help.ctx.trip-tour-walk.bullet.5':
    'Add tour in Tours of this trip imports a walking route shared from Google Maps. In the Plan tab, a walk opened from its day lets you check its stops off for that day.',
  'help.guide.tour-walk-plan.title': 'Plan a city walk from stop to stop',
  'help.guide.tour-walk-plan.goal':
    'Build a sightseeing walk out of stops, with how long you stay at each and which ones matter.',
  'help.guide.tour-walk-plan.step.1':
    'Click Plan new tour at the top of the left column, then open Tour type and choose City / sightseeing walk.',
  'help.guide.tour-walk-plan.step.2':
    'Add the stops: check that Add point is on and click the map at each one, or click Trip places to take a place the trip already has.',
  'help.guide.tour-walk-plan.step.3':
    'Point at a stop in Waypoints, click More actions beside it and choose Edit stop.',
  'help.guide.tour-walk-plan.step.4':
    'Give the stop a Label and a Stay in minutes. Leave the stay empty while you do not know it yet, and enter 0 for a point you only pass.',
  'help.guide.tour-walk-plan.step.5':
    'Set Importance to Regular, Optional or Must see. Turn on Protected for a stop that must stay where it is when a change is proposed later, then click Save.',
  'help.guide.tour-walk-plan.step.6':
    'Tour summary on the right shows Est. walking time, Stays and Planned, the two added up. Click Save at the foot of the left column to keep the walk.',
  'help.guide.tour-walk-plan.tip.1':
    'The ring around a stop’s number shows its importance: full for Must see, dashed for Optional. A small shield marks a Protected stop.',
  'help.guide.tour-walk-plan.tip.2':
    'A city walk has no hiking limit and no Breaks field: the stay times are used instead.',
  'help.guide.tour-walk-plan.tip.3':
    'Unlink from the place, in a stop’s More actions, only undoes the link to a trip place. The place itself stays in the trip.',
  'help.guide.tour-walk-plan.result':
    'The walk lists its stops with their stays, and Tour summary adds them up. Put it on a day to see when you reach each stop.',
  'help.guide.tour-walk-sights.title': 'Add sights along a city walk',
  'help.guide.tour-walk-sights.goal': 'Pick a theme, search along the walk and add a place as a stop.',
  'help.guide.tour-walk-sights.step.1':
    'With a city walk open, find Along the tour in the left column and pick a Walk theme: Culture and history, Parks and views, Food and local life or A bit of everything.',
  'help.guide.tour-walk-sights.step.2':
    'The theme fills What to look for. Open it to tick kinds on or off, and choose how far to look under Within this distance of the route.',
  'help.guide.tour-walk-sights.step.3':
    'Click Search along the tour. A star before a name marks a Highlight, one of the best-known places here.',
  'help.guide.tour-walk-sights.step.4':
    'Click a place in the list. Its card opens over the map: under Where it goes, choose the two stops it goes between.',
  'help.guide.tour-walk-sights.step.5':
    'Click Add as a stop. A notice says how much longer the walk gets, with Undo beside it.',
  'help.guide.tour-walk-sights.tip.1': 'It becomes a stop of the walk, not a place of the trip.',
  'help.guide.tour-walk-sights.tip.2':
    'After you change the route, the button shows Search again, because the places found belong to the old route.',
  'help.guide.tour-walk-sights.tip.3':
    'Opening hours and websites come from the source, mostly OpenStreetMap. Check them before you go.',
  'help.guide.tour-walk-sights.result':
    'The sight is a stop of the walk, planned into the route between the stops you chose.',
  'help.guide.tour-walk-day-times.title': 'See arrivals and opening hours for the day',
  'help.guide.tour-walk-day-times.goal':
    'Know when you reach each stop on the walk’s day, and which places are closed then.',
  'help.guide.tour-walk-day-times.step.1':
    'Put the walk on a day: in Tours of this trip, click the round + on its row (Add to day) and pick the day.',
  'help.guide.tour-walk-day-times.step.2':
    'Give it a start time on that day: in the Plan tab, right-click the walk in the day, choose Edit and enter a Start.',
  'help.guide.tour-walk-day-times.step.3':
    'Open the walk in the Tours tab again. At the top of Waypoints, Times for shows the day and its start time. On a walk planned on several days, click it to pick another.',
  'help.guide.tour-walk-day-times.step.4':
    'Under each stop you see when you arrive and how long you stay. A warning appears where a place is closed at that time or closes during the stay.',
  'help.guide.tour-walk-day-times.tip.1':
    'Without a start time the line says so: Give the walk a time on this day to see arrivals and opening hours.',
  'help.guide.tour-walk-day-times.tip.2':
    'If a stop has no stay time yet, the arrival times after it are shown as the earliest possible times.',
  'help.guide.tour-walk-day-times.tip.3':
    'Opening hours come from OpenStreetMap or from the trip place that a stop belongs to, and the pill beside them says which. Check them before you go.',
  'help.guide.tour-walk-day-times.tip.4':
    'Two walks on one day: in the Plan tab, click the leg between them (Change travel mode) and choose Public transit. The search starts where the first walk ends, at the time it ends, and warns you if a connection arrives after the next walk starts.',
  'help.guide.tour-walk-day-times.result':
    'You can reorder stops or change stays until every place is open when you get there.',
  'help.guide.tour-walk-google-import.title': 'Turn a Google Maps walking route into a city walk',
  'help.guide.tour-walk-google-import.goal':
    'Paste a walking route shared from Google Maps and load its stops as a walk.',
  'help.guide.tour-walk-google-import.step.1':
    'In Tours of this trip, click Add tour (the + at the top) and choose Import walk from Google Maps.',
  'help.guide.tour-walk-google-import.step.2':
    'Paste the link under Link to the walking route and click Read the link.',
  'help.guide.tour-walk-google-import.step.3':
    'Check Stops in the link. A stop that has no position in the link is marked and left out.',
  'help.guide.tour-walk-google-import.step.4':
    'Click Load as walk. TREK plans the way on foot between the stops itself. Click Save to keep the walk.',
  'help.guide.tour-walk-google-import.tip.1':
    'Only a route planned on foot is read. Switch Google Maps to walking before you share it.',
  'help.guide.tour-walk-google-import.tip.2':
    'Use another link takes you back to the link field. Loading replaces unsaved changes in the planner, and the dialog warns you first.',
  'help.guide.tour-walk-google-import.tip.3':
    'Only the stops are taken over, not the line drawn in Google Maps. A short maps.app.goo.gl link needs a connection to be followed.',
  'help.guide.tour-walk-google-import.result':
    'A new city walk opens in the editor with the stops from Google Maps, ready to be saved.',
  'help.guide.tour-walk-check-off.title': 'Check off the stops of a walk on the day',
  'help.guide.tour-walk-check-off.goal': 'Mark stops visited or skipped on the day and see how much walking is left.',
  'help.guide.tour-walk-check-off.step.1':
    'In the Plan tab, click the city walk in its day. Its card opens beside the map.',
  'help.guide.tour-walk-check-off.step.2':
    'Scroll to Stops of the walk. Each stop shows how long you stay and, if the walk has a start time, when you arrive.',
  'help.guide.tour-walk-check-off.step.3': 'Click Mark visited on a stop you have seen, or Skip on one you leave out.',
  'help.guide.tour-walk-check-off.step.4':
    'The top of the list counts the stops visited and shows the walking time left. Take back on a stop removes its mark.',
  'help.guide.tour-walk-check-off.tip.1':
    'Marks are saved per day: open the walk from its day in the plan, not from the tour list.',
  'help.guide.tour-walk-check-off.tip.2': 'The walk’s row in the day plan shows the count too, for example 3/7.',
  'help.guide.tour-walk-check-off.tip.3':
    'If you put a walk on a day while offline, you can check it off once it has synced.',
  'help.guide.tour-walk-check-off.result':
    'Visited stops are ticked, skipped ones struck through, and the time left counts only what is still ahead.',

  // ── Screen: trip-tour-bike ──────────────────────────────────────────────────
  'help.ctx.trip-tour-bike.title': 'Bike tours',
  'help.ctx.trip-tour-bike.summary':
    'A bike tour open in the editor on the Tours tab: the profile it is routed for, its riding time, what the route rides on and, on a mountain bike tour, how hard its trails are graded.',
  'help.ctx.trip-tour-bike.bullet.1':
    'Profile under Tour type says what kind of riding the router plans for: Touring, Road, Gravel or MTB. The line under it says what the router looks for, and changing it plans the whole route again.',
  'help.ctx.trip-tour-bike.bullet.2':
    'The Tour summary on the right gives Riding time (estimated), the router’s time for the profile, including the climbs. Breaks are not included.',
  'help.ctx.trip-tour-bike.bullet.3':
    'The Surface and ways card under Waypoints shows the ground of the route: the surfaces, the kinds of way and the share known to be unpaved. Click a row to highlight its stretches on the map.',
  'help.ctx.trip-tour-bike.bullet.4':
    'On the MTB profile the same card shows the trail grades (mtb:scale) where mappers added them. A way without a grade is unknown, not easy.',
  'help.guide.tour-bike-profile.title': 'Plan a bike tour for your kind of riding',
  'help.guide.tour-bike-profile.goal': 'Start a bike tour and let TREK route it for touring, road, gravel or MTB.',
  'help.guide.tour-bike-profile.step.1': 'On the Tours tab, click Plan new tour at the top of the left rail.',
  'help.guide.tour-bike-profile.step.2': 'Open the Tour type field and pick Bike tour.',
  'help.guide.tour-bike-profile.step.3':
    'Under Profile, choose Touring, Road, Gravel or MTB. The line below it says what the router looks for with that profile.',
  'help.guide.tour-bike-profile.step.4':
    'Under Waypoints, click Trip places and pick the start and the end, here Hotel Alpenroyal and then Hotel Greif. You can also check that Add point is on and click the map. From two points on, TREK works out the route.',
  'help.guide.tour-bike-profile.step.5':
    'Read Riding time (estimated) in the Tour summary on the right. Hover over its info dot to see how it is calculated.',
  'help.guide.tour-bike-profile.step.6': 'Type a name under Tour name, then click Save at the bottom of the left rail.',
  'help.guide.tour-bike-profile.result':
    'The bike tour is saved and listed under Tours of this trip, routed for its profile, with its riding time in the Tour summary.',
  'help.guide.tour-bike-profile.tip.1': 'Changing the profile later plans the whole route again for the new one.',
  'help.guide.tour-bike-profile.tip.2':
    'A profile only guides the router. It says nothing about whether a way can be ridden: the Surface and ways card shows what the route rides on.',
  'help.guide.tour-bike-profile.tip.3':
    'Where no way for bikes comes near a point, the rail says No way for bikes reaches point N. Move the point, or open More actions on the point before it and choose Draw the next leg by hand.',
  'help.guide.tour-bike-profile.tip.4':
    'Save stays greyed out until the tour has a name and the route and its heights are worked out.',
  'help.guide.tour-bike-profile.tip.5':
    'If an admin allows the CyclOSM map, the layer row on the map also offers Cycling while a bike tour is open. If it stops loading, switch to Map. The tour does not change.',
  'help.guide.tour-bike-surfaces.title': 'See the surfaces of a bike tour',
  'help.guide.tour-bike-surfaces.goal':
    'Find out how much of the route is asphalt, gravel or unknown, and which kinds of way it takes.',
  'help.guide.tour-bike-surfaces.step.1':
    'In Tours of this trip on the right, click a bike tour to open it. Once its route is calculated, the Surface and ways card appears under Waypoints.',
  'help.guide.tour-bike-surfaces.step.2':
    'The badge in the card’s header gives the share of the route known to be unpaved.',
  'help.guide.tour-bike-surfaces.step.3':
    'Under Surface, click a row such as Gravel or Natural ground. Its sections are highlighted on the map. Click the row again to remove the highlight.',
  'help.guide.tour-bike-surfaces.step.4':
    'Under Kind of way, click a row such as Farm or forest track or Road with traffic to see where the route runs on it.',
  'help.guide.tour-bike-surfaces.result':
    'The map marks the stretches of the row you picked, and you know which surfaces the route uses. The tour itself is unchanged.',
  'help.guide.tour-bike-surfaces.tip.1':
    'Not in the data means OpenStreetMap records no surface there. The surface is unknown, not necessarily good.',
  'help.guide.tour-bike-surfaces.tip.2':
    'On the Road profile, a warning above the bars says how far is known to be unpaved. Show on the map marks those stretches.',
  'help.guide.tour-bike-surfaces.tip.3':
    'The card uses the route as the router planned it and changes nothing on the tour. It needs a connection; offline it says so, and the route is unaffected.',
  'help.guide.tour-bike-surfaces.tip.4':
    'Click the card’s title to collapse it. It stays collapsed in this browser after a reload.',
  'help.guide.tour-bike-mtb-grades.title': 'Check the trail grades of a mountain bike tour',
  'help.guide.tour-bike-mtb-grades.goal': 'See how hard the trails on an MTB tour are before you ride them.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Open the bike tour in the editor and check that Profile is set to MTB. Trail grades are only read on that profile.',
  'help.guide.tour-bike-mtb-grades.step.2':
    'In the Surface and ways card, read Trail grade (mtb:scale): the share of the route from S0, no particular difficulty, up to S4 and up, expert ground.',
  'help.guide.tour-bike-mtb-grades.step.3': 'Click a grade row to highlight those trails on the map.',
  'help.guide.tour-bike-mtb-grades.result':
    'The map marks the trails of the grade you picked, and you know which stretches of the tour are the hard ones.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    'No grade in the data is unknown, not easy. A grade says nothing about whether a trail suits you.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Where mappers graded the climbs, Uphill grade (mtb:scale:uphill) follows below with its own rows.',
  'help.guide.tour-bike-mtb-grades.tip.3': 'If the grades could not be read, the card says so. Click Try again.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Switch Profile away from MTB and the grade sections disappear. The route is then planned again for the new profile.',

  // ── Screen: trip-tour-ski ───────────────────────────────────────────────────
  'help.ctx.trip-tour-ski.title': 'Ski & winter tours',
  'help.ctx.trip-tour-ski.summary':
    'A tour of type Ski & winter on the Tours tab: a day on the pistes, a cross-country loop, a ski tour, a snowshoe or a winter walk. Its legs follow the runs, lifts and trails mapped in OpenStreetMap, planned by the piste router for your discipline and your limits, and a recorded ski track is imported with its discipline.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Discipline comes first, and nothing is preselected: Alpine, Snowboard, Cross-country, Ski touring, Snowshoeing or Winter hiking. Cross-country also asks for the Technique: Classic, Skating or Unknown. Without a discipline the tour cannot be saved.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Under the discipline are the piste router’s options, only the ones your discipline uses: Hardest runs, Prefer, Pace, switches such as Ride lifts, and Leave out for the kinds of lift you do not want to ride. Every change plans the tour again.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Each point you click on the map is joined to the one before it along runs, lifts and trails. Under each point its leg is listed as chips, runs in the colour of their grade, with their minutes. A leg that cannot be planned turns red, says why and offers a fix or Draw straight.',
  'help.ctx.trip-tour-ski.bullet.4':
    'The Piste route card under the waypoints splits the day into Skiing, On lifts, Waiting and On foot, with the length of the runs, the height you ski down on them and the lift rides. Ski time in the Tour summary on the right adds it up once every leg is planned.',
  'help.ctx.trip-tour-ski.bullet.5':
    'While a Ski & winter tour is open, the map shows the pistes from OpenSnowMap, with Piste key beside their switch. All of it is mapped data: nothing here says whether a run or a lift is open, how the snow is, or anything about avalanches.',
  'help.guide.tour-ski-plan.title': 'Plan a ski and winter tour',
  'help.guide.tour-ski-plan.goal':
    'Plan a day on the pistes, a cross-country loop, a ski tour or a snowshoe walk along the mapped runs, lifts and trails.',
  'help.guide.tour-ski-plan.step.1': 'On the Tours tab, click Plan new tour at the top of the left rail.',
  'help.guide.tour-ski-plan.step.2': 'Open Tour type and pick Ski & winter.',
  'help.guide.tour-ski-plan.step.3':
    'Under Discipline, pick what you will do: Alpine, Snowboard, Cross-country, Ski touring, Snowshoeing or Winter hiking. Nothing is preselected, and the tour cannot be saved without one.',
  'help.guide.tour-ski-plan.step.4':
    'Check that Add point is on, then click the map where you start and at each place you want to reach, in order. The piste router joins each point to the one before it along runs, lifts and trails.',
  'help.guide.tour-ski-plan.step.5':
    'Under each point, its leg is listed as chips: every run, lift and section on foot by its name or its type, runs with a dot in the colour of their grade, and the minutes for each.',
  'help.guide.tour-ski-plan.step.6': 'Give the tour a name under Tour name and click Save.',
  'help.guide.tour-ski-plan.tip.1':
    'For Cross-country, also choose the Technique: Classic, Skating or Unknown. The notice under the fields says what is still missing.',
  'help.guide.tour-ski-plan.tip.2':
    'The info dot beside Discipline says what TREK does with ski tours. Nothing in it, or anywhere here, says anything about snow, avalanches or whether runs, lifts and trails are open.',
  'help.guide.tour-ski-plan.tip.3':
    'Changing the discipline later keeps your points and plans the legs again with the options that discipline uses.',
  'help.guide.tour-ski-plan.tip.4':
    'Where there is no piste data, a leg is a straight line between its points. For snowshoeing and winter hiking it may use summer paths instead, and a grey note on the leg says so.',
  'help.guide.tour-ski-plan.result':
    'A saved Ski & winter tour in Tours of this trip, its legs along the mapped runs, lifts and trails, and its time worked out in the Tour summary.',
  'help.guide.tour-ski-options.title': 'Tell the piste router how you ski',
  'help.guide.tour-ski-options.goal':
    'Set the most difficult runs, what to prefer, your pace and which lifts to use, so the legs suit you.',
  'help.guide.tour-ski-options.step.1':
    'In a Ski & winter tour, the router’s options are under the Discipline. You only see the ones your discipline uses: Cross-country has no Hardest runs, for instance.',
  'help.guide.tour-ski-options.step.2':
    'Open Hardest runs and pick the highest grade you want to ski, from Novice to Expert. Intermediate is the default.',
  'help.guide.tour-ski-options.step.3':
    'Under Prefer, choose Fastest, Most skiing or Easiest. Under Pace, choose Relaxed, Normal or Sporty: it changes the time the router gives each run.',
  'help.guide.tour-ski-options.step.4':
    'Use the switches: Ride lifts, Allow freeride routes, Ride a lift down where needed and Avoid guessed links. Cross-country adds Groomed trails only and Lit trails only, and Ski touring adds Skin up at the edge of pistes.',
  'help.guide.tour-ski-options.step.5':
    'Under Leave out, press each kind of lift you do not want to ride: Surface lifts, Open chairlifts, Gondolas, Cable cars or Funiculars and trains. A pressed one is struck through.',
  'help.guide.tour-ski-options.tip.1': 'Every change plans the tour again, leg by leg.',
  'help.guide.tour-ski-options.tip.2':
    'Ride lifts is on by default for Alpine and Snowboard and off for the other disciplines. Leave out and Ride a lift down where needed only show while lifts are ridden.',
  'help.guide.tour-ski-options.tip.3':
    'Avoid guessed links keeps the route off connections that the map data only guesses, such as an unmapped section between two runs.',
  'help.guide.tour-ski-options.result':
    'The tour is planned again within your limits, and the Piste route card lists the harder runs it avoided.',
  'help.guide.tour-ski-fix-leg.title': 'Fix a ski leg that could not be planned',
  'help.guide.tour-ski-fix-leg.goal': 'Get a red leg planned with one click, or draw it straight.',
  'help.guide.tour-ski-fix-leg.step.1':
    'A leg the router could not plan shows a red row under its point with the reason, for example Only a lift you left out joins these points, and the run or lift it is about.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Click the fix the row offers: Allow harder runs, Allow this lift, Ride the lift down, Switch technique or Switch discipline. The option changes and the leg is planned again.',
  'help.guide.tour-ski-fix-leg.step.3':
    'If no fix suits you, click Draw straight. The leg becomes a straight line between its two points.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'You can also drag the point on the map closer to a run, trail or lift. The leg is planned again when you let go.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'While the piste data for an area is still being downloaded, the planner waits and tries again automatically.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Offline, the legs are drawn straight for now. A grey row about summer paths is a note, not an error.',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Until every leg is planned, the Piste route card says there is no ski time yet.',
  'help.guide.tour-ski-fix-leg.result':
    'No leg is red any more: each one follows the pistes or runs straight between its points.',
  'help.guide.tour-ski-summary.title': 'Read a ski tour’s piste route',
  'help.guide.tour-ski-summary.goal': 'See how the day splits into skiing, lifts, waiting and walking.',
  'help.guide.tour-ski-summary.step.1':
    'Under the waypoints, find the Piste route card. Click its title to collapse it or open it again.',
  'help.guide.tour-ski-summary.step.2':
    'Skiing, On lifts, Waiting and On foot give the time for each. Runs, Down on runs and Lift rides give the length of the runs, the height you ski down on them and how many lifts you take.',
  'help.guide.tour-ski-summary.step.3':
    'In the Tour summary on the right, Ski time adds it all up. Its info dot explains how it is calculated.',
  'help.guide.tour-ski-summary.tip.1':
    'Kept clear of lists the harder runs the router avoided because of your Hardest runs limit.',
  'help.guide.tour-ski-summary.tip.2':
    'Ski time stays Not worked out until every leg is planned. To give the tour a time anyway, enter a planned total in its details.',
  'help.guide.tour-ski-summary.tip.3':
    'A saved tour opens as it was saved. Move a point or change an option to plan it again on the current piste data.',
  'help.guide.tour-ski-summary.tip.4':
    'The bottom of the card names the ski areas and the date of the map data the tour was planned on.',
  'help.guide.tour-ski-summary.result':
    'You know how long the day takes on the runs, on the lifts and waiting at them.',
  'help.guide.tour-ski-pistes-layer.title': 'Show the pistes on the map',
  'help.guide.tour-ski-pistes-layer.goal':
    'See the runs, cross-country trails and lifts around your ski tour, and what their colours mean.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'While a Ski & winter tour is open, the map shows the pistes automatically. The snowy mountain switch in the row at the bottom left of the map turns them off and on; its tooltip reads Pistes, cross-country trails and lifts.',
  'help.guide.tour-ski-pistes-layer.step.2': 'Click Piste key, the button with four coloured dots beside the switch.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'The key shows the downhill runs by difficulty, the cross-country trails, the winter and snowshoe trails, the toboggan runs and the lifts. Full key at OpenSnowMap opens the complete key.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'If the switch stays greyed out and says Zoom in to see the pistes, zoom in on the ski area.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'If the pistes stop loading, the switch shows a warning mark. The map and your route still work.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'The layer is mapped data, not a live report: it says nothing about what is open or groomed, the snow or avalanches. The switch is there with no tour open too, so you can look at a ski area before you plan.',
  'help.guide.tour-ski-pistes-layer.result': 'The pistes are drawn under the tour, and you can read their colours.',
  'help.guide.tour-ski-import.title': 'Import a ski track and say what it was',
  'help.guide.tour-ski-import.goal':
    'Import a recorded ski, cross-country or snowshoe track and give it the right discipline.',
  'help.guide.tour-ski-import.step.1':
    'On the Tours tab, click Add tour (the plus above Tours of this trip), choose Import GPX or KML and pick the file.',
  'help.guide.tour-ski-import.step.2': 'In the Import preview, open Import as and pick Ski & winter.',
  'help.guide.tour-ski-import.step.3':
    'Pick the Discipline, and for Cross-country the Technique. Until you do, the dialog says Choose a discipline to import the track as ski.',
  'help.guide.tour-ski-import.step.4': 'Click Import 1 tour.',
  'help.guide.tour-ski-import.step.5':
    'Click the track in Tours of this trip to open it. To correct its discipline later, click Change in its Ski track card.',
  'help.guide.tour-ski-import.step.6': 'In Classify ski track, pick the right discipline or technique and click Save.',
  'help.guide.tour-ski-import.tip.1':
    'An imported track is kept as it was recorded: TREK does not match it to the pistes, and its card shows Ski time as Not worked out.',
  'help.guide.tour-ski-import.tip.2':
    'To edit it like a planned tour, use Plan an editable version in its Editable version card. Its points are joined with straight lines.',
  'help.guide.tour-ski-import.tip.3':
    'You can also drop GPX, KML or KMZ files anywhere on the Tours tab to open the same preview.',
  'help.guide.tour-ski-import.result':
    'The track is in Tours of this trip, with its discipline and technique on its Ski track card.',

  // ── Screen: trip-tour-paddle ────────────────────────────────────────────────
  'help.ctx.trip-tour-paddle.title': 'Paddle tours',
  'help.ctx.trip-tour-paddle.summary':
    'A kayak, canoe or SUP tour on a river or a lake. It names its boat and its water, follows the water where TREK has the data, counts portages and locks into its time, and shows the wind on the day you paddle and what is known about the obstacles on the way.',
  'help.ctx.trip-tour-paddle.bullet.1':
    'Under Tour type, Paddle tour asks for a Boat (Kayak, Canoe, SUP or Other) and the Water (River or Lake). The tour cannot be saved before both are chosen.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Every point shows its role as a badge: Put-in, Take-out, Re-entry or Final take-out. Under a point you see what comes after it: a leg drawn by hand, a portage, a lock, or why a leg could not be planned.',
  'help.ctx.trip-tour-paddle.bullet.3':
    'More actions on a point contains the paddle tools: plan the next leg on the water or draw it by hand, Carry the boat from here, and Lock at this point.',
  'help.ctx.trip-tour-paddle.bullet.4':
    'Time estimate adds up the time on the water, carrying the boat, getting out and back in, the locks and the breaks, based on speeds and minutes you can change.',
  'help.ctx.trip-tour-paddle.bullet.5':
    'Wind shows the forecast at the start of the tour for the day it is planned on. Checklist lists the obstacles on the saved route and what you decided for each.',
  'help.ctx.trip-tour-paddle.bullet.6':
    'Paddling has risks, the row at the foot of the left column, opens Safety on the water. The map offers Map and Satellite, and Seamarks as an overlay.',
  'help.guide.tour-paddle-setup.title': 'Plan a paddle tour',
  'help.guide.tour-paddle-setup.goal':
    'Start a kayak, canoe or SUP tour and say what you paddle, on what water and how fast.',
  'help.guide.tour-paddle-setup.step.1': 'On the Tours tab, click Plan new tour at the top of the left column.',
  'help.guide.tour-paddle-setup.step.2': 'Open Tour type and pick Paddle tour, On the water, by kayak, canoe or SUP.',
  'help.guide.tour-paddle-setup.step.3':
    'Under Boat, pick Kayak, Canoe, SUP or Other. The boat sets the speed TREK suggests.',
  'help.guide.tour-paddle-setup.step.4':
    'Under Water, pick River or Lake. You cannot save the tour until you choose both a boat and a water type.',
  'help.guide.tour-paddle-setup.step.5':
    'On a lake, Across lakes sets the route: Straight over is the shortest, Near the shore stays close to the bank for windy days.',
  'help.guide.tour-paddle-setup.step.6':
    'Paddling speed shows the boat’s suggestion in grey. Type your own and the field says Own speed; the link under it, Use the suggested, takes the boat’s speed again.',
  'help.guide.tour-paddle-setup.step.7':
    'Check that Add point is on, then click the map: your put-in first, then any points on the way and your take-out.',
  'help.guide.tour-paddle-setup.tip.1':
    'With Boat set to Other there is no suggested speed. Enter one, or the time on the water stays empty.',
  'help.guide.tour-paddle-setup.tip.2':
    'The map of a paddle tour offers Map and Satellite, and Seamarks from OpenSeaMap as an overlay.',
  'help.guide.tour-paddle-setup.tip.3':
    'Along the tour looks for Put-ins, Boat rental and Drinking water first on a paddle tour.',
  'help.guide.tour-paddle-setup.tip.4':
    'Paddling has risks, the row at the bottom of the column, opens Safety on the water. Read it once before your first tour.',
  'help.guide.tour-paddle-setup.result':
    'A new paddle tour with its boat, its water and its speed, ready for its first point on the map.',
  'help.guide.tour-paddle-water-route.title': 'Plan the legs on the water',
  'help.guide.tour-paddle-water-route.goal':
    'Let TREK plan a leg along the river or lake, and understand the notes on a leg it could not plan.',
  'help.guide.tour-paddle-water-route.step.1':
    'A leg drawn by hand shows Drawn by hand, not routed under its point, with its length. TREK keeps its line as you drew it.',
  'help.guide.tour-paddle-water-route.step.2':
    'To have one leg planned on the water, point at the stop before it and click More actions, the three dots.',
  'help.guide.tour-paddle-water-route.step.3':
    'Choose Plan the next leg on the water. TREK plans the leg along the river or lake from this point to the next.',
  'help.guide.tour-paddle-water-route.step.4':
    'A leg TREK could not plan turns red and says why, for example that there is no water data for the area yet. Click Draw straight to draw it by hand for now.',
  'help.guide.tour-paddle-water-route.step.5':
    'To plan every leg drawn by hand at once, click Plan the legs drawn by hand on the water, the waves in the Waypoints header.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Where the water data is missing, TREK either downloads it for the region automatically or asks an admin for it, depending on how the instance is set up. The leg then shows Loading the water data and is planned automatically once the data is there, usually within one to three minutes.',
  'help.guide.tour-paddle-water-route.tip.2':
    'Where the route carries the boat around a weir or goes through a lock, TREK sets its own point there, marked Found. If you move or change it, it becomes your own point.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Notes under a planned leg flag Whitewater with its grade, a Boat chute, or a Gap in the map data bridged with a straight line.',
  'help.guide.tour-paddle-water-route.tip.4':
    'You cannot save while a leg is not planned. Plan it on the water or draw it by hand first.',
  'help.guide.tour-paddle-water-route.result':
    'Every leg follows the water or is drawn by hand on purpose, and a leg TREK could not plan says why.',
  'help.guide.tour-paddle-portage.title': 'Carry the boat around an obstacle',
  'help.guide.tour-paddle-portage.goal':
    'Mark a stretch where you carry the boat, so it counts as land, with time to get out of the boat and back in.',
  'help.guide.tour-paddle-portage.step.1':
    'Point at the stop where you get out and click More actions, the three dots.',
  'help.guide.tour-paddle-portage.step.2':
    'Choose Carry the boat from here. The section to the next point becomes a portage, drawn on land.',
  'help.guide.tour-paddle-portage.step.3':
    'A Portage card appears under the point with its length and the extra minutes. Click it to open it.',
  'help.guide.tour-paddle-portage.step.4':
    'Under Route, Follow the path uses a mapped way and Straight line goes directly across. TREK looks for the path by itself and tells you when there is none without a long detour.',
  'help.guide.tour-paddle-portage.step.5':
    'Under Out and in, type the minutes you need to get out, unload and put back in. If you leave it empty, TREK uses 10 minutes.',
  'help.guide.tour-paddle-portage.tip.1':
    'To paddle the stretch after all, open More actions on the point again and choose Paddle this stretch again. It turns back into a leg drawn by hand.',
  'help.guide.tour-paddle-portage.tip.2':
    'On the last point, Carry the boat from here applies once you set the next point. The row says Portage from here, and its cross, Do not carry after all, undoes it.',
  'help.guide.tour-paddle-portage.tip.3':
    'Carrying counts at 2 km/h until you set your own Carrying speed in the Time estimate card.',
  'help.guide.tour-paddle-portage.result':
    'The section is a portage on the map and in the waypoints, and the Time estimate counts it as carrying.',
  'help.guide.tour-paddle-lock.title': 'Add a lock and its waiting time',
  'help.guide.tour-paddle-lock.goal': 'Put a lock on the tour and include the wait and the passage in its time.',
  'help.guide.tour-paddle-lock.step.1': 'Point at the stop at the lock and click More actions, the three dots.',
  'help.guide.tour-paddle-lock.step.2':
    'Choose Lock at this point. A Lock card appears under the point, marked Time missing.',
  'help.guide.tour-paddle-lock.step.3': 'Click the Lock card to open it.',
  'help.guide.tour-paddle-lock.step.4':
    'Type the minutes for Wait and for Passage. Once both are in, the card shows their sum.',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK knows no lock schedules. The times are only what you enter, so check the lock’s hours yourself.',
  'help.guide.tour-paddle-lock.tip.2':
    'If a portage goes around the lock, the lock is dimmed and marked Carried round. The portage time counts instead, and the minutes of the lock are not included.',
  'help.guide.tour-paddle-lock.tip.3': 'Remove the lock is at the bottom of the open card and in More actions.',
  'help.guide.tour-paddle-lock.result': 'The lock is on the tour with its minutes, and the Time estimate adds them.',
  'help.guide.tour-paddle-time.title': 'Read and adjust a paddle tour’s time',
  'help.guide.tour-paddle-time.goal':
    'See how the water, the carrying, the locks and the breaks add up, and set your own values.',
  'help.guide.tour-paddle-time.step.1':
    'Time estimate is in the left column below the waypoints. The badge in its header is the total, breaks included.',
  'help.guide.tour-paddle-time.step.2':
    'The strip shows the route from start to end: the water, the portages in brown and the locks as ticks. Obstacles on the route are marks you can click to find them on the map.',
  'help.guide.tour-paddle-time.step.3':
    'The Water row is the distance on the water at your Paddling speed. Change the speed in the Paddling speed field at the top of the column.',
  'help.guide.tour-paddle-time.step.4':
    'With a portage on the tour, the Carrying row counts the carry. Click its speed and type how fast you carry the boat. Out and back in adds the minutes at each portage.',
  'help.guide.tour-paddle-time.step.5':
    'Until every lock has its times, the estimate shows Incomplete and a note under the rows lists what is missing.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK starts with 4 km/h on the water, 2 km/h carrying and 10 minutes at each portage. These are starting values to adjust, not measurements.',
  'help.guide.tour-paddle-time.tip.2': 'Current and wind are not in the estimate.',
  'help.guide.tour-paddle-time.tip.3':
    'Breaks and a planned total of your own are set under Details. With a planned total, the card shows Your planned total beside the estimate.',
  'help.guide.tour-paddle-time.result': 'The estimate counts what you entered and names what is still missing.',
  'help.guide.tour-paddle-wind.title': 'Check the wind for a paddle day',
  'help.guide.tour-paddle-wind.goal': 'See the forecast wind at the start of the tour on the day you paddle it.',
  'help.guide.tour-paddle-wind.step.1':
    'Put the paddle tour on a day of the trip. The Wind card in the left column then shows the forecast for that day at the start of the tour.',
  'help.guide.tour-paddle-wind.step.2':
    'Check the wind direction, its Mean and its Gusts. Mean is the strongest hourly mean of the day, Gusts the strongest gust.',
  'help.guide.tour-paddle-wind.step.3':
    'The bars show the hours of the day, with the gusts behind the average wind. Hover over a bar for that hour’s figures and direction.',
  'help.guide.tour-paddle-wind.step.4':
    'Open What wind means for paddling for what headwind, crosswind, open crossings and gusts do to a boat.',
  'help.guide.tour-paddle-wind.tip.1':
    'A forecast exists for the next 16 days only. For a day further ahead, it says from which date the forecast is available. For a past day, it says that the day has passed.',
  'help.guide.tour-paddle-wind.tip.2':
    'A tour on several days shows a Day chip for each in the card header. Click one to see that day.',
  'help.guide.tour-paddle-wind.tip.3':
    'On a windy day with a lake crossing, the card offers Plan near the shore, which plans the lakes along the bank.',
  'help.guide.tour-paddle-wind.tip.4': 'No forecast value means that it is safe. Check the conditions on site.',
  'help.guide.tour-paddle-wind.result': 'You know the wind for the day at your put-in, hour by hour.',
  'help.guide.tour-paddle-checklist.title': 'Go through the obstacle checklist',
  'help.guide.tour-paddle-checklist.goal':
    'See what is known about weirs, locks and access rules on a saved route, and decide what you do at each.',
  'help.guide.tour-paddle-checklist.step.1':
    'Save the paddle tour, then find Checklist in the left column. The badge in its header sums up where the list stands.',
  'help.guide.tour-paddle-checklist.step.2':
    'The line under it says how current the data is: OSM as of for OpenStreetMap, Fetched for when TREK read it, and Obstacle data where it does not cover the whole route.',
  'help.guide.tour-paddle-checklist.step.3':
    'The entries follow the route: weirs, locks, rapids, put-ins and access rules from OpenStreetMap, and your own portages and locks, marked Own.',
  'help.guide.tour-paddle-checklist.step.4':
    'Click an entry. The map moves to it: for an obstacle, its card opens with your decision; for your own portage or lock, its point is selected.',
  'help.guide.tour-paddle-checklist.step.5':
    'At the bottom of the column, click Paddling has risks to read Safety on the water before you set out.',
  'help.guide.tour-paddle-checklist.tip.1':
    'For each obstacle, pick what you will do: Paddle through, Carry round, Go round or Not affected. Next takes you to the next open entry.',
  'help.guide.tour-paddle-checklist.tip.2':
    'Carry round does not plan a portage automatically. Click Plan the portage to set it up on the map.',
  'help.guide.tour-paddle-checklist.tip.3':
    'An entry marked Check again was decided before the route or the data changed. Decide it again, or choose Keep decision or Remove decision. Decisions that no longer apply are listed under Earlier decisions.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Obstacles come from the OpenStreetMap data of the regions TREK holds. Where it has none, the card says so, and you check weirs, locks and portages yourself.',
  'help.guide.tour-paddle-checklist.tip.5':
    'A checklist is not a safety or legal approval. Your decision does not remove a ban or private land recorded in OpenStreetMap.',
  'help.guide.tour-paddle-checklist.result':
    'Every entry on the route has a decision, and you have read the safety note.',
  'help.guide.tour-paddle-track-marks.title': 'Mark portages and locks on a recorded paddle track',
  'help.guide.tour-paddle-track-marks.goal':
    'Import a paddle track from your watch and add where you carried the boat and where you went through a lock.',
  'help.guide.tour-paddle-track-marks.step.1':
    'On the Tours tab, click Add tour in the right column, choose Import GPX or KML and pick the file.',
  'help.guide.tour-paddle-track-marks.step.2':
    'In the Import preview, set Import as to Paddle tour, then choose the Boat and the Water. The import cannot continue until you choose both.',
  'help.guide.tour-paddle-track-marks.step.3': 'Click Import 1 tour.',
  'help.guide.tour-paddle-track-marks.step.4':
    'Click the track in Tours of this trip. The left column shows it as it was recorded, with the Portages and locks card.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Click Portage, then click the line where you got out and where you put back in.',
  'help.guide.tour-paddle-track-marks.step.6': 'Click Lock, then click the line where the lock is.',
  'help.guide.tour-paddle-track-marks.step.7': 'Open the cards, type their minutes and click Save.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Click exactly on the track: a click too far from the line is refused, and the card says so.',
  'help.guide.tour-paddle-track-marks.tip.2':
    'Discard removes the marks you have not saved. The recorded track itself is never redrawn.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'On a recorded track the Water row of the Time estimate has its own speed: click it and type how fast you paddled.',
  'help.guide.tour-paddle-track-marks.result':
    'The recorded track includes its portages and locks, and its Time estimate counts them.',

  // ── Screen: trip-tour-horse ─────────────────────────────────────────────────
  'help.ctx.trip-tour-horse.title': 'Horse rides',
  'help.ctx.trip-tour-horse.summary':
    'A horse ride is never routed. It is built from sections of the signposted horse routes OpenStreetMap knows, joined by stretches you draw by hand, or kept exactly as you recorded it.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Set Tour type to Horse ride in the editor and the Horse routes card appears in the left column. Find in map view lists the routes in the map view.',
  'help.ctx.trip-tour-horse.bullet.2':
    'A route opens in its own dialog: pick a section and the Direction you ride it in, check Riding access, then click Take section.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Each section is a badge in the Waypoints card with the route’s name, an access dot and its length. A stretch that no horse route covers reads Manual, unchecked.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK works out no riding time. Enter a time under Planned in Details if you want one on the day.',
  'help.ctx.trip-tour-horse.bullet.5':
    'A ride imported from a GPX file stays exactly as it was recorded, and its Recorded ride card says what the import could not calculate.',
  'help.guide.tour-horse-plan.title': 'Plan a ride along horse routes',
  'help.guide.tour-horse-plan.goal': 'Build a horse ride from sections of the signposted horse routes in the map view.',
  'help.guide.tour-horse-plan.step.1':
    'Bring the area you want to ride in into view on the map, then click Plan new tour at the top of the left column.',
  'help.guide.tour-horse-plan.step.2':
    'Click the Tour type field under Tour name and choose Horse ride. The Horse routes card appears below Waypoints.',
  'help.guide.tour-horse-plan.step.3':
    'In the Horse routes card, click Find in map view. Every signposted horse route in the view is listed with its length there.',
  'help.guide.tour-horse-plan.step.4':
    'Click a route in the list. It opens on a map of its own, with its sections numbered.',
  'help.guide.tour-horse-plan.step.5':
    'Pick a section under Sections. Check the Direction you ride it in and what Riding access says along it.',
  'help.guide.tour-horse-plan.step.6':
    'Click Take section. The section is added to the ride as a badge with the route’s name in the Waypoints card. Add more sections the same way.',
  'help.guide.tour-horse-plan.step.7':
    'Give the ride a name under Tour name, then click Save at the bottom of the left column.',
  'help.guide.tour-horse-plan.result':
    'The ride follows the sections you took, each with its route’s name, access dot and length, and it is listed under Tours of this trip.',
  'help.guide.tour-horse-plan.tip.1':
    'A horse route does not give you permission to ride it. Riding access only shows what OpenStreetMap tags. Always follow the signs on site.',
  'help.guide.tour-horse-plan.tip.2':
    'TREK works out no riding time for a ride. Enter one under Planned in Details if you want a time on the day.',
  'help.guide.tour-horse-plan.tip.3':
    'Moved the map after a search? The button reads Search this view. A view that is too large asks you to zoom in first.',
  'help.guide.tour-horse-plan.tip.4':
    'Undo waypoint edit in the header of the left column undoes a whole section in one step.',
  'help.guide.tour-horse-plan.tip.5':
    'Nothing on a ride is routed: a click on the drawn line adds no shaping point, and the points at the ends of a section stay where the route has them.',
  'help.guide.tour-horse-gap.title': 'Bridge a gap between horse routes',
  'help.guide.tour-horse-gap.goal': 'Continue with a section that starts away from the end of your ride.',
  'help.guide.tour-horse-gap.step.1':
    'With a section on the ride, open another route and pick a section that does not touch the end of your ride. Under Joining your ride, a notice says how far apart they are.',
  'help.guide.tour-horse-gap.step.2': 'Switch on Join with a manual section. The gap is drawn straight and unchecked.',
  'help.guide.tour-horse-gap.step.3': 'Click Take section. Until the switch is on, the button stays greyed out.',
  'help.guide.tour-horse-gap.step.4':
    'In the Waypoints card the bridge shows Manual, unchecked, with its length. Point at it to read why.',
  'help.guide.tour-horse-gap.result':
    'The ride has no gap any more, and the bridged stretch is marked as drawn by hand.',
  'help.guide.tour-horse-gap.tip.1':
    'No router and no horse route checked a manual section. Look at the map to see where it really runs.',
  'help.guide.tour-horse-gap.tip.2':
    'Points you click on the map are added to the ride the same way, as straight, unchecked legs.',
  'help.guide.tour-horse-gap.tip.3':
    'A section that starts within 25 m of the end of your ride continues directly from it, and Joining your ride says Joins the end of your ride.',
  'help.guide.tour-horse-recorded.title': 'Keep a recorded ride from a GPX file',
  'help.guide.tour-horse-recorded.goal':
    'Import a ride you recorded on a GPS device or in an app, and keep it exactly as you rode it.',
  'help.guide.tour-horse-recorded.step.1':
    'In Tours of this trip, click Add tour (the +), choose Import GPX or KML and pick the file of your ride.',
  'help.guide.tour-horse-recorded.step.2':
    'Import preview opens, and nothing is saved yet. Under Import as, set Tour type to Horse ride. Three badges say what the import keeps and what it does not work out.',
  'help.guide.tour-horse-recorded.step.3': 'Click Import 1 tour.',
  'help.guide.tour-horse-recorded.step.4':
    'The ride opens in the left column. The Recorded ride card shows As recorded, No riding time and Access not checked. Point at a badge to read why.',
  'help.guide.tour-horse-recorded.result':
    'The ride is in the trip exactly as you rode it, with its distance and heights from the file.',
  'help.guide.tour-horse-recorded.tip.1':
    'The line stays exactly as the file recorded it. Nothing is routed again, and a recorded ride has no editable version.',
  'help.guide.tour-horse-recorded.tip.2':
    'A file without heights shows No heights in the file instead of an ascent of zero.',
  'help.guide.tour-horse-recorded.tip.3':
    'You can also drop the file anywhere on the Tours tab to open the same preview.',
};

export default help;
