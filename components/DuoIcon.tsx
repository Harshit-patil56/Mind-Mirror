import React from 'react';

export type DuoIconName =
  | 'add-circle'
  | 'airplay'
  | 'alert-octagon'
  | 'alert-triangle'
  | 'align-bottom'
  | 'align-center'
  | 'android'
  | 'app-dots'
  | 'apple'
  | 'approved'
  | 'appstore'
  | 'app'
  | 'award'
  | 'baby-carriage'
  | 'bank'
  | 'battery'
  | 'bell-badge'
  | 'bell'
  | 'book-2'
  | 'book-3'
  | 'bookmark'
  | 'book'
  | 'box-2'
  | 'box'
  | 'bread'
  | 'bridge'
  | 'briefcase'
  | 'brush-2'
  | 'brush'
  | 'bug'
  | 'building'
  | 'bus'
  | 'cake'
  | 'calendar'
  | 'camera-square'
  | 'camera'
  | 'campground'
  | 'candle'
  | 'car'
  | 'certificate'
  | 'chart-pie'
  | 'check-circle'
  | 'chip'
  | 'clapperboard'
  | 'clipboard'
  | 'clock'
  | 'cloud-lightning'
  | 'cloud-snow'
  | 'coin-stack'
  | 'compass'
  | 'computer-camera-off'
  | 'computer-camera'
  | 'confetti'
  | 'credit-card'
  | 'currency-euro'
  | 'dashboard'
  | 'discount'
  | 'disk'
  | 'file'
  | 'fire'
  | 'folder-open'
  | 'folder-upload'
  | 'g-translate'
  | 'id-card'
  | 'info'
  | 'lamp-2'
  | 'lamp'
  | 'location'
  | 'marker'
  | 'menu'
  | 'message-2'
  | 'message-3'
  | 'message'
  | 'moon-2'
  | 'moon-stars'
  | 'palette'
  | 'rocket'
  | 'settings'
  | 'shopping-bag'
  | 'slideshow'
  | 'smartphone'
  | 'smartphone-vibration'
  | 'smartwatch'
  | 'sun'
  | 'target'
  | 'toggle'
  | 'translation'
  | 'upload-file'
  | 'user-card'
  | 'user'
  | 'world';

// Explicit literal map ensuring Tailwind v4 scanner captures every class without dynamic truncation
const DUO_ICON_CLASS_MAP: Record<DuoIconName, string> = {
  'add-circle': 'duo-icons-add-circle',
  'airplay': 'duo-icons-airplay',
  'alert-octagon': 'duo-icons-alert-octagon',
  'alert-triangle': 'duo-icons-alert-triangle',
  'align-bottom': 'duo-icons-align-bottom',
  'align-center': 'duo-icons-align-center',
  'android': 'duo-icons-android',
  'app-dots': 'duo-icons-app-dots',
  'apple': 'duo-icons-apple',
  'approved': 'duo-icons-approved',
  'appstore': 'duo-icons-appstore',
  'app': 'duo-icons-app',
  'award': 'duo-icons-award',
  'baby-carriage': 'duo-icons-baby-carriage',
  'bank': 'duo-icons-bank',
  'battery': 'duo-icons-battery',
  'bell-badge': 'duo-icons-bell-badge',
  'bell': 'duo-icons-bell',
  'book-2': 'duo-icons-book-2',
  'book-3': 'duo-icons-book-3',
  'bookmark': 'duo-icons-bookmark',
  'book': 'duo-icons-book',
  'box-2': 'duo-icons-box-2',
  'box': 'duo-icons-box',
  'bread': 'duo-icons-bread',
  'bridge': 'duo-icons-bridge',
  'briefcase': 'duo-icons-briefcase',
  'brush-2': 'duo-icons-brush-2',
  'brush': 'duo-icons-brush',
  'bug': 'duo-icons-bug',
  'building': 'duo-icons-building',
  'bus': 'duo-icons-bus',
  'cake': 'duo-icons-cake',
  'calendar': 'duo-icons-calendar',
  'camera-square': 'duo-icons-camera-square',
  'camera': 'duo-icons-camera',
  'campground': 'duo-icons-campground',
  'candle': 'duo-icons-candle',
  'car': 'duo-icons-car',
  'certificate': 'duo-icons-certificate',
  'chart-pie': 'duo-icons-chart-pie',
  'check-circle': 'duo-icons-check-circle',
  'chip': 'duo-icons-chip',
  'clapperboard': 'duo-icons-clapperboard',
  'clipboard': 'duo-icons-clipboard',
  'clock': 'duo-icons-clock',
  'cloud-lightning': 'duo-icons-cloud-lightning',
  'cloud-snow': 'duo-icons-cloud-snow',
  'coin-stack': 'duo-icons-coin-stack',
  'compass': 'duo-icons-compass',
  'computer-camera-off': 'duo-icons-computer-camera-off',
  'computer-camera': 'duo-icons-computer-camera',
  'confetti': 'duo-icons-confetti',
  'credit-card': 'duo-icons-credit-card',
  'currency-euro': 'duo-icons-currency-euro',
  'dashboard': 'duo-icons-dashboard',
  'discount': 'duo-icons-discount',
  'disk': 'duo-icons-disk',
  'file': 'duo-icons-file',
  'fire': 'duo-icons-fire',
  'folder-open': 'duo-icons-folder-open',
  'folder-upload': 'duo-icons-folder-upload',
  'g-translate': 'duo-icons-g-translate',
  'id-card': 'duo-icons-id-card',
  'info': 'duo-icons-info',
  'lamp-2': 'duo-icons-lamp-2',
  'lamp': 'duo-icons-lamp',
  'location': 'duo-icons-location',
  'marker': 'duo-icons-marker',
  'menu': 'duo-icons-menu',
  'message-2': 'duo-icons-message-2',
  'message-3': 'duo-icons-message-3',
  'message': 'duo-icons-message',
  'moon-2': 'duo-icons-moon-2',
  'moon-stars': 'duo-icons-moon-stars',
  'palette': 'duo-icons-palette',
  'rocket': 'duo-icons-rocket',
  'settings': 'duo-icons-settings',
  'shopping-bag': 'duo-icons-shopping-bag',
  'slideshow': 'duo-icons-slideshow',
  'smartphone': 'duo-icons-smartphone',
  'smartphone-vibration': 'duo-icons-smartphone-vibration',
  'smartwatch': 'duo-icons-smartwatch',
  'sun': 'duo-icons-sun',
  'target': 'duo-icons-target',
  'toggle': 'duo-icons-toggle',
  'translation': 'duo-icons-translation',
  'upload-file': 'duo-icons-upload-file',
  'user-card': 'duo-icons-user-card',
  'user': 'duo-icons-user',
  'world': 'duo-icons-world',
};

export interface DuoIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: DuoIconName;
  className?: string;
  size?: number | string;
}

export function DuoIcon({ name, className = '', size, style, ...props }: DuoIconProps) {
  const iconClass = DUO_ICON_CLASS_MAP[name] || `duo-icons-${name}`;
  const sizeStyle: React.CSSProperties = size
    ? {
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }
    : {};

  return (
    <span
      aria-hidden="true"
      className={`${iconClass} shrink-0 ${className}`}
      style={{ ...sizeStyle, ...style }}
      {...props}
    />
  );
}
