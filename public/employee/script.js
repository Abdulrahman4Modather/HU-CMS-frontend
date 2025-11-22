// بيانات وهمية
// Employee dashboard script
// Loads necessary datasets and shows complaints assigned to the logged-in employee

let employees = [];
let students = [];
let complaints = [];
let departments = [];
let faculties = [];
let replys = [];
let employeeComplaints = [];
let currentComplaintId = null;

// Utility: safe get current employee id from localStorage.currentUser
function getCurrentEmployeeId() {
    try {
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        return user && (user.id || user.email)
            ? String(user.id || user.email)
            : null;
    } catch (e) {
        return null;
    }
}

function signOut() {
    // simple sign out
    window.location.href = "/login.html";
}

function showSection(sectionId) {
    document
        .querySelectorAll(".main-section")
        .forEach((section) => section.classList.add("hidden"));
    const el = document.getElementById(sectionId + "-section");
    if (el) el.classList.remove("hidden");

    document
        .querySelectorAll(".sidebar li")
        .forEach((item) => item.classList.remove("active"));
    const nav = document.getElementById("nav-" + sectionId.replace("-", ""));
    if (nav) nav.classList.add("active");
}

function saveAccountChanges() {
    try {
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        if (!user || !user.id) {
            showToast("User not found in session", "Error");
            return;
        }

        // Get form values
        const phoneEl = document.getElementById("staff-phone");
        const currentPasswordEl = document.getElementById("current-password");
        const newPasswordEl = document.getElementById("new-password");

        const phone = phoneEl ? phoneEl.value : "";
        const currentPassword = currentPasswordEl
            ? currentPasswordEl.value
            : "";
        const newPassword = newPasswordEl ? newPasswordEl.value : "";

        // If trying to change password, validate current password first
        if (newPassword) {
            if (!currentPassword) {
                showToast("Please enter your current password", "Error");
                return;
            }

            // Find the employee to get their original password
            const employee = (employees || []).find(
                (e) =>
                    String(e.id).toLowerCase() ===
                        String(user.id).toLowerCase() ||
                    String(e.email).toLowerCase() ===
                        String(user.email || "").toLowerCase()
            );

            if (!employee) {
                showToast("Employee not found", "Error");
                return;
            }

            // Check if current password matches the stored password
            const storageKey = `employee-${user.id}-password`;
            const storedPassword = localStorage.getItem(storageKey);
            const correctPassword = storedPassword ?? employee.pass;

            if (currentPassword !== correctPassword) {
                showToast("Current password is incorrect", "Error");
                return;
            }

            if (newPassword.length < 4) {
                showToast(
                    "New password must be at least 4 characters",
                    "Error"
                );
                return;
            }
        }

        // Store phone number in localStorage
        if (phone) {
            const employeePhoneKey = `employee-${user.id}-phone`;
            localStorage.setItem(employeePhoneKey, phone);
        }

        // Store password override if provided
        if (newPassword) {
            const employeePasswordKey = `employee-${user.id}-password`;
            localStorage.setItem(employeePasswordKey, newPassword);
        }

        // Clear password fields
        if (currentPasswordEl) currentPasswordEl.value = "";
        if (newPasswordEl) newPasswordEl.value = "";

        showToast("Changes saved successfully", "Success");
    } catch (err) {
        console.warn("Failed to save account changes", err);
        showToast("Failed to save changes", "Error");
    }
}

// Load and display employee account information
function loadEmployeeAccount() {
    try {
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        if (!user || !user.id) return;

        // Find the employee in the loaded employees array
        const employee = (employees || []).find(
            (e) =>
                String(e.id).toLowerCase() === String(user.id).toLowerCase() ||
                String(e.email).toLowerCase() ===
                    String(user.email || "").toLowerCase()
        );

        if (!employee) return;

        // Populate account form fields
        const staffIdEl = document.getElementById("staff-id");
        const staffNameEl = document.getElementById("staff-name");
        const staffEmailEl = document.getElementById("staff-email");
        const staffPhoneEl = document.getElementById("staff-phone");
        const staffRoleEl = document.getElementById("staff-role");
        const staffDepartmentEl = document.getElementById("staff-department");
        const staffFacultyEl = document.getElementById("staff-faculty");

        let staffDepartment = departments.find(
            (d) => d.id === employee.departmentId
        );

        let staffFaculty = null;

        if (staffDepartment) {
            staffFaculty = faculties.find(
                (f) => f.id === staffDepartment.facultyId
            );
        }

        if (staffIdEl) staffIdEl.value = employee.id || "";
        if (staffNameEl) staffNameEl.value = employee.name || "";
        if (staffEmailEl) staffEmailEl.value = employee.email || "";
        if (staffRoleEl) staffRoleEl.value = employee.role || "";
        if (staffDepartmentEl)
            staffDepartmentEl.value =
                (staffDepartment && staffDepartment.name) || "";
        if (staffFacultyEl)
            staffFacultyEl.value = (staffFaculty && staffFaculty.name) || "";

        // Load saved phone number from localStorage
        const employeePhoneKey = `employee-${user.id}-phone`;
        const savedPhone = localStorage.getItem(employeePhoneKey);
        if (staffPhoneEl) {
            staffPhoneEl.value = savedPhone || employee.phone || "";
        }
    } catch (err) {
        console.warn("Failed to load employee account data", err);
    }
}

// Modal helpers
function openRedirectModal() {
    document.getElementById("redirect-modal").classList.remove("hidden");
}
function openReplyModal() {
    document.getElementById("reply-modal").classList.remove("hidden");
    document.getElementById("reply-text").value = "";
}
function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.add("hidden");
}

function showToast(message, title) {
    const toast = document.getElementById("toast-message");
    if (!toast) return;
    toast.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span style="color:#4CAF50;">${title}</span>
                <p style="margin:5px 0 15px 0; color:#333; font-size:0.9em;">${message}</p>
                <button class="close" onclick="closeModal('toast-message')">close</button>
            `;
    toast.classList.remove("hidden");
    setTimeout(() => {
        if (!toast.classList.contains("hidden")) toast.classList.add("hidden");
    }, 5000);
}

// Find complaints assigned to the current employee. Supports multiple possible assignment fields.
function computeEmployeeComplaints() {
    const empId = getCurrentEmployeeId();
    if (!empId) {
        // if no employee id, show none
        employeeComplaints = [];
        return;
    }
    const assignedFields = [
        "assignedTo",
        "assignee",
        "employeeId",
        "handler",
        "staffId",
    ];
    employeeComplaints = (Array.isArray(complaints) ? complaints : [])
        .filter((c) => {
            for (const f of assignedFields) {
                if (c[f] && String(c[f]) === String(empId)) return true;
            }
            return false;
        })
        .map((c) => {
            const student = (students || []).find(
                (s) => String(s.id) === String(c.studentId)
            );
            return Object.assign({}, c, {
                studentName: student ? student.name : "N/A",
            });
        });
}

// Update the small summary metrics shown on the dashboard.
function updateSummaryMetrics() {
    try {
        const totalEl = document.getElementById("total-complaints");
        // pending element uses hyphen in the HTML id
        const pendingEl =
            document.getElementById("pending-complaints") ||
            document.getElementById("pending_complaints");
        const inProgressEl = document.getElementById("in-progress-complaints");
        // new complaints count is rendered inside the card's span (has class 'new-complaints')
        const newEl =
            document.querySelector(".card.new-complaints span") ||
            document.querySelector(".new-complaints");

        const total = Number((employeeComplaints || []).length) || 0;
        const pending =
            Number(
                (employeeComplaints || []).filter(
                    (c) => String(c.status || "").toLowerCase() === "pending"
                ).length
            ) || 0;
        const inProgress =
            Number(
                (employeeComplaints || []).filter(
                    (c) =>
                        String(c.status || "").toLowerCase() ===
                            "in progress" ||
                        String(c.status || "").toLowerCase() === "inprogress"
                ).length
            ) || 0;

        // Count new complaints as those with status 'pending' and a date equal to today (local date)
        const today = new Date();
        const newCount = (employeeComplaints || []).filter((c) => {
            if (!c || !c.date) return false;
            const d = new Date(c.date);
            if (isNaN(d)) return false;
            return (
                d.toDateString() === today.toDateString() &&
                String(c.status || "").toLowerCase() === "pending"
            );
        }).length;

        if (totalEl) totalEl.textContent = String(!isNaN(total) ? total : 0);
        if (pendingEl)
            pendingEl.textContent = String(!isNaN(pending) ? pending : 0);
        if (inProgressEl)
            inProgressEl.textContent = String(
                !isNaN(inProgress) ? inProgress : 0
            );
        if (newEl) newEl.textContent = String(!isNaN(newCount) ? newCount : 0);
    } catch (err) {
        console.warn("Failed to update summary metrics", err);
    }
}

// Get filter values from the filter controls
function getFilterValues() {
    const studentIdFilter = (document.getElementById("student-id-filter") || {})
        .value
        ? (document.getElementById("student-id-filter") || {}).value
              .toLowerCase()
              .trim()
        : "";
    const dateFrom = (document.getElementById("date-from") || {}).value || "";
    const dateTo = (document.getElementById("date-to") || {}).value || "";
    const statusFilter = (document.getElementById("status-filter") || {}).value
        ? (document.getElementById("status-filter") || {}).value
              .toLowerCase()
              .trim()
        : "";

    return { studentIdFilter, dateFrom, dateTo, statusFilter };
}

// Apply filters to employeeComplaints and return filtered list
function getFilteredComplaints() {
    const { studentIdFilter, dateFrom, dateTo, statusFilter } =
        getFilterValues();
    let filtered = (employeeComplaints || []).slice();

    // Filter by student ID or name (substring match)
    if (studentIdFilter && studentIdFilter !== "") {
        filtered = filtered.filter((c) => {
            const id = String(c.studentId || "").toLowerCase();
            const name = String(c.studentName || "").toLowerCase();
            return (
                id.includes(studentIdFilter) || name.includes(studentIdFilter)
            );
        });
    }

    // Filter by status
    if (statusFilter && statusFilter !== "no-status") {
        filtered = filtered.filter(
            (c) =>
                String(c.status || "")
                    .toLowerCase()
                    .replace(/\s+/g, "") === statusFilter.replace(/\s+/g, "")
        );
    }

    // Filter by date range (inclusive)
    if (dateFrom || dateTo) {
        filtered = filtered.filter((c) => {
            if (!c.date) return false;
            const complaintDate = new Date(c.date);
            if (isNaN(complaintDate)) return false;

            if (dateFrom) {
                const from = new Date(dateFrom);
                if (complaintDate < from) return false;
            }
            if (dateTo) {
                const to = new Date(dateTo);
                // Set time to end of day for inclusive date range
                to.setHours(23, 59, 59, 999);
                if (complaintDate > to) return false;
            }
            return true;
        });
    }

    return filtered;
}

function updateComplaintTables() {
    const homeTableBody = document.querySelector(
        "#home-section .data-table tbody"
    );
    const myComplaintsTableBody = document.querySelector(
        "#my-complaints-section .data-table tbody"
    );
    if (!homeTableBody || !myComplaintsTableBody) return;

    homeTableBody.innerHTML = "";
    myComplaintsTableBody.innerHTML = "";

    // Home section: always show 3 most recent (unfiltered)
    const sorted = (employeeComplaints || [])
        .slice()
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sorted.slice(0, 3);
    recent.forEach((complaint) => {
        const row = `
                    <tr data-id="${complaint.id}">
                        <td>${complaint.id}</td>
                        <td>${complaint.title || ""}</td>
                        <td>${complaint.studentName || ""}</td>
                        <td>${complaint.date || ""}</td>
                        <td class="status-cell">
                            <span class="status-text">${
                                complaint.status || ""
                            }</span>
                            <span class="show-link" onclick="showComplaintDetails('${
                                complaint.id
                            }')">show</span>
                        </td>
                    </tr>`;
        homeTableBody.insertAdjacentHTML("beforeend", row);
    });

    // All complaints section: apply filters
    const filtered = getFilteredComplaints().sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );
    filtered.forEach((complaint) => {
        const row = `
                    <tr data-id="${complaint.id}">
                        <td>${complaint.id}</td>
                        <td>${complaint.title || ""}</td>
                        <td>${complaint.studentName || ""}</td>
                        <td>${complaint.date || ""}</td>
                        <td class="status-cell">
                            <span class="status-text">${
                                complaint.status || ""
                            }</span>
                            <span class="show-link" onclick="showComplaintDetails('${
                                complaint.id
                            }')">show</span>
                        </td>
                    </tr>`;
        myComplaintsTableBody.insertAdjacentHTML("beforeend", row);
    });

    // update small dashboard metrics based on filtered complaints
    updateSummaryMetrics();
}

function showComplaintDetails(id) {
    currentComplaintId = id;
    const complaint = (employeeComplaints || []).find(
        (c) => String(c.id) === String(id)
    );

    let student = students.find(
        (s) => String(s.id) === String(complaint.studentId)
    );

    let department = departments.find(
        (d) => String(d.id) === String(student.departmentId)
    );

    if (!complaint) {
        alert("لم يتم العثور على تفاصيل الشكوى.");
        return;
    }

    const detailsBox = document.querySelector(".details-box");
    if (!detailsBox) return;

    // clear previous strongs
    detailsBox.querySelectorAll("strong").forEach((el) => el.remove());

    // header row (id, date, status)
    const hr = detailsBox.querySelector(".header-row");
    if (hr && hr.children.length >= 3) {
        hr.children[2].insertAdjacentHTML(
            "beforeend",
            ` <strong>${complaint.id}</strong>`
        );
        hr.children[1].insertAdjacentHTML(
            "beforeend",
            ` <strong>${complaint.date || ""}</strong>`
        );
        hr.children[0].insertAdjacentHTML(
            "beforeend",
            ` <strong>${complaint.status || ""}</strong>`
        );
    }

    // second header row (student name, student id, department, level)
    const hr2 = detailsBox.querySelectorAll(".header-row")[1];
    if (hr2 && hr2.children.length >= 4) {
        hr2.children[3].insertAdjacentHTML(
            "beforeend",
            ` <strong>${complaint.studentName || ""}</strong>`
        );
        hr2.children[2].insertAdjacentHTML(
            "beforeend",
            ` <strong>${complaint.studentId || ""}</strong>`
        );
        hr2.children[1].insertAdjacentHTML(
            "beforeend",
            ` <strong>${department.name || ""}</strong>`
        );
        hr2.children[0].insertAdjacentHTML(
            "beforeend",
            ` <strong>${student.level || ""}</strong>`
        );
    }

    // name row
    const nameRow = detailsBox.querySelector(".name-row span");
    if (nameRow)
        nameRow.insertAdjacentHTML(
            "beforeend",
            ` <strong>${complaint.title || complaint.name || ""}</strong>`
        );

    const detDetails = document.getElementById("det-details");
    if (detDetails) detDetails.textContent = complaint.complaint_details || "";

    // reply

    // Try to find a saved reply for this complaint in the replies dataset
    const foundReply = (Array.isArray(replys) ? replys : []).find(
        (r) =>
            String(
                r.complaintId || r.complaintID || r.id || ""
            ).toLowerCase() === String(complaint.id || "").toLowerCase()
    );

    // Also allow an inline reply stored on the complaint object (from sendReply)
    const inlineReplyText =
        complaint && (complaint.reply || complaint.lastReply || null);

    const replySection = document.getElementById("reply-section");
    if (foundReply || inlineReplyText) {
        const lastReplyText = document.getElementById("last-reply-text");
        const lastReplyDate = document.getElementById("last-reply-date");
        const text = foundReply
            ? foundReply.text || foundReply.reply || ""
            : inlineReplyText;
        if (lastReplyText) lastReplyText.textContent = text || "";
        // prefer stored reply date when available
        const replyDateStr =
            foundReply && foundReply.date
                ? foundReply.date
                : new Date().toLocaleString();
        if (lastReplyDate) lastReplyDate.textContent = replyDateStr;
        if (replySection) replySection.classList.remove("hidden");
    } else {
        if (replySection) replySection.classList.add("hidden");
    }

    // show details page
    const dashboardPage = document.getElementById("dashboard-page");
    const detailsPage = document.getElementById("complaint-details-page");
    if (dashboardPage) {
        dashboardPage.classList.add("hidden");
        dashboardPage.classList.remove("active-page");
    }
    if (detailsPage) {
        detailsPage.classList.remove("hidden");
        detailsPage.classList.add("active-page");
    }

    // add back link
    const detailsHeader = document.querySelector(
        "#complaint-details-page .dashboard-header"
    );
    if (detailsHeader && !detailsHeader.querySelector(".back-link")) {
        const backLink = document.createElement("div");
        backLink.classList.add("back-link");
        backLink.onclick = hideComplaintDetails;
        backLink.innerHTML = '<i class="fas fa-arrow-left"></i> back';
        detailsHeader.prepend(backLink);
    }
}

function hideComplaintDetails() {
    currentComplaintId = null;
    const detailsPage = document.getElementById("complaint-details-page");
    const dashboardPage = document.getElementById("dashboard-page");
    if (detailsPage) {
        detailsPage.classList.add("hidden");
        detailsPage.classList.remove("active-page");
    }
    if (dashboardPage) {
        dashboardPage.classList.remove("hidden");
        dashboardPage.classList.add("active-page");
    }
    updateComplaintTables();
}

function callStudent() {
    if (!currentComplaintId) return;
    const complaint = (employeeComplaints || []).find(
        (c) => String(c.id) === String(currentComplaintId)
    );

    const student = (students || []).find(
        (s) => String(s.id) === String(complaint.studentId)
    );

    const phone = student ? student.phone || "" : "";
    if (phone) alert(`جاري الاتصال بالطالب... رقم الهاتف: ${phone}`);
}

function closeComplaint() {
    if (!currentComplaintId) return;
    if (!confirm("هل أنت متأكد من إغلاق الشكوى؟")) return;
    const complaint = (employeeComplaints || []).find(
        (c) => String(c.id) === String(currentComplaintId)
    );
    if (complaint) {
        complaint.status = "Resolved";
        showToast("Complaint closed successfully", "Success");
        hideComplaintDetails();
    }
}

function sendRedirect() {
    const sel = document.querySelector('input[name="redirect-to"]:checked');
    const selectedRecipient = sel ? sel.value : null;
    console.log(`Complaint redirected to: ${selectedRecipient}`);
    closeModal("redirect-modal");
    showToast("redirected successfully", "Success");
}

function sendReply() {
    const replyText = document.getElementById("reply-text").value;
    if (!replyText.trim() || !currentComplaintId) {
        alert("يرجى كتابة الرد قبل الإرسال.");
        return;
    }
    const complaint = (employeeComplaints || []).find(
        (c) => String(c.id) === String(currentComplaintId)
    );
    if (!complaint) return;
    complaint.status = "in progress";
    // attach inline reply
    complaint.reply = replyText;

    // create a reply object and persist it to local replies store
    const newReply = {
        id: `R${Date.now()}`,
        complaintId: String(complaint.id),
        date: new Date().toLocaleString(),
        text: replyText,
    };
    // ensure replies array exists
    if (!Array.isArray(replys)) replys = [];
    replys.push(newReply);
    try {
        const existing = JSON.parse(localStorage.getItem("replys") || "[]");
        const merged = Array.isArray(existing)
            ? existing.concat([newReply])
            : [newReply];
        localStorage.setItem("replys", JSON.stringify(merged));
    } catch (e) {
        console.warn("Failed to persist reply to localStorage", e);
    }

    showToast("Reply sent successfully", "Success");
    showComplaintDetails(currentComplaintId);
    closeModal("reply-modal");
    document.getElementById("reply-text").value = "";
}

// Initialize on DOM ready
document.addEventListener("DOMContentLoaded", async () => {
    try {
        const res = await Promise.all([
            fetch("/storage/employees.json").then((r) =>
                r.ok ? r.json() : []
            ),
            fetch("/storage/students.json").then((r) => (r.ok ? r.json() : [])),
            fetch("/storage/complaints.json").then((r) =>
                r.ok ? r.json() : []
            ),
            fetch("/storage/departments.json").then((r) =>
                r.ok ? r.json() : []
            ),
            fetch("/storage/faculties.json").then((r) =>
                r.ok ? r.json() : []
            ),
            fetch("/storage/replys.json").then((r) => (r.ok ? r.json() : [])),
        ]);
        employees = Array.isArray(res[0]) ? res[0] : [];
        students = Array.isArray(res[1]) ? res[1] : [];
        complaints = Array.isArray(res[2]) ? res[2] : [];
        departments = Array.isArray(res[3]) ? res[3] : [];
        faculties = Array.isArray(res[4]) ? res[4] : [];
        replys = Array.isArray(res[5]) ? res[5] : [];
    } catch (err) {
        console.warn("Failed to load some datasets", err);
    }

    // merge locally-saved replies (persisted by sendReply)
    try {
        const local = JSON.parse(localStorage.getItem("replys") || "[]");
        if (Array.isArray(local) && local.length) {
            const existingIds = new Set((replys || []).map((r) => r.id));
            for (const r of local) {
                if (!existingIds.has(r.id)) replys.push(r);
            }
        }
    } catch (e) {
        /* ignore */
    }

    // allow locally-saved students (signup fallback)
    try {
        const localStudents = JSON.parse(
            localStorage.getItem("students") || "[]"
        );
        if (Array.isArray(localStudents))
            students = students.concat(localStudents);
    } catch (e) {
        /* ignore */
    }

    computeEmployeeComplaints();
    updateComplaintTables();
    loadEmployeeAccount();

    // Wire filter controls to update table on change
    const studentIdFilter = document.getElementById("student-id-filter");
    const dateFrom = document.getElementById("date-from");
    const dateTo = document.getElementById("date-to");
    const statusFilter = document.getElementById("status-filter");

    const onFilterChange = () => {
        updateComplaintTables();
    };

    if (studentIdFilter) {
        studentIdFilter.addEventListener("input", onFilterChange);
    }
    if (dateFrom) {
        dateFrom.addEventListener("change", onFilterChange);
    }
    if (dateTo) {
        dateTo.addEventListener("change", onFilterChange);
    }
    if (statusFilter) {
        statusFilter.addEventListener("change", onFilterChange);
    }

    // Display staff username in header
    try {
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        if (user) {
            const nameEl = document.getElementById("staff-username");
            if (nameEl) {
                nameEl.textContent =
                    user.name || user.id || user.email || "staff";
            }
        }
    } catch (e) {
        /* ignore */
    }
});

document.addEventListener("DOMContentLoaded", () => {
    updateComplaintTables();
});
