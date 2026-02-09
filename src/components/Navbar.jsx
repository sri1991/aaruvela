import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Globe, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';

const Navbar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const { user, signOut } = useAuth();

    // Hidden items as per user request (Membership, Services, Donations, Contact, FAQ)
    const navItems = [
        { name: 'Home', path: '/', icon: <Home size={16} /> },
        { name: 'About Us', path: '/about' },
        { name: 'Administration', path: '/administration' },
        // { name: 'Membership', path: '/membership' },
        // { name: 'Services', path: '/services' },
        // { name: 'Magazine', path: '/magazine' },
        // { name: 'Donations', path: '/donations' },
        // { name: 'Contact', path: '/contact' },
        // { name: 'FAQ', path: '/faq' },
    ];

    return (
        <nav className="bg-[var(--color-secondary)] text-white shadow-lg sticky top-0 z-50 border-b border-white/10">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-14">

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-[var(--color-secondary-dark)] transition-colors focus:outline-none"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1 lg:space-x-2 text-sm font-medium overflow-x-auto no-scrollbar mask-gradient w-full">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                to={item.path}
                                className="hover:bg-white/20 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap flex items-center gap-2 hover:-translate-y-0.5"
                            >
                                {item.icon && <span className="opacity-80">{item.icon}</span>}
                                {item.name}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side Actions */}
                    <div className="hidden md:flex items-center space-x-4 pl-4 border-l border-white/20 ml-2">
                        <div className="flex items-center gap-2 text-xs bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
                            <Globe size={14} className="text-yellow-300" />
                            <button className="hover:text-yellow-200 font-bold transition-colors">Tel</button>
                            <span className="opacity-50">/</span>
                            <button className="hover:text-yellow-200 font-bold transition-colors">Eng</button>
                        </div>
                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    to={user.role === 'HEAD' ? '/admin' : '/dashboard'}
                                    className="text-xs font-bold hover:text-yellow-400 transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={async () => {
                                        await signOut();
                                        navigate('/auth');
                                        setIsOpen(false);
                                    }}
                                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 transition-all"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/auth"
                                className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95"
                            >
                                <LogIn size={14} />
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isOpen && (
                <div className="md:hidden bg-[var(--color-secondary-dark)] border-t border-white/10 pb-4 px-4 pt-2 space-y-2 shadow-inner">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            className="block hover:bg-white/10 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            {item.icon && <span className="opacity-70">{item.icon}</span>}
                            {item.name}
                        </Link>
                    ))}
                    <div className="border-t border-white/10 pt-4 mt-2 flex flex-col gap-3">
                        <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg">
                            <span className="text-sm flex items-center gap-2"><Globe size={16} /> Language</span>
                            <div className="flex gap-2 text-sm font-bold">
                                <span>Tel</span> / <span>Eng</span>
                            </div>
                        </div>
                        {user ? (
                            <>
                                <Link
                                    to={user.role === 'HEAD' ? '/admin' : '/dashboard'}
                                    className="w-full text-center bg-white/10 hover:bg-white/20 py-3 rounded-lg text-sm font-bold text-white border border-white/20 block transition-all"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Go to Dashboard
                                </Link>
                                <button
                                    onClick={async () => {
                                        await signOut();
                                        navigate('/auth');
                                        setIsOpen(false);
                                    }}
                                    className="w-full text-center bg-red-500/20 hover:bg-red-500/30 py-3 rounded-lg text-sm font-bold text-red-100 border border-red-500/30 block transition-all"
                                >
                                    Log Out
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/auth"
                                className="w-full text-center bg-yellow-500 hover:bg-yellow-600 py-3 rounded-lg text-sm font-bold text-white shadow-md block transition-all"
                                onClick={() => setIsOpen(false)}
                            >
                                Login / Register
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
