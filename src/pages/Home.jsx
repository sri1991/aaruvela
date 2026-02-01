import React from 'react';
import { Calendar, Newspaper, Heart, Users, ArrowRight } from 'lucide-react';
import introImage from '../assets/introduction.jpg';
import ImageGallery from '../components/ImageGallery';

const Home = () => {
    return (
        <div className="flex flex-col min-h-screen">

            {/* Main Content: Image Gallery Carousel */}
            <section className="bg-gray-50 py-12">
                <div className="container mx-auto max-w-6xl">
                    <ImageGallery />
                </div>
            </section>
        </div>
    );
};

export default Home;
