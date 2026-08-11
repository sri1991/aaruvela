import React from 'react';
import ImageGallery from '../components/ImageGallery';
import AnnouncementStrip from '../components/AnnouncementStrip';
import AdSlot from '../components/AdSlot';

const Home = () => {
    return (
        <div className="flex flex-col min-h-screen">

            {/* Main Content: Announcements + Image Gallery Carousel */}
            <section className="bg-gray-50 py-6 md:py-12">
                <div className="container mx-auto max-w-6xl px-4">
                    <AnnouncementStrip />
                    <ImageGallery />
                    <AdSlot placement="HOME_BANNER" />
                </div>
            </section>
        </div>
    );
};

export default Home;
