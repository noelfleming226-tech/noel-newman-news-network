/* eslint-disable @next/next/no-img-element */

import { FOUNDER_PROFILES, type FounderProfile } from "@/lib/founders";

type FounderBrandingProps = {
  mode?: "cards" | "chips";
  compact?: boolean;
  showBios?: boolean;
};

function FounderPortrait({ founder, compact = false }: { founder: FounderProfile; compact?: boolean }) {
  return (
    <div className={`founder-portrait founder-portrait--${founder.tone} ${compact ? "founder-portrait--compact" : ""}`}>
      <div className="founder-portrait__frame">
        {founder.photoUrl ? (
          <img
            className="founder-portrait__img"
            src={founder.photoUrl}
            alt={`${founder.name} portrait`}
            loading="lazy"
          />
        ) : (
          <div className="founder-portrait__fallback" aria-hidden="true">
            <span>{founder.initials}</span>
          </div>
        )}
        <div className="founder-portrait__scan" aria-hidden="true" />
      </div>
      <div className="founder-portrait__tag" aria-hidden="true">
        <span>NN^2</span>
        <span>{founder.shortName.toUpperCase()}</span>
      </div>
    </div>
  );
}

function FounderChip({ founder, compact = false }: { founder: FounderProfile; compact?: boolean }) {
  return (
    <article className={`founder-chip founder-chip--${founder.tone} ${compact ? "founder-chip--compact" : ""}`}>
      <FounderPortrait founder={founder} compact={compact} />
      <div className="founder-chip__body">
        <p className="founder-chip__eyebrow">NN^2 Proprietor</p>
        <h3>{founder.name}</h3>
        <p className="founder-chip__meta">{founder.roleLabel}</p>
        {!compact ? <p className="founder-chip__bio">{founder.bio}</p> : null}
      </div>
    </article>
  );
}

export function FounderBranding({ mode = "cards", compact = false, showBios = true }: FounderBrandingProps) {
  if (mode === "chips") {
    return (
      <div className={`founder-cluster founder-cluster--chips ${compact ? "founder-cluster--compact" : ""}`}>
        {FOUNDER_PROFILES.map((founder) => (
          <FounderChip key={founder.id} founder={founder} compact />
        ))}
      </div>
    );
  }

  return (
    <div className="founder-cluster founder-cluster--cards">
      {FOUNDER_PROFILES.map((founder) => (
        <article key={founder.id} className={`founder-card founder-card--${founder.tone}`}>
          <FounderPortrait founder={founder} />
          <div className="founder-card__body">
            <p className="founder-card__eyebrow">NN^2 Proprietor</p>
            <h3>{founder.name}</h3>
            <p className="founder-card__role">{founder.roleLabel}</p>
            {showBios ? <p className="founder-card__bio">{founder.bio}</p> : null}
            <p className="founder-card__handle">{founder.handle}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

