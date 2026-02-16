import { useState, useEffect, FormEvent } from 'react';
import { validateYoutubeUrl } from '../utils/youtubeExtractor';
import type { YoutubeLoadState } from '../types/youtube';
import './YoutubeInput.css';

interface YoutubeInputProps {
  onYoutubeLoad: (url: string) => void;
  loadState: YoutubeLoadState;
  disabled?: boolean;
}

export function YoutubeInput({ onYoutubeLoad, loadState, disabled = false }: YoutubeInputProps) {
  const [url, setUrl] = useState('');
  const [touched, setTouched] = useState(false);

  const validation = validateYoutubeUrl(url);
  const showValidationError = touched && !validation.valid;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validation.valid && !disabled && loadState.status !== 'loading') {
      onYoutubeLoad(url);
    }
  };

  // Clear input and reset touched state on successful load
  useEffect(() => {
    if (loadState.status === 'success') {
      setUrl('');
      setTouched(false);
    }
  }, [loadState.status]);

  const isSubmitDisabled = !validation.valid || disabled || loadState.status === 'loading';
  const buttonText = loadState.status === 'loading' ? 'Loading...' : 'Load';

  return (
    <div className="youtube-input-container">
      <form onSubmit={handleSubmit} className="youtube-input">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="Paste YouTube URL..."
          disabled={disabled || loadState.status === 'loading'}
          data-youtube-input
        />
        <button
          type="submit"
          disabled={isSubmitDisabled}
        >
          {buttonText}
        </button>
      </form>

      {loadState.status === 'loading' && (
        <div className="youtube-status loading">{loadState.stage}</div>
      )}

      {loadState.status === 'error' && (
        <div className="youtube-status error">{loadState.error}</div>
      )}

      {showValidationError && validation.error && (
        <div className="youtube-validation-error">{validation.error}</div>
      )}
    </div>
  );
}
