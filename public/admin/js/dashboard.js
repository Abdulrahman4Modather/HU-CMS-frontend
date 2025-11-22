// Load data and render a pie chart showing complaints per faculty.
(async function renderComplaintsByFaculty() {
    // Some pages/tools set a global `pathPrefix`. Avoid ReferenceError if it's absent.
    const base = typeof pathPrefix !== "undefined" ? pathPrefix : "";

    try {
        const [complaints, faculties, departments] = await Promise.all([
            fetch(`/storage/complaints.json`).then((r) => r.json()),
            fetch(`/storage/faculties.json`).then((r) => r.json()),
            fetch(`/storage/departments.json`).then((r) => r.json()),
        ]);

        document.getElementById(
            "complaintCount"
        ).innerHTML += `${complaints.length}`;
        document.getElementById("pending_complaint").innerHTML += `${
            complaints.filter((c) => c.status === "Pending").length
        }`;
        document.getElementById("in_progress_complaint").innerHTML += `${
            complaints.filter((c) => c.status === "In Progress").length
        }`;
        document.getElementById("resolved_complaint").innerHTML += `${
            complaints.filter((c) => c.status === "Resolved").length
        }`;

        const canvas = document.getElementById("complaintsByFacultyChart");
        if (!canvas) return; // nothing to draw onto

        // Attach facultyId to each complaint via department -> faculty lookup
        const complaintsWithFaculty = complaints.map((c) => {
            const dept = departments.find((d) => d.id === c.departmentId);
            return Object.assign({}, c, {
                facultyId: dept ? dept.facultyId : null,
            });
        });

        // Count complaints per facultyId
        const facultyCounts = complaintsWithFaculty.reduce((acc, c) => {
            if (c.facultyId) acc[c.facultyId] = (acc[c.facultyId] || 0) + 1;
            return acc;
        }, {});

        // Build labels and data arrays in stable order
        const facultyIds = Object.keys(facultyCounts);
        const labels = facultyIds.map((fid) => {
            const f = faculties.find((x) => x.id === fid);
            return f ? f.name : fid;
        });
        const data = facultyIds.map((fid) => facultyCounts[fid]);

        // Generate distinct colors (HSL) for each slice
        const backgroundColor = labels.map(
            (_, i) => `hsl(${(i * 360) / labels.length},70%,45%)`
        );

        // Destroy previous Chart instance if present (avoid duplicates during HMR or re-runs)
        if (canvas._chartInstance) {
            canvas._chartInstance.destroy();
        }

        const chart = new Chart(canvas, {
            type: "pie",
            data: {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor,
                        borderColor: "#fff",
                        borderWidth: 1,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: { enabled: true },
                },
            },
        });

        // Keep reference for potential cleanup
        canvas._chartInstance = chart;

        // --- Populate Recent Complaints table (latest 5) ---
        // Support both possible tbody ids: the HTML may contain either
        // `recentComplaintsTbody` (older change) or `recent-complaints-body` (current file).
        const recentTbody = document.getElementById("recent-complaints-body");
        if (recentTbody) {
            // Sort by date descending and take latest 5
            const latest = complaints
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);

            const statusBadge = (status) => {
                const s = (status || "").toLowerCase();
                if (s.includes("resolved"))
                    return '<span class="badge badge-hu-success">Resolved</span>';
                if (s.includes("in progress"))
                    return '<span class="badge badge-hu-info">In Progress</span>';
                if (s.includes("pending"))
                    return '<span class="badge badge-hu-danger">Pending</span>';
                // In Progress / New / other
                return (
                    '<span class="badge badge-hu-warning">' +
                    (status || "Unknown") +
                    "</span>"
                );
            };

            recentTbody.innerHTML = latest
                .map((c) => {
                    const date = new Date(c.date).toLocaleDateString();
                    return `
                    <tr>
                        <td>${c.id}</td>
                        <td>${escapeHtml(c.title)}</td>
                        <td>${statusBadge(c.status)}</td>
                        <td>${date}</td>
                        <td>
                            <a href="/admin/complaint/view.html?id=${encodeURIComponent(
                                c.id
                            )}" class="btn btn-sm btn-warning">view</a>
                        </td>
                    </tr>`;
                })
                .join("");
        }

        // Small helper to escape HTML for titles
        function escapeHtml(str) {
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
        }
    } catch (err) {
        // Fail gracefully in the browser console if data is missing or fetch fails
        // (useful during local file serve vs file:// testing)
        // eslint-disable-next-line no-console
        console.error("Failed to render complaintsByFaculty chart:", err);
    }
})();
