document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("departments-table-body");
    const searchInput = document.getElementById("search-input");
    const facultyFilter = document.getElementById("faculty-filter");

    const addDepartmentForm = document.getElementById("add-department-form");
    const addDepartmentModalEl = document.getElementById("addDepartmentModal");
    const departmentFacultySelect = document.getElementById(
        "department-faculty-select"
    );
    const departmentHeadSelect = document.getElementById(
        "department-head-select"
    );

    if (!tableBody) return;

    // get the necessary data
    const [faculties, departments, complaints, employees] = await Promise.all([
        fetch("/storage/faculties.json").then((res) => res.json()),
        fetch("/storage/departments.json").then((res) => res.json()),
        fetch("/storage/complaints.json").then((res) => res.json()),
        fetch("/storage/employees.json").then((res) => res.json()),
    ]);

    // If user previously saved faculties/departments/employees in localStorage, use those
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
        const storedEmployees = localStorage.getItem("employees");
        if (storedEmployees) {
            const parsed = JSON.parse(storedEmployees);
            if (Array.isArray(parsed)) {
                employees.splice(0, employees.length, ...parsed);
            }
        }
    } catch (err) {
        console.warn("Could not parse stored employees", err);
    }

    // Populate faculty filter and faculty select
    if (facultyFilter || departmentFacultySelect) {
        faculties.forEach((f) => {
            facultyFilter.innerHTML += `<option value="${f.id}">${f.name}</option>`;
            departmentFacultySelect.innerHTML += `<option value="${f.id}">${f.name}</option>`;
        });
    }

    // Populate department head select
    if (departmentHeadSelect && departmentFacultySelect) {
        const populateHeadsForFaculty = (selectedFacultyId) => {
            departmentHeadSelect.innerHTML =
                '<option value="">Select Department Head</option>';

            if (!selectedFacultyId) return;

            // find department IDs that belong to the selected faculty
            const deptIds = departments
                .filter((d) => d.facultyId === selectedFacultyId)
                .map((d) => d.id);

            // list employees who belong to any of those departments
            // Show employees with role Professor or Head of Department (not Dean/Vice Dean)
            employees.forEach((emp) => {
                if (
                    emp.departmentId &&
                    deptIds.includes(emp.departmentId) &&
                    (emp.role === "Professor" ||
                        emp.role === "Head of Department")
                ) {
                    // include role in label to make selection clearer
                    const label = emp.role
                        ? `${emp.name} (${emp.role})`
                        : emp.name;
                    departmentHeadSelect.innerHTML += `<option value="${emp.id}">${label}</option>`;
                }
            });
        };

        departmentFacultySelect.addEventListener("change", (e) => {
            populateHeadsForFaculty(e.target.value);
        });

        // populate on load if a faculty is already selected
        if (departmentFacultySelect.value) {
            populateHeadsForFaculty(departmentFacultySelect.value);
        }
    }

    // Save to localStorage after loading
    const saveDepartments = () => {
        localStorage.setItem("departments", JSON.stringify(departments));
    };

    const saveEmployees = () => {
        localStorage.setItem("employees", JSON.stringify(employees));
    };

    const saveFaculties = () => {
        localStorage.setItem("faculties", JSON.stringify(faculties));
    };

    const addDepartmentModal = new bootstrap.Modal(addDepartmentModalEl);

    const departmentData = departments.map((department) => {
        const faculty = faculties.find((f) => f.id === department.facultyId);
        const deptHead = employees.find((e) => e.id === department.headId);
        const complaintCount = complaints.filter(
            (c) => c.departmentId === department.id
        ).length;

        return {
            ...department,
            facultyName: faculty ? faculty.name : "N/A",
            deptHeadName: deptHead ? deptHead.name : "N/A",
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
                <td>${d.facultyName}</td>
                <td>${d.deptHeadName}</td>
                <td>${d.complaintCount}</td>
                <td><a href="/admin/department/view.html?id=${encodeURIComponent(
                    d.id
                )}" class="btn btn-sm btn-warning">View Details</a></td>
            </tr>
        `
            )
            .join("");
    };

    const filterData = () => {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
        const facultyId = facultyFilter ? facultyFilter.value : "";

        let filtered = departmentData.filter(
            (d) =>
                d.id.toLowerCase().includes(searchTerm) ||
                d.name.toLowerCase().includes(searchTerm)
        );

        if (facultyId) {
            filtered = filtered.filter((d) => d.facultyId === facultyId);
        }

        renderTable(filtered);
    };

    renderTable(departmentData);

    if (searchInput) {
        searchInput.addEventListener("input", filterData);
        searchInput.addEventListener("change", filterData);
    }
    if (facultyFilter) {
        facultyFilter.addEventListener("change", filterData);
    }

    if (addDepartmentForm) {
        addDepartmentForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document
                .getElementById("department-name")
                .value.trim();
            const facultyId = departmentFacultySelect.value;
            const headId = departmentHeadSelect.value;

            if (!name || !facultyId) {
                // basic validation
                alert("Please provide a department name and select a faculty.");
                return;
            }

            const newDepartmentId = `D${departments.length + 1}`;
            const newDepartment = {
                id: newDepartmentId,
                name,
                facultyId,
                headId: headId || null,
            };

            // push into raw departments array
            departments.push(newDepartment);

            // build enriched object for UI table
            const faculty = faculties.find((f) => f.id === facultyId);
            const deptHead = employees.find((emp) => emp.id === headId);
            const enriched = {
                ...newDepartment,
                facultyName: faculty ? faculty.name : "N/A",
                deptHeadName: deptHead ? deptHead.name : "N/A",
                complaintCount: 0,
            };

            departmentData.push(enriched);

            // If a head was selected, update that employee's role to Head of Department
            if (headId) {
                const emp = employees.find((emp) => emp.id === headId);
                if (emp) {
                    emp.role = "Head of Department";
                    saveEmployees();
                }
            }

            // Save to localStorage and refresh table
            saveDepartments();
            saveFaculties(); // Also save faculties for counts to update when switching pages
            renderTable(departmentData);
            addDepartmentModal.hide();
            e.target.reset();
        });
    }
});
