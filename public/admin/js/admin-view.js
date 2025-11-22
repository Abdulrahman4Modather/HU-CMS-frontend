document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const adminId = params.get("id");
    if (!adminId) {
        return;
    }

    // get the necessary data
    const admins = await Promise.all([
        fetch("/storage/admins.json").then((res) => res.json()),
    ]);

    try {
        const storedAdmins = localStorage.getItem("admins");
        if (storedAdmins) {
            const parsed = JSON.parse(storedAdmins);
            if (Array.isArray(parsed)) {
                // replace contents of fetched admins array
                admins.splice(0, admins.length, ...parsed);
            }
        }
    } catch (err) {
        console.warn("Could not parse stored admins", err);
    }

    const admin = admins.find((a) => a.id === adminId);
    if (!admin) {
        return;
    }

    document.getElementById("adminId").innerHTML += `${admin.id}`;
    document.getElementById("adminName").innerHTML += `${admin.name}`;

    const deleteAdminForm = document.getElementById("delete-admin-form");
    const deleteAdminModalEl = document.getElementById("deleteAdminModal");

    const deleteAdminModal = new bootstrap.Modal(deleteAdminModalEl);

    if (deleteAdminForm) {
        deleteAdminForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // push into raw faculties array
            const newadmins = admins.filter((a) => a.id != adminId);

            localStorage.setItem("admins", JSON.stringify(newadmins));

            deleteAdminModal.hide();
            deleteAdminForm.reset();

            setTimeout(() => {
                window.location.href = "/admin/admins.html";
            });
        });
    }
});
