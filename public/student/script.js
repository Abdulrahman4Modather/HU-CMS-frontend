// Check if user is logged in
const student = JSON.parse(localStorage.getItem("student"));
if (!student) {
    window.location.href = "/login.html";
}

// محاكاة عملية تسجيل الخروج والعودة لصفحة الدخول
function logout() {
    alert("Logging out...");
    window.location.href = "/login.html";
}

// فتح نافذة إضافة شكوى جديدة (في صفحة dashboard)
function openNewComplaintDialog() {
    const dialog = document.getElementById("new-complaint-dialog");
    if (dialog) {
        dialog.style.display = "flex";
    }
}

// إغلاق نافذة إضافة شكوى جديدة (في صفحة dashboard)
function closeNewComplaintDialog() {
    const dialog = document.getElementById("new-complaint-dialog");
    if (dialog) {
        dialog.style.display = "none";
        // يمكنك مسح الحقول هنا إذا أردت
        document.getElementById("complaint-name").value = "";
        document.getElementById("complaint-description").value = "";
    }
}

// محاكاة إرسال الشكوى
function submitComplaint() {
    const name = document.getElementById("complaint-name").value;
    const description = document.getElementById("complaint-description").value;

    if (name && description) {
        const student = JSON.parse(localStorage.getItem("student"));
        const complaints = JSON.parse(localStorage.getItem("complaints")) || [];

        const departmentId = student.departmentId;
        const deptHead = employees.find(
            (e) =>
                e.departmentId === departmentId &&
                e.role === "Head of Department"
        );

        const newComplaint = {
            id: `C${Date.now()}`,
            studentId: student.id,
            employeeId: deptHead,
            departmentId: departmentId,
            title: name,
            description: description,
            status: "Pending",
            date: new Date().toISOString().split("T")[0],
        };

        complaints.push(newComplaint);
        localStorage.setItem("complaints", JSON.stringify(complaints));

        alert(`Complaint "${name}" sent successfully!`);
        closeNewComplaintDialog();

        updateComplaintsView(newComplaint);
    } else {
        alert("Please fill in the complaint name and description.");
    }
}

// محاكاة تحديث واجهة الشكاوى بعد الإرسال
function updateComplaintsView(complaint) {
    // إخفاء رسالة 'No Complaints'
    document.getElementById("no-complaints-message").style.display = "none";

    // إظهار الجدول
    const table = document.getElementById("complaints-table");
    table.style.display = "table";

    // إضافة صف جديد للشكوى
    const tbody = table.querySelector("tbody");
    const newRow = tbody.insertRow();

    newRow.innerHTML = `
        <td>${complaint.id}</td>
        <td>${complaint.title}</td>
        <td>${complaint.date}</td>
        <td>${complaint.status}</td>
        <td></td>
    `;
}

// تحميل الشكاوى عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    const student = JSON.parse(localStorage.getItem("student"));
    const allComplaints = JSON.parse(localStorage.getItem("complaints")) || [];
    const studentComplaints = allComplaints.filter(
        (c) => c.studentId === student.id
    );

    if (studentComplaints.length > 0) {
        document.getElementById("no-complaints-message").style.display = "none";
        const table = document.getElementById("complaints-table");
        table.style.display = "table";
        const tbody = table.querySelector("tbody");
        tbody.innerHTML = ""; // Clear existing rows
        studentComplaints.forEach((complaint) => {
            updateComplaintsView(complaint);
        });
    }
});
