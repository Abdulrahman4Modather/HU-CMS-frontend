document.addEventListener("DOMContentLoaded", async () => {
    const facultySelect = document.getElementById("faculty");
    const departmentSelect = document.getElementById("department");

    // get the necessary data
    let departments = [];
    let faculties = [];
    try {
        const res = await Promise.all([
            fetch("/storage/departments.json"),
            fetch("/storage/faculties.json"),
        ]);
        departments = await res[0].json();
        faculties = await res[1].json();
    } catch (err) {
        console.warn("Could not load faculties/departments", err);
    }

    // Optional local overrides for departments/faculties
    try {
        const storedDepartments = localStorage.getItem("departments");
        if (storedDepartments) {
            const parsed = JSON.parse(storedDepartments);
            if (Array.isArray(parsed)) departments = parsed;
        }
    } catch (err) {
        console.warn("Could not parse stored departments", err);
    }

    try {
        const storedFaculties = localStorage.getItem("faculties");
        if (storedFaculties) {
            const parsed = JSON.parse(storedFaculties);
            if (Array.isArray(parsed)) faculties = parsed;
        }
    } catch (err) {
        console.warn("Could not parse stored faculties", err);
    }

    // Populate faculty select
    if (facultySelect && Array.isArray(faculties)) {
        faculties.forEach((f) => {
            const opt = document.createElement("option");
            opt.value = f.id;
            opt.textContent = f.name;
            facultySelect.appendChild(opt);
        });
    }

    // Populate department select based on selected faculty
    const populateDepartmentsForFaculty = (selectedFacultyId) => {
        if (!departmentSelect) return;
        departmentSelect.innerHTML =
            '<option value="">Select Department</option>';
        if (!selectedFacultyId) return;
        departments
            .filter((d) => d.facultyId === selectedFacultyId)
            .forEach((d) => {
                const opt = document.createElement("option");
                opt.value = d.id;
                opt.textContent = d.name;
                departmentSelect.appendChild(opt);
            });
    };

    if (facultySelect) {
        facultySelect.addEventListener("change", (e) => {
            populateDepartmentsForFaculty(e.target.value);
        });
        // initial populate if value present
        if (facultySelect.value)
            populateDepartmentsForFaculty(facultySelect.value);
    }

    // no-op placeholder in case other code calls it
    window.populateRoleOptions = function () {};
});

// Handle student sign up: validate form and add new student to storage/students.json
document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const collegeId = document.getElementById("collegeId").value.trim();
    const faculty = document.getElementById("faculty").value.trim();
    const department = document.getElementById("department").value.trim();
    const level = document.getElementById("level").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document
        .getElementById("confirmPassword")
        .value.trim();
    const errorMsg = document.getElementById("errorMsg");
    const successMsg = document.getElementById("successMsg");

    errorMsg.textContent = "";
    successMsg.textContent = "";

    // Validate
    if (
        !name ||
        !collegeId ||
        !faculty ||
        !department ||
        !level ||
        !password
    ) {
        errorMsg.textContent = "Please fill in all required fields.";
        return;
    }

    if (password !== confirmPassword) {
        errorMsg.textContent = "Passwords do not match.";
        return;
    }

    if (password.length < 6) {
        errorMsg.textContent = "Password must be at least 6 characters.";
        return;
    }

    try {
        // Load any locally-saved students first (signup fallback)
        let allStudents = [];
        try {
            const localStored = localStorage.getItem("students") || "[]";
            const parsedLocal = JSON.parse(localStored);
            if (Array.isArray(parsedLocal))
                allStudents = allStudents.concat(parsedLocal);
        } catch (err) {
            console.warn("Could not parse local students", err);
        }

        // Also try to include the packaged students.json so we generate a non-conflicting ID
        try {
            const resp = await fetch("/storage/students.json");
            if (resp && resp.ok) {
                const remote = await resp.json();
                if (Array.isArray(remote))
                    allStudents = allStudents.concat(remote);
            }
        } catch (err) {
            // ignore - we'll rely on local students if remote not available
            console.warn("Could not load storage/students.json", err);
        }

        // // Determine last numeric ID (IDs are like 'S1015')
        // let lastId = 1000; // fallback base
        // if (allStudents.length > 0) {
        //     const numericIds = allStudents
        //         .map((s) => {
        //             try {
        //                 return parseInt(
        //                     (s.id || "").toString().replace(/[^0-9]/g, ""),
        //                     10
        //                 );
        //             } catch (e) {
        //                 return NaN;
        //             }
        //         })
        //         .filter((n) => !Number.isNaN(n));
        //     if (numericIds.length) {
        //         lastId = Math.max(...numericIds);
        //     }
        // }
        // const newStudentId = "S" + (lastId + 1);

        const newStudent = {
            id: collegeId,
            name: name,
            departmentId: department.id,
            facultyId: faculty.id,
            level,
            pass: password,
        };

        // Persist to localStorage (single source of truth for now)
        try {
            const stored = localStorage.getItem("students") || "[]";
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                parsed.push(newStudent);
                localStorage.setItem("students", JSON.stringify(parsed));
            } else {
                localStorage.setItem("students", JSON.stringify([newStudent]));
            }
            successMsg.textContent =
                "Account created locally. Redirecting to login...";
            successMsg.style.display = "block";
        } catch (err) {
            console.error("Failed to save locally", err);
            errorMsg.textContent = "Could not save account locally.";
            return;
        }

        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = "/login.html";
        }, 2000);
    } catch (err) {
        console.error(err);
        errorMsg.textContent = "Error creating account: " + err.message;
    }
});
