import { useState, useRef, useEffect } from 'react';
import type { CarDTO } from '../types/api.types';

interface CarSelectProps {
  cars: CarDTO[];
  value: string;
  onChange: (id: string) => void;
}

export default function CarSelect({ cars, value, onChange }: CarSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = cars.find(c => c.id === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <style>{`
        .cs-wrap { position: relative; user-select: none; }

        .cs-trigger {
          width: 100%; display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 14px; padding: 13px 14px;
          cursor: pointer; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .cs-trigger:hover { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.14); }
        .cs-trigger.is-open {
          border-color: rgba(251,146,60,0.5);
          background: rgba(251,146,60,0.04);
          box-shadow: 0 0 0 4px rgba(251,146,60,0.08);
        }

        .cs-car-icon {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(251,146,60,0.18), rgba(244,63,94,0.12));
          border: 1px solid rgba(251,146,60,0.2);
          display: flex; align-items: center; justify-content: center;
          color: #fb923c;
        }
        .cs-car-icon.empty {
          background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.08); color: rgba(255,255,255,0.2);
        }

        .cs-text { flex: 1; min-width: 0; text-align: left; }
        .cs-main { font-size: 14px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cs-sub { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 1px; font-family: 'DM Mono', monospace; letter-spacing: 0.04em; }
        .cs-placeholder { font-size: 14px; color: rgba(255,255,255,0.25); }

        .cs-chevron {
          color: rgba(255,255,255,0.3); flex-shrink: 0;
          transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), color 0.2s;
        }
        .cs-chevron.is-open { transform: rotate(180deg); color: #fb923c; }

        /* dropdown */
        .cs-dropdown {
          position: absolute; top: calc(100% + 8px); left: 0; right: 0; z-index: 200;
          background: #13131a; border: 1px solid rgba(255,255,255,0.09);
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 24px 64px rgba(0,0,0,0.7);
          animation: cs-drop 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes cs-drop {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: none; }
        }

        .cs-list { max-height: 220px; overflow-y: auto; padding: 6px; }
        .cs-list::-webkit-scrollbar { width: 4px; }
        .cs-list::-webkit-scrollbar-track { background: transparent; }
        .cs-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .cs-option {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 10px; border-radius: 10px;
          cursor: pointer; transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
          position: relative;
        }
        .cs-option:hover { background: rgba(255,255,255,0.05); }
        .cs-option.is-selected { background: rgba(251,146,60,0.08); }
        .cs-option:active { background: rgba(255,255,255,0.08); }

        .cs-opt-icon {
          width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.35);
          transition: background 0.15s, border-color 0.15s, color 0.15s;
        }
        .cs-option.is-selected .cs-opt-icon {
          background: rgba(251,146,60,0.15); border-color: rgba(251,146,60,0.25); color: #fb923c;
        }

        .cs-opt-text { flex: 1; min-width: 0; }
        .cs-opt-name { font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .cs-opt-plate {
          display: inline-flex; align-items: center;
          margin-top: 3px; padding: 2px 7px;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 5px; font-size: 10px; font-weight: 600;
          color: rgba(255,255,255,0.4); letter-spacing: 0.1em;
          font-family: 'DM Mono', monospace;
        }
        .cs-option.is-selected .cs-opt-plate {
          background: rgba(251,146,60,0.1); border-color: rgba(251,146,60,0.2); color: #fb923c;
        }

        .cs-check { color: #fb923c; flex-shrink: 0; opacity: 0; transition: opacity 0.15s; }
        .cs-option.is-selected .cs-check { opacity: 1; }

        .cs-empty {
          padding: 24px 16px; text-align: center;
          font-size: 13px; color: rgba(255,255,255,0.25);
        }
      `}</style>

      <div className="cs-wrap" ref={ref}>
        {/* Trigger */}
        <div className={`cs-trigger${open ? ' is-open' : ''}`} onClick={() => setOpen(v => !v)}>
          <div className={`cs-car-icon${!selected ? ' empty' : ''}`}>
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" />
              <circle cx="7.5" cy="16" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="16.5" cy="16" r="1.2" fill="currentColor" stroke="none" />
            </svg>
          </div>

          <div className="cs-text">
            {selected ? (
              <>
                <div className="cs-main">{selected.mark} {selected.model}</div>
                <div className="cs-sub">{selected.carNumber}</div>
              </>
            ) : (
              <div className="cs-placeholder">Select a vehicle…</div>
            )}
          </div>

          <svg className={`cs-chevron${open ? ' is-open' : ''}`} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown */}
        {open && (
          <div className="cs-dropdown">
            <div className="cs-list">
              {cars.length === 0 ? (
                <div className="cs-empty">No vehicles found</div>
              ) : (
                cars.map(car => {
                  const isSelected = car.id === value;
                  return (
                    <div
                      key={car.id}
                      className={`cs-option${isSelected ? ' is-selected' : ''}`}
                      onClick={() => { onChange(car.id); setOpen(false); }}
                    >
                      <div className="cs-opt-icon">
                        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h8M5 11l1.5-4.5h11L19 11M5 11H3v3h1m16-3h1v3h-1M5 11h14" />
                          <circle cx="7.5" cy="16" r="1.2" fill="currentColor" stroke="none" />
                          <circle cx="16.5" cy="16" r="1.2" fill="currentColor" stroke="none" />
                        </svg>
                      </div>
                      <div className="cs-opt-text">
                        <div className="cs-opt-name">{car.mark} {car.model}</div>
                        <span className="cs-opt-plate">{car.carNumber}</span>
                      </div>
                      <svg className="cs-check" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}