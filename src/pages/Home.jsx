import React from 'react';
import { Calendar, Newspaper, Heart, Users, ArrowRight } from 'lucide-react';
import introImage from '../assets/introduction.jpg';
import ImageGallery from '../components/ImageGallery';

const Home = () => {
    return (
        <div className="flex flex-col min-h-screen">

            {/* Introduction Section (Telugu Content as Image) */}
            <section className="bg-white py-8 px-4 border-b border-gray-100">
                <div className="container mx-auto max-w-4xl">
                    <div className="bg-orange-50 border-l-4 border-orange-400 p-2 md:p-4 rounded-r-xl shadow-sm overflow-hidden">

                        <img
                            src={introImage}
                            alt="Introduction to Aaruvela Niyogi Brahmana Seva Parishat"
                            className="w-full h-auto rounded-lg shadow-sm"
                        />
                    </div>
                </div>
            </section>

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
