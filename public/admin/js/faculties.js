document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("faculties-table-body");
    const addFacultyForm = document.getElementById("add-faculty-form");
    const addFacultyModalEl = document.getElementById("addFacultyModal");

    if (!tableBody) return;

    // get the necessary data
    const [faculties, departments, complaints, employees] = await Promise.all([
        fetch("/storage/faculties.json").then((res) => res.json()),
        fetch("/storage/departments.json").then((res) => res.json()),
        fetch("/storage/complaints.json").then((res) => res.json()),
        fetch("/storage/employees.json").then((res) => res.json()),
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

    // Build a quick lookup for departments by id to map complaints to faculties
    const deptById = departments.reduce((acc, d) => {
        acc[d.id] = d;
        return acc;
    }, {});

    // Save to localStorage after loading
    const saveFaculties = () => {
        localStorage.setItem("faculties", JSON.stringify(faculties));
    };

    const addFacultyModal = new bootstrap.Modal(addFacultyModalEl);

    const facultyData = faculties.map((faculty) => {
        const dean = employees.find((e) => e.id === faculty.deanId);
        const departmentCount = departments.filter(
            (d) => d.facultyId === faculty.id
        ).length;

        // Count complaints that belong to departments inside this faculty
        const complaintCount = complaints.reduce((count, c) => {
            const dept = deptById[c.departmentId];
            return count + (dept && dept.facultyId === faculty.id ? 1 : 0);
        }, 0);

        return {
            ...faculty,
            deanName: dean ? dean.name : "N/A",
            departmentCount,
            complaintCount,
        };
    });

    const renderTable = (data) => {
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No faculties found.</td></tr>`;
            return;
        }
        tableBody.innerHTML = data
            .map(
                (f) => `
            <tr>
                <td>${f.id}</td>
                <td>${f.name}</td>
                <td>${f.deanName}</td>
                <td>${f.departmentCount}</td>
                <td>${f.complaintCount}</td>
                <td><a href="/admin/faculty/view.html?id=${encodeURIComponent(
                    f.id
                )}" class="btn btn-sm btn-warning">View Details</a></td>
            </tr>
        `
            )
            .join("");
    };

    renderTable(facultyData);

    if (addFacultyForm) {
        addFacultyForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("faculty-name").value.trim();

            if (!name) {
                // basic validation
                alert("Please provide a faculty name.");
                return;
            }

            const newFacultyId = `F${faculties.length + 1}`;
            const newFaculty = {
                id: newFacultyId,
                name,
                deanId: null,
            };

            // push into raw faculties array
            faculties.push(newFaculty);

            // build enriched object for UI table
            const enriched = {
                ...newFaculty,
                deanName: "N/A", // no dean assigned yet
                departmentCount: 0,
                complaintCount: 0,
            };

            facultyData.push(enriched);

            // Save to localStorage and refresh table
            saveFaculties();
            renderTable(facultyData);
            addFacultyModal.hide();
            addFacultyForm.reset();
        });
    }
});
