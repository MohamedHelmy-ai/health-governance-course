const fs = require('fs');

let js = fs.readFileSync('assets/js/data.js', 'utf8');
let jsonStr = js.replace('const courseData = ', '').replace(/;\s*$/, '');

let courseData;
try {
    courseData = eval('(' + jsonStr + ')');
} catch (e) {
    console.error("Error evaluating data.js:", e);
    process.exit(1);
}

function clearContent(obj) {
    for (let key in obj) {
        if (typeof obj[key] === 'string') {
            // Keep specific technical keys
            if (['icon', 'id', 'type', 'color', 'num', 'time'].includes(key)) {
                continue;
            }
            // Clear title, text, subtitle, etc. if they look like arabic content
            if (/[\u0600-\u06FF]/.test(obj[key])) {
                obj[key] = "اكتب النص هنا";
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

let newJS = 'const courseData = ' + JSON.stringify(courseData, null, 4) + ';';
fs.writeFileSync('assets/js/data.js', newJS, 'utf8');
console.log('Successfully cleared content!');
