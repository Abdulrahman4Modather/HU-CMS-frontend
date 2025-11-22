document.addEventListener("DOMContentLoaded", async () => {
    // Get admin ID from sessionStorage (set by login page) or URL params
    let currentUserData = null;
    const storedUserData = localStorage.getItem("currentUser");
    if (storedUserData) {
        currentUserData = JSON.parse(storedUserData);
    }

    const adminId =
        currentUserData?.id ||
        new URLSearchParams(window.location.search).get("id");
    if (!adminId) {
        console.warn("No admin ID found. Redirect to login.");
        return;
    }

    // Fetch admins.json from storage/ directory
    let admins = [];
    try {
        admins = await fetch("/storage/admins.json").then((res) => res.json());
    } catch (err) {
        console.error("Failed to load admins.json", err);
        return;
    }

    const admin = Array.isArray(admins)
        ? admins.find((a) => a.id === adminId)
        : null;
    if (!admin) {
        console.warn("Admin not found for id", adminId);
        return;
    }

    // Allow persisted password overrides in localStorage so changes survive page reloads
    const storedPasswordKey = `admin-${adminId}-password`;
    const storedPassword = localStorage.getItem(storedPasswordKey);
    const currentStoredPassword = storedPassword ?? admin.pass;

    // Populate page fields with admin data from JSON
    const idInput = document.getElementById("adminId");
    const nameInput = document.getElementById("adminName");
    if (idInput) idInput.value = admin.id;
    if (nameInput) nameInput.value = admin.name ?? "";

    // Find the password form. There's a single form on the page for profile/password.
    const passwordForm = document.querySelector("form");
    if (!passwordForm) return;

    passwordForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const currentPassword =
            document.getElementById("currentPassword")?.value ?? "";
        const newPassword = document.getElementById("newPassword")?.value ?? "";

        if (!currentPassword || !newPassword) {
            alert("Please enter both current and new password.");
            return;
        }

        // Validate current password against stored override (if any) or original password
        if (currentPassword !== currentStoredPassword) {
            alert("Incorrect current password!");
            return;
        }

        if (newPassword.length < 6) {
            alert("New password must be at least 6 characters.");
            return;
        }

        // Persist the new password to localStorage (client-side only).
        // Note: This does not modify server-side files — to persist to server you need an API endpoint.
        localStorage.setItem(storedPasswordKey, newPassword);

        alert("Password updated successfully!");

        // clear the form fields
        const cur = document.getElementById("currentPassword");
        const nw = document.getElementById("newPassword");
        if (cur) cur.value = "";
        if (nw) nw.value = "";
    });
});
