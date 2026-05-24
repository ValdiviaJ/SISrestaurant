import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Expose Pusher to global window context for Echo compatibility
(window as any).Pusher = Pusher;

export const initEcho = (token: string) => {
  return new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'app-key',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
    wssPort: parseInt(import.meta.env.VITE_REVERB_PORT || '8080'),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
};
