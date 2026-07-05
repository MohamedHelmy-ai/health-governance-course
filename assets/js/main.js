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
        if (slide.type === 'splash') {
            if(footer) footer.style.visibility = 'hidden';
            if(header) header.style.visibility = 'hidden';
        } else {
            if(footer) footer.style.visibility = 'visible';
            if(header) header.style.visibility = 'visible';
        }
        
        // Reset playback
        if (currentTimeline) currentTimeline.kill();
        audioPlayer.pause();
        
        // Load new audio
        // Expecting files like assets/audio/S01_INTRO.mp3
        audioPlayer.src = `assets/audio/${slide.id}.mp3`;
        audioPlayer.load();

        updatePlayUI(false);
        progressFill.style.width = '0%';
        
        // Update custom header
        const headerTitle = document.getElementById('header-slide-title');
        if (headerTitle) {
            headerTitle.textContent = slide.title || "البرنامج التدريبي";
        }
        
        function toArabicDigits(n) {
            const digits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
            return n.toString().replace(/\d/g, x => digits[x]);
        }
        
        const pageNum = document.getElementById('page-num');
        const pageTotal = document.getElementById('page-total');
        if (pageNum && pageTotal) {
            pageNum.textContent = toArabicDigits(index + 1);
            pageTotal.textContent = toArabicDigits(courseData.length);
        }

        const slideDiv = document.createElement('div');
        slideDiv.className = 'slide active';
        slideDiv.setAttribute('data-type', slide.type);
        
        let html = '';
        
        switch (slide.type) {
            case 'splash':
                html = `
                    <div class="splash-screen">
                        ${slide.buttonText !== 'إغلاق' ? `<button class="btn-start gs-btn" onclick="document.getElementById('btnNext').click()">${slide.buttonText}</button>` : `<button class="btn-start gs-btn" onclick="window.close()">${slide.buttonText}</button>`}
                    </div>
                `;
                break;

            case 'info':
            case 'stepper':
                html = `
                    <h1 class="slide-title gs-title">${slide.title}</h1>
                    <div class="content-grid">
                        ${(slide.content || slide.steps).map((item, i) => `
                            <div class="glass-card gs-item" id="item-${i}" style="opacity: 0;">
                                ${slide.type === 'stepper' ? `<div class="step-number" style="margin-bottom:15px;">${i+1}</div>` : ''}
                                <p>${typeof item === 'string' ? item : item.text}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
                break;
                

            case 'scenario-activity':
                html = `
                    <h1 class="slide-title gs-title" style="text-align: center; margin-bottom:20px;">${slide.title}</h1>
                    
                    <div class="scenario-box gs-scen-box" style="opacity:0; transform:translateY(-20px);">
                        <div class="scenario-icon">
                            ${slide.scenario.icon}
                        </div>
                        <div>
                            <div class="scenario-label">${slide.scenario.label}</div>
                            <div class="scenario-text">${slide.scenario.text}</div>
                        </div>
                    </div>

                    <div class="activity-layout">
                        <!-- Left Column (Options 2 & 4) -->
                        <div class="activity-col left-col">
                            ${[slide.options[1], slide.options[3]].map(opt => `
                                <div class="activity-option left opt-${opt.type} gs-opt" style="opacity:0; transform:translateX(30px);">
                                    <div class="opt-num">${opt.num}</div>
                                    <div class="opt-icon-wrapper">${opt.icon}</div>
                                    <div class="opt-content">
                                        <div class="opt-title">${opt.title}</div>
                                        <div class="opt-text">${opt.text}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Center Node -->
                        <div class="activity-center-col">
                            <div class="activity-center-circle gs-center" style="opacity:0; transform:scale(0.5);">
                                <div class="ac-icon">${slide.centerNode.icon}</div>
                                <div class="ac-title">${slide.centerNode.title}</div>
                                <div class="ac-sub">${slide.centerNode.subtitle}</div>
                            </div>
                        </div>

                        <!-- Right Column (Options 1 & 3) -->
                        <div class="activity-col right-col">
                            ${[slide.options[0], slide.options[2]].map(opt => `
                                <div class="activity-option right opt-${opt.type} gs-opt" style="opacity:0; transform:translateX(-30px);">
                                    <div class="opt-icon-wrapper">${opt.icon}</div>
                                    <div class="opt-content">
                                        <div class="opt-title">${opt.title}</div>
                                        <div class="opt-text">${opt.text}</div>
                                    </div>
                                    <div class="opt-num">${opt.num}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Footer Flow -->
                    <div class="activity-footer gs-footer" style="opacity:0; transform:translateY(20px);">
                        ${slide.footerFlow.map((item, i) => `
                            <div class="af-item gs-af-item" style="opacity:0; transform:scale(0.8);">
                                <div class="af-icon ${i===0?'gov':i===1?'comp':i===2?'int':i===3?'perf':'goal'}">${item.icon}</div>
                                <div class="af-text">${item.text}</div>
                            </div>
                            ${i < slide.footerFlow.length - 1 ? `
                            <div class="af-arrow gs-af-arrow" style="opacity:0;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray: 4,4;"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                            </div>
                            ` : ''}
                        `).join('')}
                    </div>
                `;
                break;

            case 'custom-objectives':
                // Based on screenshots
                html = `
                    <h1 class="slide-title gs-title" style="text-align: right; font-size:1.8rem; margin-bottom:40px;">${slide.title}</h1>
                    <div class="objectives-container" style="position:relative; width:100%; height:400px; display:flex; align-items:center;">
                        
                        <!-- The Target Graphic (Right side) -->
                        <div class="target-graphic gs-target" style="position:absolute; right:0; top:50%; transform:translateY(-50%); width:300px; height:300px;">
                            <svg viewBox="0 0 200 200" style="width:100%; height:100%;">
                                <circle cx="100" cy="100" r="90" fill="none" stroke="#237A74" stroke-width="8" opacity="0.4"/>
                                <circle cx="100" cy="100" r="70" fill="none" stroke="#237A74" stroke-width="12" opacity="0.7"/>
                                <circle cx="100" cy="100" r="50" fill="#1B3B5A" stroke="#237A74" stroke-width="15"/>
                                <circle cx="100" cy="100" r="25" fill="#059669"/>
                            </svg>
                        </div>
                        
                        <!-- List Items (Left side extending from target) -->
                        <div style="position:absolute; right:320px; top:10%; width:600px; height:80%; display:flex; flex-direction:column; justify-content:space-around;">
                            ${slide.items.map(item => `
                                <div class="obj-row" id="obj-${item.id}" style="display:flex; align-items:center; justify-content:flex-end; gap:15px; opacity:0;">
                                    <div style="background:var(--glass-bg); border:1px solid var(--color-teal); padding:10px 20px; border-radius:20px; color:white; font-size:1.2rem;">
                                        ${item.text}
                                    </div>
                                    <div style="width:100px; height:2px; background:var(--color-teal);"></div>
                                    <div style="width:40px; height:40px; background:var(--color-navy); border:2px solid var(--color-teal); border-radius:50%; display:flex; justify-content:center; align-items:center; font-weight:bold; color:white; font-size:1.2rem;">
                                        ${item.number}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;

            case 'custom-icon-cards':
                html = `
                    <div class="slide-content w-100 h-100 d-flex flex-column justify-content-center align-items-center" style="padding: 0; box-sizing: border-box;">
                        <div class="content-grid w-100" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 25px; max-width: 1100px; margin: 0 auto; align-items: end; height: 100%; padding-bottom: 140px;">
                            ${slide.cards.map((c, idx) => {
                                const slideKey = slide.id + '_' + idx;
                                const isVisited = window.visitedCards && window.visitedCards[slideKey];
                                const checkmarkHtml = isVisited ? '<div class="gs-item" style="position:absolute; top:-15px; right:-15px; background:#4CAF50; color:white; border-radius:50%; width:45px; height:45px; display:flex; justify-content:center; align-items:center; font-size:24px; font-weight:bold; box-shadow:0 4px 10px rgba(0,0,0,0.2); z-index:10;">✓</div>' : '';
                                
                                return `
                                <div class="icon-card gs-item" onclick="handleCardClick('${slide.id}', ${idx}, '${c.targetSlide}')" style="cursor: pointer; position: relative; background: #f8f9fa; border-radius: 15px; border: none; text-align: center; padding: 0 10px 25px 10px; height: 210px; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.03); transition: all 0.3s ease;">
                                    ${checkmarkHtml}
                                    <div class="icon-circle" style="position: absolute; top: -100px; left: 50%; transform: translateX(-50%); width: 190px; height: 190px; border-radius: 50%; background: #ffffff; border: 1px solid #ccc; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; z-index: 2;">
                                        ${c.icon}
                                    </div>
                                    <h4 style="color: #1B5A5A; font-weight: 800; font-size: 20px; line-height: 1.4; margin: 0; z-index: 1;">${c.text}</h4>
                                </div>
                            `}).join('')}
                        </div>
                    </div>
                `;
                break;

            case 'custom-models-grid':
                html = `
                    <h1 class="slide-title gs-title" style="text-align:center; margin-bottom: 1rem; font-size: 1.8rem;">${slide.title}</h1>
                    <div class="cards-grid-container content-grid" style="direction:rtl; max-width: 1200px; margin: 0 auto; padding-bottom: 30px;">
                        
                        <!-- Card 1 -->
                        <div class="glass-card gs-card" id="card1" style="position:relative; min-height: 220px; opacity:0;">
                            <div style="position:absolute; top:10px; right:10px; width:24px; height:24px; background:#1E293B; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">1</div>
                            <div class="c1-shield" style="position:absolute; top:35%; left:50%; transform:translate(-50%, -50%); opacity:0; color:var(--color-teal);">
                                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                            </div>
                            <svg style="position:absolute; top:45%; left:0; width:100%; height:80px;" preserveAspectRatio="none"><path class="c1-path" d="M 20 40 Q 150 80 280 40" fill="none" stroke="var(--color-teal)" stroke-width="2" opacity="0"/></svg>
                            <div class="c1-node" style="position:absolute; top:65%; left:15%; transform:translate(-50%,-50%); text-align:center; opacity:0;">
                                <div style="background:white; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; margin:0 auto; color:#1E293B;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                                <div style="font-size:0.65rem; margin-top:5px; font-weight:bold;">مجلس الإدارة</div>
                            </div>
                            <div class="c1-node" style="position:absolute; top:80%; left:38%; transform:translate(-50%,-50%); text-align:center; opacity:0;">
                                <div style="background:white; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; margin:0 auto; color:#1E293B;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg></div>
                                <div style="font-size:0.65rem; margin-top:5px; font-weight:bold;">الإدارة التنفيذية</div>
                            </div>
                            <div class="c1-node" style="position:absolute; top:80%; left:62%; transform:translate(-50%,-50%); text-align:center; opacity:0;">
                                <div style="background:white; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; margin:0 auto; color:#1E293B;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
                                <div style="font-size:0.65rem; margin-top:5px; font-weight:bold;">اللجان</div>
                            </div>
                            <div class="c1-node" style="position:absolute; top:65%; left:85%; transform:translate(-50%,-50%); text-align:center; opacity:0;">
                                <div style="background:white; border-radius:50%; width:36px; height:36px; display:flex; align-items:center; justify-content:center; margin:0 auto; color:#1E293B;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></div>
                                <div style="font-size:0.65rem; margin-top:5px; font-weight:bold;">المساءلة</div>
                            </div>
                        </div>

                        <!-- Card 2 -->
                        <div class="glass-card gs-card" id="card2" style="position:relative; min-height: 220px; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0;">
                            <div style="position:absolute; top:10px; right:10px; width:24px; height:24px; background:#1E293B; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">2</div>
                            <div style="display:flex; flex-direction:column; align-items:center; gap:5px; width:90%;">
                                <div class="c2-layer" style="background:#0F766E; width:65%; height:40px; border-radius:8px 8px 0 0; display:flex; align-items:center; justify-content:center; color:white; font-size:0.75rem; font-weight:bold; position:relative; opacity:0; clip-path: polygon(10% 0, 90% 0, 100% 100%, 0% 100%);">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:5px;"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="15" y2="22"/><line x1="8" y1="6" x2="16" y2="6"/></svg> الإدارة التنفيذية
                                </div>
                                <div class="c2-layer" style="background:#14B8A6; width:85%; height:40px; display:flex; align-items:center; justify-content:center; color:white; font-size:0.75rem; font-weight:bold; position:relative; opacity:0; clip-path: polygon(5% 0, 95% 0, 100% 100%, 0% 100%);">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:5px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> إدارة المخاطر
                                </div>
                                <div class="c2-layer" style="background:#1E3A8A; width:100%; height:40px; border-radius:0 0 8px 8px; display:flex; align-items:center; justify-content:center; color:white; font-size:0.75rem; font-weight:bold; position:relative; opacity:0; clip-path: polygon(3% 0, 97% 0, 100% 100%, 0% 100%);">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:5px;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> التدقيق الداخلي
                                </div>
                            </div>
                            <div class="c2-arrow" style="position:absolute; right:10px; top:30%; opacity:0;"><svg width="20" height="80" viewBox="0 0 24 100" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"><path d="M12 100V0M5 10l7-10 7 10"/></svg></div>
                            <div class="c2-arrow" style="position:absolute; left:10px; top:30%; opacity:0;"><svg width="20" height="80" viewBox="0 0 24 100" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"><path d="M12 100V0M5 10l7-10 7 10"/></svg></div>
                        </div>

                        <!-- Card 3 -->
                        <div class="glass-card gs-card" id="card3" style="position:relative; min-height: 220px; display:flex; flex-direction:column; align-items:center; opacity:0;">
                            <div style="position:absolute; top:10px; right:10px; width:24px; height:24px; background:#1E293B; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">3</div>
                            <div class="c3-top" style="background:#0F766E; color:white; border-radius:15px; padding:8px 25px; margin-top:20px; font-size:0.9rem; font-weight:bold; opacity:0; z-index:2; display:flex; align-items:center; gap:8px;">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                مجلس الإدارة
                            </div>
                            <svg style="position:absolute; top:55px; left:0; width:100%; height:50px; z-index:1;" preserveAspectRatio="none"><path class="c3-path" d="M 30 50 Q 150 0 270 50" fill="none" stroke="var(--color-teal)" stroke-width="1.5" stroke-dasharray="4 4" opacity="0"/></svg>
                            <div style="display:flex; justify-content:space-between; width:90%; margin-top:35px; z-index:2; direction:rtl;">
                                <div class="c3-item" style="text-align:center; opacity:0;">
                                    <div style="background:white; color:#1E293B; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg></div>
                                    <div style="font-size:0.65rem; margin-top:5px; font-weight:bold;">استراتيجية</div>
                                </div>
                                <div class="c3-item" style="text-align:center; opacity:0;">
                                    <div style="background:white; color:#1E293B; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
                                    <div style="font-size:0.65rem; margin-top:5px; font-weight:bold;">أداء</div>
                                </div>
                                <div class="c3-item" style="text-align:center; opacity:0;">
                                    <div style="background:white; color:#1E293B; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg></div>
                                    <div style="font-size:0.65rem; margin-top:5px; font-weight:bold;">امتثال</div>
                                </div>
                                <div class="c3-item" style="text-align:center; opacity:0;">
                                    <div style="background:white; color:#1E293B; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>
                                    <div style="font-size:0.65rem; margin-top:5px; font-weight:bold;">حماية</div>
                                </div>
                            </div>
                            <div class="c3-pill" style="background:rgba(255,255,255,0.1); border:1px solid var(--color-teal); border-radius:15px; padding:3px 15px; font-size:0.75rem; margin-top:15px; opacity:0; font-weight:bold;">
                                يوجه ولا ينفذ
                            </div>
                        </div>

                        <!-- Card 4 -->
                        <div class="glass-card gs-card" id="card4" style="position:relative; min-height: 220px; display:flex; flex-direction:column; padding:35px 10px 10px 10px; opacity:0;">
                            <div style="position:absolute; top:10px; right:10px; width:24px; height:24px; background:#1E293B; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">4</div>
                            <div style="display:flex; justify-content:center; gap:10px; height: 100%;">
                                <div class="c4-box" style="background:rgba(16,185,129,0.15); border-radius:8px; padding:10px 5px; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:space-between; text-align:center; opacity:0;">
                                    <div style="background:#059669; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
                                    <div style="font-weight:bold; font-size:0.7rem; color:#10B981;">الجودة والسلامة</div>
                                    <div style="display:flex; justify-content:space-around; width:100%;">
                                        <div style="font-size:0.55rem;"><svg width="14" height="14" stroke="#10B981" viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg><br>جودة</div>
                                        <div style="font-size:0.55rem;"><svg width="14" height="14" stroke="#10B981" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg><br>سلامة</div>
                                        <div style="font-size:0.55rem;"><svg width="14" height="14" stroke="#10B981" viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg><br>تحسين</div>
                                    </div>
                                </div>
                                <div class="c4-box" style="background:rgba(59,130,246,0.15); border-radius:8px; padding:10px 5px; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:space-between; text-align:center; opacity:0;">
                                    <div style="background:#2563EB; color:white; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg></div>
                                    <div style="font-weight:bold; font-size:0.7rem; color:#3B82F6;">الامتثال والأخلاقيات</div>
                                    <div style="display:flex; justify-content:space-around; width:100%;">
                                        <div style="font-size:0.55rem;"><svg width="14" height="14" stroke="#3B82F6" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg><br>مصالح</div>
                                        <div style="font-size:0.55rem;"><svg width="14" height="14" stroke="#3B82F6" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg><br>أخلاقيات</div>
                                        <div style="font-size:0.55rem;"><svg width="14" height="14" stroke="#3B82F6" viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg><br>امتثال</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Card 5 -->
                        <div class="glass-card gs-card" id="card5" style="position:relative; min-height: 220px; display:flex; flex-direction:column; align-items:center; opacity:0;">
                            <div style="position:absolute; top:10px; right:10px; width:24px; height:24px; background:#1E293B; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">5</div>
                            <div class="c5-top" style="background:#1E293B; color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-top:20px; z-index:2; opacity:0;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                            <div class="c5-line1" style="width:2px; height:15px; background:rgba(255,255,255,0.3); opacity:0;"></div>
                            <div class="c5-decision" style="background:#0F766E; color:white; border-radius:15px; padding:4px 15px; font-size:0.75rem; font-weight:bold; z-index:2; opacity:0;">
                                هل القرار مالي؟
                            </div>
                            <svg style="position:absolute; top:100px; left:0; width:100%; height:60px; z-index:1;" preserveAspectRatio="none">
                                <path class="c5-branch" d="M 150 10 L 70 50" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" opacity="0"/>
                                <path class="c5-branch" d="M 150 10 L 230 50" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2" opacity="0"/>
                            </svg>
                            <div style="display:flex; justify-content:space-between; width:70%; margin-top:25px; z-index:2; direction:ltr;">
                                <div class="c5-node" style="text-align:center; opacity:0;">
                                    <div style="background:#059669; color:white; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 5px; font-size:0.6rem;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                                    <div style="background:white; color:#059669; width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin:0 auto;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg></div>
                                    <div style="font-size:0.65rem; margin-top:5px; font-weight:bold;">المدير المالي</div>
                                </div>
                                <div class="c5-node" style="text-align:center; opacity:0;">
                                    <div style="background:#DC2626; color:white; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 5px; font-size:0.6rem;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div>
                                    <div style="background:white; color:#1E3A8A; width:36px; height:36px; border-radius:8px; display:flex; align-items:center; justify-content:center; margin:0 auto;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="15" y2="22"/><line x1="8" y1="6" x2="16" y2="6"/></svg></div>
                                    <div style="font-size:0.65rem; margin-top:5px; font-weight:bold;">الإدارة</div>
                                </div>
                            </div>
                        </div>

                        <!-- Card 6 -->
                        <div class="glass-card gs-card" id="card6" style="position:relative; min-height: 220px; opacity:0;">
                            <div style="position:absolute; top:10px; right:10px; width:24px; height:24px; background:#1E293B; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold;">6</div>
                            <svg style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); opacity:0.05; width:80px; height:80px;" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                            <svg style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:160px; height:160px;" viewBox="0 0 100 100">
                                <path class="c6-ring" d="M 50 10 A 40 40 0 0 1 90 50" fill="none" stroke="#34D399" stroke-width="2" stroke-dasharray="4 4" opacity="0"/>
                                <path class="c6-ring" d="M 90 50 A 40 40 0 0 1 50 90" fill="none" stroke="#34D399" stroke-width="2" stroke-dasharray="4 4" opacity="0"/>
                                <path class="c6-ring" d="M 50 90 A 40 40 0 0 1 10 50" fill="none" stroke="#34D399" stroke-width="2" stroke-dasharray="4 4" opacity="0"/>
                                <path class="c6-ring" d="M 10 50 A 40 40 0 0 1 50 10" fill="none" stroke="#34D399" stroke-width="2" stroke-dasharray="4 4" opacity="0"/>
                            </svg>
                            <div class="c6-node" style="position:absolute; top:15%; left:50%; transform:translate(-50%,-50%); text-align:center; opacity:0;">
                                <div style="color:var(--color-teal);"><svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                                <div style="font-size:0.6rem; font-weight:bold;">مجلس الإدارة</div>
                            </div>
                            <div class="c6-node" style="position:absolute; top:45%; left:85%; transform:translate(-50%,-50%); text-align:center; opacity:0;">
                                <div style="color:white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg></div>
                                <div style="font-size:0.6rem; font-weight:bold;">اللجان</div>
                            </div>
                            <div class="c6-node" style="position:absolute; top:80%; left:75%; transform:translate(-50%,-50%); text-align:center; opacity:0;">
                                <div style="color:white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/></svg></div>
                                <div style="font-size:0.6rem; font-weight:bold;">السياسات</div>
                            </div>
                            <div class="c6-node" style="position:absolute; top:80%; left:25%; transform:translate(-50%,-50%); text-align:center; opacity:0;">
                                <div style="color:white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
                                <div style="font-size:0.6rem; font-weight:bold;">الإجراءات</div>
                            </div>
                            <div class="c6-node" style="position:absolute; top:45%; left:15%; transform:translate(-50%,-50%); text-align:center; opacity:0;">
                                <div style="color:white;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4"/><rect x="2" y="10" width="20" height="12" rx="2"/><path d="M12 14v4"/></svg></div>
                                <div style="font-size:0.6rem; font-weight:bold;">التنفيذ</div>
                            </div>
                        </div>

                    </div>
                `;
                break;

            case 'framework-split':
                html = `
                    <div class="framework-slide-container" style="display:flex; flex-direction:column; gap:20px; width:100%; max-width:1200px; margin:0 auto; direction:rtl;">
                        <h1 class="gs-fw-title" style="text-align:right; font-size:2rem; color:#1E293B; margin-bottom:10px;">${slide.title}</h1>
                        
                        <div style="display:flex; gap:30px; width:100%;">
                            <!-- Right Panel -->
                            <div class="glass-card gs-fw-panel" id="fw-panel-right" style="flex:1; position:relative; min-height:450px; background:white; padding:0; opacity:0;">
                                <div style="background:#1B7059; color:white; border-radius:15px 15px 0 0; padding:20px; text-align:center; position:relative; height:80px;">
                                    <div class="gs-fw-icon" style="position:absolute; top:-25px; left:50%; transform:translateX(-50%); width:60px; height:60px; background:#F8FAFC; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 5px 15px rgba(0,0,0,0.1); color:#1B7059; opacity:0;">
                                        <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2h-4a2 2 0 0 1 2-2zm-3 4V4a1 1 0 0 0-1-1 3 3 0 0 0 0 6v3h2V9a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1V5a1 1 0 0 1 1-1 3 3 0 0 1 0 6h-2v3h2a1 1 0 0 0 1-1V9a1 1 0 0 1 1-1 3 3 0 0 1 0 6v2a2 2 0 0 1-2 2h-3v-2a1 1 0 0 0-1-1 3 3 0 0 0-6 0v3h-3a2 2 0 0 1-2-2v-4a1 1 0 0 1 1-1h2a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H4a1 1 0 0 1-1-1 3 3 0 0 1 6 0v2h2V6z"/></svg>
                                    </div>
                                    <h2 style="margin-top:15px; font-size:1.3rem;">مكونات إطار الحوكمة الفعّال</h2>
                                </div>
                                <div style="padding:40px 20px 20px 20px; position:relative;">
                                    <div class="fw-r-line" style="position:absolute; right:110px; top:40px; bottom:20px; width:2px; background:repeating-linear-gradient(to bottom, #1B7059 0, #1B7059 5px, transparent 5px, transparent 10px); transform-origin: top; transform: scaleY(0);"></div>
                                    ${slide.rightItems.map(item => `
                                        <div class="gs-fw-r-item" style="display:flex; align-items:center; margin-bottom:25px; opacity:0; transform:translateY(15px);">
                                            <div style="flex:1; background:#F8FAFC; border-radius:10px; padding:15px 20px; margin-left:20px; text-align:right; font-weight:bold; color:#1E293B;">${item.text}</div>
                                            <div style="width:40px; height:40px; background:#F1F5F9; border-radius:50%; display:flex; justify-content:center; align-items:center; margin-left:15px; color:#1B7059;">${item.icon}</div>
                                            <div style="width:30px; height:30px; background:#1B7059; color:white; border-radius:50%; display:flex; justify-content:center; align-items:center; font-weight:bold; font-size:0.8rem; z-index:2; box-shadow:0 0 0 4px white;">${item.num}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Left Panel -->
                            <div class="glass-card gs-fw-panel" id="fw-panel-left" style="flex:1; position:relative; min-height:450px; background:white; padding:0; opacity:0;">
                                <div style="background:#1B7059; color:white; border-radius:15px 15px 0 0; padding:20px; text-align:center; position:relative; height:80px;">
                                    <div class="gs-fw-icon" style="position:absolute; top:-25px; left:50%; transform:translateX(-50%); width:60px; height:60px; background:#F8FAFC; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 5px 15px rgba(0,0,0,0.1); color:#1B7059; opacity:0;">
                                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                                    </div>
                                    <h2 style="margin-top:15px; font-size:1.3rem;">خطوات بناء الإطار</h2>
                                </div>
                                <div style="padding:40px 20px 20px 20px; position:relative;">
                                    <div class="fw-l-line" style="position:absolute; right:35px; top:50px; bottom:20px; width:2px; background:repeating-linear-gradient(to bottom, #1B7059 0, #1B7059 5px, transparent 5px, transparent 10px); transform-origin: top; transform: scaleY(0);"></div>
                                    ${slide.leftItems.map(item => `
                                        <div class="gs-fw-l-item" style="display:flex; align-items:center; margin-bottom:20px; opacity:0; transform:translateY(15px);">
                                            <div style="width:12px; height:12px; background:#1B7059; border-radius:50%; margin-left:15px; z-index:2; border:3px solid white; box-shadow:0 0 0 2px #1B7059;"></div>
                                            <div style="width:40px; height:40px; background:#F1F5F9; border-radius:50%; display:flex; justify-content:center; align-items:center; margin-left:15px; color:#1B7059;">${item.icon}</div>
                                            <div style="flex:1; text-align:right; font-weight:bold; color:#1E293B; font-size:0.9rem;">${item.text}</div>
                                        </div>
                                    `).join('')}

                                    <div class="gs-fw-illustration" style="position:absolute; bottom:10px; left:10px; width:150px; opacity:0;">
                                        <svg viewBox="0 0 120 120" style="width:100%; height:auto;">
                                            <rect x="25" y="15" width="70" height="90" rx="8" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="4"/>
                                            <rect x="45" y="5" width="30" height="15" rx="4" fill="#94A3B8"/>
                                            <path d="M 35 40 L 45 50 L 60 30" fill="none" stroke="#10B981" stroke-width="4" stroke-linecap="round"/>
                                            <path d="M 35 60 L 45 70 L 60 50" fill="none" stroke="#10B981" stroke-width="4" stroke-linecap="round"/>
                                            <path d="M 35 80 L 45 90 L 60 70" fill="none" stroke="#10B981" stroke-width="4" stroke-linecap="round"/>
                                            <path d="M 70 50 L 100 50 L 100 80 C 100 95 85 110 70 115 C 55 110 40 95 40 80 L 40 50 Z" fill="#1B7059"/>
                                            <path d="M 55 80 L 65 90 L 85 65" fill="none" stroke="white" stroke-width="6" stroke-linecap="round"/>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Bottom Footer Bar -->
                        <div class="glass-card gs-fw-footer" style="display:flex; justify-content:space-between; align-items:center; background:white; padding:20px 40px; margin-top:10px; opacity:0; transform:translateY(20px);">
                            ${slide.footerItems.map(item => `
                                <div class="gs-fw-f-item" style="display:flex; align-items:center; gap:10px; opacity:0; transform:translateX(20px);">
                                    <div style="color:#1B7059; width:30px; height:30px;">${item.icon}</div>
                                    <div style="font-weight:bold; font-size:0.9rem; color:#1E293B;">${item.text}</div>
                                    ${item.divider ? `<div style="width:2px; height:30px; background:#E2E8F0; margin:0 15px;"></div>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;

            case 'custom-visual-def':
                // Based on Org Chart / Definition screenshot with 3 images
                html = `
                    <div class="visual-def-container" style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; gap:40px;">
                        <div style="display:flex; justify-content:center; align-items:center; gap:50px; width:100%; height:300px;">
                            ${slide.images.map(img => `
                                <div class="gs-visual-def" id="${img.id}" style="opacity:0; width:200px; height:200px; display:flex; justify-content:center; align-items:center; background:rgba(255,255,255,0.05); border-radius:50%; padding:20px;">
                                    <img src="${img.src}" alt="${img.id}" style="max-width:100%; max-height:100%; object-fit:contain;">
                                </div>
                            `).join('')}
                        </div>
                        <h1 class="slide-title gs-caption" style="text-align:center; font-size:2rem; opacity:0; margin-top:20px; max-width:800px;">${slide.caption}</h1>
                    </div>
                `;
                break;

            case 'visual-concept':
                html = `
                    <h1 class="slide-title gs-title" style="text-align:center; margin-bottom:40px;">${slide.title}</h1>
                    <div style="display:flex; justify-content:center; align-items:center; gap:40px; flex-wrap:wrap;">
                        ${slide.images.map(img => `
                            <div class="gs-visual-concept" id="${img.id}" style="opacity:0; display:flex; flex-direction:column; align-items:center; gap:15px;">
                                <div style="width:150px; height:150px; background:rgba(255,255,255,0.05); border-radius:20px; padding:20px; display:flex; justify-content:center; align-items:center;">
                                    <img src="${img.src}" alt="${img.label}" style="max-width:100%; max-height:100%;">
                                </div>
                                <h3 style="font-size:1.5rem; color:white;">${img.label}</h3>
                            </div>
                        `).join('')}
                    </div>
                `;
                break;

            case 'concept':
                html = `
                    <h1 class="slide-title gs-title">${slide.title}</h1>
                    <div class="glass-card gs-item" style="max-width: 800px; font-size: 1.5rem; opacity:0;">
                        <p>${slide.text}</p>
                    </div>
                `;
                break;
                
            // Three Pillars Flow Logic
            case 'three-pillars-flow':
            html = `
                <div class="pillars-wrapper" style="display:flex; flex-direction:column; height:100%; width:100%; max-width:1200px; margin:0 auto; padding-top:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h1 class="slide-title gs-title" style="margin:0;">${slide.title}</h1>
                        <div class="gs-title-deco" style="display:flex; gap:5px; opacity:0;">
                            <div style="width:10px; height:10px; border-radius:50%; background:#8CAE9E;"></div>
                            <div style="width:10px; height:10px; border-radius:50%; background:#237A74;"></div>
                            <div style="width:10px; height:10px; border-radius:50%; background:#1B3B5A;"></div>
                        </div>
                    </div>
                    
                    <div class="pillars-container" style="display:flex; gap:20px; flex:1; margin-bottom:20px;">
                        ${slide.pillars.map((pillar) => `
                            <div class="pillar gs-pillar" id="pillar-${pillar.id}" style="flex:1; display:flex; flex-direction:column; opacity:0; transform:translateY(30px);">
                                <div class="pillar-header" style="background:${pillar.color}; border-radius:15px; padding:15px; display:flex; align-items:center; justify-content:space-between; color:white; margin-bottom:15px; box-shadow:0 4px 15px rgba(0,0,0,0.1); position:relative; overflow:hidden;">
                                    <h3 style="margin:0; font-size:1.2rem; position:relative; z-index:2;">${pillar.title}</h3>
                                    <div style="background:white; color:${pillar.color}; width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:1.2rem; position:relative; z-index:2;">${pillar.num}</div>
                                    <div style="position:absolute; right:-20px; top:-20px; width:80px; height:80px; background:rgba(255,255,255,0.1); border-radius:50%; z-index:1;"></div>
                                </div>
                                <div class="pillar-body glass-card" style="flex:1; padding:20px; border-radius:15px; display:flex; flex-direction:column; align-items:center; position:relative;">
                                    <h4 style="color:${pillar.color}; text-align:center; margin-bottom:20px; font-size:1.1rem; border-bottom:2px dashed rgba(0,0,0,0.1); padding-bottom:10px; width:100%;">${pillar.subtitle}</h4>
                                    
                                                                                                            <!-- Pillar Custom SVG Illustration -->
                                    <div class="pillar-illustration" style="width:120px; height:120px; margin-bottom:25px; position:relative; display:flex; align-items:center; justify-content:center;">
                                        ${pillar.id === 'gov' ? `
                                            <!-- Governance SVG (Lucide Landmark) -->
                                            <div class="gs-gov-svg" style="width:100%; height:100%; opacity:0; transform:scale(0.8); display:flex; align-items:center; justify-content:center;">
                                                <div style="width:90px; height:90px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 25px rgba(0,0,0,0.08); border: 3px solid ${pillar.color};">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="${pillar.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                        <line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>
                                                    </svg>
                                                </div>
                                            </div>
                                        ` : pillar.id === 'comp' ? `
                                            <!-- Compliance SVG (Lucide ShieldCheck) -->
                                            <div class="gs-comp-svg" style="width:100%; height:100%; opacity:0; transform:scale(0.8); display:flex; align-items:center; justify-content:center;">
                                                <div style="width:90px; height:90px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 25px rgba(0,0,0,0.08); border: 3px solid ${pillar.color};">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="${pillar.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>
                                                    </svg>
                                                </div>
                                            </div>
                                        ` : `
                                            <!-- Integration SVG (Lucide Puzzle) -->
                                            <div class="gs-int-svg" style="width:100%; height:100%; opacity:0; transform:scale(0.8); display:flex; align-items:center; justify-content:center;">
                                                <div style="width:90px; height:90px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 10px 25px rgba(0,0,0,0.08); border: 3px solid ${pillar.color};">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="${pillar.color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.611c-.94.94-2.469.94-3.408 0L8.73 19.73a1.2 1.2 0 0 1-.289-.877l.074-.486A2.5 2.5 0 0 0 6.002 16c-.732.186-1.503-.028-2.033-.559l-1.568-1.568c-.94-.94-.94-2.469 0-3.408l1.611-1.611a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.611c.94-.94 2.469-.94 3.408 0l1.568 1.568c.23.23.556.338.877.289l.486-.074a2.5 2.5 0 0 0 2.512-2.512l-.074-.486Z"/>
                                                    </svg>
                                                </div>
                                            </div>
                                        `}
                                    </div>
                                    <div class="pillar-items" style="width:100%; display:flex; flex-direction:column; gap:10px;">
                                        ${pillar.items.map((item, i) => `
                                            <div class="gs-p-item" style="display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.7); padding:10px; border-radius:10px; opacity:0; transform:translateX(20px);">
                                                <div style="min-width:30px; height:30px; border-radius:50%; background:rgba(0,0,0,0.05); display:flex; align-items:center; justify-content:center; color:${pillar.color};">
                                                    <div style="width:16px; height:16px;">${pillar.icons[i]}</div>
                                                </div>
                                                <p style="margin:0; font-size:0.85rem; line-height:1.4;">${item}</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="footer-flow gs-flow" style="display:flex; align-items:center; background:white; padding:15px 30px; border-radius:15px; box-shadow:0 4px 15px rgba(0,0,0,0.05); opacity:0; transform:translateY(20px);">
                        ${slide.footerFlow.map((flow, i) => `
                            <div class="gs-flow-item" style="display:flex; flex-direction:column; align-items:center; flex:1; text-align:center; opacity:0; transform:scale(0.8);">
                                <div style="width:40px; height:40px; border-radius:50%; background:#E5F0ED; color:#237A74; display:flex; align-items:center; justify-content:center; margin-bottom:10px;">
                                    <div style="width:20px; height:20px;">${flow.icon}</div>
                                </div>
                                <span style="font-size:0.8rem; font-weight:bold; color:#1B3B5A; ${i === 0 ? 'font-size:0.95rem; color:#237A74;' : ''}">${flow.text}</span>
                            </div>
                            ${i < slide.footerFlow.length - 1 ? `
                                <div class="gs-flow-arrow" style="color:#237A74; opacity:0; margin:0 10px;">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </div>
                            ` : ''}
                        `).join('')}
                    </div>
                </div>
            `;
            break;
        
        // (Keeping Interactive-diagram, Tabs, Comparison, Quiz generic for now to save space, just adding basic GSAP hooks)
            default:
                html = `
                    <h1 class="slide-title gs-title">${slide.title}</h1>
                    <div class="glass-card gs-item" style="max-width:800px; opacity:0;"><p>Content type: ${slide.type}</p></div>
                `;
                if(slide.type === 'quiz') {
                     html = `
                    <h1 class="slide-title gs-title">${slide.title}</h1>
                    <div class="glass-card gs-item" style="width:100%; max-width:800px; opacity:0;">
                        <p style="font-size:1.2rem; opacity:0.8; margin-bottom:10px;">${slide.scenario}</p>
                        <h3 class="card-title" style="margin-bottom:20px;">${slide.question}</h3>
                        <div class="quiz-options" id="quiz-${index}">
                            ${slide.options.map(opt => `<button class="quiz-btn" data-correct="${opt.correct}" data-feedback="${opt.feedback}">${opt.text}</button>`).join('')}
                        </div>
                        <div class="feedback-msg" id="feedback-${index}"></div>
                    </div>
                `;
                }
                if(slide.type === 'tabs') {
                    html = `
                    <h1 class="slide-title gs-title">${slide.title}</h1>
                    <div class="glass-card gs-item" style="width: 100%; opacity:0;">
                        <div class="tabs-header">
                            ${slide.tabs.map((tab, i) => `<button class="tab-btn ${i===0?'active':''}" data-target="tab-${i}">${tab.label}</button>`).join('')}
                        </div>
                        <div class="tab-content">
                            ${slide.tabs.map((tab, i) => `<p id="tab-${i}" style="display: ${i===0?'block':'none'}; font-size:1.3rem;">${tab.text}</p>`).join('')}
                        </div>
                    </div>
                `;
                }
                break;
        }
        
        if (slide.type === 'splash') {
            slideDiv.innerHTML = html;
        } else {
            slideDiv.innerHTML = `<div class="content-scaler" style="transform: scale(0.85); transform-origin: top center; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center;">${html}</div>`;
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
                currentTimeline.fromTo(container.querySelector('.gs-fw-title'), { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" }, 0.5);
                
                // Right Panel Appears - "مجلس الإدارة" starts at 2.0s
                currentTimeline.fromTo(container.querySelector('#fw-panel-right'), {opacity: 0, y: 30}, {opacity: 1, y: 0, duration: 0.6, ease:"power2.out"}, 1.5);
                currentTimeline.fromTo(container.querySelectorAll('#fw-panel-right .gs-fw-icon'), {opacity: 0, scale: 0}, {opacity: 1, scale: 1, duration: 0.4, ease:"back.out(1.5)"}, 1.8);
                
                // Draw dotted line for Right Panel
                currentTimeline.to(container.querySelector('.fw-r-line'), {scaleY: 1, duration: 2, ease:"none"}, 2.0);
                
                // Right items precise timings
                const rItems = container.querySelectorAll('.gs-fw-r-item');
                if(rItems.length >= 5) {
                    currentTimeline.fromTo(rItems[0], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 2.04); // مجلس الإدارة
                    currentTimeline.fromTo(rItems[1], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 4.82); // واللجان المتخصصة
                    currentTimeline.fromTo(rItems[2], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 8.22); // ومصفوفة الصلاحيات
                    currentTimeline.fromTo(rItems[3], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 12.24); // والسياسات
                    currentTimeline.fromTo(rItems[4], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 14.14); // والإجراءات
                }
                
                // Show illustration (Clipboard and Shield) - after right panel is done
                currentTimeline.fromTo(container.querySelector('.gs-fw-illustration'), {opacity: 0, scale:0.5, rotation:-15}, {opacity: 1, scale:1, rotation:0, duration: 0.6, ease:"back.out(1.5)"}, 16.0);

                // Left Panel Appears - "مجموعة من الخطوات" at 22.4s
                currentTimeline.fromTo(container.querySelector('#fw-panel-left'), {opacity: 0, y: 30}, {opacity: 1, y: 0, duration: 0.6, ease:"power2.out"}, 21.0);
                currentTimeline.fromTo(container.querySelectorAll('#fw-panel-left .gs-fw-icon'), {opacity: 0, scale: 0}, {opacity: 1, scale: 1, duration: 0.4, ease:"back.out(1.5)"}, 21.5);
                
                // Draw dotted line for Left Panel
                currentTimeline.to(container.querySelector('.fw-l-line'), {scaleY: 1, duration: 2, ease:"none"}, 22.0);
                
                // Left items precise timings
                const lItems = container.querySelectorAll('.gs-fw-l-item');
                if(lItems.length >= 6) {
                    currentTimeline.fromTo(lItems[0], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 25.16); // بتحديد القيم والأهداف
                    currentTimeline.fromTo(lItems[1], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 27.86); // وضع السياسات وآليات الامتثال
                    currentTimeline.fromTo(lItems[2], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 32.56); // تصميم هياكل
                    currentTimeline.fromTo(lItems[3], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 36.26); // البيانات الصحية
                    currentTimeline.fromTo(lItems[4], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 39.56); // وإدارة الموارد البشرية
                    currentTimeline.fromTo(lItems[5], {opacity: 0, y: 20}, {opacity: 1, y: 0, duration: 0.5, ease:"back.out(1.2)"}, 45.04); // بالتطبيق العملي
                }
                
                // Footer Appears - "وعند تكامل هذه المكونات" at 52.26s
                currentTimeline.to(container.querySelector('.gs-fw-footer'), {opacity: 1, y: 0, duration: 0.6, ease:"power2.out"}, 52.0);
                
                // Footer items precise timings
                const fItems = container.querySelectorAll('.gs-fw-f-item');
                if(fItems.length >= 4) {
                    currentTimeline.to(fItems[0], {opacity: 1, x: 0, duration: 0.5, ease:"power2.out"}, 53.0); 
                    currentTimeline.to(fItems[1], {opacity: 1, x: 0, duration: 0.5, ease:"power2.out"}, 54.5); 
                    currentTimeline.to(fItems[2], {opacity: 1, x: 0, duration: 0.5, ease:"power2.out"}, 56.0); 
                    currentTimeline.to(fItems[3], {opacity: 1, x: 0, duration: 0.5, ease:"power2.out"}, 57.74); // وترتفع جودة الأداء المؤسسي
                }

            } else {
                currentTimeline.set(container.querySelectorAll('*'), {opacity: 1, x:0, y:0, scale:1, scaleY:1}, 0);
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
