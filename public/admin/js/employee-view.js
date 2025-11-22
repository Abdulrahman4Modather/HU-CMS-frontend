document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const employeeId = params.get("id");
    if (!employeeId) {
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

    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) {
        return;
    }

    // If employee has a department, find its faculty. Otherwise, facultyId might be directly on employee.
    let employeeDepartment = null;
    let employeeFaculty = null;

    if (employee.departmentId) {
        employeeDepartment = departments.find(
            (d) => d.id === employee.departmentId
        );
        if (employeeDepartment) {
            employeeFaculty = faculties.find(
                (f) => f.id === employeeDepartment.facultyId
            );
        }
    } else if (employee.facultyId) {
        // For roles like Dean/Vice Dean who might not have a departmentId
        employeeFaculty = faculties.find((f) => f.id === employee.facultyId);
    }

    // If employee has no department or faculty, these will remain null.
    // The UI should handle displaying "N/A" for these cases.

    const employeeComplaints = complaints.filter(
        (c) => c.employeeId === employee.id
    );

    // header
    document.getElementById("employeeId").innerHTML += `${employee.id}`;
    document.getElementById("employeeName").innerHTML += `${employee.name}`;
    document.getElementById("employeeFaculty").innerHTML += `${
        employeeFaculty ? employeeFaculty.name : "N/A"
    }`;
    document.getElementById("employeeDepartment").innerHTML += `${
        employeeDepartment ? employeeDepartment.name : "N/A"
    }`;
    document.getElementById("employeeRole").innerHTML += `${employee.role}`;

    // summary
    document.getElementById(
        "complaintCount"
    ).innerHTML += `${employeeComplaints.length}`;
    document.getElementById("pending_complaint").innerHTML += `${
        employeeComplaints.filter((c) => c.status === "Pending").length
    }`;
    document.getElementById("in_progress_complaint").innerHTML += `${
        employeeComplaints.filter((c) => c.status === "In Progress").length
    }`;
    document.getElementById("resolved_complaint").innerHTML += `${
        employeeComplaints.filter((c) => c.status === "Resolved").length
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

    const complaintData = employeeComplaints.map((complaint) => {
        const student = students.find((s) => s.id === complaint.studentId);

        return {
            ...complaint,
            studentName: student ? student.name : "N/A",
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
                <td><a href="/admin/student/view.html?id=${c.studentId}">${
                    c.studentName
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
