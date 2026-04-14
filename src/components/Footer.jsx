import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-primary-dark text-white py-6 mt-auto">
            <div className="container mx-auto px-4 text-center space-y-2">
                <p className="text-sm">
                    &copy; {new Date().getFullYear()} Aaruvela Niyogi Brahmana Seva Parishat. All rights reserved. 
                    <span className="block sm:inline sm:ml-2 text-secondary-light">
                        Built by MSB digital labs and consulting
                    </span>
                </p>
                <div className="text-xs text-secondary-light space-x-4">
                    <Link to="/disclaimer" className="hover:underline">Disclaimer</Link>
                    <a href="#" className="hover:underline">Privacy Policy</a>
                    <a href="#" className="hover:underline">Terms of Service</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
