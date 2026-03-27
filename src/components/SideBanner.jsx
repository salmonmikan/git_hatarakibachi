import './SideBanner.scss'

export default function SideBanner({ side, content }) {
  if (!content) return null
  if (content.mediaType === 'image' && !content.imageUrl) return null
  if (content.mediaType === 'video' && !content.videoUrl) return null
  if (content.mediaType === 'link' && !content.externalUrl) return null

  const getYoutubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const renderMedia = () => {
    if (content.mediaType === 'image') {
      return <img src={content.imageUrl} alt={`Side banner ${side}`} />
    }
    if (content.mediaType === 'video') {
      return (
        <video
          src={content.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      )
    }
    if (content.mediaType === 'link' && content.externalUrl) {
      const ytId = getYoutubeId(content.externalUrl);
      if (ytId) {
        return (
          <div className="side-banner__video-container">
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }
      return <img src={content.externalUrl} alt={`Side banner ${side}`} />
    }
    return null
  }

  return (
    <div className={`side-banner side-${side}`}>
      <div className="side-banner__content">
        {renderMedia()}
      </div>
    </div>
  )
}
