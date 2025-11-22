document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("students-table-body");
    const searchInput = document.getElementById("search-input");
    const facultyFilter = document.getElementById("faculty-filter");
    const departmentFilter = document.getElementById("department-filter");
    const levelFilter = document.getElementById("level-filter");

    if (!tableBody) return;

    // get the necessary data
    const [students, departments, faculties, complaints] = await Promise.all([
        fetch("/storage/students.json").then((res) => res.json()),
        fetch("/storage/departments.json").then((res) => res.json()),
        fetch("/storage/faculties.json").then((res) => res.json()),
        fetch("/storage/complaints.json").then((res) => res.json()),
    ]);

    // If user previously saved departments/faculties in localStorage, use those
    try {
        const storedDepartments = localStorage.getItem("departments");
        if (storedDepartments) {
            const parsed = JSON.parse(storedDepartments);
            if (Array.isArray(parsed)) {
                departments.splice(0, departments.length, ...parsed);
            }
        }
    } catch (err) {
        console.warn("Could not parse stored departments", err);
    }

    try {
        const storedFaculties = localStorage.getItem("faculties");
        if (storedFaculties) {
            const parsed = JSON.parse(storedFaculties);
            if (Array.isArray(parsed)) {
                faculties.splice(0, faculties.length, ...parsed);
            }
        }
    } catch (err) {
        console.warn("Could not parse stored faculties", err);
    }

    // Populate filters
    faculties.forEach((f) => {
        facultyFilter.innerHTML += `<option value="${f.id}">${f.name}</option>`;
    });
    departments.forEach((d) => {
        departmentFilter.innerHTML += `<option value="${d.id}">${d.name}</option>`;
    });

    const studentData = students.map((student) => {
        const department = departments.find(
            (d) => d.id === student.departmentId
        );
        const faculty = department
            ? faculties.find((f) => f.id === department.facultyId)
            : null;
        const complaintsCount = complaints.filter(
            (c) => c.studentId === student.id
        ).length;
        return {
            ...student,
            facultyId: faculty ? faculty.id : null,
            facultyName: faculty ? faculty.name : "N/A",
            departmentId: department ? department.id : null,
            departmentName: department ? department.name : "N/A",
            complaints: complaintsCount,
        };
    });

    const renderTable = (data) => {
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No students found.</td></tr>`;
            return;
        }
        tableBody.innerHTML = data
            .map(
                (s) => `
            <tr>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${s.facultyName}</td>
                <td>${s.departmentName}</td>
                <td>${s.level}</td>
                <td>${s.complaints}</td>
                <td><a href="/admin/student/view.html?id=${encodeURIComponent(
                    s.id
                )}" class="btn btn-sm btn-warning">View Details</a></td>
            </tr>
        `
            )
            .join("");
    };

    const filterData = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const level = levelFilter.value;
        const faculty = facultyFilter.value;
        const department = departmentFilter.value;

        let filtered = studentData.filter(
            (s) =>
                s.id.toLowerCase().includes(searchTerm) ||
                s.name.toLowerCase().includes(searchTerm)
        );

        if (level) {
            filtered = filtered.filter((s) => s.level === level);
        }
        if (faculty) {
            filtered = filtered.filter((s) => s.facultyId === faculty);
        }
        if (department) {
            filtered = filtered.filter((s) => s.departmentId === department);
        }

        renderTable(filtered);
    };

    renderTable(studentData);

    [searchInput, levelFilter, facultyFilter, departmentFilter].forEach(
        (el) => {
            el.addEventListener("input", filterData);
            el.addEventListener("change", filterData);
        }
    );
});
