/**
 * DroneVerse - Supabase Client Initializer
 * Initializes the Supabase JS client using CDN-loaded @supabase/supabase-js
 */
(function (window) {
  'use strict';

  const config = window.SUPABASE_CONFIG || {
    url: 'https://xfyeupjlstfsxlccpltq.supabase.co',
    anonKey: 'sb_publishable_OYrzBndEI8AiRdykSOpNmA_3P0vMgwJ',
  };

  function initClient() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      window.supabaseClient = window.supabase.createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage,
        },
      });
      document.dispatchEvent(new CustomEvent('droneverse:supabase:ready', { detail: window.supabaseClient }));
      return true;
    }
    return false;
  }

  // Attempt immediate initialization
  if (!initClient()) {
    // Retry once CDN loads
    window.addEventListener('load', () => {
      initClient();
    });
  }
})(window);
