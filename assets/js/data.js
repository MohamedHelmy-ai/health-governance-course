const courseData = [
    {
        id: "S01_INTRO",
        type: "splash",
        unit: "الوحدة الأولى",
        title: "الحوكمة والامتثال",
        buttonText: "ابدأ",
        duration: 5
    },
    {
        id: "S02_MEDIA",
        type: "media-split",
        title: "هيكل تنظيمي",
        audio: "assets/video/slide2.mp4",
        videoSrc: "assets/video/slide2.mp4",
        imageSrc: "assets/images/2.1.png",
        text: "هيكل تنظيمي يوزع الصلاحيات بين مستويات الإدارة لضمان الشفافية والمساءلة.",
        duration: 15
    }
];

// Allow use in both browser and Node/React if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = courseData;
}
