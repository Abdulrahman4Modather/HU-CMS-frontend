document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const studentId = params.get("id");
    if (!studentId) {
        return;
    }

    // get the necessary data
    const [employees, students, complaints, departments, faculties] =
        await Promise.all([
            fetch("/storage/employees.json").then((res) => res.json()),
            fetch("/storage/students.json").then((res) => res.json()),
            fetch("/storage/complaints.json").then((res) => res.json()),
            fetch("/storage/departments.json").then((res) => res.json()),
            fetch("/storage/faculties.json").then((res) => res.json()),
        ]);

    const student = students.find((s) => s.id === studentId);
    if (!student) {
        return;
    }

    const studentFaculty = faculties.find((f) => f.id === student.facultyId);
    const studentDepartment = departments.find(
        (d) => d.id === student.departmentId
    );
    const studentComplaints = complaints.filter(
        (c) => c.studentId === student.id
    );

    // header
    document.getElementById("studentId").innerHTML += `${student.id}`;
    document.getElementById("studentName").innerHTML += `${student.name}`;
    document.getElementById(
        "studentFaculty"
    ).innerHTML += `${studentFaculty.name}`;
    document.getElementById(
        "studentDepartment"
    ).innerHTML += `${studentDepartment.name}`;
    document.getElementById("studentLevel").innerHTML += `${student.level}`;

    // summary
    document.getElementById(
        "complaintCount"
    ).innerHTML += `${studentComplaints.length}`;
    document.getElementById("pending_complaint").innerHTML += `${
        studentComplaints.filter((c) => c.status === "Pending").length
    }`;
    document.getElementById("in_progress_complaint").innerHTML += `${
        studentComplaints.filter((c) => c.status === "In Progress").length
    }`;
    document.getElementById("resolved_complaint").innerHTML += `${
        studentComplaints.filter((c) => c.status === "Resolved").length
    }`;

    // table
    const tableBody = document.getElementById("complaintTableBody");

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

    const complaintData = studentComplaints.map((complaint) => {
        const employee = employees.find((e) => e.id === complaint.employeeId);

        return {
            ...complaint,
            employeeName: employee ? employee.name : "N/A",
        };
    });

    const renderTable = (data) => {
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No complaints found.</td></tr>`;
            return;
        }
        tableBody.innerHTML = data
            .map(
                (c) => `
            <tr>
                <td>${c.id}</td>
                <td>${c.title}</td>
                <td><a href="/admin/employee/view.html?id=${c.employeeId}">${
                    c.employeeName
                }</a></td>
                <td>${getStatusBadge(c.status)}</td>
                <td>${c.date}</td>
                <td><a <a href="/admin/complaint/view.html?id=${encodeURIComponent(
                    c.id
                )}" class="btn btn-sm btn-warning">View Details</a></td>
            </tr>
        `
            )
            .join("");
    };

    renderTable(complaintData);
});
