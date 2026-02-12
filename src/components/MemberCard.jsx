import PropTypes from 'prop-types';
// import MemberPhoto from '../assets/MemberPhoto';
import { returnPhotoUrl } from '../assets/_returnPhotoUrl';



export default function MemberCard({ m, hurigana, name, role, photoUrl, photoAlt, onOpen }) {
    async function fetchImg(path, el) {
        const res = await fetch(`/api/img-url?path=${encodeURIComponent(path)}`);
        if (!res.ok) throw new Error("failed to get img url");
        const data = await res.json();
        el.src = data.url;
    }

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
                <img
                    className="member-photo upper"
                    loading="eager"
                    fetchpriority="high"
                    decoding="async"
                    width={400}
                    height={400}
                    src={returnPhotoUrl(photoUrl, 400, "top")}
                    alt={name}
                />
            ) : (
                <div
                    className="member-no-photo"
                    role="img"
                    aria-label="No photo available"
                >
                    No Image
                </div>
            )}
            <h2 className="member-name">{name}</h2>
            <span className="member-hurigana">{hurigana}</span>
            <p className="member-role">{role}</p>
            {/* {bio && <p className="member-bio">{bio}</p>} */}
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
