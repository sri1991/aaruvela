import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, LogIn, User, Download, CreditCard, KeyRound, Users, Newspaper, Heart, BookOpen, PhoneCall } from 'lucide-react';

const sections = [
  {
    id: 'login',
    icon: <LogIn size={20} />,
    title: 'How to Login',
    steps: [
      { heading: 'Open the website', body: 'Go to aaruvela.org in any browser (Chrome or Safari work best).' },
      { heading: 'Click "Login" in the top menu', body: 'You will find the Login button at the top right corner of the page.' },
      { heading: 'Enter your mobile number', body: 'Type your 10-digit mobile number — do not add +91 or 0 at the beginning. Example: 9876543210' },
      { heading: 'Enter your 4-digit PIN', body: 'Your PIN was shared with you when your membership was approved. If you do not know it, contact the Parishat office — they will reset it for you.' },
      { heading: 'Click the Login button', body: 'You will be taken to your personal Member Dashboard.' },
    ],
    tip: 'If you are on your own phone, you can save the website to your home screen for quick access next time.',
  },
  {
    id: 'membership',
    icon: <User size={20} />,
    title: 'Applying for Membership (New Members)',
    steps: [
      { heading: 'Go to the Login page', body: 'Open the website and click Login in the top menu.' },
      { heading: 'Click "Register / Apply Here"', body: 'On the login page, look for a link at the bottom that says "New Member? Apply Here" and click it.' },
      { heading: 'Choose your membership type', body: 'Select one of the three options: Permanent (₹5,000 one-time), Normal (₹100/year), or Associated membership.' },
      { heading: 'Fill in your personal details', body: 'Enter your full name, mobile number, date of birth, address, and other requested details. All fields marked with * are required.' },
      { heading: 'Pay and enter the transaction reference', body: 'Pay the membership fee via UPI (GPay, PhonePe, Paytm, etc.) to the UPI ID shown on screen. Then type your UPI Transaction ID in the box provided.' },
      { heading: 'Submit your application', body: 'Click "Submit Application". The Parishat office will review and activate your account within 2–3 working days.' },
    ],
    tip: 'Save your UPI Transaction ID after paying — you may need it if you contact the office about your application.',
  },
  {
    id: 'dashboard',
    icon: <BookOpen size={20} />,
    title: 'Your Member Dashboard',
    steps: [
      { heading: 'After logging in you are taken to your dashboard', body: 'This is your personal page where you can see all your information.' },
      { heading: 'Your Member ID is shown at the top', body: 'Your unique Member ID (for example PID-004) is displayed at the top of the page. Note this number — you may need it when contacting the office.' },
      { heading: 'Scroll down to see your ID card', body: 'Your official digital identity card is displayed on the page showing your name, photo, member ID, and other details.' },
      { heading: 'Personal details are shown below the ID card', body: 'You can see your mobile number, date of birth, address, region, and more.' },
      { heading: 'Membership status', body: 'If your membership is due for renewal, a notice will appear at the top of the dashboard.' },
    ],
    tip: null,
  },
  {
    id: 'idcard',
    icon: <Download size={20} />,
    title: 'Downloading Your ID Card',
    steps: [
      { heading: 'Login and go to your Dashboard', body: 'Make sure you are logged in. You will be taken to your dashboard automatically.' },
      { heading: 'Scroll down to your ID card', body: 'Scroll down the page until you can see your ID card displayed on screen.' },
      { heading: 'Click "Download ID Card"', body: 'Below the ID card you will see a green button that says "Download ID Card". Click or tap it.' },
      { heading: 'Wait 2–3 seconds', body: 'A message will appear saying "Generating your official ID card…" — please wait and do not tap anything else.' },
      { heading: 'The image will be saved to your device', body: 'A .jpg image file will be saved to your phone or computer. On a phone it will appear in your Downloads folder or photo gallery.' },
    ],
    tip: 'You can send the downloaded ID card on WhatsApp or get it printed at any photo print shop.',
  },
  {
    id: 'editprofile',
    icon: <User size={20} />,
    title: 'Editing Your Profile',
    steps: [
      { heading: 'Go to your Dashboard', body: 'Login and you will be taken to your dashboard.' },
      { heading: 'Scroll down to Personal Details', body: 'Scroll past your ID card to find the Personal Details section.' },
      { heading: 'Click "Edit Profile"', body: 'In the top-right corner of that section, click the "Edit Profile" link.' },
      { heading: 'Make your changes', body: 'Click on any field you want to update and type the new information — such as your address, email, or date of birth.' },
      { heading: 'Upload a new photo (optional)', body: 'Click the camera/upload area to choose a photo from your phone or computer. A clear front-facing photo works best for your ID card.' },
      { heading: 'Click "Save Changes"', body: 'Click the Save Changes button. A green success message will appear when your changes are saved.' },
    ],
    tip: 'After uploading a new photo, download a fresh copy of your ID card to get the updated version.',
  },
  {
    id: 'pin',
    icon: <KeyRound size={20} />,
    title: 'Changing Your PIN',
    steps: [
      { heading: 'Go to your Dashboard', body: 'Login and go to your member dashboard.' },
      { heading: 'Scroll to Personal Details and click "Change PIN"', body: 'Next to the Edit Profile link you will see a "Change PIN" link. Click it.' },
      { heading: 'Enter your new 4-digit PIN', body: 'Type your new PIN in the first box. Repeat the same PIN in the second box to confirm.' },
      { heading: 'Click "Update PIN"', body: 'Click the button to save. You will see a confirmation message when it is done.' },
    ],
    tip: 'Choose a PIN that is easy for you to remember but not obvious to others (avoid 1234 or 0000). Never share your PIN with anyone.',
  },
  {
    id: 'members',
    icon: <Users size={20} />,
    title: 'Viewing the Members Directory',
    steps: [
      { heading: 'Click "Members" in the top menu', body: 'In the navigation bar at the top of the page, click "Members".' },
      { heading: 'Browse the members list', body: 'You will see all active members with their name, region, and membership type. Scroll down to see more.' },
      { heading: 'Filter by membership type', body: 'Use the ALL / PERMANENT / NORMAL buttons at the top to filter the list.' },
      { heading: 'Click on a member to see their details', body: "Tap or click any member's card to see their full profile." },
    ],
    tip: null,
  },
  {
    id: 'news',
    icon: <Newspaper size={20} />,
    title: 'Reading News & Updates',
    steps: [
      { heading: 'Click "News" in the top menu', body: 'Click the News link in the navigation bar.' },
      { heading: 'Click on any article to read it', body: 'Each article shows a title and a short summary. Click on it to read the full content.' },
      { heading: 'Download attached PDFs', body: 'Some articles have a PDF attached. Click the Download PDF button to save it to your device.' },
    ],
    tip: 'Make sure you are logged in to read the full articles.',
  },
  {
    id: 'matrimony',
    icon: <Heart size={20} />,
    title: 'Matrimony Feature',
    steps: [
      { heading: 'Click "Matrimony" in the top menu', body: 'Click the Matrimony link in the navigation bar. You must be a logged-in active member to use this feature.' },
      { heading: 'Register your profile', body: 'Click "Register Profile" and fill in your details — name, age, education, occupation, family details, and preferences. Upload a recent photo.' },
      { heading: 'View matches', body: 'Once your profile is registered, click "View Matches" to see other registered profiles from the community.' },
      { heading: 'Contact through the office', body: "If you are interested in a profile, contact the Parishat office with the member's ID. The office will facilitate the introduction." },
    ],
    tip: 'This service is for finding alliances within the Niyogi Brahmana community in a safe and respectful way.',
  },
];

const faqs = [
  { q: 'I cannot login — it says "Invalid credentials"', a: 'Check that your mobile number has exactly 10 digits and no spaces. Check your PIN carefully. If it still does not work, contact the Parishat office to have your PIN reset.' },
  { q: 'I forgot my PIN', a: 'Contact the Parishat office. They will reset your PIN to 0000. Login with 0000 and immediately change it to something only you know (see the "Changing Your PIN" section above).' },
  { q: 'My photo is not showing on the ID card', a: 'Go to Edit Profile and upload a photo. After saving, the ID card will update automatically. Then download a fresh copy.' },
  { q: 'The ID card download is not working', a: 'Make sure you are using Chrome or Safari browser. Allow the browser to download files when it asks. Try again after a few seconds.' },
  { q: 'I applied for membership but my account is not active', a: 'Membership applications are reviewed manually by the Parishat office. Please wait 2–3 working days. Contact the office if it has been longer.' },
  { q: 'The page is not loading', a: 'Check your internet connection. Close the browser and open it again. Make sure you typed the address correctly: aaruvela.org' },
  { q: 'I cannot see the Matrimony or News section', a: 'These sections require you to be logged in with an active membership. Make sure you are logged in first.' },
];

// ─── Accordion step card ──────────────────────────────────────────────────────

const SectionCard = ({ section }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            {section.icon}
          </div>
          <span className="font-black text-gray-900 text-[15px]">{section.title}</span>
        </div>
        {open
          ? <ChevronUp size={18} className="text-gray-400 shrink-0" />
          : <ChevronDown size={18} className="text-gray-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <ol className="mt-5 space-y-4">
            {section.steps.map((step, i) => (
              <li key={i} className="flex gap-4">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0 mt-0.5"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {i + 1}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{step.heading}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          {section.tip && (
            <div className="mt-5 flex gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <span className="text-amber-500 text-lg shrink-0">💡</span>
              <p className="text-amber-800 text-sm">{section.tip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── FAQ item ─────────────────────────────────────────────────────────────────

const FaqItem = ({ faq }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left"
      >
        <span className="font-bold text-gray-900 text-sm">{faq.q}</span>
        {open
          ? <ChevronUp size={16} className="text-gray-400 shrink-0 mt-0.5" />
          : <ChevronDown size={16} className="text-gray-400 shrink-0 mt-0.5" />
        }
      </button>
      {open && (
        <p className="text-gray-500 text-sm pb-4 pr-8">{faq.a}</p>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const Help = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-16">

      {/* Hero */}
      <div className="py-12 px-4 text-center text-white" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #0e3d2e 100%)' }}>
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4">
          <HelpCircle size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-black mb-2">Help & Guide</h1>
        <p className="text-white/70 text-sm max-w-md mx-auto">
          Step-by-step instructions for using the Parishat member website
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-10 space-y-10">

        {/* Step-by-step sections */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">How to use the website</h2>
          <div className="space-y-3">
            {sections.map(s => <SectionCard key={s.id} section={s} />)}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Frequently Asked Questions</h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-2">
            {faqs.map((f, i) => <FaqItem key={i} faq={f} />)}
          </div>
        </div>

        {/* Contact card */}
        <div className="rounded-2xl text-white p-7 text-center" style={{ backgroundColor: 'var(--color-primary)' }}>
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-3">
            <PhoneCall size={22} className="text-white" />
          </div>
          <h3 className="font-black text-lg mb-1">Still need help?</h3>
          <p className="text-white/70 text-sm mb-4">Contact the Parishat office and we will assist you.</p>
          <p className="text-sm font-bold leading-relaxed">
            D.No. 48-16-33/7, F-101, Sai Evenue Apartment,<br />
            Kamineni Nagar, Vijayawada – 520 007,<br />
            Andhra Pradesh, India
          </p>
        </div>

      </div>
    </div>
  );
};

export default Help;
