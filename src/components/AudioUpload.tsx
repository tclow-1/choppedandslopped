import { useDropzone } from 'react-dropzone';
import './AudioUpload.css';

interface AudioUploadProps {
  onFileLoad: (file: File) => void;
  fileName: string | null;
  isLoading?: boolean;
}

export function AudioUpload({ onFileLoad, fileName, isLoading = false }: AudioUploadProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a', '.flac']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileLoad(acceptedFiles[0]);
      }
    }
  });

  const getDisplayText = () => {
    if (isLoading) {
      return 'Loading...';
    }
    if (fileName) {
      return fileName;
    }
    if (isDragActive) {
      return 'Drop audio file here...';
    }
    return 'Drag audio file here, or click to select';
  };

  return (
    <div
      {...getRootProps()}
      className={`audio-upload ${isDragActive ? 'drag-active' : ''} ${fileName ? 'has-file' : ''}`}
    >
      <input {...getInputProps()} />
      <p>{getDisplayText()}</p>
    </div>
  );
}
