document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const departmentId = params.get("id");
    if (!departmentId) {
        return;
    }

    // get the necessary data
    const [faculties, departments, employees, students, complaints] =
        await Promise.all([
            fetch("/storage/faculties.json").then((res) => res.json()),
            fetch("/storage/departments.json").then((res) => res.json()),
            fetch("/storage/employees.json").then((res) => res.json()),
            fetch("/storage/students.json").then((res) => res.json()),
            fetch("/storage/complaints.json").then((res) => res.json()),
        ]);

    // If user previously saved departments in localStorage, use those
    try {
        const storedDepartments = localStorage.getItem("departments");
        if (storedDepartments) {
            const parsed = JSON.parse(storedDepartments);
            if (Array.isArray(parsed)) {
                // replace contents of fetched departments array
                departments.splice(0, departments.length, ...parsed);
            }
        }
    } catch (err) {
        console.warn("Could not parse stored departments", err);
    }

    // If user previously saved employees in localStorage, use those
    try {
        const storedEmployees = localStorage.getItem("employees");
        if (storedEmployees) {
            const parsed = JSON.parse(storedEmployees);
            if (Array.isArray(parsed)) {
                // replace contents of fetched employees array
                employees.splice(0, employees.length, ...parsed);
            }
        }
    } catch (err) {
        console.warn("Could not parse stored employees", err);
    }

    // If user previously saved faculties in localStorage, use those
    try {
        const storedFaculties = localStorage.getItem("faculties");
        if (storedFaculties) {
            const parsed = JSON.parse(storedFaculties);
            if (Array.isArray(parsed)) {
                // replace contents of fetched faculties array
                faculties.splice(0, faculties.length, ...parsed);
            }
        }
    } catch (err) {
        console.warn("Could not parse stored faculties", err);
    }

    const department = departments.find((d) => d.id === departmentId);
    if (!department) {
        return;
    }

    const head = employees.find((e) => e.id === department.headId);

    const departmentStudentsCount = students.filter(
        (s) => s.departmentId === departmentId
    ).length;
    const departmentComplaints = complaints.filter(
        (c) => c.departmentId === departmentId
    );

    document.getElementById("departmentName").innerHTML += `${department.name}`;
    document.getElementById("departmentHead").innerHTML += `${
        head
            ? `<a href="/admin/employee/view.html?id=${head.id}">${head.name}</a>`
            : "N/A"
    }`;
    document.getElementById("studentCount").innerHTML += `${
        departmentStudentsCount ? departmentStudentsCount : "N/A"
    }`;

    // summary
    document.getElementById(
        "complaintCount"
    ).innerHTML += `${departmentComplaints.length}`;
    document.getElementById("pending_complaint").innerHTML += `${
        departmentComplaints.filter((c) => c.status === "Pending").length
    }`;
    document.getElementById("in_progress_complaint").innerHTML += `${
        departmentComplaints.filter((c) => c.status === "In Progress").length
    }`;
    document.getElementById("resolved_complaint").innerHTML += `${
        departmentComplaints.filter((c) => c.status === "Resolved").length
    }`;

    const tableBody = document.getElementById("complaintTableBody");

    if (!tableBody) return;

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

    const complaintData = departmentComplaints.map((complaint) => {
        const student = students.find((s) => s.id === complaint.studentId);
        const employee = employees.find((e) => e.id === complaint.employeeId);

        return {
            ...complaint,
            studentName: student ? student.name : "N/A",
            employeeName: employee ? employee.name : "N/A",
        };
    });

    const renderTable = (data) => {
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No complaints found.</td></tr>`;
            return;
        }
        tableBody.innerHTML = data
            .map(
                (c) => `
            <tr>
                <td>${c.id}</td>
                <td>${c.title}</td>
                <td><a href="/admin/student/view.html?id=${c.studentId}">${
                    c.studentName
                }</a></td>
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
