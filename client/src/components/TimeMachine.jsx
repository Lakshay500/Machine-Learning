import { useState } from 'react';

const DECADES = [
  { label: 'ALL', value: '' },
  { label: '1930s', value: '1930s' },
  { label: '1940s', value: '1940s' },
  { label: '1950s', value: '1950s' }
];

export default function TimeMachine({ decade, year, onDecadeChange, onYearChange }) {
  const [localYear, setLocalYear] = useState(year || 1930);

  const minYear = decade ? parseInt(decade) : 1930;
  const maxYear = decade ? parseInt(decade) + 9 : 1959;

  const pickDecade = (d) => {
    onDecadeChange(d);
    if (!d) {
      onYearChange('');
    } else {
      setLocalYear(parseInt(d));
      onYearChange(''); // reset exact-year filter when switching decades
    }
  };

  return (
    <section className="record-sleeve rounded-lg p-5 mb-8">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="font-display font-black text-2xl">
          ⏳ The Time Machine
        </h2>
        <span className="typeline">SET THE DIAL · TRAVEL 1930 → 1959</span>
      </div>

      {/* Decade selector pills */}
      <div className="flex gap-2 mt-4 flex-wrap">
        {DECADES.map((d) => (
          <button
            key={d.label}
            onClick={() => pickDecade(d.value)}
            className={`btn-pill !px-5 !py-1.5 ${
              decade === d.value
                ? 'bg-oxblood text-parchment'
                : 'border border-sepia/50 text-sepia hover:bg-linen'
            }`}
          >
            {d.label}
          </button>
        ))}
        <button
          onClick={() => { setLocalYear(1930); onYearChange(''); }}
          className="ml-auto font-mono text-xs text-sepia underline hover:text-oxblood"
        >
          reset dial
        </button>
      </div>

      {/* Timeline slider */}
      <div className="mt-5">
        <input
          type="range"
          className="time-machine"
          min={minYear}
          max={maxYear}
          step="1"
          value={Math.min(Math.max(localYear, minYear), maxYear)}
          onChange={(e) => {
            const y = parseInt(e.target.value);
            setLocalYear(y);
            onYearChange(String(y));
          }}
          aria-label="Travel through the years"
        />
        <div className="flex justify-between font-mono text-[10px] text-sepia mt-1">
          {Array.from({ length: ((maxYear - minYear) / 10) + 1 }, (_, i) => (
            <span key={i}>{minYear + i * Math.max(1, Math.round((maxYear - minYear) / 5))}</span>
          )).slice(0, 6)}
        </div>
        <p className="text-center font-display italic text-lg mt-2">
          Now arriving in{' '}
          <span className="text-oxblood font-black not-italic">{year || decade || 'the whole archive'}</span>
        </p>
      </div>
    </section>
  );
}
