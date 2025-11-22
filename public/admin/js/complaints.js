document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("complaints-table-body");
    const searchInput = document.getElementById("search-input");
    const statusFilter = document.getElementById("status-filter");
    const facultyFilter = document.getElementById("faculty-filter");
    const departmentFilter = document.getElementById("department-filter");

    if (!tableBody) return;

    // get the necessary data
    let [complaints, students, employees, departments, faculties] =
        await Promise.all([
            fetch("/storage/complaints.json").then((res) => res.json()),
            fetch("/storage/students.json").then((res) => res.json()),
            fetch("/storage/employees.json").then((res) => res.json()),
            fetch("/storage/departments.json").then((res) => res.json()),
            fetch("/storage/faculties.json").then((res) => res.json()),
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

    // Populate filters
    faculties.forEach((f) => {
        facultyFilter.innerHTML += `<option value="${f.id}">${f.name}</option>`;
    });
    departments.forEach((d) => {
        departmentFilter.innerHTML += `<option value="${d.id}">${d.name}</option>`;
    });

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

    const complaintData = complaints.map((complaint) => {
        const student = students.find((s) => s.id === complaint.studentId);
        const employee = employees.find((e) => e.id === complaint.employeeId);
        const department = departments.find(
            (d) => d.id === complaint.departmentId
        );
        const faculty = department
            ? faculties.find((f) => f.id === department.facultyId)
            : null;
        return {
            ...complaint,
            studentName: student ? student.name : "N/A",
            employeeName: employee ? employee.name : "N/A",
            facultyId: faculty ? faculty.id : null,
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

    const filterData = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const status = statusFilter.value;
        const faculty = facultyFilter.value;
        const department = departmentFilter.value;

        let filtered = complaintData.filter(
            (c) =>
                c.id.toLowerCase().includes(searchTerm) ||
                c.title.toLowerCase().includes(searchTerm) ||
                c.studentName.toLowerCase().includes(searchTerm)
        );

        if (status) {
            filtered = filtered.filter((c) => c.status === status);
        }
        if (faculty) {
            filtered = filtered.filter((c) => c.facultyId === faculty);
        }
        if (department) {
            filtered = filtered.filter((c) => c.departmentId === department);
        }

        renderTable(filtered);
    };

    renderTable(complaintData);

    [searchInput, statusFilter, facultyFilter, departmentFilter].forEach(
        (el) => {
            el.addEventListener("input", filterData);
            el.addEventListener("change", filterData);
        }
    );
});
