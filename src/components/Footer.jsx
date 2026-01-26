import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-primary-dark text-white py-6 mt-auto">
            <div className="container mx-auto px-4 text-center space-y-2">
                <p className="text-sm">&copy; {new Date().getFullYear()} Aaruvela Niyogi Brahmana Seva Parishat. All rights reserved.</p>
                <div className="text-xs text-secondary-light space-x-4">
                    <a href="#" className="hover:underline">Privacy Policy</a>
                    <a href="#" className="hover:underline">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
