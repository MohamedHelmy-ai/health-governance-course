document.addEventListener('DOMContentLoaded', () => {
    let currentSlideIndex = 0;
    // Initialize SCORM
    if (typeof SCORM !== 'undefined' && SCORM.init()) {
        // Set initial status to prevent "failed" by default on SCORM Cloud
        const completionStatus = SCORM.getValue("cmi.completion_status");
        if (completionStatus === "unknown" || completionStatus === "not attempted") {
            SCORM.setValue("cmi.completion_status", "incomplete");
            SCORM.setValue("cmi.success_status", "unknown");
            SCORM.commit();
        }
        
        const savedLocation = SCORM.getValue("cmi.location");
        if (savedLocation && !isNaN(parseInt(savedLocation))) {
            currentSlideIndex = parseInt(savedLocation);
            if (currentSlideIndex >= courseData.length || currentSlideIndex < 0) {
                currentSlideIndex = 0;
            }
        }
    }

    // Terminate SCORM on close
    window.addEventListener("beforeunload", () => {
        if (typeof SCORM !== 'undefined') {
            if (currentSlideIndex < courseData.length - 1) {
                SCORM.setValue("cmi.exit", "suspend");
            } else {
                SCORM.setValue("cmi.exit", "normal");
            }
            SCORM.commit();
            SCORM.terminate();
        }
    });

    const totalSlides = courseData.length;
    
    // DOM Elements
    const slideContainer = document.getElementById('slide-container');

    // Scale to fit logic
    function scaleSlide() {
        const app = document.getElementById('app');
        const player = document.getElementById('player-wrapper');
        if (!app || !player) return;
        
        const availableWidth = app.clientWidth;
        const availableHeight = app.clientHeight;
        
        // Total height is roughly 70 (header) + 720 (slide) + 40 (footer) = 830
        const playerWidth = 1300; 
        const playerHeight = 830;
        
        const scaleX = availableWidth / playerWidth;
        const scaleY = availableHeight / playerHeight;
        const scale = Math.min(scaleX, scaleY) * 0.98; // 2% padding
        
        player.style.transform = `scale(${scale})`;
    }
    window.addEventListener('resize', scaleSlide);
    const btnNext = document.getElementById('btnNext');
    const btnPrev = document.getElementById('btnPrev');
    const btnPlayPause = document.getElementById('btnPlayPause');
    const playText = document.getElementById('play-text');
    const btnMute = document.getElementById('btnMute');
    const progressFill = document.getElementById('progress-fill');
    const audioPlayer = document.getElementById('course-audio');
    const btnHome = document.getElementById('btnHome');
    const btnReplay = document.getElementById('btnReplay');
    
    // State
    let currentTimeline = null;

    function getNextLinearIndex(currentIndex) {
        for (let i = currentIndex + 1; i < courseData.length; i++) {
            if (!courseData[i].isBranch) return i;
        }
        return -1;
    }

    function getPrevLinearIndex(currentIndex) {
        for (let i = currentIndex - 1; i >= 0; i--) {
            if (!courseData[i].isBranch) return i;
        }
        return -1;
    }

    // Initialize UI
    function init() {
        renderSlide(currentSlideIndex);
        updateNavButtons();

        btnNext.addEventListener('click', () => {
            const nextIdx = getNextLinearIndex(currentSlideIndex);
            if (nextIdx !== -1) {
                currentSlideIndex = nextIdx;
                renderSlide(currentSlideIndex);
                updateNavButtons();
            }
        });

        btnPrev.addEventListener('click', () => {
            if (window.returnSlideIndex !== undefined && window.returnSlideIndex !== null) {
                window.goBackToMenu();
            } else {
                const prevIdx = getPrevLinearIndex(currentSlideIndex);
                if (prevIdx !== -1) {
                    currentSlideIndex = prevIdx;
                    renderSlide(currentSlideIndex);
                    updateNavButtons();
                }
            }
        });


        btnPlayPause.addEventListener('click', togglePlay);
        btnMute.addEventListener('click', toggleMute);
        
        const progressWrapper = document.querySelector('.progress-wrapper');
        if (progressWrapper) {
            progressWrapper.style.cursor = 'pointer';
            progressWrapper.addEventListener('click', (e) => {
                if (audioPlayer && audioPlayer.duration && !isNaN(audioPlayer.duration)) {
                    const rect = progressWrapper.getBoundingClientRect();
                    // In RTL, the progress starts from the right edge
                    const clickX = rect.right - e.clientX;
                    let percentage = clickX / rect.width;
                    percentage = Math.max(0, Math.min(1, percentage));
                    audioPlayer.currentTime = percentage * audioPlayer.duration;
                }
            });
        }

        
        if (btnHome) {
            btnHome.addEventListener('click', () => {
                if (currentSlideIndex !== 0) {
                    currentSlideIndex = 0;
                    renderSlide(currentSlideIndex);
                    updateNavButtons();
                }
            });
        }
        
        if (btnReplay) {
            btnReplay.addEventListener('click', () => {
                audioPlayer.currentTime = 0;
                audioPlayer.play().catch(e => console.log("Replay blocked:", e));
            });
        }
        
        // Audio event listeners
        audioPlayer.addEventListener('play', () => updatePlayUI(true));
        audioPlayer.addEventListener('pause', () => updatePlayUI(false));
        audioPlayer.addEventListener('ended', () => {
            updatePlayUI(false);
            if (currentSlideIndex < totalSlides - 1) {
                // Optional: Auto-advance to next slide
                // btnNext.click();
            }
        });
        
        audioPlayer.addEventListener('timeupdate', () => {
            if (currentTimeline && audioPlayer.duration) {
                // Sync GSAP to audio time
                currentTimeline.seek(audioPlayer.currentTime);
                
                // Update progress bar
                let p = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressFill.style.width = `${p}%`;
            }
        });
    }

    function updateNavButtons() {
        const slide = courseData[currentSlideIndex];
        const pageTotal = document.querySelector('.ch-pagination');
        
        if (slide.type === "splash") {
            btnNext.style.visibility = 'hidden';
            btnPrev.style.visibility = 'hidden';
            if (pageTotal) pageTotal.style.visibility = 'hidden';
            return;
        } else {
            if (pageTotal) pageTotal.style.visibility = 'visible';
        }
        
        if (slide.isBranch) {
            btnNext.style.visibility = 'hidden';
            btnPrev.style.visibility = 'visible';
            btnPrev.disabled = false; // Always enabled to go back
            
            // Optionally update pagination text
            const pageTotal = document.querySelector('.ch-pagination');
            if(pageTotal) pageTotal.style.opacity = '0';
        } else {
            btnNext.style.visibility = 'visible';
            btnPrev.style.visibility = 'visible';
            
            const pageTotal = document.querySelector('.ch-pagination');
            if(pageTotal) {
                pageTotal.style.opacity = '1';
                // Calculate linear slides only
                const linearSlides = courseData.filter(s => !s.isBranch);
                const currentLinear = courseData.slice(0, currentSlideIndex + 1).filter(s => !s.isBranch).length;
                pageTotal.innerHTML = `<span style="display:inline-block;direction:ltr">${currentLinear}/${linearSlides.length}</span>`;
            }
            
            const nextIdx = getNextLinearIndex(currentSlideIndex);
            const prevIdx = getPrevLinearIndex(currentSlideIndex);
            
            btnPrev.disabled = (prevIdx === -1);
            
            // Gating logic: force completion before Next
            if (slide.id === "S06_CONFLICT") {
                let allVisited = true;
                if (slide.cards) {
                    for (let i=0; i<slide.cards.length; i++) {
                        if (!window.visitedCards || !window.visitedCards[`S06_CONFLICT_${i}`]) {
                            allVisited = false;
                            break;
                        }
                    }
                }
                btnNext.disabled = !allVisited || (nextIdx === -1);
                btnNext.style.opacity = (!allVisited || nextIdx === -1) ? '0.5' : '1';
                btnNext.style.cursor = (!allVisited || nextIdx === -1) ? 'not-allowed' : 'pointer';
            } else {
                btnNext.disabled = (nextIdx === -1);
                btnNext.style.opacity = (nextIdx === -1) ? '0.5' : '1';
                btnNext.style.cursor = (nextIdx === -1) ? 'not-allowed' : 'pointer';
            }
        }
    }

    function togglePlay() {
        if (audioPlayer.paused) {
            const playPromise = audioPlayer.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log("Audio play blocked or missing:", e);
                    // Fallback: play timeline directly if no audio
                    if (currentTimeline) {
                        currentTimeline.play();
                        updatePlayUI(true);
                        
                        // Fake progress bar for missing audio (assume 30s)
                        gsap.to(progressFill, {width: '100%', duration: 30, ease: 'none'});
                    }
                });
            }
        } else {
            audioPlayer.pause();
            if (currentTimeline) {
                currentTimeline.pause();
                gsap.killTweensOf(progressFill);
            }
        }
    }

    function updatePlayUI(playing) {
        const iconPlay = document.getElementById('icon-play');
        const iconPause = document.getElementById('icon-pause');
        
        if (playing) {
            iconPlay.style.display = 'none';
            iconPause.style.display = 'block';
        } else {
            iconPlay.style.display = 'block';
            iconPause.style.display = 'none';
        }
    }

    function toggleMute() {
        audioPlayer.muted = !audioPlayer.muted;
        btnMute.style.opacity = audioPlayer.muted ? 0.5 : 1;
    }

    // Render engine
    function renderSlide(index) {
        const slide = courseData[index];
        slideContainer.innerHTML = ''; 
        
        // Hide footer on splash screens
        const footer = document.querySelector('.course-footer');
        const header = document.querySelector('.custom-header');
        
        let scaleVal = 1.0;
        if (slide.type === 'framework-split') scaleVal = 0.85;
        else if (slide.type === 'three-pillars-flow') scaleVal = 0.95;
        
        if (slide.type === 'splash') {
            slideDiv.innerHTML = html;
        } else if (scaleVal !== 1.0) {
            slideDiv.innerHTML = `<div class="smart-scaler" style="transform: scale(${scaleVal}); transform-origin: center center; width: 100%;">${html}</div>`;
        } else {
            slideDiv.innerHTML = `<div class="smart-scaler" style="width: 100%;">${html}</div>`;
        }

        slideContainer.appendChild(slideDiv);
        
        // Apply dynamic background
        if (slide.type === 'splash') {
            slideDiv.style.backgroundImage = "url('assets/images/intro.png')";
        } else {
            slideDiv.style.backgroundImage = "url('assets/images/bg.png')";
        }
        
        scaleSlide();
        bindInteractions(slide, index);
        buildTimeline(slide, slideDiv);
        
        // Virtual Presenter Logic
        const vp = document.getElementById('virtual-presenter');
        if (vp) {
            if (slide.type === 'splash' || slide.id === 'S05_ACTIVITY') {
                vp.classList.add('hidden');
                // stop animation if any
                gsap.killTweensOf(vp);
            } else {
                vp.classList.remove('hidden');
                // Reset position
                gsap.set(vp, { y: 100, opacity: 0 });
                // Animate in
                gsap.to(vp, { 
                    y: 0, 
                    opacity: 1, 
                    duration: 1, 
                    ease: "power2.out",
                    onComplete: () => {
                        // Floating idle animation
                        gsap.to(vp, {
                            y: 10,
                            duration: 2,
                            repeat: -1,
                            yoyo: true,
                            ease: "sine.inOut"
                        });
                    }
                });
            }
        }
        
        // SCORM Progress Tracking
        if (typeof SCORM !== 'undefined') {
            SCORM.setValue("cmi.location", index.toString());
            if (index === courseData.length - 1) {
                SCORM.setValue("cmi.completion_status", "completed");
                SCORM.setValue("cmi.success_status", "passed");
            }
            SCORM.commit();
        }
    }

    function bindInteractions(slide, index) {
        if (slide.type === 'tabs') {
            const btns = document.querySelectorAll('.tab-btn');
            btns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    const targetId = e.target.getAttribute('data-target');
                    document.querySelectorAll('.tab-content p').forEach(p => p.style.display = 'none');
                    const t = document.getElementById(targetId);
                    t.style.display = 'block';
                    gsap.fromTo(t, {opacity: 0, y: 10}, {opacity:1, y:0, duration: 0.3});
                });
            });
        }
        
        if (slide.type === 'quiz') {
            const btns = document.querySelectorAll(`#quiz-${index} .quiz-btn`);
            const feedback = document.getElementById(`feedback-${index}`);
            btns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    btns.forEach(b => b.disabled = true);
                    const isCorrect = e.target.getAttribute('data-correct') === 'true';
                    const msg = e.target.getAttribute('data-feedback');
                    e.target.classList.add(isCorrect ? 'correct' : 'incorrect');
                    feedback.textContent = msg;
                    feedback.className = `feedback-msg ${isCorrect ? 'correct' : 'incorrect'}`;
                    feedback.style.display = 'block';
                    gsap.from(feedback, {opacity: 0, scale: 0.95, duration: 0.3, ease: "back.out(1.7)"});
                });
            });
        }
    }

    // Build GSAP Timeline based on data.js timestamps
    function buildTimeline(slide, container) {
        currentTimeline = gsap.timeline({ paused: true });
        
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        if (slide.type === 'splash') {
            gsap.fromTo(container.querySelector('.gs-title'), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
            gsap.fromTo(container.querySelector('.gs-btn'), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)", delay: 0.3 });
            return; // Don't auto-play splash until user clicks start
        }

        // Common title animation
        const title = container.querySelector('.gs-title');
        if (title && !prefersReducedMotion) {
            currentTimeline.fromTo(title, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0);
        } else if (title) {
            gsap.set(title, {opacity: 1});
        }

        // Custom Objectives Logic
        if (slide.type === 'custom-objectives') {
            const target = container.querySelector('.gs-target');
            if(!prefersReducedMotion) currentTimeline.fromTo(target, { opacity: 0, scale: 0.8, rotation: -45 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(1.2)" }, 0.2);
            else gsap.set(target, {opacity:1});
            
            slide.items.forEach(item => {
                const row = container.querySelector(`#obj-${item.id}`);
                if(row) {
                    if(!prefersReducedMotion) {
                        currentTimeline.fromTo(row, { opacity: 0, x: -30 }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }, item.time);
                    } else {
                        currentTimeline.set(row, {opacity: 1}, item.time);
                    }
                }
            });
        }
        
        // Custom Visual Definition Logic
        else if (slide.type === 'custom-visual-def') {
            const caption = container.querySelector('.gs-caption');
            if(caption) {
                if(!prefersReducedMotion) currentTimeline.fromTo(caption, {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease: "power2.out"}, slide.timeCaption);
                else currentTimeline.set(caption, {opacity:1}, slide.timeCaption);
            }
            
            slide.images.forEach(img => {
                const node = container.querySelector(`#${img.id}`);
                if(node) {
                    if(!prefersReducedMotion) {
                        currentTimeline.fromTo(node, { opacity: 0, scale: 0.8, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.2)" }, img.time);
                    } else {
                        currentTimeline.set(node, {opacity:1}, img.time);
                    }
                }
            });
        }
        
        // Framework Split Logic
        else if (slide.type === 'framework-split') {
            if (!prefersReducedMotion) {
                // Intro Title - "إطار الحوكمة الفعال" at 0.5s
                currentTimeline.fromTo(container.querySelector('.gs-fw-title'), { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }, 0.07);
                
                // Right Panel Appears - "مجلس الإدارة" starts at 2.0s
                currentTimeline.fromTo(container.querySelector('#fw-panel-right'), {opacity: 0, y: 30}, {opacity: 1, y: 0, duration: 0.6, ease:"power2.out"}, 0.22);
                currentTimeline.fromTo(container.querySelectorAll('#fw-panel-right .gs-fw-icon'), {opacity: 0, scale: 0}, {opacity: 1, scale: 1, duration: 0.4, ease:"back.out(1.5)"}, 0.27);
                
                // Draw dotted line for Right Panel
                currentTimeline.to(container.querySelector('.fw-r-line'), {scaleY: 1, duration: 2, ease:"none"}, 0.30);
                
                // Right items precise timings
                const rItems = container.querySelectorAll('.gs-fw-r-item');
                if(rItems.length >= 5) {
                    currentTimeline.fromTo(rItems[0], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 0.31); // مجلس الإدارة
                    currentTimeline.fromTo(rItems[1], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 0.72); // واللجان المتخصصة
                    currentTimeline.fromTo(rItems[2], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 1.23); // ومصفوفة الصلاحيات
                    currentTimeline.fromTo(rItems[3], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 1.84); // والسياسات
                    currentTimeline.fromTo(rItems[4], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 2.12); // والإجراءات
                }
                
                // Show illustration (Clipboard and Shield) - after right panel is done
                currentTimeline.fromTo(container.querySelector('.gs-fw-illustration'), {opacity: 0, scale:0.5, rotation:-15}, {opacity: 1, scale:1, rotation:0, duration: 0.6, ease:"back.out(1.5)"}, 2.40);

                // Left Panel Appears - "مجموعة من الخطوات" at 22.4s
                currentTimeline.fromTo(container.querySelector('#fw-panel-left'), {opacity: 0, y: 30}, {opacity: 1, y: 0, duration: 0.6, ease:"power2.out"}, 3.15);
                currentTimeline.fromTo(container.querySelectorAll('#fw-panel-left .gs-fw-icon'), {opacity: 0, scale: 0}, {opacity: 1, scale: 1, duration: 0.4, ease:"back.out(1.5)"}, 3.23);
                
                // Draw dotted line for Left Panel
                currentTimeline.to(container.querySelector('.fw-l-line'), {scaleY: 1, duration: 2, ease:"none"}, 3.30);
                
                // Left items precise timings
                const lItems = container.querySelectorAll('.gs-fw-l-item');
                if(lItems.length >= 6) {
                    currentTimeline.fromTo(lItems[0], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 3.77); // بتحديد القيم والأهداف
                    currentTimeline.fromTo(lItems[1], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 4.18); // وضع السياسات وآليات الامتثال
                    currentTimeline.fromTo(lItems[2], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 4.88); // تصميم هياكل
                    currentTimeline.fromTo(lItems[3], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 5.44); // البيانات الصحية
                    currentTimeline.fromTo(lItems[4], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 5.93); // وإدارة الموارد البشرية
                    currentTimeline.fromTo(lItems[5], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 6.76); // بالتطبيق العملي
                }
                
                // Footer Appears - "وعند تكامل هذه المكونات" at 52.26s
                currentTimeline.to(container.querySelector('.gs-fw-footer'), {opacity: 1, y: 0, duration: 0.6, ease:"power2.out"}, 7.80);
                
                // Footer items precise timings
                const fItems = container.querySelectorAll('.gs-fw-f-item');
                if(fItems.length >= 4) {
                    currentTimeline.to(fItems[0], {opacity: 1, x: 0, duration: 0.5, ease:"power2.out"}, 7.95); 
                    currentTimeline.to(fItems[1], {opacity: 1, x: 0, duration: 0.5, ease:"power2.out"}, 8.17); 
                    currentTimeline.to(fItems[2], {opacity: 1, x: 0, duration: 0.5, ease:"power2.out"}, 8.40); 
                    currentTimeline.to(fItems[3], {opacity: 1, x: 0, duration: 0.5, ease:"power2.out"}, 8.66); // وترتفع جودة الأداء المؤسسي
                }

            } else {
                currentTimeline.set(container.querySelectorAll('*'), {opacity: 1, x:0, y:0, scale:1, scaleY:1}, 0.00);
            }
        }

        // Three Pillars Flow GSAP Logic
        else if (slide.type === 'three-pillars-flow') {
            if (!prefersReducedMotion) {
                // Title
                currentTimeline.fromTo(container.querySelector('.gs-title'), { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.1);
                
                const pillars = container.querySelectorAll('.gs-pillar');
                
                // Pillar 1 (Governance)
                currentTimeline.to(pillars[0], { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.2)" }, 2.5);
                currentTimeline.to(container.querySelector('.gs-gov-svg'), { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" }, 2.8);
                const p1Items = pillars[0].querySelectorAll('.gs-p-item');
                if(p1Items.length === 5) {
                    currentTimeline.to(p1Items[0], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 6.0);
                    currentTimeline.to(p1Items[1], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 7.5);
                    currentTimeline.to(p1Items[2], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 9.0);
                    currentTimeline.to(p1Items[3], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 10.4);
                    currentTimeline.to(p1Items[4], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 11.5);
                }

                // Pillar 2 (Compliance)
                currentTimeline.to(pillars[1], { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.2)" }, 12.5);
                currentTimeline.to(container.querySelector('.gs-comp-svg'), { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" }, 13.0);
                const p2Items = pillars[1].querySelectorAll('.gs-p-item');
                if(p2Items.length === 5) {
                    currentTimeline.to(p2Items[0], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 15.4);
                    currentTimeline.to(p2Items[1], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 18.5);
                    currentTimeline.to(p2Items[2], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 20.4);
                    currentTimeline.to(p2Items[3], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 23.1);
                    currentTimeline.to(p2Items[4], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 25.5);
                }

                // Pillar 3 (Integration)
                currentTimeline.to(pillars[2], { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.2)" }, 27.5);
                currentTimeline.to(container.querySelector('.gs-int-svg'), { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)", rotation: 360 }, 27.8);
                const p3Items = pillars[2].querySelectorAll('.gs-p-item');
                if(p3Items.length === 5) {
                    currentTimeline.to(p3Items[0], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 28.5);
                    currentTimeline.to(p3Items[1], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 29.5);
                    currentTimeline.to(p3Items[2], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 30.7);
                    currentTimeline.to(p3Items[3], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 31.8);
                    currentTimeline.to(p3Items[4], { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }, 33.8);
                }

                // Footer Flow
                currentTimeline.to(container.querySelector('.gs-flow'), { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 35.0);
                
                const flowItems = container.querySelectorAll('.gs-flow-item');
                const flowArrows = container.querySelectorAll('.gs-flow-arrow');
                
                if (flowItems.length >= 5) {
                    currentTimeline.to(flowItems[0], { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 35.5);
                    if(flowArrows[0]) currentTimeline.to(flowArrows[0], { opacity: 1, x: -10, duration: 0.3, yoyo: true, repeat: 1 }, 35.8);
                    
                    currentTimeline.to(flowItems[1], { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 36.2);
                    if(flowArrows[1]) currentTimeline.to(flowArrows[1], { opacity: 1, x: -10, duration: 0.3, yoyo: true, repeat: 1 }, 36.5);
                    
                    currentTimeline.to(flowItems[2], { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 37.0);
                    if(flowArrows[2]) currentTimeline.to(flowArrows[2], { opacity: 1, x: -10, duration: 0.3, yoyo: true, repeat: 1 }, 37.3);
                    
                    currentTimeline.to(flowItems[3], { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 37.8);
                    if(flowArrows[3]) currentTimeline.to(flowArrows[3], { opacity: 1, x: -10, duration: 0.3, yoyo: true, repeat: 1 }, 38.1);
                    
                    currentTimeline.to(flowItems[4], { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 38.5);
                }

            } else {
                currentTimeline.set(container.querySelectorAll('*'), {opacity: 1, x:0, y:0, scale:1, scaleY:1}, 0);
            }
        }


        // Scenario Activity GSAP Logic
        else if (slide.type === 'scenario-activity') {
            if (!prefersReducedMotion) {
                // Title
                currentTimeline.fromTo(container.querySelector('.gs-title'), { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.14);
                
                // Scenario Box
                currentTimeline.to(container.querySelector('.gs-scen-box'), { opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.2)" }, 6.5);
                
                // Center Circle
                currentTimeline.to(container.querySelector('.gs-center'), { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.5)" }, 16.0);
                
                // 4 Options
                const opts = container.querySelectorAll('.gs-opt');
                // DOM order: opts[0]=#2, opts[1]=#4, opts[2]=#1, opts[3]=#3
                if (opts.length >= 4) {
                    const orderedOpts = [opts[2], opts[0], opts[3], opts[1]];
                    
                    // Box 1
                    currentTimeline.to(orderedOpts[0], { opacity: 1, x: 0, duration: 0.6, ease: "back.out(1.2)" }, 30.9);
                    currentTimeline.to(orderedOpts[0], { scale: 1.05, boxShadow: "0 15px 35px rgba(0,0,0,0.15)", duration: 0.2, yoyo: true, repeat: 1, ease: "power1.inOut" }, 43.0);
                    
                    // Box 2
                    currentTimeline.to(orderedOpts[1], { opacity: 1, x: 0, duration: 0.6, ease: "back.out(1.2)" }, 48.0);
                    currentTimeline.to(orderedOpts[1], { scale: 1.05, boxShadow: "0 15px 35px rgba(0,0,0,0.15)", duration: 0.2, yoyo: true, repeat: 1, ease: "power1.inOut" }, 53.0);
                    
                    // Box 3
                    currentTimeline.to(orderedOpts[2], { opacity: 1, x: 0, duration: 0.6, ease: "back.out(1.2)" }, 58.5);
                    currentTimeline.to(orderedOpts[2], { scale: 1.05, boxShadow: "0 15px 35px rgba(0,0,0,0.15)", duration: 0.2, yoyo: true, repeat: 1, ease: "power1.inOut" }, 64.0);
                    
                    // Box 4
                    currentTimeline.to(orderedOpts[3], { opacity: 1, x: 0, duration: 0.6, ease: "back.out(1.2)" }, 70.5);
                    currentTimeline.to(orderedOpts[3], { scale: 1.05, boxShadow: "0 15px 35px rgba(0,0,0,0.15)", duration: 0.2, yoyo: true, repeat: 1, ease: "power1.inOut" }, 76.5);
                }
                
                // Footer
                currentTimeline.to(container.querySelector('.gs-footer'), { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 83.0);
                
                const afItems = container.querySelectorAll('.gs-af-item');
                const afArrows = container.querySelectorAll('.gs-af-arrow');
                
                if(afItems.length >= 5) {
                    currentTimeline.to(afItems[0], { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 84.0);
                    if(afArrows.length > 0) currentTimeline.to(afArrows[0], { opacity: 1, x: 5, duration: 0.3, yoyo: true, repeat: 1 }, 84.5);
                    
                    currentTimeline.to(afItems[1], { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 86.5);
                    if(afArrows.length > 1) currentTimeline.to(afArrows[1], { opacity: 1, x: 5, duration: 0.3, yoyo: true, repeat: 1 }, 87.0);
                    
                    currentTimeline.to(afItems[2], { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 89.5);
                    if(afArrows.length > 2) currentTimeline.to(afArrows[2], { opacity: 1, x: 5, duration: 0.3, yoyo: true, repeat: 1 }, 90.0);
                    
                    currentTimeline.to(afItems[3], { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 92.5);
                    if(afArrows.length > 3) currentTimeline.to(afArrows[3], { opacity: 1, x: 5, duration: 0.3, yoyo: true, repeat: 1 }, 93.0);
                    
                    currentTimeline.to(afItems[4], { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.5)" }, 95.5);
                }

            } else {
                currentTimeline.set(container.querySelectorAll('*'), {opacity: 1, x:0, y:0, scale:1, scaleY:1}, 0);
            }
        }

        // Custom Models Grid Logic
        else if (slide.type === 'custom-models-grid') {
            slide.cards.forEach((card, idx) => {
                const node = container.querySelector(`#${card.id}`);
                if (node) {
                    if (!prefersReducedMotion) {
                        currentTimeline.fromTo(node, { opacity: 0, y: 30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(1.2)" }, card.time);
                        
                        // Internal animations based on card index (1 to 6)
                        if(idx === 0) { // Card 1
                            currentTimeline.fromTo(node.querySelector('.c1-shield'), {opacity:0, scale:0}, {opacity:1, scale:1, duration:0.5, ease:"back.out(1.5)"}, card.time + 0.3);
                            currentTimeline.fromTo(node.querySelector('.c1-path'), {opacity:0, strokeDasharray:"0 500"}, {opacity:0.3, strokeDasharray:"500 500", duration:1}, card.time + 0.6);
                            currentTimeline.fromTo(node.querySelectorAll('.c1-node'), {opacity:0, y:10}, {opacity:1, y:0, duration:0.4, stagger:0.1, ease:"power2.out"}, card.time + 0.8);
                        } else if(idx === 1) { // Card 2
                            currentTimeline.fromTo(node.querySelectorAll('.c2-layer'), {opacity:0, y:20}, {opacity:1, y:0, duration:0.5, stagger:-0.15, ease:"back.out(1.2)"}, card.time + 0.3);
                            currentTimeline.fromTo(node.querySelectorAll('.c2-arrow'), {opacity:0, y:30}, {opacity:1, y:0, duration:0.5}, card.time + 0.8);
                        } else if(idx === 2) { // Card 3
                            currentTimeline.fromTo(node.querySelector('.c3-top'), {opacity:0, y:-20}, {opacity:1, y:0, duration:0.5, ease:"back.out(1.5)"}, card.time + 0.3);
                            currentTimeline.fromTo(node.querySelector('.c3-path'), {opacity:0}, {opacity:0.4, duration:0.5}, card.time + 0.6);
                            currentTimeline.fromTo(node.querySelectorAll('.c3-item'), {opacity:0, scale:0.5}, {opacity:1, scale:1, duration:0.4, stagger:0.1, ease:"back.out(1.5)"}, card.time + 0.8);
                            currentTimeline.fromTo(node.querySelector('.c3-pill'), {opacity:0, y:10}, {opacity:1, y:0, duration:0.4}, card.time + 1.2);
                        } else if(idx === 3) { // Card 4
                            currentTimeline.fromTo(node.querySelectorAll('.c4-box'), {opacity:0, scale:0.9, x:-20}, {opacity:1, scale:1, x:0, duration:0.6, stagger:0.2, ease:"power3.out"}, card.time + 0.3);
                        } else if(idx === 4) { // Card 5
                            currentTimeline.fromTo(node.querySelector('.c5-top'), {opacity:0, scale:0}, {opacity:1, scale:1, duration:0.4, ease:"back.out(1.5)"}, card.time + 0.3);
                            currentTimeline.fromTo(node.querySelector('.c5-line1'), {opacity:0, scaleY:0}, {opacity:1, scaleY:1, duration:0.3}, card.time + 0.7);
                            currentTimeline.fromTo(node.querySelector('.c5-decision'), {opacity:0, scale:0.8}, {opacity:1, scale:1, duration:0.4, ease:"back.out(1.5)"}, card.time + 1.0);
                            currentTimeline.fromTo(node.querySelectorAll('.c5-branch'), {opacity:0}, {opacity:1, duration:0.4, stagger:0.1}, card.time + 1.4);
                            currentTimeline.fromTo(node.querySelectorAll('.c5-node'), {opacity:0, y:10}, {opacity:1, y:0, duration:0.4, stagger:0.1}, card.time + 1.6);
                        } else if(idx === 5) { // Card 6
                            currentTimeline.fromTo(node.querySelectorAll('.c6-ring'), {opacity:0}, {opacity:1, duration:0.3, stagger:0.15}, card.time + 0.3);
                            currentTimeline.fromTo(node.querySelectorAll('.c6-node'), {opacity:0, scale:0}, {opacity:1, scale:1, duration:0.4, stagger:0.15, ease:"back.out(1.5)"}, card.time + 0.4);
                        }
                    } else {
                        currentTimeline.set(node, {opacity: 1}, card.time);
                        currentTimeline.set(node.querySelectorAll('*'), {opacity: 1, strokeDasharray:"none", scale:1, scaleY:1, y:0, x:0}, card.time);
                    }
                }
            });
        }

        // We don't auto-play immediately to respect browser auto-play policies.
        // User clicks Play in the footer, or we try to play automatically.
        setTimeout(() => {
            togglePlay();
        }, 500);
    }

    init();

// ==========================================
// Modals & Overlays Logic
// ==========================================

    // 1. Menu Logic
    const btnMenu = document.getElementById('btnMenu');
    const mainMenu = document.getElementById('main-menu');
    const closeMenu = document.getElementById('closeMenu');
    const menuList = document.getElementById('menu-list');

    if (btnMenu && mainMenu && menuList) {
        // Populate Menu
        courseData.forEach((slide, idx) => {
            const li = document.createElement('li');
            li.textContent = slide.title || `الشريحة ${idx + 1}`;
            li.addEventListener('click', () => {
                currentSlideIndex = idx;
                renderSlide(currentSlideIndex);
                updateNavButtons();
                mainMenu.classList.remove('active');
            });
            menuList.appendChild(li);
        });

        // Toggle Menu
        btnMenu.addEventListener('click', () => {
            mainMenu.classList.toggle('active');
            // Update active state class
            Array.from(menuList.children).forEach((li, idx) => {
                if (idx === currentSlideIndex) li.classList.add('active-item');
                else li.classList.remove('active-item');
            });
        });

        closeMenu.addEventListener('click', () => {
            mainMenu.classList.remove('active');
        });
    }


    // 2. Help Overlay Logic
    const btnHelp = document.getElementById('btnHelp');
    const helpOverlay = document.getElementById('help-overlay');
    const closeHelp = document.getElementById('closeHelp');

    function positionHelpLabels() {
        const footerTargets = [
            { label: '.hl-next', id: 'btnNext', height: 60 },
            { label: '.hl-prev', id: 'btnPrev', height: 140 },
            { label: '.hl-mute', id: 'btnMute', height: 220 },
            { label: '.hl-play', id: 'btnPlayPause', height: 80 },
            { label: '.hl-repl', id: 'btnReplay', height: 180 },
            { label: '.hl-prog', id: 'progress-fill', height: 260 } // use progress wrapper actually
        ];
        
        footerTargets.forEach(t => {
            const label = document.querySelector(t.label);
            let targetElement = document.getElementById(t.id);
            if (t.id === 'progress-fill') targetElement = document.querySelector('.progress-wrapper');
            if (!label || !targetElement) return;
            
            const rect = targetElement.getBoundingClientRect();
            const centerX = rect.left + (rect.width / 2);
            
            label.style.left = `${centerX}px`;
            label.style.transform = `translateX(-50%)`;
            
            // Calculate distance from bottom of screen to the top of the button
            const screenHeight = window.innerHeight;
            const distToBottom = screenHeight - rect.top;
            
            const labelBottom = distToBottom + t.height;
            label.style.bottom = `${labelBottom}px`;
            
            // Set line height
            const line = label.querySelector('.help-line');
            if (line) line.style.height = `${t.height}px`;
        });
        
        const headerTargets = [
            { label: '.hl-page', id: 'page-total', height: 60 }, // pagination
            { label: '.hl-home', id: 'btnHome', height: 140 },
            { label: '.hl-menu', id: 'btnMenu', height: 220 }
        ];
        
        headerTargets.forEach(t => {
            const label = document.querySelector(t.label);
            let targetElement = document.getElementById(t.id);
            if (t.id === 'page-total') targetElement = document.querySelector('.ch-pagination');
            if (!label || !targetElement) return;
            
            const rect = targetElement.getBoundingClientRect();
            const centerX = rect.left + (rect.width / 2);
            
            label.style.left = `${centerX}px`;
            label.style.transform = `translateX(-50%)`;
            
            const distToTop = rect.bottom;
            const labelTop = distToTop + t.height;
            label.style.top = `${labelTop}px`;
            
            const line = label.querySelector('.help-line');
            if (line) line.style.height = `${t.height}px`;
        });
    }

    if (btnHelp && helpOverlay) {
        btnHelp.addEventListener('click', () => {
            helpOverlay.classList.toggle('active');
            if (helpOverlay.classList.contains('active')) {
                // Wait a tiny bit for display to render if needed, then position
                setTimeout(positionHelpLabels, 10);
            }
        });
        
        closeHelp.addEventListener('click', () => {
            helpOverlay.classList.remove('active');
        });
        
        window.addEventListener('resize', () => {
            if (helpOverlay.classList.contains('active')) {
                positionHelpLabels();
            }
        });
    }
    
    // Close modals on clicking outside
    document.addEventListener('click', (e) => {
        if (mainMenu && mainMenu.classList.contains('active') && !mainMenu.contains(e.target) && !btnMenu.contains(e.target)) {
            mainMenu.classList.remove('active');
        }
        if (helpOverlay && helpOverlay.classList.contains('active') && !helpOverlay.contains(e.target) && !btnHelp.contains(e.target)) {
            helpOverlay.classList.remove('active');
        }
    });
    // Modal Logic for Cards
    
    // Branching Navigation Logic
    window.handleCardClick = function(slideId, cardIdx, targetSlideId) {
        // Mark card as visited
        window.visitedCards = window.visitedCards || {};
        window.visitedCards[`${slideId}_${cardIdx}`] = true;
        
        // Find target slide index
        const targetIdx = courseData.findIndex(s => s.id === targetSlideId);
        if (targetIdx !== -1) {
            window.returnSlideIndex = currentSlideIndex; // Remember where to go back
            currentSlideIndex = targetIdx;
            renderSlide(currentSlideIndex);
            updateNavButtons();
        }
    }

    window.goBackToMenu = function() {
        if (window.returnSlideIndex !== undefined && window.returnSlideIndex !== null) {
            currentSlideIndex = window.returnSlideIndex;
            window.returnSlideIndex = null;
            renderSlide(currentSlideIndex);
            updateNavButtons();
        }
    }

    window.openCardDetails = function(cardIndex) {
        const slide = courseData[currentSlideIndex];
        const card = slide.cards[cardIndex];
        
        let modal = document.getElementById('card-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'card-modal';
            modal.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s;';
            modal.innerHTML = `
                <div class="modal-content" style="background: white; border-radius: 20px; width: 850px; max-width: 90%; padding: 50px; position: relative; transform: scale(0.8); transition: transform 0.3s; text-align: right;" dir="rtl">
                    <button onclick="closeCardDetails()" style="position: absolute; top: 20px; left: 20px; background: none; border: none; font-size: 40px; cursor: pointer; color: #666; line-height: 1;">&times;</button>
                    <div style="display: flex; gap: 40px; align-items: center;">
                        <div id="modal-icon" style="width: 200px; height: 200px; flex-shrink: 0; border-radius: 50%; overflow: hidden; border: 1px solid #ccc; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"></div>
                        <div>
                            <h2 id="modal-title" style="color: #1B5A5A; font-weight: 900; font-size: 32px; margin-bottom: 20px; margin-top: 0;"></h2>
                            <p id="modal-desc" style="font-size: 22px; line-height: 1.8; color: #444; margin: 0;"></p>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('player-wrapper').appendChild(modal);
        }
        
        document.getElementById('modal-icon').innerHTML = card.icon;
        document.getElementById('modal-title').textContent = card.text;
        document.getElementById('modal-desc').innerHTML = card.details || "التفاصيل غير متوفرة حالياً.";
        
        modal.style.display = 'flex';
        // Trigger reflow for animation
        void modal.offsetWidth;
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
    }

    window.closeCardDetails = function() {
        const modal = document.getElementById('card-modal');
        if (modal) {
            modal.style.opacity = '0';
            modal.querySelector('.modal-content').style.transform = 'scale(0.8)';
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

});
