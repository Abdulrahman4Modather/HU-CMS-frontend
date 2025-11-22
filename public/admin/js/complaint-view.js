document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const complaintId = params.get("id");
    if (!complaintId) {
        return;
    }

    // get the necessary data
    const [employees, students, complaints] = await Promise.all([
        fetch("/storage/employees.json").then((res) => res.json()),
        fetch("/storage/students.json").then((res) => res.json()),
        fetch("/storage/complaints.json").then((res) => res.json()),
    ]);

    const complaint = complaints.find((c) => c.id === complaintId);
    if (!complaint) {
        return;
    }

    const getStatusBadge = (status) => {
        const badgeClasses = {
            Pending: "badge-hu-danger",
            "In Progress": "badge-hu-info text-white",
            Resolved: "badge-hu-success",
        };
        return `<span class="badge ${
            badgeClasses[status] || "bg-secondary"
        }">${status}</span>`;
    };

    const assignedEmployee = employees.find(
        (e) => e.id === complaint.employeeId
    );
    const complaintStudent = students.find((s) => s.id === complaint.studentId);

    document.getElementById("complaintId").innerHTML += `${complaint.id}`;
    document.getElementById("complaintTitle").innerHTML += `${complaint.title}`;
    document.getElementById("complaintStatus").innerHTML += `${getStatusBadge(
        complaint.status
    )}`;
    document.getElementById("complaintDate").innerHTML += `${complaint.date}`;

    document.getElementById(
        "complaintStudent"
    ).innerHTML += `<a href="/admin/student/view.html?id=${encodeURIComponent(
        complaintStudent.id
    )}">${complaintStudent ? complaintStudent.name : "N/A"}</a>`;

    document.getElementById(
        "complaintEmployee"
    ).innerHTML += `<a href="/admin/employee/view.html?id=${encodeURIComponent(
        assignedEmployee.id
    )}">${assignedEmployee ? assignedEmployee.name : "N/A"}`;
});
