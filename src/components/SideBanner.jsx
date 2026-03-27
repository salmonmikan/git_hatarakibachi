import './SideBanner.scss'

export default function SideBanner({ side, content }) {
  if (!content) return null
  if (content.mediaType === 'image' && !content.imageUrl) return null
  if (content.mediaType === 'video' && !content.videoUrl) return null

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
    return null
  }

  const banner = (
    <div className={`side-banner side-${side}`}>
      <div className="side-banner__content">
        {renderMedia()}
      </div>
    </div>
  )

  if (content.link) {
    return (
      <a href={content.link} target="_blank" rel="noopener noreferrer" className="side-banner-link">
        {banner}
      </a>
    )
  }

  return banner
}
