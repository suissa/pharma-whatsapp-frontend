import { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  className?: string;
}

const Spinner = () => (
  <div 
    style={{
      width: '20px',
      height: '20px',
      border: '3px solid rgba(255, 255, 255, 0.3)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} 
  />
);

export default function AudioPlayer({ src, className = '' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // Função para formatar tempo (mm:ss)
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Função para alternar play/pause
  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('Erro ao reproduzir áudio:', err);
      setError(true);
    }
  };

  // Função para atualizar progresso
  const handleProgress = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;

    const rect = progressRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newTime = percentage * duration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Event listeners do áudio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError(true);
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [src]);

  // Estilos diretos
  const playerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    maxWidth: '320px',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
  };

  const buttonStyle = {
    flexShrink: 0,
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    border: 'none',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transition: 'all 0.2s ease-in-out',
    outline: 'none'
  };

  const progressContainerStyle = {
    flex: 1,
    minWidth: 0
  };

  const progressBarStyle = {
    height: '12px',
    backgroundColor: '#e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    marginBottom: '8px',
    position: 'relative' as const,
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  };

  const progressFillStyle = {
    height: '100%',
    backgroundColor: '#db1c50',
    borderRadius: '6px',
    transition: 'width 0.2s ease-in-out',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
  };

  const timeDisplayStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6c6d6d'
  };

  const downloadStyle = {
    flexShrink: 0,
    padding: '8px',
    borderRadius: '50%',
    color: '#6c6d6d',
    textDecoration: 'none',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  if (error) {
    return (
      <div style={{...playerStyle, maxWidth: '280px'}}>
        <span style={{fontSize: '20px'}}>❌</span>
        <span style={{fontSize: '14px', fontWeight: '500', color: '#6c6d6d'}}>
          Erro ao carregar áudio
        </span>
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            fontSize: '14px',
            color: '#db1c50',
            textDecoration: 'underline',
            marginLeft: 'auto',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          Download
        </a>
      </div>
    );
  }

  return (
    <div style={playerStyle} className={className}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Botão Play/Pause */}
      <button
        style={buttonStyle}
        onClick={togglePlayPause}
        disabled={isLoading}
        onMouseEnter={(e) => {
          setIsHovered(true);
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#c41847';
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          setIsHovered(false);
          e.currentTarget.style.backgroundColor = 'transparent';
          if (!isLoading) {
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
        onMouseDown={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'scale(0.95)';
          }
        }}
        onMouseUp={(e) => {
          if (!isLoading) {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        aria-label={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
      >
        {isLoading ? (
          <Spinner />
        ) : (
          <img src={isHovered ? '/button-branco.png' : '/button.png'} alt={isPlaying ? 'Pausar' : 'Play'} style={{ width: 28, height: 28, objectFit: 'contain', filter: isPlaying ? 'grayscale(1) opacity(0.7)' : 'none' }} />
        )}
      </button>

      {/* Barra de progresso e informações */}
      <div style={progressContainerStyle}>
        <div 
          ref={progressRef}
          style={progressBarStyle}
          onClick={handleProgress}
        >
          <div style={progressFillStyle} />
        </div>
        
        <div style={timeDisplayStyle}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Botão de download */}
      <a 
        href={src} 
        target="_blank" 
        rel="noopener noreferrer"
        style={downloadStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f5f5f5';
          e.currentTarget.style.color = '#db1c50';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#6c6d6d';
          e.currentTarget.style.boxShadow = 'none';
        }}
        title="Download do áudio"
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </a>


    </div>
  );
} 