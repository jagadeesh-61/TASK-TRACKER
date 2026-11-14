import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

/** Accessible confirm dialog (Bootstrap styles, React-controlled). */
export default function ConfirmModal({ show, title, children, confirmLabel = 'Confirm', busy = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!show) return undefined;
    cancelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [show, busy, onCancel]);

  if (!show) return null;

  return (
    <>
      <div className="modal-backdrop-custom" onClick={busy ? undefined : onCancel} />
      <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-body p-4 text-center">
              <div className="danger-icon mx-auto mb-3">
                <Icon name="trash" size={22} />
              </div>
              <h2 className="h5 mb-2" id="confirm-modal-title">
                {title}
              </h2>
              <div className="text-secondary">{children}</div>
            </div>
            <div className="modal-footer border-0 justify-content-center pt-0 pb-4 gap-2">
              <button ref={cancelRef} type="button" className="btn btn-outline-secondary px-4" onClick={onCancel} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger px-4" onClick={onConfirm} disabled={busy}>
                {busy && <span className="spinner-border spinner-border-sm" aria-hidden="true" />}
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
