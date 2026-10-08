"use client";

import { hanToRubyPairs } from "@/lib/chinese-to-goetsusioji";

export function GoetsusiojiRuby({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const pairs = hanToRubyPairs(text);
  return (
    <span className={`gs-ruby ${className}`.trim()}>
      {pairs.map((pair, index) =>
        pair.goetsusioji ? (
          <ruby key={`${pair.char}-${index}`}>
            {pair.char}
            <rt className="font-goetsusioji">{pair.goetsusioji}</rt>
          </ruby>
        ) : (
          <span key={`${pair.char}-${index}`}>{pair.char}</span>
        ),
      )}
    </span>
  );
}

export function GoetsusiojiLine({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  if (!text) return null;
  return (
    <p
      className={`font-goetsusioji text-kapok/80 leading-relaxed ${className}`.trim()}
    >
      {text}
    </p>
  );
}
