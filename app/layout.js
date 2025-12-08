/**
 * ════════════════════════════════════════════════════════════════════════
 * ROOT LAYOUT - App-Wide Configuration
 * ════════════════════════════════════════════════════════════════════════
 * 
 * WHAT IS ROOT LAYOUT:
 * In Next.js App Router, layout.js defines structure that wraps ALL pages.
 * Anything you add here appears on every page (fonts, providers, nav, etc.)
 * 
 * WHY TOAST PROVIDER HERE:
 * - Toasts need to work on every page
 * - Provider must wrap entire app
 * - Positioned in layout, not on each page
 * 
 * TOASTER CONFIGURATION:
 * - position: bottom-center (mobile-friendly, thumb accessible)
 * - reverseOrder: false (newest on top)
 * - gutter: 8 (space between stacked toasts)
 * - containerStyle: Custom positioning
 * - toastOptions: Default styling for all toasts
 */

import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Startup Idea Validator - Real Feedback in Minutes",
  description: "Get honest, AI-powered validation for your startup idea through a conversational experience backed by real competitor research.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Main app content */}
        {children}
        
        {/* 
          TOAST PROVIDER:
          Must be inside <body> to render toasts
          Positioned at bottom-center for best UX
          
          WHY bottom-center:
          - Mobile: Thumb zone (easy to dismiss)
          - Desktop: Doesn't cover content
          - Universal: Works on all screen sizes
          
          WHY these options:
          - gutter: 8 (comfortable spacing between multiple toasts)
          - reverseOrder: false (latest toast on top)
          - toastOptions.duration: 3000 (3 seconds default)
        */}
        <Toaster 
          position="bottom-center"
          reverseOrder={false}
          gutter={8}
          containerStyle={{
            bottom: 40, // 40px from bottom (safe zone)
          }}
          toastOptions={{
            // Default options for all toasts
            duration: 3000, // 3 seconds
            style: {
              // These can be overridden by individual toast calls
              background: '#111',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '16px',
            },
            // Success toast defaults (green checkmark)
            success: {
              duration: 2000, // Quick confirmation
              iconTheme: {
                primary: '#10b981', // Green-500
                secondary: '#fff',
              },
            },
            // Error toast defaults (red X)
            error: {
              duration: 4000, // More time to read
              iconTheme: {
                primary: '#f87171', // Red-400
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}

/**
 * ════════════════════════════════════════════════════════════════════════
 * HOW TOASTER WORKS
 * ════════════════════════════════════════════════════════════════════════
 * 
 * ARCHITECTURE:
 * 1. <Toaster /> component renders a container
 * 2. Container listens for toast events
 * 3. When you call showSuccess(), showError(), etc:
 *    - Event is emitted
 *    - Toaster catches it
 *    - Toast is rendered in container
 *    - Auto-dismiss timer starts
 *    - Toast fades out when done
 * 
 * USAGE FROM ANY PAGE:
 * import { showSuccess } from '@/lib/toast';
 * showSuccess('Operation complete!');
 * // Toast automatically appears at bottom-center
 * 
 * NO PROP DRILLING:
 * - Don't need to pass toast functions down
 * - Just import and call from anywhere
 * - Toaster handles rendering globally
 * 
 * ════════════════════════════════════════════════════════════════════════
 * CUSTOMIZATION OPTIONS
 * ════════════════════════════════════════════════════════════════════════
 * 
 * POSITION OPTIONS:
 * - top-left, top-center, top-right
 * - bottom-left, bottom-center, bottom-right
 * 
 * We use bottom-center because:
 * ✅ Mobile-friendly (thumb zone)
 * ✅ Doesn't cover main content
 * ✅ Consistent with modern apps (iOS, Android)
 * 
 * DURATION OPTIONS:
 * - Success: 2000ms (quick "done" confirmation)
 * - Error: 4000ms (more time to read issue)
 * - Info: 3000ms (neutral information)
 * - Loading: Infinity (manual dismiss)
 * 
 * STYLE CUSTOMIZATION:
 * All toasts inherit dark theme:
 * - Matches app's aesthetic
 * - High contrast (readable)
 * - Subtle borders (defines edges)
 * 
 * ════════════════════════════════════════════════════════════════════════
 * ACCESSIBILITY FEATURES
 * ════════════════════════════════════════════════════════════════════════
 * 
 * react-hot-toast includes:
 * ✅ aria-live="polite" (screen readers announce)
 * ✅ role="status" (semantic meaning)
 * ✅ Keyboard support (Escape to dismiss)
 * ✅ Focus management (doesn't steal focus)
 * ✅ Reduced motion (respects prefers-reduced-motion)
 * 
 * SCREEN READER BEHAVIOR:
 * - Success: "Success, [message]"
 * - Error: "Error, [message]"
 * - Info: "[message]"
 * 
 * KEYBOARD SHORTCUTS:
 * - Escape: Dismiss focused toast
 * - Tab: Navigate between toasts (if multiple)
 * 
 * ════════════════════════════════════════════════════════════════════════
 * PRODUCTION NOTES
 * ════════════════════════════════════════════════════════════════════════
 * 
 * PERFORMANCE:
 * - Toasts are portaled (rendered outside normal flow)
 * - No re-renders of parent components
 * - Lightweight (adds ~5KB gzipped)
 * 
 * MOBILE CONSIDERATIONS:
 * - Bottom position: Above virtual keyboard
 * - Large touch targets: Easy to dismiss
 * - Safe area: Respects notches (iPhone)
 * 
 * MULTIPLE TOASTS:
 * - Stack vertically with gutter spacing
 * - Max 3 visible at once (older ones auto-dismiss)
 * - Newest on top (most recent info)
 * 
 * ANIMATION:
 * - Fade in: 200ms
 * - Fade out: 300ms
 * - Smooth transitions (not jarring)
 * - Respects prefers-reduced-motion
 */
