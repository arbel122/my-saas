// הלוגו של Opnyx: מילה בגרדיאנט עם ניצנוץ. tone="dark" לרקע כהה, tone="light" לרקע בהיר.
export default function Logo({ size = 28, tone = 'dark' }: { size?: number; tone?: 'dark' | 'light' }) {
  const base = tone === 'dark' ? '#ffffff' : '#0f172a';
  return (
    <span
      dir="ltr"
      aria-label="Opnyx"
      className="relative inline-flex items-baseline leading-none select-none"
      style={{ fontFamily: 'var(--font-logo), var(--font-inter), sans-serif', fontWeight: 800, fontSize: size, letterSpacing: '-0.04em' }}
    >
      <span style={{ color: base }}>op</span>
      <span style={{ color: '#4f7bff' }}>n</span>
      <span style={{ color: '#7a70ff' }}>y</span>
      <span style={{ backgroundImage: 'linear-gradient(135deg, #9a6bff, #d070ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>x</span>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="absolute"
        style={{ width: size * 0.42, height: size * 0.42, top: -size * 0.22, right: -size * 0.3, fill: base }}
      >
        <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z" />
      </svg>
    </span>
  );
}
