export function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "hsl(var(--secondary))", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--accent))", stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      
      {/* Chat bubble */}
      <path
        d="M 20 30 Q 20 20 30 20 L 70 20 Q 80 20 80 30 L 80 55 Q 80 65 70 65 L 45 65 L 30 80 L 30 65 L 30 65 Q 20 65 20 55 Z"
        fill="url(#logoGradient)"
        stroke="currentColor"
        strokeWidth="2"
        className="text-foreground"
      />
      
      {/* Three dots inside bubble */}
      <circle cx="35" cy="42" r="4" fill="currentColor" className="text-background" />
      <circle cx="50" cy="42" r="4" fill="currentColor" className="text-background" />
      <circle cx="65" cy="42" r="4" fill="currentColor" className="text-background" />
    </svg>
  );
}
