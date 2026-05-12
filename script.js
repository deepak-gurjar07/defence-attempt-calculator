// ─── CORRECTED getOfficialRange ───────────────────────────────────────────────
//
// UPSC specifies age as of the 1st of the course commencement month.
// "born not earlier than" → courseDate - maxAge  (add 1 day → 2nd)
// "born not later than"   → courseDate - minAge  (→ 1st)
//
// courseYear  : year the course commences (exam year + 1 for CDS/AFCAT etc.)
// courseMonth : 0-based month of commencement (Jan=0, Jul=6 …)
// minAge, maxAge : in whole years (no fractional months needed for CDS/AFCAT)

function getOfficialRange(courseYear, courseMonth, minAge, maxAge) {
    // "not later than" → born on or before (courseDate - minAge)
    let maxDate = new Date(courseYear - minAge, courseMonth, 1);   // 1st of that month

    // "not earlier than" → born on or after (courseDate - maxAge + 1 day)
    let minDate = new Date(courseYear - maxAge, courseMonth, 2);   // 2nd of that month

    return { min: minDate, max: maxDate };
}

// ─── VERIFIED PATTERN FROM OFFICIAL NOTIFICATIONS ────────────────────────────
//
// CDS II 2025  → course commences Jul 2026  → window: 2 Jul 2001 – 1 Jul 2007 (OTA)
//                                                       2 Jul 2002 – 1 Jul 2007 (IMA)
// CDS I  2026  → course commences Jan 2027  → window: 2 Jan 2002 – 1 Jan 2008 (OTA)
//                                                       2 Jan 2003 – 1 Jan 2008 (IMA)
//
// Pattern: every session shifts dates forward by 6 months. ✅
// Course commencement = January (session I) or July (session II) of the NEXT year.
//
// So for exam year Y:
//   Session I  → courseYear = Y+1, courseMonth = 0  (January)
//   Session II → courseYear = Y+1, courseMonth = 6  (July)

// ─── CORRECTED calculate() ────────────────────────────────────────────────────

function calculate() {
    const dobInput = document.getElementById('dob');
    if (!dobInput.value) return;

    const parts = dobInput.value.split('-');
    const dob = new Date(parts[0], parts[1] - 1, parts[2]);

    const categoryBonus = parseInt(document.getElementById('category').value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = "";

    // ── Exam definitions ──────────────────────────────────────────────────────
    // comMonth1 / comMonth2 : 0-based month of course commencement for session I / II
    // examMonth1/2          : 0-based month the written exam is actually held
    //                         (used only to decide past/future badge colour)
    // For CDS & NDA: I ≈ April exam → Jan commencement next year
    //                II ≈ Sept exam  → Jul commencement next year
    const exams = [
        // 10+2 entries – age calculated at course start (~Jan / Jul of SAME year as exam)
        { name: "Army TES (10+2)",    min: 16.5, max: 19.5, freq: 2,
          comMonth1: 0,  comMonth2: 6,  sameYear: true,
          examMonth1: 0, examMonth2: 6 },
        { name: "Navy 10+2 (B.Tech)", min: 16.5, max: 19.5, freq: 2,
          comMonth1: 0,  comMonth2: 6,  sameYear: true,
          examMonth1: 0, examMonth2: 6 },

        // NDA – exam Apr/Sept, course Jan/Jul of next year
        { name: "NDA",                min: 15,   max: 18.5, freq: 2,
          comMonth1: 0,  comMonth2: 6,  sameYear: false,
          examMonth1: 3, examMonth2: 8 },

        // CDS – exam Apr/Sept, course Jan/Jul of next year
        { name: "CDS (IMA/INA)",      min: 19,   max: 24,   freq: 2,
          comMonth1: 0,  comMonth2: 6,  sameYear: false,
          examMonth1: 3, examMonth2: 8 },
        { name: "CDS (AFA)",          min: 20,   max: 24,   freq: 2,
          comMonth1: 0,  comMonth2: 6,  sameYear: false,
          examMonth1: 3, examMonth2: 8 },
        { name: "CDS (OTA)",          min: 19,   max: 25,   freq: 2,
          comMonth1: 0,  comMonth2: 6,  sameYear: false,
          examMonth1: 3, examMonth2: 8 },

        // AFCAT – Feb/Aug exam, course Jan/Jul of SAME year
        { name: "AFCAT (Flying)",     min: 20,   max: 24,   freq: 2,
          comMonth1: 0,  comMonth2: 6,  sameYear: true,
          examMonth1: 1, examMonth2: 7 },
        { name: "AFCAT (Ground Duty)",min: 20,   max: 26,   freq: 2,
          comMonth1: 0,  comMonth2: 6,  sameYear: true,
          examMonth1: 1, examMonth2: 7 },

        // ICG AC – two cycles, commencement ~Jan & Jul same year
        { name: "ICG AC",             min: 21,   max: 25 + categoryBonus, freq: 2,
          comMonth1: 0,  comMonth2: 6,  sameYear: true,
          examMonth1: 3, examMonth2: 9 },

        // CAPF AC – once a year, August exam, age as of 1 Aug
        { name: "CAPF AC",            min: 20,   max: 25 + categoryBonus, freq: 1,
          comMonth1: 7,  comMonth2: -1, sameYear: true,
          examMonth1: 7, examMonth2: -1 },

        // Army SSC Tech – Apr & Oct notifications, course Jan & Jul
        { name: "Army SSC Tech",      min: 20,   max: 27,   freq: 2,
          comMonth1: 0,  comMonth2: 6,  sameYear: true,
          examMonth1: 3, examMonth2: 9 },
        { name: "Army NCC Special",   min: 19,   max: 25,   freq: 2,
          comMonth1: 0,  comMonth2: 6,  sameYear: true,
          examMonth1: 3, examMonth2: 9 },
        { name: "Navy SSC Tech",      min: 21,   max: 25,   freq: 2,
          comMonth1: 0,  comMonth2: 6,  sameYear: true,
          examMonth1: 0, examMonth2: 6 },
    ];

    const startYear = dob.getFullYear() + 14;
    const endYear   = dob.getFullYear() + 32;

    let examCountWithFutureAttempts = 0;
    let lastChances = [];

    exams.forEach(exam => {
        let attemptList = [];

        for (let year = startYear; year <= endYear; year++) {

            // ── Session I ────────────────────────────────────────────────────
            {
                const courseYear  = exam.sameYear ? year : year + 1;
                const courseMonth = exam.comMonth1;
                const range = getOfficialRange(courseYear, courseMonth, exam.min, exam.max);

                if (dob >= range.min && dob <= range.max) {
                    // Exam date: used only for past/future colouring
                    const examDate = new Date(year, exam.examMonth1, 15);
                    const status   = examDate < today ? "status-past" : "status-future";
                    const label    = exam.freq === 1 ? `${year}` : `${year}-I`;
                    attemptList.push({ lbl: label, status });
                }
            }

            // ── Session II (bi-annual exams only) ────────────────────────────
            if (exam.freq === 2) {
                const courseYear  = exam.sameYear ? year : year + 1;
                const courseMonth = exam.comMonth2;
                const range = getOfficialRange(courseYear, courseMonth, exam.min, exam.max);

                if (dob >= range.min && dob <= range.max) {
                    const examDate = new Date(year, exam.examMonth2, 15);
                    const status   = examDate < today ? "status-past" : "status-future";
                    attemptList.push({ lbl: `${year}-II`, status });
                }
            }
        }

        // ── Count future attempts ─────────────────────────────────────────────
        let futureCount = 0;
        let lastFutureIndex = -1;
        attemptList.forEach((item, i) => {
            if (item.status === 'status-future') {
                futureCount++;
                lastFutureIndex = i;
            }
        });

        if (futureCount > 0) {
            examCountWithFutureAttempts++;
            if (futureCount === 1) lastChances.push(exam.name);
        }

        // ── Render ────────────────────────────────────────────────────────────
        if (attemptList.length > 0) {
            const html = attemptList.map((item, index) => {
                const isLastChance = index === lastFutureIndex;
                const isPast       = item.status === 'status-past';

                if (isPast) {
                    return `<span class="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 line-through whitespace-nowrap">${item.lbl}</span>`;
                } else if (isLastChance) {
                    return `<span class="inline-flex items-center px-3 py-1 rounded border border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 text-xs font-bold shadow-sm whitespace-nowrap">${item.lbl}</span>`;
                } else {
                    return `<span class="inline-flex items-center px-3 py-1 rounded border border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 text-xs font-bold shadow-sm whitespace-nowrap">${item.lbl}</span>`;
                }
            }).join('');

            const meta = examMeta[exam.name] || { icon: "assignment", desc: "Defense Examination", highlight: false };
            const isHighlight = meta.highlight;

            let wrapperClass = "p-6 md:p-8 flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6 md:items-center hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group";
            let iconBgClass  = "bg-primary-light/50 dark:bg-gray-800 text-primary/70 dark:text-gray-400";
            const titleClass = "group-hover:text-primary dark:group-hover:text-blue-400";

            if (isHighlight) {
                wrapperClass += " border-l-4 border-l-primary dark:border-l-blue-500 bg-white dark:bg-transparent";
                iconBgClass   = "bg-primary-light/50 dark:bg-blue-900/20 text-primary dark:text-blue-400 shadow-sm";
            }

            const remainingBadgeClass = futureCount > 0
                ? "bg-primary text-white dark:bg-blue-900/40 dark:text-blue-300 shadow-md shadow-primary/20"
                : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700";

            let exceptionText = "";
            if (exam.name === "Navy SSC Tech") {
                exceptionText = `<p class="text-[10px] text-orange-600 dark:text-orange-400 mt-1 font-semibold italic">Exception: Law Cadre age limit is 22 to 27 yrs</p>`;
            } else if (exam.name === "AFCAT (Flying)") {
                exceptionText = `<p class="text-[10px] text-orange-600 dark:text-orange-400 mt-1 font-semibold italic">Exception: CPL holders age limit is up to 26 yrs</p>`;
            }

            resultsDiv.innerHTML += `
                <div class="${wrapperClass}">
                    <div class="col-span-4 lg:col-span-3 mb-4 md:mb-0">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full ${iconBgClass} flex shrink-0 items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                                <span class="material-symbols-outlined">${meta.icon}</span>
                            </div>
                            <div class="min-w-0">
                                <h3 class="text-base font-bold text-text-main-light dark:text-text-main-dark ${titleClass} transition-colors truncate">${exam.name}</h3>
                                <p class="text-xs text-text-muted-light dark:text-text-muted-dark mt-1 font-medium truncate">${meta.desc}</p>
                                ${exceptionText}
                            </div>
                        </div>
                    </div>
                    <div class="col-span-7 lg:col-span-8 overflow-x-auto timeline-scroll pb-2 md:pb-0">
                        <div class="flex gap-2 min-w-max items-center">
                            ${html}
                        </div>
                    </div>
                    <div class="mt-2 md:mt-0 flex w-full md:w-auto md:block md:col-span-1 justify-end">
                        <span class="inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-bold ${remainingBadgeClass} whitespace-nowrap min-w-[70px]">
                            ${futureCount} Left
                        </span>
                    </div>
                </div>`;
        }
    });

    if (resultsDiv.innerHTML === "") {
        resultsDiv.innerHTML = "<div class='p-8 text-center text-gray-500 dark:text-gray-400'>No attempts found.</div>";
    }

    document.getElementById('eligible-exams-count').innerText = `${examCountWithFutureAttempts} Exams`;
    document.getElementById('last-chance-exam').innerText = lastChances.length > 0 ? lastChances.join(', ') : 'None';
}

window.onload = calculate;
