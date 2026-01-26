import React from 'react';
import bannerImage from '../assets/header-banner-main.png';

const Header = () => {
    return (
        <header className="bg-white shadow-md">
            <div className="w-full">
                {/* Full width responsive banner */}
                <img
                    src={bannerImage}
                    alt="Aaruvela Niyogi Brahmana Seva Parishat Banner"
                    className="w-full h-auto object-cover md:object-contain max-h-[250px] md:max-h-[350px] mx-auto"
                />
            </div>
        </header>
    );
};

export default Header;
