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
        id: "S02_MODELS",
        type: "custom-models-grid",
        title: "نماذج وهياكل الحوكمة الصحية",
        duration: 53,
        cards: [
            { id: "card1", time: 5.1 },
            { id: "card2", time: 11.9 },
            { id: "card3", time: 21.0 },
            { id: "card4", time: 28.2 },
            { id: "card5", time: 36.1 },
            { id: "card6", time: 43.8 }
        ]
    },
    {
        id: "S03_FRAMEWORK",
        type: "framework-split",
        title: "تطوير وتطبيق أطر الحوكمة",
        duration: 30,
        rightItems: [
            { num: "01", text: "مجلس الإدارة: يوجه ويشرف", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
            { num: "02", text: "اللجان المتخصصة: تحلل وتوصي", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
            { num: "03", text: "مصفوفة الصلاحيات: تضبط القرار", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>' },
            { num: "04", text: "السياسات: تحدد الالتزام", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>' },
            { num: "05", text: "الإجراءات: تترجم الالتزام إلى ممارسة يومية", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' }
        ],
        leftItems: [
            { text: "تحديد القيم والأهداف المؤسسية", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>' },
            { text: "وضع السياسات وآليات الامتثال", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L12 22"/><path d="M6 10L18 10"/><path d="M3 15L9 15"/><path d="M15 15L21 15"/></svg>' }, 
            { text: "تصميم هياكل المساءلة والشفافية", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>' },
            { text: "إدارة البيانات الصحية بمسؤولية", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>' },
            { text: "إدارة الموارد البشرية بكفاءة", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
            { text: "التطبيق عبر تدريب مستمر وتقييم دوري", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>' }
        ],
        footerItems: [
            { text: "التحسين المستمر", divider: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>' },
            { text: "تعزيز الثقة والشفافية", divider: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
            { text: "رفع الجودة والسلامة", divider: true, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>' },
            { text: "تحسين الأداء المؤسسي", divider: false, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>' }
        ]
    },
    {
        id: "S04_RELATIONSHIP",
        type: "three-pillars-flow",
        title: "العلاقة بين الحوكمة والامتثال",
        duration: 30,
        pillars: [
            {
                id: "gov",
                title: "الحوكمة تحدد الإطار",
                num: "1",
                subtitle: "من يقرر - ماذا يُقرر - كيف يُحاسب",
                color: "#1B3B5A",
                items: [
                    "توزّع الأدوار بين مجلس الإدارة والإدارة واللجان",
                    "مصفوفة الصلاحيات (DoA) تضبط القرار وتمنع التداخل",
                    "السياسات تترجم الاستراتيجية إلى ممارسة يومية",
                    "آليات المساءلة والشفافية تحمي القرار",
                    "تحدد من يُبلّغ ومتى وأي آلية"
                ],
                icons: [
                    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>',
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h3M19 12h3M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"/><circle cx="12" cy="12" r="4"/></svg>'
                ]
            },
            {
                id: "comp",
                title: "الامتثال يضمن التطبيق",
                num: "2",
                subtitle: "ماذا يُلزم - كيف يُراقب - أين الفجوات",
                color: "#237A74",
                items: [
                    "يحوّل المتطلبات التنظيمية إلى ضوابط قابلة للقياس",
                    "يراقب التطبيق الفعلي ويختبر فعالية الضوابط",
                    "يعالج أسباب عدم الامتثال الجذرية لا الظاهرية",
                    "يرفع تقارير دورية للقيادة لدعم القرار",
                    "يبني ثقافة مؤسسية تلتزم بروح النظام لا حرفه"
                ],
                icons: [
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>'
                ]
            },
            {
                id: "int",
                title: "التكامل = استدامة الأداء",
                num: "3",
                subtitle: "معاً نحصان المنشأة",
                color: "#CFA043",
                items: [
                    "الحوكمة بلا امتثال: سلطة بلا أثر",
                    "الامتثال بلا حوكمة: تنفيذ بلا توجيه",
                    "التكامل بينهما يصنع منشأة مستدامة",
                    "تترجم الاستراتيجية إلى ممارسة يومية محمية",
                    "يبني ثقة المرضى والجهات التنظيمية والمجتمع"
                ],
                icons: [
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>',
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>',
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
                    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
                ]
            }
        ],
        footerFlow: [
            { text: "حوكمة قوية + امتثال = استدامة ونمو", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>' },
            { text: "قرارات أفضل وقيمة أعلى", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' },
            { text: "تقليل المخاطر والغرامات", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
            { text: "تحسين الأداء المؤسسي", icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
            { text: "ثقة المستفيدين والمجتمع", icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' }
        ]
    },
    {
        id: "S05_ACTIVITY",
        type: "scenario-activity",
        title: "نشاط: الحوكمة أم الامتثال؟ — تمييز الأدوار",
        duration: 30, // Default duration, can be adjusted
        scenario: {
            label: "السيناريو",
            text: "لاحظت لجنة الجودة في مستشفى أن 30% من الأطباء لا يوافقون تقارير الخروج وفق السياسة المعتمدة. صنّف كل إجراء أدناه: هل هو قرار حوكمة أم إجراء امتثال؟ ولماذا؟",
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6v4"/><path d="M14 14h-4v4"/><path d="M14 18h4v-4h-4"/><path d="M10 18H6v-4h4"/><path d="M14 10h-4V6h4"/><path d="M10 10H6v4h4"/><path d="M18 22V6c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v16"/><path d="M2 22h20"/><path d="M12 2v4"/><path d="M7 23l1-2 1 2"/><path d="M11 23l1-2 1 2"/><path d="M15 23l1-2 1 2"/></svg>'
        },
        centerNode: {
            title: "تمييز الأدوار",
            subtitle: "حوكمة أم امتثال؟",
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16"/><path d="M4 2v20"/><path d="M20 2v20"/><path d="M4 6h16"/><path d="M4 18h16"/><path d="M8 6v12"/><path d="M12 6v12"/><path d="M16 6v12"/><path d="M12 2v4"/></svg>'
        },
        options: [
            {
                id: "opt1",
                num: 1,
                type: "compliance", // Green
                title: "حوكمة / امتثال؟",
                text: "إصدار سياسة جديدة تلزم بالتوثيق الإلكتروني خلال 24 ساعة",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 10 2 2 4-4"/><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>'
            },
            {
                id: "opt2",
                num: 2,
                type: "governance", // Gold
                title: "حوكمة / امتثال؟",
                text: "إنشاء لجنة مراجعة تقارير الخروج شهرياً",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><circle cx="11.5" cy="11.5" r="2.5"/><path d="M13.25 13.25 16 16"/></svg>'
            },
            {
                id: "opt3",
                num: 3,
                type: "compliance", // Green
                title: "حوكمة / امتثال؟",
                text: "إرسال تنبيهات تلقائية للأطباء المتأخرين في التوثيق",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12.5"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/><path d="M20 14v4"/><path d="M20 22v.01"/></svg>'
            },
            {
                id: "opt4",
                num: 4,
                type: "governance", // Gold
                title: "حوكمة / امتثال؟",
                text: "ربط الامتثال بالتوثيق بمؤشرات أداء الطبيب السنوية",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" transform="scale(0.6) translate(20, 15)"/></svg>'
            }
        ],
        footerFlow: [
            { text: "حوكمة واضحة تضع الاتجاه", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>' },
            { text: "امتثال فعال يضمن التطبيق", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>' },
            { text: "بيانات دقيقة وتقارير موثوقة", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>' },
            { text: "تحسين الأداء وجودة الرعاية", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
            { text: "تحقيق الأهداف المؤسسية", icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>' }
        ]
    },
    {
        id: "S06_CONFLICT",
        type: "custom-icon-cards",
        title: "",
        duration: 20,
        cards: [
            { 
                text: "تأثير تعارض المصالح على المؤسسة", 
                icon: '<svg viewBox="0 0 24 24" fill="#237a74" width="80" height="80"><path d="M5 3v18h14V3H5zm7 16H8v-2h4v2zm0-4H8v-2h4v2zm0-4H8V9h4v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V9h2v2z"/></svg>',
                targetSlide: "S06_DETAIL_1"
            },
            { 
                text: "تأثير تعارض المصالح على الفرد", 
                icon: '<svg viewBox="0 0 24 24" fill="#1b5a5a" width="80" height="80"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
                targetSlide: "S06_DETAIL_2"
            },
            { 
                text: "كيفية التعامل مع تعارض المصالح", 
                icon: '<svg viewBox="0 0 24 24" fill="#237a74" width="80" height="80"><path d="M21 3H3v18h18V3zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/></svg>',
                targetSlide: "S06_DETAIL_3"
            },
            { 
                text: "أمثلة تعارض المصالح", 
                icon: '<svg viewBox="0 0 24 24" fill="#1b5a5a" width="80" height="80"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>',
                targetSlide: "S06_DETAIL_4"
            }
        ]
    },
    {
        id: "S06_DETAIL_1",
        isBranch: true,
        type: "info",
        title: "تأثير تعارض المصالح على المؤسسة",
        showBackButton: true,
        duration: 10,
        content: "<div style='display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%;'><h2 style='color: #237A74; font-size: 40px; margin-bottom: 30px; font-weight: bold;'>تأثير تعارض المصالح على المؤسسة</h2><p style='font-size: 28px; line-height: 1.8; color: #1B5A5A; max-width: 900px;'>يؤدي تعارض المصالح إلى فقدان الثقة في المؤسسة، اتخاذ قرارات متحيزة، وهدر الموارد المالية والبشرية مما يؤثر سلباً على جودة الخدمات المقدمة.</p></div>"
    },
    {
        id: "S06_DETAIL_2",
        isBranch: true,
        type: "info",
        title: "تأثير تعارض المصالح على الفرد",
        showBackButton: true,
        duration: 10,
        content: "<div style='display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%;'><h2 style='color: #237A74; font-size: 40px; margin-bottom: 30px; font-weight: bold;'>تأثير تعارض المصالح على الفرد</h2><p style='font-size: 28px; line-height: 1.8; color: #1B5A5A; max-width: 900px;'>يعرض الفرد للمساءلة القانونية، تشويه السمعة المهنية، وفقدان النزاهة والمصداقية في بيئة العمل مما قد ينهي مسيرته المهنية بالكامل.</p></div>"
    },
    {
        id: "S06_DETAIL_3",
        isBranch: true,
        type: "info",
        title: "كيفية التعامل مع تعارض المصالح",
        showBackButton: true,
        duration: 10,
        content: "<div style='display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%;'><h2 style='color: #237A74; font-size: 40px; margin-bottom: 30px; font-weight: bold;'>كيفية التعامل مع تعارض المصالح</h2><p style='font-size: 28px; line-height: 1.8; color: #1B5A5A; max-width: 900px;'>يجب الإفصاح الفوري عن أي تعارض محتمل، التنحي عن اتخاذ القرارات المتعلقة به، والالتزام الصارم بسياسات المؤسسة والشفافية التامة.</p></div>"
    },
    {
        id: "S06_DETAIL_4",
        isBranch: true,
        type: "info",
        title: "أمثلة تعارض المصالح",
        showBackButton: true,
        duration: 10,
        content: "<div style='display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%;'><h2 style='color: #237A74; font-size: 40px; margin-bottom: 30px; font-weight: bold;'>أمثلة تعارض المصالح</h2><p style='font-size: 28px; line-height: 1.8; color: #1B5A5A; max-width: 900px;'>قبول هدايا من موردين، توظيف أقارب في مناصب تحت إدارتك المباشرة، أو استغلال معلومات سرية لتحقيق مكاسب شخصية مالية أو معنوية.</p></div>"
    }
]
;

// Allow use in both browser and Node/React if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = courseData;
}
