import React from 'react';
import { Calendar, Newspaper, Heart, Users, ArrowRight } from 'lucide-react';
import introImage from '../assets/introduction.jpg';
import ImageGallery from '../components/ImageGallery';
import AdBanner from '../components/AdBanner'; // Import the new AdBanner component

const Home = () => {
    return (
        <div className="flex flex-col min-h-screen">

            {/* Main Content: Image Gallery Carousel */}
            <section className="bg-gray-50 py-6 md:py-12">
                <div className="container mx-auto max-w-6xl px-4">
                    <ImageGallery />
                    <AdBanner />
                </div>
            </section>
        </div>
    );
};

export default Home;
