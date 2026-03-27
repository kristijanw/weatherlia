import { Capacitor, registerPlugin } from '@capacitor/core';

interface WidgetSyncPlugin {
  setFavoriteCity(options: { city: string }): Promise<{ ok: boolean }>;
}

const WidgetSync = registerPlugin<WidgetSyncPlugin>('WidgetSync');

export async function syncFavoriteCityToWidget(city: string) {
  if (Capacitor.getPlatform() !== 'android') return;

  try {
    await WidgetSync.setFavoriteCity({ city });
  } catch {
    // Ignore sync errors to keep weather UI responsive.
  }
}
