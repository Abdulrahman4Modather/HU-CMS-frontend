// Load Sidebar for Desktop and Mobile
fetch("/admin/includes/sidebar.html")
    .then((res) => res.text())
    .then((html) => {
        // Insert sidebar into both containers
        document.getElementById("sidebarContainer").innerHTML = html;
        document.getElementById("sidebarContainerMobile").innerHTML = html;

        // Get current file name (e.g., "students.html")
        const currentPage =
            window.location.pathname.split("/").pop() || "dashboard.html";

        // Highlight the matching link
        document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
            const href = link.getAttribute("href");

            // Get only the file name part of the href (handles "pages/students.html", "./students.html", etc.)
            const linkPage = href.split("/").pop();

            // Compare normalized names
            if (linkPage === currentPage) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    })
    .catch((err) => console.error("Error loading sidebar:", err));

// Load Header
fetch("/admin/includes/header.html")
    .then((res) => res.text())
    .then((html) => {
        document.getElementById("headerContainer").innerHTML = html;
    })
    .catch((err) => console.error("Error loading header:", err));
