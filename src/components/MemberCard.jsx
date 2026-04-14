import { User } from 'lucide-react';
import headerBanner from '../assets/header-banner-main.png';
import signature from '../assets/idcard/WhatsApp Image 2026-04-12 at 17.49.37.jpeg';

// Roles that carry a named position title
const POSITION_LABEL = {
    HEAD: 'President',
};

// Roles with no specific position — shown as membership type
const MEMBERSHIP_LABEL = {
    PERMANENT: 'Permanent Member',
    NORMAL: 'Member',
    ASSOCIATED: 'Associate Member',
    LIFE: 'Life Member',
    ANNUAL: 'Annual Member',
    MONTHLY: 'Monthly Member',
};

const MemberCard = ({ user }) => {
    if (!user) return null;

    const nameLen = user.full_name?.length || 0;
    const nameFontSize = nameLen > 28 ? '14px' : nameLen > 20 ? '17px' : '20px';

    const dobFormatted = user.dob
        ? new Date(user.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '';

    const roleDisplay = POSITION_LABEL[user.role] || MEMBERSHIP_LABEL[user.role] || 'Member';

    return (
        <div style={{ width: '480px', margin: '0 auto', fontFamily: 'Arial, Helvetica, sans-serif', border: '2.5px solid #000', borderRadius: '4px', overflow: 'hidden' }}>
            {/* Header Banner */}
            <img
                src={headerBanner}
                alt="Parishat Banner"
                style={{ width: '100%', display: 'block' }}
            />

            {/* Card Body */}
            <div style={{
                backgroundColor: '#ffffff',
                padding: '10px 12px 8px 12px',
            }}>
                {/* IDENTITY CARD label */}
                <div style={{ textAlign: 'right', marginBottom: '6px' }}>
                    <span style={{
                        color: '#1a5c4a',
                        fontWeight: '900',
                        fontSize: '17px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                    }}>
                        Identity Card
                    </span>
                </div>

                {/* Main row: Photo + Details */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                    {/* Photo */}
                    <div style={{
                        width: '88px',
                        height: '108px',
                        border: '1px solid #888',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#f0f0f0',
                        overflow: 'hidden',
                    }}>
                        {user.photo_url ? (
                            <img
                                src={user.photo_url}
                                alt={user.full_name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        ) : (
                            <User size={44} color="#bbb" />
                        )}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Name */}
                        <div style={{ fontSize: '8px', color: '#555', marginBottom: '1px', letterSpacing: '0.05em' }}>
                            FULL NAME
                        </div>
                        <div style={{
                            fontSize: nameFontSize,
                            fontWeight: '900',
                            color: '#111',
                            lineHeight: 1.2,
                            marginBottom: '5px',
                            wordBreak: 'break-word',
                        }}>
                            {user.full_name?.toUpperCase()}
                        </div>

                        {/* Role + DOB row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
                            <div style={{ fontSize: '9px', color: '#333', fontStyle: 'italic' }}>
                                {roleDisplay}
                            </div>
                            {dobFormatted && (
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '8px', color: '#555' }}>Date of Birth</div>
                                    <div style={{ fontSize: '9px', color: '#111', fontWeight: '600' }}>{dobFormatted}</div>
                                </div>
                            )}
                        </div>

                        {/* Cell No */}
                        {user.phone && (
                            <div style={{ fontSize: '9px', color: '#333', marginBottom: '2px' }}>
                                Mobile No. : {user.phone}
                            </div>
                        )}

                        {/* Region */}
                        <div style={{ fontSize: '9px', color: '#333' }}>
                            Region{user.regional_committee ? `: ${user.regional_committee}` : ''}
                        </div>
                    </div>
                </div>

                {/* Bottom row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginTop: '10px',
                    paddingTop: '6px',
                    borderTop: '1px solid #e0e0e0',
                }}>
                    {/* Member ID badge */}
                    <div style={{
                        backgroundColor: '#1a5c4a',
                        color: 'white',
                        padding: '4px 12px 5px',
                        borderRadius: '4px',
                        minWidth: '72px',
                    }}>
                        <div style={{ fontSize: '7px', fontWeight: '700', opacity: 0.75, letterSpacing: '0.06em' }}>MEMBER ID</div>
                        <div style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '0.02em' }}>
                            {user.member_id || 'PENDING'}
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: '#222', marginBottom: '2px' }}>Status</div>
                        <div style={{ fontSize: '9px', color: '#333' }}>Verified &nbsp; Active</div>
                    </div>

                    {/* Signature + President */}
                    <div style={{ textAlign: 'center' }}>
                        <img
                            src={signature}
                            alt="Signature"
                            style={{ height: '42px', width: 'auto', display: 'block', margin: '0 auto', mixBlendMode: 'multiply' }}
                        />
                        <div style={{ fontSize: '8px', color: '#333', marginTop: '2px', letterSpacing: '0.03em' }}>
                            President
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MemberCard;
