const fs = require('fs');
const courseData = require('./assets/js/data.js');

function clearContent(obj) {
    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            // Keep specific technical keys
            if (['icon', 'id', 'type', 'color', 'num', 'time', 'targetSlide', 'buttonText', 'unit'].includes(key)) {
                continue;
            }
            // For raw HTML content strings, preserve tags
            if (key === 'content' || obj[key].includes('<div') || obj[key].includes('<h2')) {
                obj[key] = obj[key].replace(/>([^<]*[\u0600-\u06FF]+[^<]*)</g, ">اكتب النص هنا<");
            } else {
                // Clear title, text, subtitle, etc. if they look like arabic content
                if (/[\u0600-\u06FF]/.test(obj[key])) {
                    obj[key] = "اكتب النص هنا";
                }
            }
        } else if (Array.isArray(obj[key])) {
            obj[key].forEach((item, idx) => {
                if (typeof item === 'string') {
                    if (/[\u0600-\u06FF]/.test(item) && !item.includes('<svg')) {
                        obj[key][idx] = "اكتب النص هنا";
                    }
                } else if (typeof item === 'object') {
                    clearContent(item);
                }
            });
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            clearContent(obj[key]);
        }
    }
}

clearContent(courseData);

let newJS = 'const courseData = ' + JSON.stringify(courseData, null, 4) + ';\n\n// Allow use in both browser and Node/React if needed\nif (typeof module !== "undefined" && module.exports) {\n    module.exports = courseData;\n}\n';

fs.writeFileSync('assets/js/data.js', newJS, 'utf8');
console.log('Successfully cleared content while preserving structure!');
