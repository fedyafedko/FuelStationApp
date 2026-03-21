interface Props {
    robotCode: string;
    codeError: string;
    codeSubmitting: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onSubmit: () => void;
  }
  
  export function ArrivedState({ robotCode, codeError, codeSubmitting, onChange, onSubmit }: Props) {
    return (
      <div className="fw-arrived">
        <div className="fw-arrived-icon-wrap">
          <div className="fw-arrived-ring" />
          <div className="fw-arrived-ring-2" />
          <div className="fw-arrived-inner">🤖</div>
        </div>
  
        <div className="fw-badge fw-badge-green">
          <span className="fw-badge-dot fw-badge-dot-green" />
          Robot is here
        </div>
  
        <h1 className="fw-arrived-title">Your robot arrived!</h1>
        <p className="fw-arrived-sub">Enter the unique code displayed on the robot's screen to unlock fueling.</p>
  
        <div className="fw-code-card">
          <div className="fw-code-label">Robot unlock code</div>
          <input
            className={`fw-code-input${codeError ? ' error' : ''}`}
            style={{ letterSpacing:'0.18em', fontSize:20 }}
            placeholder="FS-RB-01-0123"
            value={robotCode}
            onChange={onChange}
            onKeyDown={e => {
              if (e.key === 'Backspace' && robotCode === 'FS-') e.preventDefault();
              if (e.key === 'Enter') onSubmit();
            }}
            onFocus={e => {
              const len = e.target.value.length;
              setTimeout(() => e.target.setSelectionRange(len, len), 0);
            }}
            maxLength={13}
            autoCapitalize="characters"
            spellCheck={false}
            autoCorrect="off"
          />
          {codeError && (
            <div className="fw-code-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {codeError}
            </div>
          )}
        </div>
  
        <button className="fw-confirm-btn" onClick={onSubmit} disabled={codeSubmitting || robotCode.length < 13}>
          {codeSubmitting
            ? <><div className="fw-btn-spinner" /> Verifying…</>
            : <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Confirm Code
              </>
          }
        </button>
      </div>
    );
  }