import React from 'react';
import Header from './Header';
import Navbar from './Navbar';
import Footer from './Footer';
import StickyAdBar from './StickyAdBar';
import { Outlet, useLocation } from 'react-router-dom';

// No ads while managing the site or signing in.
const AD_FREE_PREFIXES = ['/admin', '/auth'];

const Layout = () => {
    const { pathname } = useLocation();
    const showAdBar = !AD_FREE_PREFIXES.some(prefix => pathname.startsWith(prefix));

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <Header />
            <Navbar />
            <main className="flex-grow w-full">
                <Outlet />
            </main>
            <Footer />
            {showAdBar && <StickyAdBar />}
        </div>
    );
};

export default Layout;
