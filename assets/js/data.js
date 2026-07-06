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
        audio: "assets/audio/slide2_v4.mp3",
        videoSrc: "assets/video/slide2_v4.mp4",
        imageSrc: "assets/images/2.1.png",
        timeIn: 5,
        timeOut: 10,
        text: "هيكل تنظيمي يوزع الصلاحيات بين مستويات الإدارة لضمان الشفافية والمساءلة.",
        duration: 50
    }
    ,{
        id: "S03_WARNING",
        type: "quality-warning",
        title: "تحذير الجودة",
        text: "عدم التزام 30% من الأطباء بسياسة توثيق تقارير الخروج",
        audio: "assets/audio/slide3_v4.mp3",
        duration: 50
    }
];

// Allow use in both browser and Node/React if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = courseData;
}
