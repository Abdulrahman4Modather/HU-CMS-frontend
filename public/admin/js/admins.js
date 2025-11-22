document.addEventListener("DOMContentLoaded", async () => {
    const tableBody = document.getElementById("admins-table-body");
    const searchInput = document.getElementById("search-input");

    const addAdminForm = document.getElementById("add-admin-form");
    const addAdminModalEl = document.getElementById("addAdminModal");

    if (!tableBody) return;

    // Load admins from localStorage first; if not present, fetch from JSON
    let admins =
        JSON.parse(localStorage.getItem("admins")) ||
        (await fetch("/storage/admins.json").then((res) => res.json()));

    // Save to localStorage after loading
    const saveAdmins = () => {
        localStorage.setItem("admins", JSON.stringify(admins));
    };

    const addAdminModal = new bootstrap.Modal(addAdminModalEl);

    const adminData = admins.map((admin) => ({
        ...admin,
    }));

    const renderTable = (data) => {
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" class="text-center">No admins found.</td></tr>`;
            return;
        }
        tableBody.innerHTML = data
            .map(
                (a) => `
            <tr>
                <td>${a.id}</td>
                <td>${a.name}</td>
                <td><a href="/admin/admin/view.html?id=${encodeURIComponent(
                    a.id
                )}" class="btn btn-sm btn-warning">View Details</a></td>
            </tr>
        `
            )
            .join("");
    };

    const filterData = () => {
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

        let filtered = adminData.filter(
            (a) =>
                a.id.toLowerCase().includes(searchTerm) ||
                a.name.toLowerCase().includes(searchTerm)
        );

        renderTable(filtered);
    };

    const refreshTable = () => {
        // Clear search input and re-render all admins
        if (searchInput) searchInput.value = "";
        renderTable(adminData);
    };

    renderTable(adminData);

    if (searchInput) {
        searchInput.addEventListener("input", filterData);
        searchInput.addEventListener("change", filterData);
    }

    if (addAdminForm) {
        addAdminForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("admin-name").value;
            const password = document.getElementById("admin-password").value;
            const passwordConfirm = document.getElementById(
                "admin-password-confirm"
            ).value;

            if (password !== passwordConfirm) {
                alert("Passwords do not match!");
                return;
            }

            const newAdminId = `A${admins.length + 1}`;
            const newAdmin = {
                id: newAdminId,
                name,
                password,
            };

            // Add to both admins and adminData arrays
            admins.push(newAdmin);
            adminData.push(newAdmin);

            // Save to localStorage and refresh table
            saveAdmins();
            refreshTable();
            addAdminModal.hide();
            e.target.reset();
        });
    }
});
