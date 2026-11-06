
"use strict";

// TeachTrack API
const API_URL = "http://localhost:8080/api";
const TOKEN_KEY = "teachtrack_token";
const USER_KEY = "teachtrack_user";

// Application state
let teachers = [];
let currentPage = 1;
const pageSize = 8;
let editingTeacherId = null;
let toastTimer = null;
// Chart instance for teacher subject distribution
let subjectChart = null;
let salaryChart = null;

// DOM elements
const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const loginButton = document.getElementById("loginButton");

const teacherModal = document.getElementById("teacherModal");
const teacherForm = document.getElementById("teacherForm");
const teacherTableBody = document.getElementById("teacherTableBody");
const pagination = document.getElementById("pagination");
const toast = document.getElementById("toast");

const cancelTeacherButton = document.getElementById("cancelTeacherButton");
const closeModalBtn = document.getElementById("closeModalBtn");

// -------------------- API REQUEST --------------------

async function apiRequest(endpoint, options = {}) {
    const token = sessionStorage.getItem(TOKEN_KEY);

    const headers = {
        ...(options.headers || {})
    };

    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    // Handle unauthorized requests
if (response.status === 401) {
    if (endpoint !== "/auth/login" && endpoint !== "/auth/register") {
        logout();
    }

    throw new Error("Session expired or invalid. Please login again.");
}

// Handle forbidden requests
if (response.status === 403) {
    throw new Error("Access denied. You do not have permission.");
}

// Handle other API errors
if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
        const errorData = await response.json();

        if (Array.isArray(errorData.messages)) {
            message = errorData.messages.join(", ");
        } else if (errorData.message) {
            message = errorData.message;
        } else if (errorData.error) {
            message = errorData.error;
        }
    } catch {
        // Keep the default message.
    }

    throw new Error(message);
}

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }

    return null;
}

// -------------------- LOGIN --------------------


// Clear login error when user edits password
document.getElementById("loginPassword").addEventListener("input", () => {
    loginError.textContent = "";
});


loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    loginError.textContent = "";

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        const result = await apiRequest("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password })
        });

        if (!result || !result.token) {
            throw new Error("Login response did not contain a JWT token.");
        }

        sessionStorage.setItem(TOKEN_KEY, result.token);
        sessionStorage.setItem(
            USER_KEY,
            result.fullName || result.email || email
        );

        document.getElementById("loginPassword").value = "";

        await showDashboard();

    } catch (error) {
        loginError.textContent =
            error.message || "Login failed. Check your credentials.";
    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Login to Dashboard";
    }
});

// -------------------- LOGOUT --------------------

document.getElementById("logoutButton").addEventListener("click", logout);

function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    teachers = [];
    currentPage = 1;

    dashboardSection.hidden = true;
    loginSection.hidden = false;

    loginForm.reset();
    loginError.textContent = "";

    closeTeacherModal();
}

// -------------------- DASHBOARD --------------------

async function showDashboard() {
    loginSection.hidden = true;
    dashboardSection.hidden = false;

    document.getElementById("loggedInUser").textContent =
        sessionStorage.getItem(USER_KEY) || "TeachTrack Admin";

    await loadTeachers();
}

// -------------------- LOAD TEACHERS FROM BACKEND --------------------

async function loadTeachers() {
    console.log("Loading teachers from backend...");

    try {
        const result = await apiRequest("/teachers");

        console.log("GET /api/teachers response:", result);

        if (!Array.isArray(result)) {
            throw new Error("Backend did not return a valid teacher list.");
        }

        teachers = result;

        updateStatistics();
        updateSubjectChart();
        updateSalaryChart();
        populateSubjectFilter();
        renderTeachers();

        console.log("Teachers loaded successfully:", teachers.length);

    } catch (error) {
        console.error("Failed to load teachers:", error);
        showToast(error.message || "Unable to load teachers.", true);
    }
}

// -------------------- SETTINGS NAVIGATION --------------------

const dashboardContainer = document.querySelector(".dashboard-container");
const settingsPage = document.getElementById("settingsPage");
const attendancePage = document.getElementById("attendancePage");
const reportsPage = document.getElementById("reportsPage");

const dashboardNavLink = document.querySelector(
    '.sidebar-link[href="#dashboardSection"]'
);

const teacherNavLink = document.querySelector(
    '.sidebar-link[href="#teacherDirectory"]'
);

const settingsNavLink = document.getElementById("settingsNavLink");
const attendanceNavLink = document.getElementById("attendanceNavLink");
const reportsNavLink = document.getElementById("reportsNavLink");

function showPage(page) {
    const pageTitle = document.getElementById("pageTitle");
    const pageBreadcrumb = document.getElementById("pageBreadcrumb");

    // Hide all page containers before showing the selected page
dashboardContainer.hidden = true;
settingsPage.hidden = true;

if (attendancePage) {
    attendancePage.hidden = true;
}

if (reportsPage) {
    reportsPage.hidden = true;
}
    // Remove active state from sidebar
    document.querySelectorAll(".sidebar-link").forEach(link => {
        link.classList.remove("active");
    });

    if (page === "dashboard") {
    dashboardContainer.hidden = false;

    pageTitle.textContent = "Dashboard Overview";
    pageBreadcrumb.textContent = "Pages / Dashboard";

    dashboardNavLink.classList.add("active");

    // Return to the top of the dashboard
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

    if (page === "teachers") {
        dashboardContainer.hidden = false;

        pageTitle.textContent = "Teacher Directory";
        pageBreadcrumb.textContent = "Pages / Teachers";

        teacherNavLink.classList.add("active");

        setTimeout(() => {
            document.getElementById("teacherDirectory")
                .scrollIntoView({ behavior: "smooth" });
        }, 100);
    }

    if (page === "settings") {
        settingsPage.hidden = false;

        pageTitle.textContent = "Settings";
        pageBreadcrumb.textContent = "Pages / Settings";

        settingsNavLink.classList.add("active");
    }
}

// Dashboard navigation
dashboardNavLink.addEventListener("click", event => {
    event.preventDefault();
    showPage("dashboard");
});

// Teacher navigation
teacherNavLink.addEventListener("click", event => {
    event.preventDefault();
    showPage("teachers");
});

// Settings navigation
settingsNavLink.addEventListener("click", event => {
    event.preventDefault();
    showPage("settings");
});

// -------------------- PROFILE SETTINGS --------------------

const profileSettingsForm = document.getElementById("profileSettingsForm");

const saveProfileBtn = document.getElementById("saveProfileBtn");
const editProfileBtn = document.getElementById("editProfileBtn");

const fullNameInput = document.getElementById("settingsFullName");
const emailInput = document.getElementById("settingsEmail");
const phoneInput = document.getElementById("settingsPhone");

const profileInputs = [
    fullNameInput,
    emailInput,
    phoneInput
];

function setProfileSavedState() {
    profileInputs.forEach(input => {
        input.disabled = true;
    });

    saveProfileBtn.textContent = "✓ Saved";
    saveProfileBtn.classList.add("profile-saved");

    editProfileBtn.hidden = false;
}

function setProfileEditState() {
    profileInputs.forEach(input => {
        input.disabled = false;
    });

    saveProfileBtn.textContent = "Save Profile";
    saveProfileBtn.classList.remove("profile-saved");

    editProfileBtn.hidden = true;
}

function loadProfileSettings() {
    const savedProfile = JSON.parse(
        localStorage.getItem("teachtrack_profile") || "{}"
    );

    fullNameInput.value =
        savedProfile.fullName ||
        sessionStorage.getItem(USER_KEY) ||
        "TeachTrack Admin";

    emailInput.value =
        savedProfile.email || "admin@teachtrack.com";

    phoneInput.value =
        savedProfile.phone || "";

    // Only show Saved state if a profile was previously saved
    if (localStorage.getItem("teachtrack_profile")) {
        setProfileSavedState();
    } else {
        setProfileEditState();
    }
}

profileSettingsForm.addEventListener("submit", event => {
    event.preventDefault();

    const profile = {
        fullName: fullNameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim()
    };

    localStorage.setItem(
        "teachtrack_profile",
        JSON.stringify(profile)
    );

    sessionStorage.setItem(USER_KEY, profile.fullName);

    document.getElementById("loggedInUser").textContent =
        profile.fullName;

    setProfileSavedState();

    showToast("Profile settings saved successfully");
});

// Edit profile
editProfileBtn.addEventListener("click", () => {
    setProfileEditState();
});

loadProfileSettings();

// -------------------- APPEARANCE SETTINGS --------------------

const themeSelect = document.getElementById("themeSelect");
const fontSizeSelect = document.getElementById("fontSizeSelect");

// Apply theme globally
function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("teachtrack_theme", theme);
}

// Apply font size globally
function applyFontSize(size) {
    document.documentElement.setAttribute("data-font-size", size);
    localStorage.setItem("teachtrack_font_size", size);
}

// Theme selection
if (themeSelect) {
    themeSelect.addEventListener("change", () => {
        applyTheme(themeSelect.value);
        showToast("Theme preference saved");
    });
}

// Font size selection
if (fontSizeSelect) {
    fontSizeSelect.addEventListener("change", () => {
        applyFontSize(fontSizeSelect.value);
        showToast("Font size preference saved");
    });
}

// Load saved appearance settings
function loadAppearanceSettings() {
    const savedTheme =
        localStorage.getItem("teachtrack_theme") || "light";

    const savedFontSize =
        localStorage.getItem("teachtrack_font_size") || "medium";

    if (themeSelect) {
        themeSelect.value = savedTheme;
    }

    if (fontSizeSelect) {
        fontSizeSelect.value = savedFontSize;
    }

    applyTheme(savedTheme);
    applyFontSize(savedFontSize);
}

// Load settings when the app starts
loadAppearanceSettings();
// -------------------- NOTIFICATION SETTINGS --------------------

const notificationSettingIds = [
    "emailNotifications",
    "teacherNotifications",
    "systemNotifications"
];

// -------------------- NOTIFICATION SETTINGS --------------------

function loadNotificationSettings() {

    const savedSettings = JSON.parse(
        localStorage.getItem("teachtrack_notifications") || "{}"
    );

    notificationSettingIds.forEach(id => {

        const checkbox = document.getElementById(id);

        // Skip checkbox if it doesn't exist in HTML
        if (!checkbox) {
            console.warn(`Notification checkbox not found: ${id}`);
            return;
        }

        checkbox.checked = savedSettings[id] !== undefined
            ? savedSettings[id]
            : true;
    });
}


// Save notification settings when changed
notificationSettingIds.forEach(id => {

    const checkbox = document.getElementById(id);

    // Prevent errors if checkbox is missing
    if (!checkbox) {
        console.warn(`Notification checkbox not found: ${id}`);
        return;
    }

    checkbox.addEventListener("change", () => {

        const settings = {};

        notificationSettingIds.forEach(settingId => {

            const setting = document.getElementById(settingId);

            if (setting) {
                settings[settingId] = setting.checked;
            }
        });

        localStorage.setItem(
            "teachtrack_notifications",
            JSON.stringify(settings)
        );

        showToast("Notification preferences saved");
    });
});




    // -------------------- SECURITY SETTINGS --------------------

const passwordSettingsForm = document.getElementById("passwordSettingsForm");

if (passwordSettingsForm) {
    passwordSettingsForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const currentPassword =
            document.getElementById("currentSettingsPassword").value.trim();

        const newPassword =
            document.getElementById("newSettingsPassword").value;

        const confirmPassword =
            document.getElementById("confirmSettingsPassword").value;

        const updatePasswordBtn =
            document.getElementById("updatePasswordBtn");

        // Validate current password
        if (!currentPassword) {
            showToast("Please enter your current password.", true);
            return;
        }

        // Validate new password length
        if (newPassword.length < 8) {
            showToast("New password must contain at least 8 characters.", true);
            return;
        }

        // Validate password confirmation
        if (newPassword !== confirmPassword) {
            showToast("New passwords do not match.", true);
            return;
        }

        // Prevent using the current password again
        if (currentPassword === newPassword) {
            showToast("New password must be different from current password.", true);
            return;
        }

        try {
            if (updatePasswordBtn) {
                updatePasswordBtn.disabled = true;
                updatePasswordBtn.textContent = "Updating...";
            }

            await apiRequest("/auth/change-password", {
                method: "PUT",
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                    confirmPassword: confirmPassword
                })
            });

            showToast("Password changed successfully!");

            passwordSettingsForm.reset();

        } catch (error) {
            console.error("Change password error:", error);
            showToast(error.message || "Failed to update password.", true);

        } finally {
            if (updatePasswordBtn) {
                updatePasswordBtn.disabled = false;
                updatePasswordBtn.textContent = "Update Password";
            }
        }
    });
}

// -------------------- DASHBOARD STATISTICS --------------------

 // =========================================
// DASHBOARD STATISTICS
// =========================================

function updateStatistics() {

    const totalTeachers = teachers.length;

    const activeTeachers = teachers.filter(
        teacher => teacher.active === true
    ).length;

    const activePercentage = totalTeachers > 0
        ? (activeTeachers / totalTeachers) * 100
        : 0;

    const totalSubjects = new Set(
        teachers
            .map(teacher => teacher.subject)
            .filter(Boolean)
    ).size;

    const totalSalary = teachers.reduce(
        (total, teacher) =>
            total + Number(teacher.salary || 0),
        0
    );

    // Total teachers
    document.getElementById("totalTeachers").textContent =
        totalTeachers;

    // Active teachers count
    document.getElementById("activeTeachers").textContent =
        activeTeachers;

    // Active teacher percentage
    document.getElementById("activePercent").textContent =
        `${activePercentage.toFixed(1)}%`;

    // Subjects
    document.getElementById("totalSubjects").textContent =
        totalSubjects;

    // Total salary
    document.getElementById("totalSalary").textContent =
        formatCurrency(totalSalary);

}

// =========================================
// TEACHER DISTRIBUTION CHART - FINAL FIX
// =========================================

function updateSubjectChart() {

    const canvas = document.getElementById("subjectChart");
    const legendContainer = document.getElementById("subjectLegend");
    const centerCount = document.getElementById("subjectCenterCount");
    const emptyMessage = document.getElementById("subjectEmpty");

    if (!canvas || !legendContainer) {
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }

    // Count teachers by subject
    const subjectCounts = {};

    teachers.forEach(teacher => {
        const subject = (teacher.subject || "Other").trim();

        if (subject) {
            subjectCounts[subject] =
                (subjectCounts[subject] || 0) + 1;
        }
    });

    const labels = Object.keys(subjectCounts);
    const values = Object.values(subjectCounts);

    const totalTeachers = teachers.length;

    // Update center text
    if (centerCount) {
        centerCount.textContent = totalTeachers;
    }

    // Destroy existing chart
    if (subjectChart) {
        subjectChart.destroy();
        subjectChart = null;
    }

  // Clear custom legend
legendContainer.innerHTML = "";

// Empty chart state
if (labels.length === 0) {

    if (emptyMessage) {
        emptyMessage.hidden = false;
    }

    return;

} else if (emptyMessage) {
    emptyMessage.hidden = true;
}

const colors = [
    "#4f46e5",
    "#06b6d4",
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#3b82f6",
    "#ec4899",
    "#14b8a6",
    "#6366f1",
    "#84cc16",
    "#f97316"
];

// Create custom legend
labels.forEach((subject, index) => {

    const item = document.createElement("li");

    item.innerHTML = `
        <span
            class="legend-dot"
            style="background-color:${colors[index % colors.length]}"
        ></span>

        <span class="legend-name">
            ${escapeHTML(subject)}
        </span>

        <span class="legend-count">
            ${values[index]}
        </span>
    `;

    legendContainer.appendChild(item);

});

// // Reset scrollbar AFTER rendering
// legendContainer.scrollTop = 0;

// requestAnimationFrame(() => {
//     legendContainer.scrollTop = 0;
// });

// Create doughnut chart
subjectChart = new Chart(canvas, {
    type: "doughnut",

    data: {
        labels: labels,
        datasets: [{
            label: "Teachers",
            data: values,
            backgroundColor: labels.map(
                (_, index) => colors[index % colors.length]
            ),
            borderColor: "#ffffff",
            borderWidth: 4,
            hoverOffset: 8
        }]
    },

    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "68%",

        layout: {
            padding: 5
        },

        plugins: {
            legend: {
                display: false
            },

            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `${context.label}: ${context.raw} teacher(s)`;
                    }
                }
            }
        }
    }
});
}

// =========================================
// MONTHLY SALARY OVERVIEW CHART
// =========================================

function updateSalaryChart() {

    const canvas = document.getElementById("salaryChart");
    const emptyMessage = document.getElementById("salaryEmpty");

    if (!canvas) {
        console.error("Salary chart canvas not found.");
        return;
    }

    if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded.");
        return;
    }

    // Destroy previous chart before creating a new one
    if (salaryChart) {
        salaryChart.destroy();
        salaryChart = null;
    }

    const today = new Date();

// Get selected chart period
const periodFilter = document.getElementById("salaryPeriodFilter");

const selectedMonths = periodFilter
    ? Number(periodFilter.value)
    : 6;

// Generate selected months, including current month
const months = [];

for (let i = selectedMonths - 1; i >= 0; i--) {

    const date = new Date(
        today.getFullYear(),
        today.getMonth() - i,
        1
    );

    months.push({
        year: date.getFullYear(),
        month: date.getMonth(),

        label: date.toLocaleDateString("en-IN", {
            month: "short",
            year: "numeric"
        })
    });

}


    // Calculate monthly salary expense
    const salaryData = months.map(month => {

        return teachers.reduce((total, teacher) => {

            const salary = Number(teacher.salary || 0);

            if (salary <= 0) {
                return total;
            }

            // Ignore inactive teachers
            if (teacher.active === false) {
                return total;
            }

            // Teacher joining date
            const joiningDate = teacher.joiningDate
                ? new Date(teacher.joiningDate)
                : null;

            // Include teacher if they joined on or before this month
            if (
                joiningDate &&
                !isNaN(joiningDate.getTime()) &&
                joiningDate <= new Date(
                    month.year,
                    month.month + 1,
                    0
                )
            ) {
                return total + salary;
            }

            return total;

        }, 0);

    });

      const salaryPeriodFilter = document.getElementById("salaryPeriodFilter");

if (salaryPeriodFilter) {
    salaryPeriodFilter.addEventListener("change", updateSalaryChart);
}

 


  // =========================================
// SALARY MONTH-OVER-MONTH TREND
// =========================================

const trendElement = document.getElementById("salaryTrendSummary");

if (trendElement && salaryData.length >= 2) {

    const currentSalary = salaryData[salaryData.length - 1];
    const previousSalary = salaryData[salaryData.length - 2];

    if (previousSalary > 0) {

        const percentage =
            ((currentSalary - previousSalary) / previousSalary) * 100;

        const formattedPercentage = Math.abs(percentage).toFixed(1);

        if (percentage > 0) {

            trendElement.innerHTML =
                `Salary expense increased by <strong>${formattedPercentage}%</strong> compared with last month.`;

        } else if (percentage < 0) {

            trendElement.innerHTML =
                `Salary expense decreased by <strong>${formattedPercentage}%</strong> compared with last month.`;

        } else {

            trendElement.innerHTML =
                "Salary expense remained unchanged (0.0%).";

        }

    } else {

        trendElement.textContent =
            "Salary trend unavailable for the previous month.";

    }

}

    // Empty chart message
    if (teachers.length === 0) {

        if (emptyMessage) {
            emptyMessage.hidden = false;
        }

        return;

    }

    if (emptyMessage) {
        emptyMessage.hidden = true;
    }

    // Create salary chart
    salaryChart = new Chart(canvas, {

        type: "bar",

        data: {

            labels: months.map(month => month.label),

            datasets: [{

                label: "Monthly Salary Expense",

                data: salaryData,

                backgroundColor: [
                    "rgba(99, 102, 241, 0.65)",
                    "rgba(99, 102, 241, 0.65)",
                    "rgba(99, 102, 241, 0.65)",
                    "rgba(99, 102, 241, 0.65)",
                    "rgba(99, 102, 241, 0.65)",
                    "rgba(79, 70, 229, 0.9)"
                ],

                borderColor: "#5145f5",

                borderWidth: 1,

                borderRadius: 8,

                borderSkipped: false,

                maxBarThickness: 45

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            animation: {
                duration: 800
            },

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {

                legend: {
                    display: false
                },

                tooltip: {

                    backgroundColor: "#111b50",

                    padding: 12,

                    displayColors: false,

                    callbacks: {

                        label: function(context) {

                            return "Salary: " +
                                formatCurrency(context.raw);

                        }

                    }

                }

            },

            scales: {

                x: {

                    grid: {
                        display: false
                    },

                    border: {
                        display: false
                    },

                    ticks: {
                        color: "#647493",
                        font: {
                            size: 11
                        }
                    }

                },

                y: {

                    beginAtZero: true,

                    border: {
                        display: false
                    },

                    grid: {
                        color: "rgba(148, 163, 184, 0.15)"
                    },

                    ticks: {

                        color: "#647493",

                        callback: function(value) {

                            if (value >= 100000) {
                                return "₹" +
                                    (value / 100000).toFixed(1) + "L";
                            }

                            if (value >= 1000) {
                                return "₹" +
                                    (value / 1000).toFixed(0) + "K";
                            }

                            return "₹" + value;

                        }

                    }

                }

            }

        }

    });

}

function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);
}

// -------------------- SUBJECT FILTER --------------------

function populateSubjectFilter() {
    const subjectFilter = document.getElementById("subjectFilter");
    const selectedSubject = subjectFilter.value;

    const subjects = [
        ...new Set(
            teachers.map(teacher => teacher.subject).filter(Boolean)
        )
    ].sort((a, b) => a.localeCompare(b));

    subjectFilter.innerHTML =
        '<option value="">All Subjects</option>';

    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject;
        option.textContent = subject;

        subjectFilter.appendChild(option);
    });

    if (subjects.includes(selectedSubject)) {
        subjectFilter.value = selectedSubject;
    }
}

// -------------------- SEARCH / SORT --------------------

document.getElementById("searchInput").addEventListener("input", () => {
    currentPage = 1;
    renderTeachers();
});

document.getElementById("subjectFilter").addEventListener("change", () => {
    currentPage = 1;
    renderTeachers();
});

document.getElementById("sortFilter").addEventListener("change", () => {
    currentPage = 1;
    renderTeachers();
});

function getFilteredTeachers() {
    const searchText = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();

    const selectedSubject =
        document.getElementById("subjectFilter").value;

    const sortOption =
        document.getElementById("sortFilter").value;

    let filtered = teachers.filter(teacher => {
        const searchableText = [
            teacher.fullName,
            teacher.email,
            teacher.phone,
            teacher.subject,
            teacher.qualification
        ].join(" ").toLowerCase();

        const matchesSearch = searchableText.includes(searchText);

        const matchesSubject =
            !selectedSubject || teacher.subject === selectedSubject;

        return matchesSearch && matchesSubject;
    });

    filtered.sort((a, b) => {
        switch (sortOption) {
            case "name-asc":
                return (a.fullName || "").localeCompare(b.fullName || "");

            case "name-desc":
                return (b.fullName || "").localeCompare(a.fullName || "");

            case "salary-asc":
                return Number(a.salary || 0) - Number(b.salary || 0);

            case "salary-desc":
                return Number(b.salary || 0) - Number(a.salary || 0);

            case "date-desc":
                return new Date(b.joiningDate) - new Date(a.joiningDate);

            case "date-asc":
                return new Date(a.joiningDate) - new Date(b.joiningDate);

            default:
                return 0;
        }
    });

    return filtered;
}

// -------------------- RENDER TEACHERS --------------------

function renderTeachers() {
    const filteredTeachers = getFilteredTeachers();

    const totalPages = Math.max(
        1,
        Math.ceil(filteredTeachers.length / pageSize)
    );

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * pageSize;

    const currentTeachers = filteredTeachers.slice(
        startIndex,
        startIndex + pageSize
    );

    teacherTableBody.innerHTML = "";

    if (currentTeachers.length === 0) {
        teacherTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    No teachers found.
                </td>
            </tr>
        `;
    } else {
        currentTeachers.forEach(teacher => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>
                    <div class="teacher-profile">
                        <div class="teacher-avatar">
                             ${getTeacherInitials(teacher.fullName)}
                        </div>

                        <div class="teacher-profile-info">
                            <strong>${escapeHTML(teacher.fullName)}</strong>
                            <small>${escapeHTML(teacher.email)}</small>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(teacher.subject)}</td>

                <td>${escapeHTML(teacher.qualification)}</td>

                <td>${formatCurrency(Number(teacher.salary || 0))}</td>

                <td>
                    <span class="${
                        teacher.active ? "status-active" : "status-inactive"
                    }">
                        ${teacher.active ? "Active" : "Inactive"}
                    </span>
                </td>

                <td>
                    <button class="edit-button" data-action="edit"
                        data-id="${teacher.id}">
                        Edit
                    </button>

                    <button class="delete-button" data-action="delete"
                        data-id="${teacher.id}">
                        Delete
                    </button>
                </td>
            `;

            teacherTableBody.appendChild(row);
        });
    }

    // Render teacher cards for Grid View
const teacherGrid = document.getElementById("teacherGrid");

if (teacherGrid) {
    teacherGrid.innerHTML = "";

    if (currentTeachers.length === 0) {
        teacherGrid.innerHTML = `
            <div class="empty-message">
                No teachers found.
            </div>
        `;
    } else {
        currentTeachers.forEach(teacher => {
            const card = document.createElement("div");

            card.className = "teacher-card";

            card.innerHTML = `
                <div class="teacher-card-header">
                    <div class="teacher-avatar">
                        ${getTeacherInitials(teacher.fullName)}
                    </div>

                    <span class="${
                        teacher.active
                            ? "status-active"
                            : "status-inactive"
                    }">
                        ${teacher.active ? "Active" : "Inactive"}
                    </span>
                </div>

                <h3>${escapeHTML(teacher.fullName)}</h3>

                <p class="teacher-card-email">
                    ${escapeHTML(teacher.email)}
                </p>

                <div class="teacher-card-details">
                    <p>
                        <strong>Subject:</strong>
                        ${escapeHTML(teacher.subject)}
                    </p>

                    <p>
                        <strong>Qualification:</strong>
                        ${escapeHTML(teacher.qualification)}
                    </p>

                    <p>
                        <strong>Salary:</strong>
                        ${formatCurrency(Number(teacher.salary || 0))}
                    </p>
                </div>

                <div class="teacher-card-actions">
                    <button class="edit-button"
                        data-action="edit"
                        data-id="${teacher.id}">
                        Edit
                    </button>

                    <button class="delete-button"
                        data-action="delete"
                        data-id="${teacher.id}">
                        Delete
                    </button>
                </div>
            `;

            teacherGrid.appendChild(card);
        });
    }
}

renderPagination(filteredTeachers.length, totalPages);
}

// Event delegation for Edit and Delete buttons
teacherTableBody.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "edit") {
        editTeacher(id);
    } else if (action === "delete") {
        deleteTeacher(id);
    }
});

// -------------------- PAGINATION --------------------

function renderPagination(totalItems, totalPages) {
    pagination.innerHTML = "";

    if (totalItems === 0) {
        return;
    }

    const previousButton = document.createElement("button");
    previousButton.textContent = "Previous";
    previousButton.disabled = currentPage === 1;

    previousButton.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            renderTeachers();
        }
    });

    const pageInfo = document.createElement("span");
    pageInfo.textContent =
        `Page ${currentPage} of ${totalPages} | ${totalItems} teachers`;

    const nextButton = document.createElement("button");
    nextButton.textContent = "Next";
    nextButton.disabled = currentPage === totalPages;

    nextButton.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTeachers();
        }
    });

    pagination.append(previousButton, pageInfo, nextButton);
}

// -------------------- MODAL OPEN / CLOSE --------------------

document.getElementById("addTeacherButton").addEventListener("click", () => {
    openTeacherModal();
});

cancelTeacherButton.addEventListener("click", closeTeacherModal);
closeModalBtn.addEventListener("click", closeTeacherModal);

teacherModal.addEventListener("click", event => {
    if (event.target === teacherModal) {
        closeTeacherModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !teacherModal.classList.contains("hidden")) {
        closeTeacherModal();
    }
});

function openTeacherModal(teacher = null) {
    teacherForm.reset();

    editingTeacherId = teacher ? teacher.id : null;

    document.getElementById("modalTitle").textContent =
        teacher ? "Edit Teacher" : "Add Teacher";

    document.getElementById("teacherId").value =
        teacher ? teacher.id : "";

    if (teacher) {
        document.getElementById("fullName").value =
            teacher.fullName || "";

        document.getElementById("email").value =
            teacher.email || "";

        document.getElementById("phone").value =
            teacher.phone || "";

        document.getElementById("subject").value =
            teacher.subject || "";

        document.getElementById("qualification").value =
            teacher.qualification || "";

        document.getElementById("salary").value =
            teacher.salary ?? "";

        document.getElementById("joiningDate").value =
            teacher.joiningDate || "";

        document.getElementById("active").value =
            String(Boolean(teacher.active));
    }

    teacherModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeTeacherModal() {
    teacherModal.classList.add("hidden");
    document.body.style.overflow = "";

    teacherForm.reset();

    document.getElementById("teacherId").value = "";

    editingTeacherId = null;
}

// -------------------- ADD / UPDATE TEACHER --------------------

// Lines 541–549
teacherForm.addEventListener("submit", async event => {
    event.preventDefault();

    // Validate form before submitting
    if (!teacherForm.checkValidity()) {
        teacherForm.reportValidity();
        return;
    }

    // Validate email format
const email = document.getElementById("email").value.trim();

const emailPattern =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

if (!emailPattern.test(email)) {
    showToast("Please enter a valid email address, such as user@gmail.com", true);
    document.getElementById("email").focus();
    return;
}

    const teacherData = {
        fullName: document.getElementById("fullName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        subject: document.getElementById("subject").value.trim(),
        qualification:
            document.getElementById("qualification").value.trim(),
        salary: Number(document.getElementById("salary").value),
        joiningDate: document.getElementById("joiningDate").value,
        active: document.getElementById("active").value === "true"
    };

    const saveButton = document.getElementById("saveBtn");

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        if (editingTeacherId !== null) {
            await apiRequest(`/teachers/${editingTeacherId}`, {
                method: "PUT",
                body: JSON.stringify(teacherData)
            });

            showToast("Teacher updated successfully");
        } else {
            await apiRequest("/teachers", {
                method: "POST",
                body: JSON.stringify(teacherData)
            });

            showToast("Teacher added successfully");
        }

        closeTeacherModal();
        await loadTeachers();

    } catch (error) {
        showToast(error.message || "Unable to save teacher", true);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Teacher";
    }
});

// -------------------- EDIT TEACHER --------------------

function editTeacher(id) {
    const teacher = teachers.find(item => Number(item.id) === Number(id));

    if (!teacher) {
        showToast("Teacher not found", true);
        return;
    }

    openTeacherModal(teacher);
}

// -------------------- DELETE TEACHER --------------------

async function deleteTeacher(id) {
    const teacher = teachers.find(item => Number(item.id) === Number(id));

    if (!teacher) {
        showToast("Teacher not found", true);
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete ${teacher.fullName}?`
    );

    if (!confirmed) {
        return;
    }

    try {
        await apiRequest(`/teachers/${id}`, {
            method: "DELETE"
        });

        showToast("Teacher deleted successfully");
        await loadTeachers();

    } catch (error) {
        showToast(error.message || "Unable to delete teacher", true);
    }
}

// -------------------- TOAST --------------------

function showToast(message, isError = false) {
    toast.textContent = message;
    toast.classList.remove("hidden", "error");

    if (isError) {
        toast.classList.add("error");
    }

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
    }, 3000);
}

// Generate teacher initials for profile avatar
function getTeacherInitials(fullName) {
    return String(fullName || "Teacher")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(name => name.charAt(0).toUpperCase())
        .join("");
}
// -------------------- HTML ESCAPING --------------------

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}

// -------------------- APPLICATION INITIALIZATION --------------------

// -------------------- INITIALIZE APPLICATION --------------------

async function initializeApp() {

    const token = sessionStorage.getItem("teachtrack_token");

    if (token) {
        try {
            // Restore dashboard when a token exists
            await showDashboard();
        } catch (error) {
            console.error("Unable to restore dashboard:", error);

            sessionStorage.removeItem("teachtrack_token");

            document.getElementById("loginSection").style.display = "block";
            document.getElementById("dashboardSection").style.display = "none";
        }
    } else {
        // No token: show login page
        document.getElementById("loginSection").style.display = "block";
        document.getElementById("dashboardSection").style.display = "none";
    }
}

// ================================================
// TEACHTRACK ATTENDANCE AND REPORTS
// ================================================

const ATTENDANCE_STORAGE_KEY = "teachtrack_attendance";

// -------------------- DATE HELPER --------------------

function getTodayLocalDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// -------------------- ATTENDANCE STORAGE --------------------

function getAttendanceData() {
    try {
        return JSON.parse(
            localStorage.getItem(ATTENDANCE_STORAGE_KEY) || "{}"
        );
    } catch (error) {
        console.error("Unable to read attendance data:", error);
        return {};
    }
}

function saveAttendanceData(data) {
    localStorage.setItem(
        ATTENDANCE_STORAGE_KEY,
        JSON.stringify(data)
    );
}

// -------------------- PAGE NAVIGATION --------------------

function openAttendanceReportsPage(page) {
    const dashboardContainer =
        document.querySelector(".dashboard-container");

    const settingsPage =
        document.getElementById("settingsPage");

    const attendancePage =
        document.getElementById("attendancePage");

    const reportsPage =
        document.getElementById("reportsPage");

    if (dashboardContainer) dashboardContainer.hidden = true;
    if (settingsPage) settingsPage.hidden = true;

    attendancePage.hidden = page !== "attendance";
    reportsPage.hidden = page !== "reports";

    document.querySelectorAll(".sidebar-link").forEach(link => {
        link.classList.remove("active");
    });

    const pageTitle = document.getElementById("pageTitle");
    const pageBreadcrumb = document.getElementById("pageBreadcrumb");

    if (page === "attendance") {
        document.getElementById("attendanceNavLink")
            .classList.add("active");

        pageTitle.textContent = "Attendance Management";
        pageBreadcrumb.textContent = "Pages / Attendance";

        renderAttendance();
    }

    if (page === "reports") {
        document.getElementById("reportsNavLink")
            .classList.add("active");

        pageTitle.textContent = "Reports & Analytics";
        pageBreadcrumb.textContent = "Pages / Reports";

        renderReports();
    }
}

// Sidebar click events
document.getElementById("attendanceNavLink")
    .addEventListener("click", event => {
        event.preventDefault();
        openAttendanceReportsPage("attendance");
    });

document.getElementById("reportsNavLink")
    .addEventListener("click", event => {
        event.preventDefault();
        openAttendanceReportsPage("reports");
    });

// -------------------- ATTENDANCE PAGE --------------------

const attendanceDateInput =
    document.getElementById("attendanceDate");

const attendanceTableBody =
    document.getElementById("attendanceTableBody");

attendanceDateInput.value = getTodayLocalDate();

attendanceDateInput.addEventListener("change", renderAttendance);

function renderAttendance() {
    const selectedDate =
        attendanceDateInput.value || getTodayLocalDate();

    const attendanceData = getAttendanceData();
    const dayData = attendanceData[selectedDate] || {};

    attendanceTableBody.innerHTML = "";

    if (teachers.length === 0) {
        attendanceTableBody.innerHTML = `
            <tr>
                <td colspan="3" class="empty-message">
                    No teachers available. Add teachers first.
                </td>
            </tr>
        `;

        updateAttendanceSummary();
        return;
    }

    teachers.forEach(teacher => {
        const teacherId = String(teacher.id);

        const savedStatus = dayData[teacherId] || "Not Marked";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <strong>${escapeHTML(teacher.fullName)}</strong>
            </td>

            <td>
                ${escapeHTML(teacher.subject || "N/A")}
            </td>

            <td>
                <select
                    class="attendance-status"
                    data-teacher-id="${teacherId}">

                    <option value="Not Marked"
                        ${savedStatus === "Not Marked" ? "selected" : ""}>
                        Not Marked
                    </option>

                    <option value="Present"
                        ${savedStatus === "Present" ? "selected" : ""}>
                        Present
                    </option>

                    <option value="Absent"
                        ${savedStatus === "Absent" ? "selected" : ""}>
                        Absent
                    </option>

                    <option value="Leave"
                        ${savedStatus === "Leave" ? "selected" : ""}>
                        Leave
                    </option>
                </select>
            </td>
        `;

        attendanceTableBody.appendChild(row);
    });

    updateAttendanceSummary();
}

// -------------------- ATTENDANCE SUMMARY --------------------

function updateAttendanceSummary() {
    const statuses = [
        ...document.querySelectorAll("#attendanceTableBody .attendance-status")
    ].map(select => select.value);

    document.getElementById("attendanceTotal").textContent =
        teachers.length;

    document.getElementById("attendancePresent").textContent =
        statuses.filter(status => status === "Present").length;

    document.getElementById("attendanceAbsent").textContent =
        statuses.filter(status => status === "Absent").length;

    document.getElementById("attendanceLeave").textContent =
        statuses.filter(status => status === "Leave").length;
}

// Update totals whenever attendance status changes
attendanceTableBody.addEventListener("change", event => {
    if (event.target.classList.contains("attendance-status")) {
        updateAttendanceSummary();
    }
});

// -------------------- SAVE ATTENDANCE --------------------

document.getElementById("saveAttendanceBtn")
    .addEventListener("click", () => {

        const selectedDate =
            attendanceDateInput.value || getTodayLocalDate();

        const attendanceData = getAttendanceData();

        attendanceData[selectedDate] = {};

        document.querySelectorAll(
            "#attendanceTableBody .attendance-status"
        ).forEach(select => {

            const teacherId = select.dataset.teacherId;

            attendanceData[selectedDate][teacherId] =
                select.value;
        });

        saveAttendanceData(attendanceData);

        showToast("Attendance saved successfully");

        renderAttendance();
        renderReports();
    });

// ================================================
// REPORTS PAGE
// ================================================

const reportDateInput = document.getElementById("reportDate");

reportDateInput.value = getTodayLocalDate();

reportDateInput.addEventListener("change", renderReports);

function renderReports() {
    const selectedDate =
        reportDateInput.value || getTodayLocalDate();

    const attendanceData = getAttendanceData();
    const dayData = attendanceData[selectedDate] || {};

    // Teacher statistics
    document.getElementById("reportTotalTeachers").textContent =
        teachers.length;

    document.getElementById("reportActiveTeachers").textContent =
        teachers.filter(teacher => teacher.active === true).length;

    document.getElementById("reportPresentToday").textContent =
        Object.values(dayData).filter(status => status === "Present").length;

    document.getElementById("reportAbsentToday").textContent =
        Object.values(dayData).filter(status => status === "Absent").length;

    const tbody = document.getElementById("reportTableBody");

    tbody.innerHTML = "";

    if (teachers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-message">
                    No teachers found.
                </td>
            </tr>
        `;
        return;
    }

    teachers.forEach(teacher => {
        const status =
            dayData[String(teacher.id)] || "Not Marked";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(teacher.fullName)}</td>

            <td>${escapeHTML(teacher.subject || "N/A")}</td>

            <td>${escapeHTML(selectedDate)}</td>

            <td>
                <span class="attendance-badge ${
                    status.toLowerCase().replace(/\s+/g, "-")
                }">
                    ${escapeHTML(status)}
                </span>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// -------------------- EXPORT EXCEL REPORT --------------------

document.getElementById("exportReportBtn")
    .addEventListener("click", () => {

        if (typeof XLSX === "undefined") {
            showToast("Excel library is not loaded", true);
            return;
        }

        const selectedDate =
            reportDateInput.value || getTodayLocalDate();

        const attendanceData = getAttendanceData();
        const dayData = attendanceData[selectedDate] || {};

        // Excel table data
        const rows = [
            ["Teacher Name", "Subject", "Date", "Attendance Status"]
        ];

        teachers.forEach(teacher => {
            rows.push([
                teacher.fullName,
                teacher.subject || "N/A",
                selectedDate,
                dayData[String(teacher.id)] || "Not Marked"
            ]);
        });

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(rows);

        // Set Excel column widths
        worksheet["!cols"] = [
            { wch: 25 },
            { wch: 25 },
            { wch: 18 },
            { wch: 22 }
        ];

        // Create workbook
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Attendance Report"
        );

        // Download Excel file
        XLSX.writeFile(
            workbook,
            `TeachTrack_Report_${selectedDate}.xlsx`
        );

        showToast("Excel report exported successfully");
    });

    // ==========================================
// GLOBAL NAVBAR SEARCH
// ==========================================

const globalSearch = document.getElementById("globalSearch");
const teacherSearchInput = document.getElementById("searchInput");

if (globalSearch) {

    // Ctrl + K focuses the search box
    document.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            globalSearch.focus();
            globalSearch.select();
        }
    });

    // Search teachers by name or subject
    globalSearch.addEventListener("input", function () {
        const searchValue = globalSearch.value.trim();

        if (teacherSearchInput) {
            teacherSearchInput.value = searchValue;
            teacherSearchInput.dispatchEvent(new Event("input", {
                bubbles: true
            }));
        }
    });

    // Press Enter to jump to the Teacher Directory
    globalSearch.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            const teacherDirectory = document.getElementById("teacherDirectory");

            if (teacherDirectory) {
                teacherDirectory.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        }
    });
}

// -------------------- NAVBAR DASHBOARD BUTTON --------------------

// -------------------- NAVBAR DASHBOARD BUTTON --------------------

const navbarDashboardButton =
    document.getElementById("navbarDashboardButton");

if (navbarDashboardButton) {
    navbarDashboardButton.addEventListener("click", function (event) {

        event.preventDefault();

        // Navigate directly using the existing page navigation function
        showPage("dashboard");

        // Scroll to top
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        // Clear global search
        if (globalSearch) {
            globalSearch.value = "";
        }

        // Clear teacher search
        if (teacherSearchInput) {
            teacherSearchInput.value = "";

            teacherSearchInput.dispatchEvent(
                new Event("input", { bubbles: true })
            );
        }
    });
}

// -------------------- APPLICATION INITIALIZATION --------------------

loadProfileSettings();
loadAppearanceSettings();
loadNotificationSettings();


initializeApp();

// -------------------- TEACHER VIEW TOGGLE --------------------

const viewListBtn = document.getElementById("viewListBtn");
const viewGridBtn = document.getElementById("viewGridBtn");

const tableWrapper = document.getElementById("tableWrapper");
const teacherGrid = document.getElementById("teacherGrid");

if (viewListBtn && viewGridBtn && tableWrapper && teacherGrid) {

    viewListBtn.addEventListener("click", () => {

        tableWrapper.hidden = false;
        teacherGrid.hidden = true;

        viewListBtn.classList.add("active");
        viewGridBtn.classList.remove("active");

    });

    viewGridBtn.addEventListener("click", () => {

        tableWrapper.hidden = true;
        teacherGrid.hidden = false;

        viewGridBtn.classList.add("active");
        viewListBtn.classList.remove("active");

    });
}

// Grid Edit/Delete event delegation
if (teacherGrid) {

    teacherGrid.addEventListener("click", event => {

        const button = event.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const id = Number(button.dataset.id);
        const action = button.dataset.action;

        if (action === "edit") {
            editTeacher(id);
        } else if (action === "delete") {
            deleteTeacher(id);
        }

    });

}

// ==============================================
// CONTACT ADMINISTRATOR - WORK FROM ALL PAGES
// ==============================================

document.addEventListener("click", function (event) {
    const contactLink = event.target.closest(".contact-admin-link");

    if (!contactLink) return;

    event.preventDefault();

    // Hide Attendance and Reports pages
    const attendancePage = document.getElementById("attendancePage");
    const reportsPage = document.getElementById("reportsPage");

    if (attendancePage) attendancePage.hidden = true;
    if (reportsPage) reportsPage.hidden = true;

    // Navigate to Dashboard using existing navigation
    showPage("dashboard");

    // Wait until Dashboard is visible
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const footer = document.getElementById("footer");

            if (!footer) {
                console.error("Footer element with id='footer' was not found.");
                return;
            }

            footer.scrollIntoView({
                behavior: "smooth",
                block: "end"
            });
        });
    });
});

