// =================================
// READING STATS PAGE
// =================================

if (document.getElementById("booksDone")) {

    // Get existing shelf data
    let statsShelf = JSON.parse(localStorage.getItem("shelfSpace")) || {
        toRead: [],
        reading: [],
        done: []
    };


    // 1. READING STATISTICS

    function updateStats() {

        const completed = statsShelf.done || [];

        const totalPages = completed.reduce((total, book) => {
            return total + Number(book.pagesRead || book.pages || 0);
        }, 0);

        const ratings = completed
            .map(book => Number(book.rating))
            .filter(rating => rating > 0);

        const averageRating = ratings.length
            ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
            : "0";

        document.getElementById("booksDone").textContent =
            `${completed.length} / 12`;

        document.getElementById("pagesRead").textContent =
            totalPages.toLocaleString();

        document.getElementById("averageRating").textContent =
            averageRating;

        document.getElementById("daysToFinish").textContent =
            totalPages > 0 ? Math.ceil(totalPages / 30) : "-";
    }

    updateStats();


    // 2. READING SESSION TIMER

    let remainingTime = 25 * 60;
    let timerInterval = null;

    function displayTimer() {

        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;

        document.getElementById("timer").textContent =
            `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    document.getElementById("startTimer").addEventListener("click", function () {

        if (timerInterval !== null) return;

        timerInterval = setInterval(function () {

            if (remainingTime > 0) {
                remainingTime--;
                displayTimer();
            } else {
                clearInterval(timerInterval);
                timerInterval = null;
                alert("Reading session completed!");
            }

        }, 1000);
    });

    document.getElementById("pauseTimer").addEventListener("click", function () {

        clearInterval(timerInterval);
        timerInterval = null;
    });

    document.getElementById("resetTimer").addEventListener("click", function () {

        clearInterval(timerInterval);
        timerInterval = null;

        remainingTime = 25 * 60;
        displayTimer();
    });


    // 3. ADD CUSTOM BOOK

    document.getElementById("addCustomBook").addEventListener("click", function () {

        const title = document.getElementById("customTitle").value.trim();
        const author = document.getElementById("customAuthor").value.trim();
        const pages = Number(document.getElementById("customPages").value);

        if (!title) {
            alert("Please enter book title.");
            return;
        }

        if (!Number.isInteger(pages) || pages <= 0) {
            alert("Please enter a valid page count.");
            return;
        }

        statsShelf.toRead.push({
            key: "custom-" + Date.now(),
            title: title,
            author: author || "Unknown Author",
            pages: pages,
            pagesRead: 0,
            rating: 0,
            cover_i: null
        });

        localStorage.setItem("shelfSpace", JSON.stringify(statsShelf));

        alert("Book added successfully!");

        document.getElementById("customTitle").value = "";
        document.getElementById("customAuthor").value = "";
        document.getElementById("customPages").value = "";
    });


    // 4. EXPORT JSON

    function updateJSON() {

        document.getElementById("shelfJSON").value =
            JSON.stringify(statsShelf, null, 2);
    }

    document.getElementById("copyJSON").addEventListener("click", async function () {

        updateJSON();

        try {
            await navigator.clipboard.writeText(
                document.getElementById("shelfJSON").value
            );

            alert("JSON copied successfully!");

        } catch (error) {
            alert("Unable to copy JSON.");
        }
    });


    // 5. SEND EMAIL SUMMARY

    document.getElementById("sendSummary").addEventListener("click", function () {

        const email = document.getElementById("shareEmail").value.trim();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("Please enter a valid email address.");
            return;
        }

        updateJSON();

        const subject = encodeURIComponent("My ShelfSpace Reading Summary");

        const body = encodeURIComponent(
            document.getElementById("shelfJSON").value
        );

        window.location.href =
            `mailto:${email}?subject=${subject}&body=${body}`;
    });


    // 6. IMPORT JSON

    document.getElementById("importJSON").addEventListener("click", function () {

        document.getElementById("importFile").click();
    });

    document.getElementById("importFile").addEventListener("change", function (event) {

        const file = event.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = function () {

            try {

                const importedShelf = JSON.parse(reader.result);

                if (
                    !importedShelf ||
                    !Array.isArray(importedShelf.toRead) ||
                    !Array.isArray(importedShelf.reading) ||
                    !Array.isArray(importedShelf.done)
                ) {
                    throw new Error("Invalid shelf data");
                }

                if (!confirm("Replace your existing shelf data?")) {
                    return;
                }

                statsShelf = importedShelf;

                localStorage.setItem(
                    "shelfSpace",
                    JSON.stringify(statsShelf)
                );

                updateStats();
                updateJSON();

                alert("Shelf imported successfully!");

            } catch (error) {
                alert("Invalid JSON file.");
            }

            event.target.value = "";
        };

        reader.readAsText(file);
    });

    updateJSON();

}