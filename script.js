const examMeta = {
    "Army TES (10+2)": { icon: "school", desc: "Technical Entry Scheme", highlight: false },
    "Navy 10+2 (B.Tech)": { icon: "sailing", desc: "Cadet Entry Scheme", highlight: false },
    "NDA": { icon: "shield", desc: "National Defence Academy", highlight: false },
    "CDS (IMA/INA)": { icon: "military_tech", desc: "Indian Military Academy", highlight: true },
    "CDS (AFA)": { icon: "flight", desc: "Air Force Academy", highlight: true },
    "CDS (OTA)": { icon: "local_police", desc: "Officers Training Academy", highlight: true },
    "AFCAT (Flying)": { icon: "flight_takeoff", desc: "Air Force Common Admission", highlight: true },
    "AFCAT (Ground Duty)": { icon: "radar", desc: "Air Force Common Admission", highlight: true },
    "ICG AC": { icon: "anchor", desc: "Indian Coast Guard", highlight: true },
    "CAPF AC": { icon: "security", desc: "Central Armed Police Forces", highlight: true },
    "Army SSC Tech": { icon: "engineering", desc: "Short Service Commission", highlight: false },
    "Army NCC Special": { icon: "military_tech", desc: "NCC Special Entry", highlight: false },
    "Navy SSC Tech": { icon: "directions_boat", desc: "Short Service Commission", highlight: false }
};

// ─── FIXED getOfficialRange ───────────────────────────────────────────────────
// courseYear  : year the course commences
// courseMonth : 0-based month of commencement (Jan=0, Jul=6)
// minAge, maxAge : years, may include a .5 (6-month) fraction
//
// Matches UPSC pattern verified from official notifications:
//   CDS II 2025 → course Jul 2026 → IMA: 2 Jul 2002 – 1 Jul 2007
//   CDS I  2026 → course Jan 2027 → IMA: 2 Jan 2003 – 1 Jan 2008
//
// Age is subtracted in whole months rather than passed straight into the
// Date constructor, since `new Date(2006.5, 0, 1)` truncates the .5 instead
// of shifting by 6 months — that silently broke every .5-age exam (Army TES,
// Navy 10+2, NDA) before this fix.
function subtractAgeFromDate(year, month, day, ageYears) {
    const totalMonths = year * 12 + month;
    const ageMonths = Math.round(ageYears * 12);
    const resultTotalMonths = totalMonths - ageMonths;
    const resultYear = Math.floor(resultTotalMonths / 12);
    const resultMonth = ((resultTotalMonths % 12) + 12) % 12;
    return new Date(resultYear, resultMonth, day);
}

function getOfficialRange(courseYear, courseMonth, minAge, maxAge) {
    // "not later than 1st <month> <year-minAge>"
    let maxDate = subtractAgeFromDate(courseYear, courseMonth, 1, minAge);
    // "not earlier than 2nd <month> <year-maxAge>"
    let minDate = subtractAgeFromDate(courseYear, courseMonth, 2, maxAge);
    return { min: minDate, max: maxDate };
}

function calculate() {
    const dobInput = document.getElementById('dob');
    if (!dobInput.value) {
        showStatusMessage({
            icon: 'calendar_month',
            title: 'Enter your date of birth above',
            text: 'to see your remaining attempts across all listed defence exams.'
        });
        return;
    }

    const parts = dobInput.value.split('-');
    const dob = new Date(parts[0], parts[1] - 1, parts[2]);

    const categoryBonus = parseInt(document.getElementById('category').value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(dob.getTime())) {
        showStatusMessage({
            icon: 'error',
            title: 'Invalid date',
            text: 'Please enter a valid date of birth.',
            isError: true
        });
        return;
    }

    if (dob > today) {
        showStatusMessage({
            icon: 'error',
            title: 'Invalid date of birth',
            text: 'Date of birth cannot be in the future.',
            isError: true
        });
        return;
    }

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = "";

    // ── Exam definitions ──────────────────────────────────────────────────────
    // offset1 / offset2 : 0-based commencement month for session I / II
    // examMonth1/2      : 0-based month the written exam is held (for past/future badge)
    // nextYear          : true  → course commences in year+1 (CDS, NDA)
    //                     false → course commences in same year (AFCAT, ICG, etc.)
    const exams = [
        // 10+2 entries — course same year, Jan / Jul
        { name: "Army TES (10+2)",     min: 16.5, max: 19.5, freq: 2, nextYear: false, offset1: 0, offset2: 6, examMonth1: 0, examMonth2: 6 },
        { name: "Navy 10+2 (B.Tech)",  min: 16.5, max: 19.5, freq: 2, nextYear: false, offset1: 0, offset2: 6, examMonth1: 0, examMonth2: 6 },

        // NDA — exam Apr/Sept, course commences Jan/Jul of NEXT year
        { name: "NDA",                 min: 15,   max: 18.5, freq: 2, nextYear: true,  offset1: 0, offset2: 6, examMonth1: 3, examMonth2: 8 },

        // CDS — exam Apr/Sept, course commences Jan/Jul of NEXT year
        // Verified: CDS II 2025 → course Jul 2026; CDS I 2026 → course Jan 2027
        { name: "CDS (IMA/INA)",       min: 19,   max: 24,   freq: 2, nextYear: true,  offset1: 0, offset2: 6, examMonth1: 3, examMonth2: 8 },
        { name: "CDS (AFA)",           min: 20,   max: 24,   freq: 2, nextYear: true,  offset1: 0, offset2: 6, examMonth1: 3, examMonth2: 8 },
        { name: "CDS (OTA)",           min: 19,   max: 25,   freq: 2, nextYear: true,  offset1: 0, offset2: 6, examMonth1: 3, examMonth2: 8 },

        // AFCAT — exam Feb/Aug, course commences Jan/Jul same year
        { name: "AFCAT (Flying)",      min: 20,   max: 24,   freq: 2, nextYear: false, offset1: 0, offset2: 6, examMonth1: 1, examMonth2: 7 },
        { name: "AFCAT (Ground Duty)", min: 20,   max: 26,   freq: 2, nextYear: false, offset1: 0, offset2: 6, examMonth1: 1, examMonth2: 7 },

        // ICG AC — two cycles, course Jan/Jul same year
        { name: "ICG AC",              min: 21,   max: 25 + categoryBonus, freq: 2, nextYear: false, offset1: 0, offset2: 6, examMonth1: 3, examMonth2: 9 },

        // CAPF AC — once a year, age as of 1 Aug
        { name: "CAPF AC",             min: 20,   max: 25 + categoryBonus, freq: 1, nextYear: false, offset1: 7, offset2: -1, examMonth1: 7, examMonth2: -1 },

        // Army SSC Tech — Apr & Oct, course Jan/Jul same year
        { name: "Army SSC Tech",       min: 20,   max: 27,   freq: 2, nextYear: false, offset1: 0, offset2: 6, examMonth1: 3, examMonth2: 9 },
        { name: "Army NCC Special",    min: 19,   max: 25,   freq: 2, nextYear: false, offset1: 0, offset2: 6, examMonth1: 3, examMonth2: 9 },
        { name: "Navy SSC Tech",       min: 21,   max: 25,   freq: 2, nextYear: false, offset1: 0, offset2: 6, examMonth1: 0, examMonth2: 6 },
    ];

    const minPossibleAge = Math.min(...exams.map(e => e.min));
    const maxPossibleAge = Math.max(...exams.map(e => e.max));

    const currentAge = getAgeInYears(dob, today);
    if (currentAge > maxPossibleAge + 5) {
        showStatusMessage({
            icon: 'sentiment_dissatisfied',
            title: 'No eligible exams for this date of birth',
            text: `At ${currentAge} years old, this is above the upper age limit for every exam listed here.`,
            isError: true
        });
        return;
    }

    const startYear = dob.getFullYear() + Math.floor(minPossibleAge) - 1;
    const endYear   = dob.getFullYear() + Math.ceil(maxPossibleAge) + 3;

    let totalRemainingAttempts = 0;
    let lastChances = [];
    let examCountWithFutureAttempts = 0;

    exams.forEach(exam => {
        let attemptList = [];

        for (let year = startYear; year <= endYear; year++) {

            // ── Session I ──────────────────────────────────────────────────
            {
                const courseYear = exam.nextYear ? year + 1 : year;
                const range = getOfficialRange(courseYear, exam.offset1, exam.min, exam.max);

                if (dob >= range.min && dob <= range.max) {
                    const examDate = new Date(year, exam.examMonth1, 15);
                    const status   = examDate < today ? "status-past" : "status-future";
                    const label    = exam.freq === 1 ? `${year}` : `${year}-I`;
                    attemptList.push({ lbl: label, status });
                }
            }

            // ── Session II (bi-annual only) ────────────────────────────────
            if (exam.freq === 2) {
                const courseYear = exam.nextYear ? year + 1 : year;
                const range = getOfficialRange(courseYear, exam.offset2, exam.min, exam.max);

                if (dob >= range.min && dob <= range.max) {
                    const examDate = new Date(year, exam.examMonth2, 15);
                    const status   = examDate < today ? "status-past" : "status-future";
                    attemptList.push({ lbl: `${year}-II`, status });
                }
            }
        }

        // ── Count future attempts ──────────────────────────────────────────
        let futureCount = 0;
        let lastFutureIndex = -1;
        attemptList.forEach((item, i) => {
            if (item.status === 'status-future') {
                futureCount++;
                lastFutureIndex = i;
            }
        });

        totalRemainingAttempts += futureCount;

        if (futureCount > 0) {
            examCountWithFutureAttempts++;
            if (futureCount === 1) lastChances.push(exam.name);
        }

        // ── Render row ─────────────────────────────────────────────────────
        if (attemptList.length > 0) {
            const html = attemptList.map((item, index) => {
                const isLastChance = futureCount === 1 && index === lastFutureIndex;
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
                                <span class="material-symbols-outlined" aria-hidden="true">${meta.icon}</span>
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
    document.getElementById('total-attempts-count').innerText = `${totalRemainingAttempts}`;

    const lastChanceText = lastChances.length > 0 ? lastChances.join(', ') : 'None';
    const lastChanceEl = document.getElementById('last-chance-exam');
    lastChanceEl.innerText = lastChanceText;
    lastChanceEl.title = lastChanceText;

    showResults();
}

function getAgeInYears(dob, today) {
    let age = today.getFullYear() - dob.getFullYear();
    const hadBirthday = today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
    if (!hadBirthday) age--;
    return age;
}

function showStatusMessage({ icon, title, text, isError = false }) {
    document.getElementById('results-section').classList.add('hidden');
    const statusMessage = document.getElementById('status-message');
    statusMessage.classList.remove('hidden');

    const iconEl = document.getElementById('status-message-icon');
    iconEl.textContent = icon;
    iconEl.className = `material-symbols-outlined text-4xl ${isError ? 'text-orange-500 dark:text-orange-400' : 'text-primary/60 dark:text-blue-400/60'}`;

    document.getElementById('status-message-title').textContent = title;
    document.getElementById('status-message-text').textContent = text;
}

function showResults() {
    document.getElementById('status-message').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
}

function applyTheme(isDark) {
    document.documentElement.classList.toggle('dark', isDark);
    const icon = document.getElementById('theme-toggle-icon');
    if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.setAttribute('aria-pressed', String(isDark));
}

function toggleTheme() {
    const isDark = !document.documentElement.classList.contains('dark');
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {}
    applyTheme(isDark);
}

function initApp() {
    const dobInput = document.getElementById('dob');
    dobInput.max = new Date().toISOString().slice(0, 10);

    applyTheme(document.documentElement.classList.contains('dark'));
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.onclick = toggleTheme;

    calculate();
}

document.addEventListener('DOMContentLoaded', initApp);
