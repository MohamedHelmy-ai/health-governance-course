const courseData = [
    {
        id: "S01_INTRO",
        type: "splash",
        unit: "الوحدة الأولى",
        title: "الحوكمة والامتثال",
        buttonText: "ابدأ",
        duration: 5
    }
];

// Allow use in both browser and Node/React if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = courseData;
}
