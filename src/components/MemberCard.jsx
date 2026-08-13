import PropTypes from 'prop-types';
// import MemberPhoto from '../assets/MemberPhoto';
import { returnPhotoUrl } from '../assets/_returnPhotoUrl';
import { trackDataLayerEvent } from '@src/utils/analytics.js';



export default function MemberCard({ id, hurigana, name, role, photoUrl, photoAlt, onOpen }) {
    const hasPhoto = Boolean(photoUrl);
    const imageAlt = photoAlt || (name ? `${name} photo` : 'Member photo');

    const handleOpen = () => {
        trackDataLayerEvent("member_detail_open", {
            member_id: id != null ? String(id) : undefined,
            placement: "member",
        });
        onOpen?.();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
        }
    };
    const analyticsProps = {
        "data-gtm-category": "engagement",
        "data-gtm-action": "open",
        "data-gtm-label": "member_modal",
        "data-gtm-location": "member",
        "data-gtm-type": "member_card",
    };

    return (
        <article
            className="member-card"
            role="button"
            tabIndex={0}
            onClick={handleOpen}
            onKeyDown={handleKeyDown}
            aria-label={`${name} の詳細を開く`}
            {...analyticsProps}
        >
            {hasPhoto ? (
                <img
                    className="member-photo upper"
                    loading="eager"
                    // priority
                    fetchpriority="high"
                    decoding="async"
                    width={400}
                    height={400}
                    src={returnPhotoUrl(photoUrl, 400, "top")}
                    alt={imageAlt}
                    {...analyticsProps}
                />
            ) : (
                <div
                    className="member-no-photo"
                    role="img"
                    aria-label="No photo available"
                    {...analyticsProps}
                >
                    No Image
                </div>
            )}
            <h2 className="member-name" {...analyticsProps}>{name}</h2>
            <span className="member-hurigana" {...analyticsProps}>{hurigana}</span>
            <p className="member-role" {...analyticsProps}>{role}</p>
            {/* {bio && <p className="member-bio">{bio}</p>} */}
        </article >
    );
}

MemberCard.propTypes = {
    name: PropTypes.string.isRequired,
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    role: PropTypes.string.isRequired,
    bio: PropTypes.string,
    photoUrl: PropTypes.string,
    photoAlt: PropTypes.string,
    onOpen: PropTypes.func,
};
