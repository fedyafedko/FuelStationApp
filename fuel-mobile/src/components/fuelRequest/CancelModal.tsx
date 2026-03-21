const CANCEL_REASONS = [
    'Changed my mind',
    'Found another solution',
    'Wrong location entered',
    'Taking too long',
    'Other',
  ];
  
  interface Props {
    cancelReason: string;
    cancelError: string;
    cancelling: boolean;
    onSelectReason: (reason: string) => void;
    onCustomReason: (text: string) => void;
    onConfirm: () => void;
    onClose: () => void;
  }
  
  export function CancelModal({
    cancelReason,
    cancelError,
    cancelling,
    onSelectReason,
    onCustomReason,
    onConfirm,
    onClose,
  }: Props) {
    return (
      <div
        className="fw-cancel-modal-overlay"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="fw-cancel-modal-sheet">
          <div className="fw-cancel-modal-handle" />
  
          <div className="fw-cancel-modal-header">
            <div className="fw-cancel-modal-icon">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#f43f5e" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <div className="fw-cancel-modal-title">Cancel Request</div>
              <div className="fw-cancel-modal-sub">Let us know why you're cancelling</div>
            </div>
          </div>
  
          <div className="fw-cancel-reasons-label">Select a reason</div>
  
          <div className="fw-cancel-reasons-list">
            {CANCEL_REASONS.map(reason => {
              const isSelected = cancelReason === reason || (reason === 'Other' && cancelReason !== '' && !CANCEL_REASONS.slice(0, -1).includes(cancelReason));
              return (
                <button
                  key={reason}
                  className={`fw-cancel-reason-btn ${isSelected ? 'selected' : 'unselected'}`}
                  onClick={() => onSelectReason(reason)}
                >
                  <div className={`fw-cancel-reason-radio ${isSelected ? 'selected' : 'unselected'}`}>
                    {isSelected && <div className="fw-cancel-reason-dot" />}
                  </div>
                  <span className={`fw-cancel-reason-text ${isSelected ? 'selected' : 'unselected'}`}>
                    {reason}
                  </span>
                </button>
              );
            })}
          </div>
  
          {(cancelReason === 'Other' || (!CANCEL_REASONS.slice(0, -1).includes(cancelReason) && cancelReason !== '')) && (
            <textarea
              className="fw-cancel-textarea"
              placeholder="Please describe your reason…"
              rows={3}
              onChange={e => onCustomReason(e.target.value)}
            />
          )}
  
          {cancelError && (
            <div className="fw-cancel-error">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              {cancelError}
            </div>
          )}
  
          <div className="fw-cancel-actions">
            <button className="fw-keep-btn" onClick={onClose}>Keep Order</button>
            <button
              className="fw-do-cancel-btn"
              onClick={onConfirm}
              disabled={cancelling || !cancelReason.trim()}
            >
              {cancelling
                ? <><div className="fw-btn-spinner" /> Cancelling…</>
                : <>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel Request
                  </>
              }
            </button>
          </div>
        </div>
      </div>
    );
  }