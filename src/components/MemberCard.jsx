import PropTypes from 'prop-types';


export default function MemberCard({ name, role, bio, photoUrl, photoAlt, onOpen }) {
    const hasPhoto = Boolean(photoUrl);
    const imageAlt = photoAlt || (name ? `${name} photo` : 'Member photo');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen?.();
        }
    };

    return (
        <article
            className="member-card"
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={handleKeyDown}
            aria-label={`${name} の詳細を開く`}
        >
            {hasPhoto ? (
                <img src={photoUrl} alt={imageAlt} className="member-photo" />
            ) : (
                <div
                    className="member-no-photo"
                    role="img"
                    aria-label="No photo available"
                >
                    No Image
                </div>
            )}
            <h3 className="member-name">{name}</h3>
            <p className="member-role">{role}</p>
            {bio && <p className="member-bio">{bio}</p>}
        </article >
    );
}

MemberCard.propTypes = {
    name: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    bio: PropTypes.string,
    photoUrl: PropTypes.string,
    photoAlt: PropTypes.string,
    onOpen: PropTypes.func,
};
