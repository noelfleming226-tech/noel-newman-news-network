import Link from "next/link";

import { formatDistanceToNow } from "date-fns";

import type { StaffAnalyticsSummary } from "@/lib/analytics";

type AnalyticsOverviewProps = {
  summary: StaffAnalyticsSummary;
};

function formatCount(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatRatio(numerator: number, denominator: number) {
  if (denominator <= 0) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

function buildLineChartPath(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return "";
  }

  const maxValue = Math.max(...values, 1);
  const xStep = values.length === 1 ? 0 : width / (values.length - 1);

  return values
    .map((value, index) => {
      const x = xStep * index;
      const y = height - (value / maxValue) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function formatSeconds(value: number) {
  if (value <= 0) {
    return "0s";
  }

  if (value < 60) {
    return `${value}s`;
  }

  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return secs === 0 ? `${mins}m` : `${mins}m ${secs}s`;
}

function TrendChart({ summary }: { summary: StaffAnalyticsSummary }) {
  const width = 560;
  const height = 180;
  const views = summary.daily.map((point) => point.views);
  const uniques = summary.daily.map((point) => point.uniqueViews);
  const maxValue = Math.max(...views, ...uniques, 1);
  const gridSteps = 4;
  const xStep = summary.daily.length > 1 ? width / (summary.daily.length - 1) : 0;

  return (
    <section className="analytics-card analytics-card--chart">
      <div className="analytics-card__head">
        <h2>Traffic Trend ({summary.windowDays}d)</h2>
        <p>Views and approx unique visitors by day.</p>
      </div>

      <div className="analytics-trend">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Views and unique views line chart">
          {Array.from({ length: gridSteps + 1 }).map((_, index) => {
            const y = (height / gridSteps) * index;
            return <line key={index} x1="0" y1={y} x2={width} y2={y} />;
          })}

          {summary.daily.map((point, index) => {
            const x = xStep * index;
            const yViews = height - (point.views / maxValue) * height;
            const yUniques = height - (point.uniqueViews / maxValue) * height;

            return (
              <g key={point.dateKey}>
                <circle cx={x} cy={yViews} r="2.8" className="analytics-trend__dot analytics-trend__dot--views" />
                <circle
                  cx={x}
                  cy={yUniques}
                  r="2.6"
                  className="analytics-trend__dot analytics-trend__dot--uniques"
                />
              </g>
            );
          })}

          <path d={buildLineChartPath(views, width, height)} className="analytics-trend__line analytics-trend__line--views" />
          <path
            d={buildLineChartPath(uniques, width, height)}
            className="analytics-trend__line analytics-trend__line--uniques"
          />
        </svg>

        <div className="analytics-trend__axis">
          {summary.daily.map((point) => (
            <span key={point.dateKey}>{point.label}</span>
          ))}
        </div>
      </div>

      <div className="analytics-legend">
        <span>
          <i className="analytics-legend__swatch analytics-legend__swatch--views" /> Views
        </span>
        <span>
          <i className="analytics-legend__swatch analytics-legend__swatch--uniques" /> Unique (approx)
        </span>
      </div>
    </section>
  );
}

function TopPostsChart({ summary }: { summary: StaffAnalyticsSummary }) {
  const maxViews = Math.max(...summary.topPosts.map((post) => post.views), 1);

  return (
    <section className="analytics-card">
      <div className="analytics-card__head">
        <h2>Top Posts ({summary.windowDays}d)</h2>
        <p>Best-performing stories in the current reporting window.</p>
      </div>

      {summary.topPosts.length === 0 ? (
        <p className="analytics-empty">No tracked views yet. Open a story locally to generate data.</p>
      ) : (
        <div className="analytics-bars">
          {summary.topPosts.map((post) => (
            <div key={post.postId} className="analytics-bars__row">
              <div className="analytics-bars__label">
                <Link href={`/articles/${post.slug}`} target="_blank" rel="noopener noreferrer">
                  {post.title}
                </Link>
                <span>
                  {formatCount(post.views)} views · {formatCount(post.uniqueViews)} unique · {formatCount(post.linkClicks)} clicks · {formatSeconds(post.avgSecondsOnPage)} avg time
                </span>
              </div>
              <div className="analytics-bars__track" aria-hidden="true">
                <div className="analytics-bars__fill" style={{ width: `${(post.views / maxViews) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EngagementTrendChart({ summary }: { summary: StaffAnalyticsSummary }) {
  const width = 560;
  const height = 180;
  const clicks = summary.daily.map((point) => point.linkClicks);
  const avgTime = summary.daily.map((point) => point.avgSecondsOnPage);
  const maxValue = Math.max(...clicks, ...avgTime, 1);
  const gridSteps = 4;
  const xStep = summary.daily.length > 1 ? width / (summary.daily.length - 1) : 0;

  return (
    <section className="analytics-card">
      <div className="analytics-card__head">
        <h2>Engagement Trend ({summary.windowDays}d)</h2>
        <p>Outbound link clicks and average time-on-page by day.</p>
      </div>

      <div className="analytics-trend">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Engagement line chart">
          {Array.from({ length: gridSteps + 1 }).map((_, index) => {
            const y = (height / gridSteps) * index;
            return <line key={index} x1="0" y1={y} x2={width} y2={y} />;
          })}
          {summary.daily.map((point, index) => {
            const x = xStep * index;
            const yClicks = height - (point.linkClicks / maxValue) * height;
            const yTime = height - (point.avgSecondsOnPage / maxValue) * height;
            return (
              <g key={point.dateKey}>
                <circle cx={x} cy={yClicks} r="2.8" className="analytics-trend__dot analytics-trend__dot--clicks" />
                <circle cx={x} cy={yTime} r="2.6" className="analytics-trend__dot analytics-trend__dot--time" />
              </g>
            );
          })}
          <path d={buildLineChartPath(clicks, width, height)} className="analytics-trend__line analytics-trend__line--clicks" />
          <path d={buildLineChartPath(avgTime, width, height)} className="analytics-trend__line analytics-trend__line--time" />
        </svg>
        <div className="analytics-trend__axis">
          {summary.daily.map((point) => (
            <span key={point.dateKey}>{point.label}</span>
          ))}
        </div>
      </div>

      <div className="analytics-legend">
        <span>
          <i className="analytics-legend__swatch analytics-legend__swatch--clicks" /> Link clicks
        </span>
        <span>
          <i className="analytics-legend__swatch analytics-legend__swatch--time" /> Avg time (sec)
        </span>
      </div>
    </section>
  );
}

function ReferrerChart({ summary }: { summary: StaffAnalyticsSummary }) {
  const maxViews = Math.max(...summary.referrers.map((ref) => ref.views), 1);

  return (
    <section className="analytics-card">
      <div className="analytics-card__head">
        <h2>Referrers ({summary.windowDays}d)</h2>
        <p>Where readers are arriving from. “direct” includes typed/bookmarked traffic.</p>
      </div>

      {summary.referrers.length === 0 ? (
        <p className="analytics-empty">No referrer data yet.</p>
      ) : (
        <div className="analytics-bars analytics-bars--compact">
          {summary.referrers.map((ref) => (
            <div key={ref.label} className="analytics-bars__row">
              <div className="analytics-bars__label">
                <strong>{ref.label}</strong>
                <span>
                  {formatCount(ref.views)} views · {formatCount(ref.uniqueViews)} unique
                </span>
              </div>
              <div className="analytics-bars__track" aria-hidden="true">
                <div
                  className="analytics-bars__fill analytics-bars__fill--referrer"
                  style={{ width: `${(ref.views / maxViews) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AnalyticsOverview({ summary }: AnalyticsOverviewProps) {
  const avgViewsPerDay = summary.windowDays > 0 ? summary.totals.views / summary.windowDays : 0;
  const generatedAt =
    summary.generatedAt instanceof Date ? summary.generatedAt : new Date(summary.generatedAt);
  const generatedAtLabel = Number.isNaN(generatedAt.getTime())
    ? "just now"
    : formatDistanceToNow(generatedAt, { addSuffix: true });

  return (
    <section className="analytics-grid" aria-label="Post analytics">
      <div className="analytics-card analytics-card--kpis">
        <div className="analytics-card__head">
          <h2>Audience Snapshot ({summary.windowDays}d)</h2>
          <p>Updated {generatedAtLabel}.</p>
        </div>
        <div className="analytics-kpis">
          <article className="analytics-kpi">
            <span>Views</span>
            <strong>{formatCount(summary.totals.views)}</strong>
          </article>
          <article className="analytics-kpi">
            <span>Unique (approx)</span>
            <strong>{formatCount(summary.totals.uniqueViews)}</strong>
          </article>
          <article className="analytics-kpi">
            <span>Repeat rate</span>
            <strong>{formatRatio(summary.totals.views - summary.totals.uniqueViews, Math.max(summary.totals.views, 1))}</strong>
          </article>
          <article className="analytics-kpi">
            <span>Avg / day</span>
            <strong>{avgViewsPerDay.toFixed(avgViewsPerDay >= 10 ? 0 : 1)}</strong>
          </article>
          <article className="analytics-kpi">
            <span>Link clicks</span>
            <strong>{formatCount(summary.totals.linkClicks)}</strong>
          </article>
          <article className="analytics-kpi">
            <span>Avg time on page</span>
            <strong>{formatSeconds(summary.totals.avgSecondsOnPage)}</strong>
          </article>
        </div>
      </div>

      <TrendChart summary={summary} />
      <EngagementTrendChart summary={summary} />
      <TopPostsChart summary={summary} />
      <ReferrerChart summary={summary} />
    </section>
  );
}
