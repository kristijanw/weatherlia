import 'leaflet';

declare module 'leaflet' {
  interface MapOptions {
    gestureHandling?: boolean;
    gestureHandlingOptions?: {
      text?: {
        touch?: string;
        scroll?: string;
        scrollMac?: string;
      };
      duration?: number;
    };
  }
}
