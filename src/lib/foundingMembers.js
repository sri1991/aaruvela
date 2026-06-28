// Single source of truth for the Parishat's founding members.
// Matching is done on the last 10 digits of the phone number so that values
// stored with or without the +91 country code resolve to the same member.

const lastTenDigits = (phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '').slice(-10);
};

// Founding member phone numbers (from the Administration page).
const FOUNDING_MEMBER_PHONES = new Set([
    '9849476726', '9885063577', '9440326363', '9491223344',
    '8309874005', '9866103483', '9848645899', '9848747447',
    '7997459859', '9440097872', '9246832468',
].map(lastTenDigits));

// A founding member is a PERMANENT-role account whose phone is in the set above.
export const isFoundingMember = (member) =>
    member?.role === 'PERMANENT' && FOUNDING_MEMBER_PHONES.has(lastTenDigits(member?.phone));

// Office positions held by founding members (from the Central Executive list).
// Only founders who hold an actual office appear here; plain committee members
// are intentionally omitted so they display as "Founding Member" only.
const FOUNDING_OFFICES = new Map([
    ['9849476726', "Hon'ble President"],
    ['9885063577', 'President'],
    ['9440326363', 'Vice-President'],
    ['9491223344', 'Co-Vice President'],
    ['8309874005', 'Secretary'],
    ['9866103483', 'Asst. Secretary'],
    ['9848645899', 'Treasurer'],
].map(([phone, post]) => [lastTenDigits(phone), post]));

// Returns the office title for a founding member, or null if they hold none.
export const foundingOffice = (member) =>
    isFoundingMember(member) ? (FOUNDING_OFFICES.get(lastTenDigits(member?.phone)) || null) : null;
