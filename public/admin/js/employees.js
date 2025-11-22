document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("staff-table-body");
    const searchInput = document.getElementById("search-input");
    const facultyFilter = document.getElementById("faculty-filter");
    const departmentFilter = document.getElementById("department-filter");
    const roleFilter = document.getElementById("role-filter");

    const addEmployeeForm = document.getElementById("add-employee-form");
    const addEmployeeModalEl = document.getElementById("addEmployeeModal");
    const employeeFacultySelect = document.getElementById(
        "employee-faculty-select"
    );
    const employeeDepartmentSelect = document.getElementById(
        "employee-department-select"
    );
    const employeeRoleSelect = document.getElementById("employee-role-select");

    if (!tableBody) return;

    // get the necessary data
    const [employees, departments, faculties, complaints] = await Promise.all([
        fetch("/storage/employees.json").then((res) => res.json()),
        fetch("/storage/departments.json").then((res) => res.json()),
        fetch("/storage/faculties.json").then((res) => res.json()),
        fetch("/storage/complaints.json").then((res) => res.json()),
    ]);

    // If there are locally-saved employees (from department edits), prefer them
    try {
        const storedComplaints = localStorage.getItem("complaints");
        if (storedComplaints) {
            const parsed = JSON.parse(storedComplaints);
            if (Array.isArray(parsed)) {
                // mutate the fetched employees array in-place so downstream code uses updated roles
                complaints.splice(0, complaints.length, ...parsed);
            }
        }
    } catch (err) {
        console.warn("Could not parse stored complaints", err);
    }
    // If there are locally-saved employees (from department edits), prefer them
    try {
        const storedEmployees = localStorage.getItem("employees");
        if (storedEmployees) {
            const parsed = JSON.parse(storedEmployees);
            if (Array.isArray(parsed)) {
                // mutate the fetched employees array in-place so downstream code uses updated roles
                employees.splice(0, employees.length, ...parsed);
            }
        }
    } catch (err) {
        console.warn("Could not parse stored employees", err);
    }

    // If there are locally-saved departments, prefer them
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

    // If there are locally-saved faculties, prefer them
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

    // Populate faculty filter and faculty select
    if (facultyFilter || employeeFacultySelect) {
        faculties.forEach((f) => {
            facultyFilter.innerHTML += `<option value="${f.id}">${f.name}</option>`;
            employeeFacultySelect.innerHTML += `<option value="${f.id}">${f.name}</option>`;
        });
    }

    // Populate department filter and department select (after loading from localStorage)
    if (departmentFilter) {
        departmentFilter.innerHTML =
            '<option value="">All Departments</option>';
        departments.forEach((d) => {
            departmentFilter.innerHTML += `<option value="${d.id}">${d.name}</option>`;
        });
    }

    // Populate department select based on selected faculty
    if (employeeDepartmentSelect && employeeFacultySelect) {
        const populateDepartmentsForFaculty = (selectedFacultyId) => {
            employeeDepartmentSelect.innerHTML =
                '<option value="">Select Department</option>';

            if (!selectedFacultyId) return;

            // find departments that belong to the selected faculty
            departments
                .filter((d) => d.facultyId === selectedFacultyId)
                .forEach((d) => {
                    employeeDepartmentSelect.innerHTML += `<option value="${d.id}">${d.name}</option>`;
                });
        };

        employeeFacultySelect.addEventListener("change", (e) => {
            populateDepartmentsForFaculty(e.target.value);
            // update role options when faculty changes
            populateRoleOptions(
                e.target.value,
                employeeDepartmentSelect ? employeeDepartmentSelect.value : null
            );
        });

        // populate on load if a faculty is already selected
        if (employeeFacultySelect.value) {
            populateDepartmentsForFaculty(employeeFacultySelect.value);
            populateRoleOptions(
                employeeFacultySelect.value,
                employeeDepartmentSelect ? employeeDepartmentSelect.value : null
            );
        }
    }

    // update roles when department changes (faculty may be same)
    if (employeeDepartmentSelect && employeeFacultySelect) {
        employeeDepartmentSelect.addEventListener("change", (e) => {
            populateRoleOptions(employeeFacultySelect.value, e.target.value);
        });
    }

    // Populate role select based on current assignments (show available roles)
    const populateRoleOptions = (selectedFacultyId, selectedDepartmentId) => {
        if (!employeeRoleSelect) return;
        employeeRoleSelect.innerHTML =
            '<option value="">-- Select Role --</option>';

        // Always allow Professor
        const options = ["Professor"];

        // Check if department already has a Head
        const hasHead = employees.some(
            (emp) =>
                emp.role === "Head of Department" &&
                emp.departmentId === selectedDepartmentId
        );
        if (!hasHead) options.push("Head of Department");

        // Check if faculty already has a Dean (including those with departmentId = null)
        const hasDean = employees.some((emp) => {
            if (emp.role !== "Dean") return false;
            // Dean can be faculty-wide (no department) or department-based
            if (!emp.departmentId) {
                // Faculty-wide dean: check if their facultyId matches or if we can infer it
                return true; // Assume faculty-wide deans exist
            }
            const dep = departments.find((d) => d.id === emp.departmentId);
            return dep && dep.facultyId === selectedFacultyId;
        });
        if (!hasDean) options.push("Dean");

        // Check if faculty already has a Vice Dean (including those with departmentId = null)
        const hasVice = employees.some((emp) => {
            if (emp.role !== "Vice Dean") return false;
            if (!emp.departmentId) {
                return true; // Faculty-wide vice dean
            }
            const dep = departments.find((d) => d.id === emp.departmentId);
            return dep && dep.facultyId === selectedFacultyId;
        });
        if (!hasVice) options.push("Vice Dean");

        options.forEach((role) => {
            employeeRoleSelect.innerHTML += `<option value="${role}">${role}</option>`;
        });
    };

    const employeeData = employees.map((employee) => {
        const department = departments.find(
            (d) => d.id === employee.departmentId
        );
        const faculty = department
            ? faculties.find((f) => f.id === department.facultyId)
            : null;
        const complaintCount = complaints.filter(
            (c) => c.employeeId === employee.id
        ).length;
        return {
            ...employee,
            facultyId: faculty ? faculty.id : null,
            facultyName: faculty ? faculty.name : "N/A",
            departmentId: department ? department.id : null,
            departmentName: department ? department.name : "N/A",
            complaints: complaintCount,
        };
    });

    const renderTable = (data) => {
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="text-center">No employees found.</td></tr>`;
            return;
        }
        tableBody.innerHTML = data
            .map(
                (s) => `
            <tr>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${s.role}</td>
                <td>${s.facultyName}</td>
                <td>${s.departmentName}</td>
                <td>${s.complaints}</td>
                <td><a href="/admin/employee/view.html?id=${encodeURIComponent(
                    s.id
                )}" class="btn btn-sm btn-warning">View Details</a></td>
            </tr>
        `
            )
            .join("");
    };

    const filterData = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const role = roleFilter.value;
        const faculty = facultyFilter.value;
        const department = departmentFilter.value;

        let filtered = employeeData.filter(
            (s) =>
                s.id.toLowerCase().includes(searchTerm) ||
                s.name.toLowerCase().includes(searchTerm)
        );

        if (role) {
            filtered = filtered.filter((s) => s.role === role);
        }
        if (faculty) {
            filtered = filtered.filter((s) => s.facultyId === faculty);
        }
        if (department) {
            filtered = filtered.filter((s) => s.departmentId === department);
        }

        renderTable(filtered);
    };

    renderTable(employeeData);

    [searchInput, roleFilter, facultyFilter, departmentFilter].forEach((el) => {
        el.addEventListener("input", filterData);
        el.addEventListener("change", filterData);
    });

    // Save to localStorage
    const saveEmployeesData = () => {
        localStorage.setItem("employees", JSON.stringify(employees));
    };

    const saveFacultiesData = () => {
        localStorage.setItem("faculties", JSON.stringify(faculties));
    };

    // Validate and handle role conflicts
    const checkRoleConflict = (role, departmentId, facultyId) => {
        if (role === "Head of Department") {
            // Only one head per department
            const existingHead = employees.find(
                (emp) =>
                    emp.role === "Head of Department" &&
                    emp.departmentId === departmentId
            );
            if (existingHead) {
                return {
                    conflict: true,
                    message: `Department already has a Head: ${existingHead.name}. Demote them to Professor?`,
                    existingEmployee: existingHead,
                };
            }
        } else if (role === "Dean") {
            // Only one Dean per faculty
            const existingDean = employees.find(
                (emp) =>
                    emp.role === "Dean" &&
                    emp.departmentId &&
                    departments.find(
                        (d) =>
                            d.id === emp.departmentId &&
                            d.facultyId === facultyId
                    )
            );
            if (existingDean) {
                return {
                    conflict: true,
                    message: `Faculty already has a Dean: ${existingDean.name}. Demote them to Professor?`,
                    existingEmployee: existingDean,
                };
            }
        } else if (role === "Vice Dean") {
            // Only one Vice Dean per faculty
            const existingViceDean = employees.find(
                (emp) =>
                    emp.role === "Vice Dean" &&
                    emp.departmentId &&
                    departments.find(
                        (d) =>
                            d.id === emp.departmentId &&
                            d.facultyId === facultyId
                    )
            );
            if (existingViceDean) {
                return {
                    conflict: true,
                    message: `Faculty already has a Vice Dean: ${existingViceDean.name}. Demote them to Professor?`,
                    existingEmployee: existingViceDean,
                };
            }
        }
        return { conflict: false };
    };

    // Handle add employee form submission
    const addEmployeeModal = new bootstrap.Modal(addEmployeeModalEl);
    if (addEmployeeForm) {
        addEmployeeForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("employee-name").value.trim();
            const facultyId = employeeFacultySelect.value;
            const departmentId = employeeDepartmentSelect.value;
            const role = employeeRoleSelect.value;

            if (!name || !facultyId || !role) {
                alert(
                    "Please fill in all required fields (Name, Faculty, Role)."
                );
                return;
            }

            // Department is required only for Head of Department
            // Department is optional for Professor, Dean, and Vice Dean
            const requiresDepartment = role === "Head of Department";
            if (requiresDepartment && !departmentId) {
                alert(
                    "Please select a department for Head of Department role."
                );
                return;
            }

            // Note: we no longer perform automatic conflict checks on save.
            // The role select shows only available roles for the selected faculty/department.

            const newEmployeeId = `E${employees.length + 1}`;
            const newEmployee = {
                id: newEmployeeId,
                name,
                email: "", // optional, can be populated from form if needed
                role,
                departmentId: departmentId || null, // null for Dean/Vice Dean if not selected
            };

            // Add to employees array
            employees.push(newEmployee);

            // Build enriched object for table rendering
            const department = departmentId
                ? departments.find((d) => d.id === departmentId)
                : null;
            const faculty = department
                ? faculties.find((f) => f.id === department.facultyId)
                : faculties.find((f) => f.id === facultyId);

            const enriched = {
                ...newEmployee,
                facultyId: faculty ? faculty.id : null,
                facultyName: faculty ? faculty.name : "N/A",
                departmentName: department ? department.name : "N/A",
            };

            // Add to employeeData
            employeeData.push(enriched);

            // Save to localStorage and refresh
            saveEmployeesData();
            saveFacultiesData(); // Also save faculties so counts update when switching pages

            // Recalculate all employee data to ensure counts are fresh
            const updatedEmployeeData = employees.map((employee) => {
                const department = departments.find(
                    (d) => d.id === employee.departmentId
                );
                const faculty = department
                    ? faculties.find((f) => f.id === department.facultyId)
                    : null;
                const complaintCount = complaints.filter(
                    (c) => c.employeeId === employee.id
                ).length;
                return {
                    ...employee,
                    facultyId: faculty ? faculty.id : null,
                    facultyName: faculty ? faculty.name : "N/A",
                    departmentId: department ? department.id : null,
                    departmentName: department ? department.name : "N/A",
                    complaints: complaintCount,
                };
            });

            // Replace employeeData with updated version
            employeeData.splice(0, employeeData.length, ...updatedEmployeeData);

            renderTable(employeeData);
            addEmployeeModal.hide();
            addEmployeeForm.reset();
            employeeFacultySelect.value = "";
            employeeDepartmentSelect.innerHTML =
                '<option value="">-- Select Department --</option>';
        });
    }
});
