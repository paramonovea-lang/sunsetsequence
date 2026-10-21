// Google Analytics' global, defined only on the live site (components/Analytics.astro).
interface Window {
  gtag?: (...args: unknown[]) => void;
}
