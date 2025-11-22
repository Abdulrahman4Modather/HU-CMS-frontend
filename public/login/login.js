// Role-based login script. Reads users from storage/*.json and supports admin password override via localStorage.
document
    .getElementById("loginForm")
    .addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("emailInput").value.trim();
        const password = document.getElementById("passwordInput").value.trim();
        const role = document.querySelector('input[name="role"]:checked').value;
        const errorMsg = document.getElementById("errorMsg");
        errorMsg.textContent = "";

        try {
            let dataFile = "";
            let redirectUrl = "";
            let idField = "id";
            let passField = "pass";

            if (role === "admin") {
                dataFile = "/storage/admins.json";
                redirectUrl = "/admin/dashboard.html";
            } else if (role === "employee") {
                dataFile = "/storage/employees.json";
                redirectUrl = "/employee/index.html";
                idField = "email";
                passField = "pass";
            } else if (role === "student") {
                dataFile = "/storage/students.json";
                redirectUrl = "/student/complain.html";
                idField = "email";
                passField = "pass";
            }

            let users = [];
            try {
                const resp = await fetch(dataFile);
                if (resp && resp.ok) {
                    users = await resp.json();
                } else {
                    // couldn't fetch file, leave users as empty array and rely on localStorage fallback where appropriate
                    users = [];
                }
            } catch (fetchErr) {
                // network or file fetch error; proceed with empty users and try local fallbacks below
                console.warn("Could not fetch", dataFile, fetchErr);
                users = [];
            }

            // Merge any locally-saved users for this role (signup/registration fallback)
            if (role === "student") {
                try {
                    const stored = localStorage.getItem("students");
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) {
                            // append local students after remote ones
                            users = users.concat(parsed);
                        }
                    }
                } catch (err) {
                    console.warn("Failed to parse local students", err);
                }
            } else if (role === "employee") {
                try {
                    const stored = localStorage.getItem("employees");
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) {
                            // append local employees after remote ones
                            users = users.concat(parsed);
                        }
                    }
                } catch (err) {
                    console.warn("Failed to parse local employees", err);
                }
            } else if (role === "admin") {
                try {
                    const stored = localStorage.getItem("admins");
                    if (stored) {
                        const parsed = JSON.parse(stored);
                        if (Array.isArray(parsed)) {
                            // append local admins after remote ones
                            users = users.concat(parsed);
                        }
                    }
                } catch (err) {
                    console.warn("Failed to parse local admins", err);
                }
            }

            let user = null;
            if (role) {
                user = users.find(
                    (u) => (u.id || "").toLowerCase() === email.toLowerCase()
                );
            } else {
                user = users.find(
                    (u) =>
                        (u[idField] || "").toLowerCase() === email.toLowerCase()
                );
            }

            if (!user) {
                errorMsg.textContent = "Invalid email or password";
                return;
            }

            // Check for password override in localStorage (can be set by user profile update)
            let storedPassword = null;
            const storageKey = `${role}-${user.id || user.email}-password`;
            storedPassword = localStorage.getItem(storageKey);

            const correctPassword = storedPassword ?? user[passField];
            if (!correctPassword) {
                errorMsg.textContent = "Account has no password set";
                return;
            }

            if (password !== correctPassword) {
                errorMsg.textContent = "Invalid email or password";
                return;
            }

            // Save user info to localStorage
            const userToStore = {
                id: user.id || user.email,
                role,
                name: user.name || user.email,
            };
            localStorage.setItem("currentUser", JSON.stringify(userToStore));
            if (role === "student") {
                localStorage.setItem("student", JSON.stringify(user));
                // Load complaints into localStorage
                try {
                    const resp = await fetch("/storage/complaints.json");
                    if (resp && resp.ok) {
                        const complaints = await resp.json();
                        localStorage.setItem(
                            "complaints",
                            JSON.stringify(complaints)
                        );
                    }
                } catch (fetchErr) {
                    console.warn("Could not fetch complaints.json", fetchErr);
                }
            }

            // Redirect to role dashboard
            window.location.href = redirectUrl;
        } catch (err) {
            console.error(err);
            errorMsg.textContent = "Error loading user data";
        }
    });

// Toggle signup link visibility based on selected role
const updateSignupVisibility = () => {
    const signup = document.querySelector(".signup_container");
    const selected = document.querySelector('input[name="role"]:checked');
    const role = selected ? selected.value : null;
    if (signup) signup.style.display = role === "student" ? "block" : "none";
};

document
    .querySelectorAll('input[name="role"]')
    .forEach((r) => r.addEventListener("change", updateSignupVisibility));
// Set initial visibility (student is checked by default)
updateSignupVisibility();
