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

    const exams = [
        { name: "Army TES (10+2)", min: 16.5, max: 19.5, freq: 2, offset1: 0, offset2: 6 },
        { name: "Navy 10+2 (B.Tech)", min: 16.5, max: 19.5, freq: 2, offset1: 0, offset2: 6 },

        { name: "NDA", min: 16.5, max: 19.5, freq: 2, offset1: 0, offset2: 6 },
        { name: "CDS (IMA/INA)", min: 19, max: 24, freq: 2, offset1: 0, offset2: 6 },
        { name: "CDS (AFA)", min: 20, max: 24, freq: 2, offset1: 0, offset2: 6 },
        { name: "CDS (OTA)", min: 19, max: 25, freq: 2, offset1: 0, offset2: 6 },
        { name: "AFCAT (Flying)", min: 20, max: 24, freq: 2, offset1: 0, offset2: 6 },
        { name: "AFCAT (Ground Duty)", min: 20, max: 26, freq: 2, offset1: 0, offset2: 6 },
        { name: "ICG AC", min: 21, max: 25 + categoryBonus, freq: 2, offset1: 0, offset2: 6 },

        { name: "CAPF AC", min: 20, max: 25 + categoryBonus, freq: 1, offset1: 7 },

        { name: "Army SSC Tech", min: 20, max: 27, freq: 2, offset1: 3, offset2: 9 },
        { name: "Army NCC Special", min: 19, max: 25, freq: 2, offset1: 3, offset2: 9 },
        { name: "Navy SSC Tech", min: 19.5, max: 25, freq: 2, offset1: 0, offset2: 6 }
    ];

    const startYear = dob.getFullYear() + 15;
    const endYear = dob.getFullYear() + 35;

    let totalEligibleExams = 0;
    let lastChances = [];
    let examCountWithFutureAttempts = 0;

    exams.forEach(exam => {
        let attemptList = [];
        let futureCount = 0;

        for (let year = startYear; year <= endYear; year++) {

            let courseYear1 = (exam.name.includes("CAPF")) ? year : year + 1;
            let range1 = getOfficialRange(courseYear1, exam.offset1, exam.min, exam.max);

            if (dob >= range1.min && dob <= range1.max) {
                let examDate1 = new Date(year, exam.offset1, 15);
                if (exam.name.includes("CDS") || exam.name.includes("NDA")) examDate1 = new Date(year, 3, 15);

                let status = examDate1 < today ? "status-past" : "status-future";
                attemptList.push({ lbl: exam.freq === 1 ? `${year}` : `${year}-I`, status: status });
            }

            if (exam.freq === 2) {
                let courseYear2 = year + 1;
                let range2 = getOfficialRange(courseYear2, exam.offset2, exam.min, exam.max);

                if (dob >= range2.min && dob <= range2.max) {
                    let examDate2 = new Date(year, 8, 4);
                    let status = examDate2 < today ? "status-past" : "status-future";
                    attemptList.push({ lbl: `${year}-II`, status: status });
                }
            }
        }

        attemptList.forEach(item => { if (item.status === 'status-future') futureCount++; });
        totalEligibleExams += futureCount;

        let lastFutureIndex = -1;
        for (let i = attemptList.length - 1; i >= 0; i--) {
            if (attemptList[i].status === 'status-future') {
                lastFutureIndex = i;
                break;
            }
        }

        if (futureCount > 0) {
            examCountWithFutureAttempts++;
            let hasPastAttempts = attemptList.some(item => item.status === 'status-past');
            if (futureCount === 1) {
                lastChances.push(exam.name);
            }
        }

        if (attemptList.length > 0) {
            let html = "";
            if (exam.name.includes("AFCAT (Ground")) {
                // Avoid duplication if they appear the same way, but let's just let it render.
            }
            html = attemptList.map((item, index) => {
                let isLastChance = (index === lastFutureIndex);
                let isPast = (item.status === 'status-past');

                if (isPast) {
                    return `<span class="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 line-through whitespace-nowrap">${item.lbl}</span>`;
                } else if (isLastChance) {
                    return `<span class="inline-flex items-center px-3 py-1 rounded border border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400 text-xs font-bold shadow-sm whitespace-nowrap">${item.lbl}</span>`;
                } else {
                    return `<span class="inline-flex items-center px-3 py-1 rounded border border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 text-xs font-bold shadow-sm whitespace-nowrap">${item.lbl}</span>`;
                }
            }).join('');

            let meta = examMeta[exam.name] || { icon: "assignment", desc: "Defense Examination", highlight: false };

            let isHighlight = meta.highlight;

            let wrapperClass = "p-6 md:p-8 flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6 md:items-center hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group";
            let iconBgClass = "bg-primary-light/50 dark:bg-gray-800 text-primary/70 dark:text-gray-400";
            let titleClass = "group-hover:text-primary dark:group-hover:text-blue-400";

            if (isHighlight) {
                wrapperClass += " border-l-4 border-l-primary dark:border-l-blue-500 bg-white dark:bg-transparent";
                iconBgClass = "bg-primary-light/50 dark:bg-blue-900/20 text-primary dark:text-blue-400 shadow-sm";
            }

            let remainingBadgeClass = futureCount > 0
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

function getOfficialRange(courseYear, courseMonth, minAge, maxAge) {
    let minYear = courseYear - Math.floor(maxAge);
    let minMonth = courseMonth - (maxAge % 1 * 12);
    let minDate = new Date(minYear, minMonth, 2);

    let maxYear = courseYear - Math.floor(minAge);
    let maxMonth = courseMonth - (minAge % 1 * 12);
    let maxDate = new Date(maxYear, maxMonth, 1);

    return { min: minDate, max: maxDate };
}

window.onload = calculate;
