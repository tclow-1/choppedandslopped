import './YoutubeInput.css';

interface YoutubeInputProps {
  disabled?: boolean;
}

export function YoutubeInput({ disabled = false }: YoutubeInputProps) {
  const handleOpenYtmp3 = () => {
    window.open('https://ytmp3.ai/', '_blank');
  };

  const handleOpenSoundCloudDownloader = () => {
    window.open('https://sclouddownloader.net/', '_blank');
  };

  return (
    <div className="youtube-helper">
      <p className="youtube-helper-text">
        Want to load a song from a URL? Try{' '}
        <button
          onClick={handleOpenYtmp3}
          disabled={disabled}
          className="youtube-link-btn"
        >
          ytmp3.ai
        </button>{' '}
        for YouTube or{' '}
        <button
          onClick={handleOpenSoundCloudDownloader}
          disabled={disabled}
          className="youtube-link-btn"
        >
          sclouddownloader.net
        </button>{' '}
        for SoundCloud, then drag the downloaded MP3 file above.
      </p>
    </div>
  );
}
