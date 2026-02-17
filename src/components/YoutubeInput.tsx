import { useState } from 'react';
import { validateYoutubeUrl } from '../utils/youtubeExtractor';
import './YoutubeInput.css';

interface YoutubeInputProps {
  disabled?: boolean;
}

export function YoutubeInput({ disabled = false }: YoutubeInputProps) {
  const [url, setUrl] = useState('');
  const [touched, setTouched] = useState(false);

  const validation = validateYoutubeUrl(url);
  const showError = touched && !validation.valid;

  const handleOpenYtmp3 = () => {
    if (validation.valid && url) {
      // Try to pass URL parameter (ytmp3.ai may or may not support it)
      window.open(`https://ytmp3.ai/?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  return (
    <div className="youtube-helper">
      <h3>Load from YouTube</h3>
      <div className="youtube-input-row">
        <input
          type="text"
          placeholder="Paste YouTube URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          data-youtube-input
        />
        <button
          onClick={handleOpenYtmp3}
          disabled={!validation.valid || disabled}
          className="youtube-open-btn"
        >
          Open in ytmp3.ai ↗
        </button>
      </div>
      {showError && validation.error && (
        <span className="youtube-error">{validation.error}</span>
      )}
      <div className="youtube-instructions">
        <p><strong>How to use:</strong></p>
        <ol>
          <li>Paste a YouTube URL above</li>
          <li>Click "Open in ytmp3.ai" button</li>
          <li>Download the MP3 file on ytmp3.ai</li>
          <li>Drag the downloaded MP3 into the upload area above</li>
        </ol>
      </div>
    </div>
  );
}
