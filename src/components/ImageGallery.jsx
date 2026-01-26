import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

const ImageGallery = () => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Dynamically load images from src/assets/carousel
    // Eager load ensures they are bundled
    const imageModules = import.meta.glob('../assets/carousel/*.{png,jpg,jpeg,webp,svg}', { eager: true });

    const images = Object.values(imageModules).map((mod, index) => ({
        id: index,
        src: mod.default,
        alt: `Gallery Image ${index + 1}`
    }));

    const openLightbox = (index) => {
        setCurrentIndex(index);
        setLightboxOpen(true);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!lightboxOpen) return;
            if (e.key === 'ArrowRight') setCurrentIndex((prev) => (prev + 1) % images.length);
            if (e.key === 'ArrowLeft') setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
            if (e.key === 'Escape') setLightboxOpen(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxOpen, images.length]);

    if (images.length === 0) {
        return (
            <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                <p className="text-gray-500">No images found in gallery.</p>
                <p className="text-xs text-gray-400 mt-1">Add images to src/assets/carousel folder</p>
            </div>
        );
    }

    return (
        <div className="w-full py-2">
            <div className="flex items-center gap-2 mb-6 px-4">
                <div className="h-8 w-1 bg-[var(--color-primary)] rounded-full"></div>
                <h2 className="text-2xl font-bold text-gray-800">Gallery</h2>
            </div>

            <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
                effect={'coverflow'}
                grabCursor={true}
                centeredSlides={true}
                loop={images.length > 2}
                slidesPerView={'auto'}
                coverflowEffect={{
                    rotate: 0,
                    stretch: 0,
                    depth: 100,
                    modifier: 2.5,
                    slideShadows: false,
                }}
                autoplay={{
                    delay: 3000,
                    disableOnInteraction: false,
                }}
                pagination={{ el: '.swiper-pagination', clickable: true }}
                navigation={{
                    nextEl: '.gallery-next',
                    prevEl: '.gallery-prev',
                    clickable: true,
                }}
                className="swiper_container !pb-12 !px-4"
                breakpoints={{
                    640: {
                        slidesPerView: 2,
                    },
                    768: {
                        slidesPerView: 3,
                    },
                    1024: {
                        slidesPerView: 3,
                    }
                }}
            >
                {images.map((img, index) => (
                    <SwiperSlide key={img.id} className="!w-[300px] !h-[250px] relative group rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-white">
                        <img
                            src={img.src}
                            alt={img.alt}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                            onClick={() => openLightbox(index)}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <ZoomIn className="text-white w-10 h-10 drop-shadow-md" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                            Click to view
                        </div>
                    </SwiperSlide>
                ))}

                <div className="slider-controler mt-8 relative flex items-center justify-center gap-6">
                    <div className="gallery-prev cursor-pointer text-[var(--color-primary)] bg-white p-3 rounded-full shadow-md hover:bg-gray-50 transition-all hover:scale-110 active:scale-95 flex items-center justify-center w-12 h-12 border border-gray-100">
                        <ChevronLeft size={24} />
                    </div>
                    <div className="swiper-pagination !static !w-auto"></div>
                    <div className="gallery-next cursor-pointer text-[var(--color-primary)] bg-white p-3 rounded-full shadow-md hover:bg-gray-50 transition-all hover:scale-110 active:scale-95 flex items-center justify-center w-12 h-12 border border-gray-100">
                        <ChevronRight size={24} />
                    </div>
                </div>
            </Swiper>

            {/* Lightbox Modal */}
            {lightboxOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200">

                    {/* Close Button */}
                    <button
                        onClick={() => setLightboxOpen(false)}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors bg-white/10 p-2 rounded-full cursor-pointer z-[102]"
                    >
                        <X size={32} />
                    </button>

                    {/* Left Navigation Button */}
                    <button
                        onClick={handlePrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 p-3 rounded-full cursor-pointer z-[102] hidden md:block"
                    >
                        <ChevronLeft size={40} />
                    </button>

                    {/* Right Navigation Button */}
                    <button
                        onClick={handleNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-white/10 hover:bg-white/20 p-3 rounded-full cursor-pointer z-[102] hidden md:block"
                    >
                        <ChevronRight size={40} />
                    </button>

                    <div className="relative w-full max-w-5xl h-full flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
                        <img
                            src={images[currentIndex].src}
                            alt="Enlarged view"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
                        />

                        {/* Mobile Navigation Controls (Bottom) */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8 md:hidden z-[102]" onClick={(e) => e.stopPropagation()}>
                            <button onClick={handlePrev} className="bg-white/20 p-3 rounded-full text-white backdrop-blur-sm active:bg-white/30">
                                <ChevronLeft size={32} />
                            </button>
                            <button onClick={handleNext} className="bg-white/20 p-3 rounded-full text-white backdrop-blur-sm active:bg-white/30">
                                <ChevronRight size={32} />
                            </button>
                        </div>
                    </div>

                    {/* Image Counter */}
                    <div className="absolute top-4 left-4 text-white/50 font-medium z-[101]">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageGallery;
