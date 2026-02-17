import './YoutubeInput.css';

interface YoutubeInputProps {
  disabled?: boolean;
}

export function YoutubeInput({ disabled = false }: YoutubeInputProps) {
  const handleOpenYtmp3 = () => {
    window.open('https://ytmp3.ai/', '_blank');
  };

  return (
    <div className="youtube-helper">
      <p className="youtube-helper-text">
        Want to load a song from YouTube?{' '}
        <button
          onClick={handleOpenYtmp3}
          disabled={disabled}
          className="youtube-link-btn"
        >
          Try using ytmp3.ai
        </button>{' '}
        to download your song, then drag the MP3 file above.
      </p>
    </div>
  );
}
