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

        const newComplaint = {
            id: `C${Date.now()}`,
            studentId: student.id,
            title: name,
            description: description,
            date: new Date().toISOString().split("T")[0],
            status: "Pending",
            employeeId: "",
            departmentId: "",
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
document.addEventListener("DOMContentLoaded", async () => {
    const student = JSON.parse(localStorage.getItem("student"));

    // get the necessary data
    let [complaints, employees] = await Promise.all([
        fetch("/storage/complaints.json").then((res) => res.json()),
        fetch("/storage/employees.json").then((res) => res.json()),
    ]);

    // Get complaints from local storage and merge them
    const localComplaints =
        JSON.parse(localStorage.getItem("complaints")) || [];
    complaints = [
        ...complaints,
        ...localComplaints.filter(
            (lc) => !complaints.find((c) => c.id === lc.id)
        ),
    ];

    const studentComplaints = localComplaints.filter(
        (c) => c.studentId === student.id
    );

    const complaintData = studentComplaints.map((complaint) => {
        const employee = employees.find((e) => e.id === complaint.employeeId);
        return {
            ...complaint,
            employeeName: employee ? employee.name : "N/A",
        };
    });

    const renderTable = (data) => {
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center">No complaints found.</td></tr>`;
            return;
        }
        tableBody.innerHTML = data
            .map(
                (c) => `
            <tr>
                <td>${c.id}</td>
                <td>${c.title}</td>
                <td>${c.date}</td>
                <td>${c.status}</td>
                <td>${c.employeeName}</td>
            </tr>
        `
            )
            .join("");
    };

    renderTable(complaintData)
});
