/**
 * DroneVerse - Customer & Admin Authentication Module
 * Manages Supabase Auth, Profiles, Orders, Role verification, and Header UI Sync
 */
(function (window) {
  'use strict';

  function getClient() {
    return window.supabaseClient;
  }

  const Auth = {
    /**
     * Get active session
     */
    async getSession() {
      const client = getClient();
      if (!client) return null;
      try {
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        return data.session;
      } catch (err) {
        console.warn('[Auth] getSession failed:', err.message);
        return null;
      }
    },

    /**
     * Get currently logged-in user
     */
    async getUser() {
      const session = await this.getSession();
      return session?.user || null;
    },

    /**
     * Fetch user profile from public.profiles table
     */
    async getProfile() {
      const user = await this.getUser();
      if (!user) return null;
      const client = getClient();
      try {
        const { data, error } = await client
          .from('profiles')
          .select('id, full_name, phone, role, created_at')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('[Auth] Profile fetch warning:', error.message);
        }

        // Fallback to user metadata if profile row isn't cached yet
        return data || {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          phone: user.user_metadata?.phone || '',
          role: user.user_metadata?.role || 'customer',
        };
      } catch (e) {
        return {
          id: user.id,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          phone: '',
          role: 'customer',
        };
      }
    },

    /**
     * Customer & Admin Sign In
     */
    async signIn(email, password) {
      const client = getClient();
      if (!client) throw new Error('Authentication client is not initialized.');

      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      // Sync navigation immediately
      await this.syncNavAuthUI();
      return data;
    },

    /**
     * Customer Sign Up with metadata
     */
    async signUp(email, password, fullName = '', phone = '') {
      const client = getClient();
      if (!client) throw new Error('Authentication client is not initialized.');

      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone.trim(),
            role: 'customer',
          },
        },
      });

      if (error) throw error;
      return data;
    },

    /**
     * Sign Out
     */
    async signOut() {
      const client = getClient();
      if (client) {
        try {
          await client.auth.signOut();
        } catch (e) {
          console.warn('[Auth] SignOut error:', e.message);
        }
      }
      // Redirect to homepage or login
      window.location.href = window.location.pathname.includes('/admin/')
        ? '../account/login.html'
        : window.location.pathname.includes('/account/')
        ? './login.html'
        : './index.html';
    },

    /**
     * Fetch orders for current customer
     */
    async getUserOrders() {
      const user = await this.getUser();
      if (!user) return [];
      const client = getClient();
      try {
        const { data, error } = await client
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[Auth] getUserOrders warning:', error.message);
          return [];
        }
        return data || [];
      } catch (e) {
        return [];
      }
    },

    /**
     * Create order in Supabase
     */
    async createOrder({ items, totalAmount, gstAmount, shippingFee = 0, shippingAddress = {} }) {
      const user = await this.getUser();
      if (!user) return null;
      const client = getClient();

      const orderNumber = 'DV-' + Date.now().toString(36).toUpperCase();
      const { data, error } = await client
        .from('orders')
        .insert([
          {
            user_id: user.id,
            order_number: orderNumber,
            items: items,
            total_amount: totalAmount,
            gst_amount: gstAmount,
            shipping_fee: shippingFee,
            shipping_address: shippingAddress,
            status: 'confirmed',
          },
        ])
        .select()
        .single();

      if (error) {
        console.warn('[Auth] createOrder error:', error.message);
        return null;
      }
      return data;
    },

    /**
     * Page guard: Require logged-in user
     */
    async requireAuth(redirectPath = './login.html') {
      const session = await this.getSession();
      if (!session) {
        window.location.href = redirectPath;
        return null;
      }
      return session.user;
    },

    /**
     * Page guard: Require Admin role
     */
    async requireAdmin(redirectPath = '../account/login.html') {
      const session = await this.getSession();
      if (!session) {
        window.location.href = redirectPath;
        return false;
      }

      const profile = await this.getProfile();
      if (!profile || profile.role !== 'admin') {
        alert('Access Denied: You must be an administrator to access this area.');
        window.location.href = redirectPath;
        return false;
      }
      return true;
    },

    /**
     * MFA / 2FA: List enrolled factors
     */
    async getMFAFactors() {
      const client = getClient();
      if (!client) return { all: [], totp: [] };
      try {
        const { data, error } = await client.auth.mfa.listFactors();
        if (error) {
          console.warn('[Auth] listFactors error:', error.message);
          return { all: [], totp: [] };
        }
        return data || { all: [], totp: [] };
      } catch (e) {
        return { all: [], totp: [] };
      }
    },

    /**
     * MFA / 2FA: Get Authenticator Assurance Level (aal1 vs aal2)
     */
    async getAssuranceLevel() {
      const client = getClient();
      if (!client) return null;
      try {
        const { data, error } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
        if (error) return null;
        return data;
      } catch (e) {
        return null;
      }
    },

    /**
     * MFA / 2FA: Start TOTP enrollment (returns QR code SVG and manual secret)
     */
    async enrollMFA(issuer = 'DroneVerse') {
      const client = getClient();
      if (!client) throw new Error('Authentication client not initialized.');

      // Purge any abandoned unverified factors first
      const factors = await this.getMFAFactors();
      for (const f of factors.all || []) {
        if (f.status === 'unverified') {
          try {
            await client.auth.mfa.unenroll({ factorId: f.id });
          } catch (_) {}
        }
      }

      const { data, error } = await client.auth.mfa.enroll({
        factorType: 'totp',
        issuer: issuer,
      });

      if (error) throw error;
      return data;
    },

    /**
     * MFA / 2FA: Verify enrollment challenge code to activate 2FA
     */
    async verifyMFAEnrollment(factorId, code) {
      const client = getClient();
      if (!client) throw new Error('Authentication client not initialized.');

      const { data, error } = await client.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: code.trim(),
      });

      if (error) throw error;
      return data;
    },

    /**
     * MFA / 2FA: Verify code on login when AAL2 is required
     */
    async verifyMFALogin(factorId, code) {
      const client = getClient();
      if (!client) throw new Error('Authentication client not initialized.');

      const { data, error } = await client.auth.mfa.challengeAndVerify({
        factorId: factorId,
        code: code.trim(),
      });

      if (error) throw error;
      return data;
    },

    /**
     * MFA / 2FA: Disable / Unenroll a factor
     */
    async unenrollMFA(factorId) {
      const client = getClient();
      if (!client) throw new Error('Authentication client not initialized.');

      const { data, error } = await client.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      return data;
    },

    /**
     * Synchronize header navigation across pages
     */
    async syncNavAuthUI() {
      try {
        const session = await this.getSession();
        const accountLinks = document.querySelectorAll('a[href*="/account/login.html"], a[href="./account/login.html"], a[href="../account/login.html"]');
        const mobileAccountLinks = document.querySelectorAll('.mobile-bottom-btn[href*="login.html"]');

        if (session && session.user) {
          const profile = await this.getProfile();
          const displayName = (profile?.full_name && profile.full_name.trim())
            ? profile.full_name.split(' ')[0]
            : (session.user.email ? session.user.email.split('@')[0] : 'My Account');

          const isAdmin = profile?.role === 'admin';
          const targetUrl = isAdmin
            ? (window.location.pathname.includes('/account/') ? '../admin/index.html' : './admin/index.html')
            : (window.location.pathname.includes('/account/') ? './orders.html' : './account/orders.html');

          accountLinks.forEach(link => {
            link.href = targetUrl;
            const titleEl = link.querySelector('.header-action-btn__title');
            if (titleEl) {
              titleEl.textContent = displayName;
            }
            const subtitleEl = link.querySelector('.header-action-btn__subtitle');
            if (subtitleEl) {
              subtitleEl.textContent = isAdmin ? 'Admin' : 'Account';
            }
          });

          mobileAccountLinks.forEach(link => {
            link.href = targetUrl;
            const span = link.querySelector('span');
            if (span) span.textContent = displayName;
          });
        }
      } catch (err) {
        console.warn('[Auth] syncNavAuthUI error:', err);
      }
    },
  };

  // Expose global
  window.DroneVerseAuth = Auth;

  // Run header sync on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure Supabase client initializes
    setTimeout(() => {
      Auth.syncNavAuthUI();
    }, 150);
  });

})(window);
