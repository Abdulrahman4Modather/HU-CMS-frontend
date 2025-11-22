document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const facultyId = params.get("id");
    if (!facultyId) {
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

    const faculty = faculties.find((f) => f.id === facultyId);
    if (!faculty) {
        return;
    }

    const dean = employees.find((e) => e.id === faculty.deanId);
    const viceDean = employees.find((e) => e.id === faculty.viceDeanId);
    const facultyDepartments = departments.filter(
        (d) => d.facultyId === facultyId
    );

    // Build a quick lookup for departments by id to map complaints to faculties
    const deptById = departments.reduce((acc, d) => {
        acc[d.id] = d;
        return acc;
    }, {});

    const facultyStudents = students.filter((s) => s.facultyId === facultyId);
    const complaintCount = complaints.reduce((count, c) => {
        const dept = deptById[c.departmentId];
        return count + (dept && dept.facultyId === faculty.id ? 1 : 0);
    }, 0);

    document.getElementById("facultyName").innerHTML += `${faculty.name}`;
    document.getElementById("facultyDean").innerHTML += `${
        dean ? dean.name : "N/A"
    }`;
    document.getElementById("facultyViceDean").innerHTML += `${
        viceDean ? viceDean.name : "N/A"
    }`;

    document.getElementById(
        "deptCount"
    ).innerHTML += `${facultyDepartments.length}`;
    document.getElementById(
        "studentCount"
    ).innerHTML += `${facultyStudents.length}`;
    document.getElementById("complaintCount").innerHTML += `${complaintCount}`;

    // Chart
    const ctx = document.getElementById("complaintChart");
    if (ctx) {
        const chartData = facultyDepartments.map((dept) => {
            return {
                name: dept.name,
                complaintCount: complaints.filter(
                    (c) => c.departmentId === dept.id
                ).length,
            };
        });

        new Chart(ctx, {
            type: "bar",
            data: {
                labels: chartData.map((d) => d.name),
                datasets: [
                    {
                        label: "Total Complaints",
                        data: chartData.map((d) => d.complaintCount),
                        backgroundColor: "#003366",
                    },
                ],
            },
            options: {
                indexAxis: "y",
                scales: {
                    x: {
                        beginAtZero: true,
                    },
                },
            },
        });
    }

    const tableBody = document.getElementById("deptTableBody");

    if (!tableBody) return;

    const departmentData = facultyDepartments.map((department) => {
        const deptHead = employees.find((e) => e.id === department.headId);
        const studentsCount = students.filter(
            (s) => s.departmentId === department.id
        ).length;
        const complaintCount = complaints.filter(
            (c) => c.departmentId === department.id
        ).length;

        return {
            ...department,
            deptHeadName: deptHead ? deptHead.name : "N/A",
            studentsCount,
            complaintCount,
        };
    });

    const renderTable = (data) => {
        if (!Array.isArray(data) || data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No departments found.</td></tr>`;
            return;
        }
        tableBody.innerHTML = data
            .map(
                (d) => `    
            <tr>
                <td>${d.id}</td>
                <td>${d.name}</td>
                <td>${d.deptHeadName}</td>
                <td>${d.studentsCount}</td>
                <td>${d.complaintCount}</td>
                <td><a href="/admin/department/view.html?id=${encodeURIComponent(
                    d.id
                )}" class="btn btn-sm btn-warning">View Details</a></td>
            </tr>
        `
            )
            .join("");
    };

    renderTable(departmentData);
});
