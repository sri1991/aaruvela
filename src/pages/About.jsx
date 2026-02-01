import React from 'react';
import introImage from '../assets/introduction.jpg';

const About = () => {
    return (
        <div className="min-h-screen bg-white">
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
        </div>
    );
};

export default About;
