// // src/components/VideoPlayer.tsx
// import { useEffect, useMemo, useRef, useState } from 'react';
// import { VideoSection } from '../lib/types';
// import './VideoPlayer.css';

// export default function VideoPlayer({
//   src,
//   poster,
//   captions,
//   autoplay,
//   loop,
//   muted,
//   credit
// }: VideoSection) {
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [showPlayButton, setShowPlayButton] = useState(false);

//   const youtubeId = useMemo(() => {
//     try {
//       const url = new URL(src);
//       if (url.hostname.includes('youtube.com')) {
//         return url.searchParams.get('v');
//       }
//       if (url.hostname === 'youtu.be') {
//         return url.pathname.replace('/', '') || null;
//       }
//     } catch (_) {
//       // 非 URL 字符串直接跳过
//     }
//     return null;
//   }, [src]);

//   const isYouTube = !!youtubeId;

//   useEffect(() => {
//     if (isYouTube) return;

//     const video = videoRef.current;
//     if (!video) return;

//     // 尝试自动播放
//     const playPromise = video.play();
    
//     if (playPromise !== undefined) {
//       playPromise
//         .then(() => {
//           setIsPlaying(true);
//           setShowPlayButton(false);
//         })
//         .catch(() => {
//           // 自动播放被阻止，显示播放按钮
//           setShowPlayButton(true);
//           setIsPlaying(false);
//         });
//     }

//     // 监听播放状态
//     const handlePlay = () => setIsPlaying(true);
//     const handlePause = () => setIsPlaying(false);
    
//     video.addEventListener('play', handlePlay);
//     video.addEventListener('pause', handlePause);

//     return () => {
//       video.removeEventListener('play', handlePlay);
//       video.removeEventListener('pause', handlePause);
//     };
//   }, [isYouTube]);

//   const handlePlayClick = () => {
//     const video = videoRef.current;
//     if (video) {
//       video.play();
//       setShowPlayButton(false);
//     }
//   };

//   return (
//     <figure className="video-hero">
//       <div className="video-wrapper">
//         {isYouTube ? (
//           <iframe
//             className="video-player video-player-embed"
//             src={`https://www.youtube.com/embed/${youtubeId}?rel=0&playsinline=1${autoplay ? '&autoplay=1' : ''}${muted ? '&mute=1' : ''}${loop ? `&loop=1&playlist=${youtubeId}` : ''}`}
//             title={credit || 'Embedded video'}
//             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
//             allowFullScreen
//           />
//         ) : (
//           <video
//             ref={videoRef}
//             src={src}
//             poster={poster}
//             autoPlay={autoplay}
//             loop={loop}
//             muted={muted}
//             playsInline
//             controls
//             className="video-player"
//           >
//             {captions && (
//               <track
//                 kind="captions"
//                 src={captions}
//                 srcLang="en"
//                 label="English"
//                 default
//               />
//             )}
//             Your browser does not support the video tag.
//           </video>
//         )}
        
//         {showPlayButton && !isYouTube && (
//           <button 
//             className="video-play-overlay"
//             onClick={handlePlayClick}
//             aria-label="Play video"
//           >
//             <svg width="80" height="80" viewBox="0 0 80 80">
//               <circle cx="40" cy="40" r="38" fill="rgba(0,0,0,0.6)" />
//               <polygon points="32,24 32,56 56,40" fill="white" />
//             </svg>
//             <span className="sr-only">Click to play</span>
//           </button>
//         )}
//       </div>
      
//       {credit && (
//         <figcaption className="video-credit">{credit}</figcaption>
//       )}
//     </figure>
//   );
// }
// 
import { useEffect, useMemo, useRef, useState } from 'react';
import { VideoSection } from '../lib/types';
import './VideoPlayer.css';

export default function VideoPlayer({
  src,
  poster,
  captions,
  autoplay,
  loop,
  muted,
  credit,
}: VideoSection) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);

  // 解析是否为 YouTube 链接，并抽取视频 ID
  const youtubeId = useMemo(() => {
    try {
      const url = new URL(src);
      if (url.hostname.includes('youtube.com')) {
        return url.searchParams.get('v');
      }
      if (url.hostname === 'youtu.be') {
        return url.pathname.replace('/', '') || null;
      }
    } catch {
      // 非 URL 字符串时直接忽略
    }
    return null;
  }, [src]);

  const isYouTube = !!youtubeId;

  // 构造更安全清晰的 YouTube 嵌入地址
  const ytSrc = useMemo(() => {
    if (!youtubeId) return '';
    const qs = new URLSearchParams({
      rel: '0',
      playsinline: '1',
    });
    if (autoplay) qs.set('autoplay', '1');
    if (muted) qs.set('mute', '1');
    if (loop) {
      qs.set('loop', '1');
      qs.set('playlist', youtubeId); // YouTube 循环需要设置同一 ID 为播放列表
    }
    return `https://www.youtube.com/embed/${youtubeId}?${qs.toString()}`;
  }, [youtubeId, autoplay, muted, loop]);

  // 仅在需要时尝试自动播放（非 YouTube 且 autoplay=true）
  useEffect(() => {
    if (isYouTube) return;

    const video = videoRef.current;
    if (!video) return;

    if (!autoplay) {
      // 确保在不需要自动播放时视频不会意外启动
      video.pause();
      setIsPlaying(false);
      setShowPlayButton(false);
      return;
    }

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setShowPlayButton(false);
        })
        .catch(() => {
          setShowPlayButton(true);
          setIsPlaying(false);
        });
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [isYouTube, autoplay, src]);

  const handlePlayClick = () => {
    const video = videoRef.current;
    if (video) {
      video.play().catch(() => {});
      setShowPlayButton(false);
    }
  };

  return (
    <figure className="video-hero">
      <div className="video-wrapper">
        {isYouTube ? (
          <iframe
            className="video-player video-player-embed"
            src={ytSrc}
            title={credit || 'Embedded video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            autoPlay={false}
            loop={loop}
            muted={muted}
            playsInline
            preload="metadata"
            controls
            crossOrigin="anonymous"
            className="video-player"
          >
            {captions && (
              <track
                kind="captions"
                src={captions}
                srcLang="en"
                label="English"
                default
              />
            )}
            Your browser does not support the video tag.
          </video>
        )}

        {showPlayButton && !isYouTube && (
          <button
            className="video-play-overlay"
            onClick={handlePlayClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePlayClick();
              }
            }}
            aria-label="Play video"
          >
            <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
              <circle cx="40" cy="40" r="38" fill="rgba(0,0,0,0.6)" />
              <polygon points="32,24 32,56 56,40" fill="white" />
            </svg>
            <span className="sr-only">Click to play</span>
          </button>
        )}
      </div>

      {credit && <figcaption className="video-credit">{credit}</figcaption>}
    </figure>
  );
}
