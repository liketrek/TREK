import { Map, MessageCircle, PackageCheck, Ticket, Wallet } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useSharedTrip } from './sharedTrip/useSharedTrip';
import { SharedTripErrorScreen } from './sharedTrip/SharedTripErrorScreen';
import {
  PAGE_WIDTH,
  SharedFooter,
  SharedHero,
  SharedLoading,
  SharedTabBar,
  SharedTopBar,
  type HeroStat,
  type SharedTab,
} from './sharedTrip/SharedChrome';
import { SharedPlanView } from './sharedTrip/SharedPlanView';
import { SharedBookingsView } from './sharedTrip/SharedBookingsView';
import { SharedChatView, SharedCostsView, SharedPackingView } from './sharedTrip/SharedListsViews';

export default function SharedTripPage() {
  const { t, locale } = useTranslation();
  // Page = wiring container: share fetch + view state live in the hook.
  const {
    data,
    error,
    retry,
    retrying,
    base,
    convert,
    selectedDay,
    setSelectedDay,
    pickDayOnMap,
    collapsedDays,
    toggleDay,
    activeTab,
    setActiveTab,
    showLangPicker,
    setShowLangPicker,
  } = useSharedTrip();

  if (error) return <SharedTripErrorScreen reason={error} retrying={retrying} onRetry={retry} />;
  if (!data) return <SharedLoading />;

  const { trip, permissions } = data;
  const reservations = data.reservations || [];

  const tabs: SharedTab[] = [
    ...(permissions?.share_map !== false ? [{ id: 'plan', label: t('shared.tabPlan'), icon: Map }] : []),
    ...(permissions?.share_bookings ? [{ id: 'bookings', label: t('shared.tabBookings'), icon: Ticket }] : []),
    ...(permissions?.share_packing ? [{ id: 'packing', label: t('shared.tabPacking'), icon: PackageCheck }] : []),
    ...(permissions?.share_budget ? [{ id: 'budget', label: t('shared.tabBudget'), icon: Wallet }] : []),
    ...(permissions?.share_collab ? [{ id: 'collab', label: t('shared.tabChat'), icon: MessageCircle }] : []),
  ];

  const stats: HeroStat[] = [
    { key: 'days', value: data.days?.length || 0, label: t('dashboard.days', { count: data.days?.length || 0 }) },
    { key: 'places', value: data.places?.length || 0, label: t('dashboard.places', { count: data.places?.length || 0 }) },
    { key: 'bookings', value: permissions?.share_bookings ? reservations.length : 0, label: t('trip.tabs.reservations') },
  ].filter(s => s.value > 0);

  return (
    <div className="flex min-h-screen flex-col bg-surface-secondary" style={{ fontFamily: 'var(--font-system)' }}>
      <SharedTopBar title={trip.title} locale={locale} langOpen={showLangPicker} onLangOpenChange={setShowLangPicker} />

      <main className={`${PAGE_WIDTH} flex-1 pt-5`}>
        <SharedHero trip={trip} stats={stats} />
        <SharedTabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
        <div className={tabs.length < 2 ? 'pt-5' : 'pt-2'}>
          {activeTab === 'plan' && (
            <SharedPlanView
              data={data}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onPickDayOnMap={pickDayOnMap}
              collapsedDays={collapsedDays}
              onToggleDay={toggleDay}
              travelOnly={!!permissions?.share_travel_only}
            />
          )}
          {activeTab === 'bookings' && (
            <SharedBookingsView reservations={reservations} days={data.days || []} tripCurrency={trip.currency} />
          )}
          {activeTab === 'packing' && <SharedPackingView items={data.packing || []} />}
          {activeTab === 'budget' && (
            <SharedCostsView
              items={data.budget || []}
              base={base}
              tripCurrency={String(trip.currency || base).toUpperCase()}
              convert={convert}
            />
          )}
          {activeTab === 'collab' && <SharedChatView messages={data.collab || []} />}
        </div>
      </main>

      <SharedFooter />
    </div>
  );
}
