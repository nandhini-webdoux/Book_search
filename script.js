
// ======================================
// 1. GET HTML ELEMENTS
// ======================================

const bookContainer = document.getElementById("bookContainer");
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const randomBtn = document.getElementById("randomBtn");
const statusMessage = document.getElementById("statusMessage");

const toReadList = document.getElementById("toReadList");
const readingList = document.getElementById("readingList");
const doneList = document.getElementById("doneList");

const bookModal = document.getElementById("bookModal");
const modalDetails = document.getElementById("modalDetails");


// ======================================
// 2. SHELF DATA
// ======================================

let shelf = JSON.parse(localStorage.getItem("shelfSpace")) || {
    toRead: [],
    reading: [],
    done: []
};

let history = [];

let currentBooks = [];


// Save shelf data
function saveShelf() {

    localStorage.setItem("shelfSpace", JSON.stringify(shelf));

}


// Save previous state for Undo
function saveHistory() {

    history.push(JSON.stringify(shelf));

    if (history.length > 20) {
        history.shift();
    }

}


// ======================================
// 3. FETCH BOOKS FROM OPEN LIBRARY
// ======================================

async function fetchBooks(query) {

    try {

        statusMessage.textContent = "Searching books...";

        bookContainer.innerHTML = "";

        const url =
            `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=6`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("API request failed");
        }

        const data = await response.json();

        currentBooks = data.docs || [];

        if (currentBooks.length === 0) {

            statusMessage.textContent = "No books found.";

            return;
        }

        statusMessage.textContent =
            `${currentBooks.length} books found.`;

        currentBooks.forEach(book => {

            displayBook(book);

        });

    }

    catch (error) {

        console.error(error);

        statusMessage.textContent =
            "Unable to load books. Check your internet connection and try again.";

    }

}


// ======================================
// 4. DISPLAY BOOK CARDS
// ======================================

function displayBook(book) {

    const title = book.title || "Unknown Title";
    const author = book.author_name?.join(", ") || "Unknown Author";
    const year = book.first_publish_year || "N/A";
    const pages = book.number_of_pages_median || "N/A";

    const cover = book.cover_i
        ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
        : "https://placehold.co/200x280?text=No+Cover";

    const description = book.first_sentence
        ? (Array.isArray(book.first_sentence)
            ? book.first_sentence[0]
            : book.first_sentence)
        : "Click View Details to see more about this book.";

    const card = document.createElement("div");
    card.className = "book-card";

    // Book Cover
    const coverDiv = document.createElement("div");
    coverDiv.className = "book-cover";

    const image = document.createElement("img");
    image.src = cover;
    image.alt = title + " cover";

    image.onerror = function () {
        this.src = "https://placehold.co/200x280?text=No+Cover";
    };

    coverDiv.appendChild(image);

    // Book Title
    const heading = document.createElement("h4");
    heading.textContent = title;

    // Book Details
    const details = document.createElement("p");
    details.textContent = `${author} | ${year} | ${pages} pages`;

    // Description
    const descriptionText = document.createElement("p");
    descriptionText.className = "book-description";
    descriptionText.textContent = description;

    // Buttons
    const actions = document.createElement("div");
    actions.className = "book-actions";

    const addButton = document.createElement("button");

    // Check whether book already exists
    const currentShelf = JSON.parse(
        localStorage.getItem("shelfSpace")
    ) || { toRead: [], reading: [], done: [] };

    const isAlreadyAdded = [
        ...currentShelf.toRead,
        ...currentShelf.reading,
        ...currentShelf.done
    ].some(b => b.key === book.key);

    addButton.textContent = isAlreadyAdded
        ? "View Shelf"
        : "Add to shelf";

    // Button Click
    addButton.addEventListener("click", function () {

        if (addButton.textContent === "Add to shelf") {

            addToShelf(book);

            addButton.textContent = "View Shelf";

        } else {

            const shelfSection = document.querySelector(".my-shelf");

            if (shelfSection) {
                shelfSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }

        }

    });

    actions.appendChild(addButton);

    card.append(
        coverDiv,
        heading,
        details,
        descriptionText,
        actions
    );

    bookContainer.appendChild(card);
}


// ======================================
// 5. ADD BOOK TO SHELF
// ======================================

function addToShelf(book) {

    const bookKey = book.key;

    const alreadyExists = [
        ...shelf.toRead,
        ...shelf.reading,
        ...shelf.done
    ].some(item => item.key === bookKey);

    if (alreadyExists) {
        return;
    }

    saveHistory();

    const newBook = {

        key: book.key,
        title: book.title || "Unknown Title",
        author: book.author_name?.join(", ") || "Unknown Author",
        year: book.first_publish_year || "N/A",
        pages: book.number_of_pages_median || 0,

        cover: book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : "https://placehold.co/200x280?text=No+Cover",

        progress: 0,
        rating: 0,
        description: ""

    };

    shelf.toRead.push(newBook);

    saveShelf();

    renderShelf();

}


// ======================================
// 6. DISPLAY SHELF
// ======================================

function renderShelf() {

    toReadList.innerHTML = "";
    readingList.innerHTML = "";
    doneList.innerHTML = "";

    document.getElementById("toReadCount").textContent =
        shelf.toRead.length;

    document.getElementById("readingCount").textContent =
        shelf.reading.length;

    document.getElementById("doneCount").textContent =
        shelf.done.length;

    renderShelfColumn(shelf.toRead, toReadList, "toRead");

    renderShelfColumn(shelf.reading, readingList, "reading");

    renderShelfColumn(shelf.done, doneList, "done");

    const completed = shelf.done.length;

    document.getElementById("goalStatus").textContent =
        `Hi Reader! - Goal ${completed} / 12 - ${
            completed >= 12 ? "Goal reached!" : "On track"
        }`;

}


// ======================================
// 7. CREATE SHELF BOOK CARDS
// ======================================

function renderShelfColumn(books, container, type) {

    if (books.length === 0) {

        const empty = document.createElement("p");

        empty.className = "empty-shelf";

        empty.textContent = "No books added yet.";

        container.appendChild(empty);

        return;
    }

    books.forEach((book, index) => {

        const card = document.createElement("div");

        card.className = "shelf-book";

        const image = document.createElement("img");

        image.className = "small-cover";

        image.src = book.cover;

        image.alt = book.title;

        image.onerror = function () {
            this.src = "https://placehold.co/100x140?text=No+Cover";
        };

        const info = document.createElement("div");

        info.className = "book-info";

        const title = document.createElement("h4");

        title.textContent = book.title;

        const author = document.createElement("p");

        author.textContent = book.author;

        info.append(title, author);

        card.append(image, info);


        // TO READ BUTTON
        if (type === "toRead") {

            const button = document.createElement("button");

            button.textContent = "Move to Reading";

            button.onclick = () => {

                moveBook(index, "toRead", "reading");

            };

            card.appendChild(button);

        }


        // READING BUTTONS
        // READING BUTTONS
    if (type === "reading") {

    // Calculate progress percentage
    const totalPages = Number(book.pages) || 0;
    const pagesRead = Number(book.progress) || 0;

    const percentage = totalPages > 0
        ? Math.min(100, (pagesRead / totalPages) * 100)
        : 0;


    // Progress Text
    const progress = document.createElement("p");

    progress.className = "progress-text";

    progress.textContent =
        `${pagesRead} / ${totalPages || "N/A"} pages · ${percentage.toFixed(1)}%`;


    // Progress Bar Container
    const progressBar = document.createElement("div");

    progressBar.className = "progress-bar";


    // Progress Bar Fill
    const progressFill = document.createElement("div");

    progressFill.className = "progress-fill";

    progressFill.style.width = `${percentage}%`;

    progressBar.appendChild(progressFill);


    // Page Input
    const input = document.createElement("input");

    input.type = "number";

    input.min = 0;

    input.max = totalPages || undefined;

    input.placeholder = "Enter pages read";


    // Update Button
    const updateButton = document.createElement("button");

    updateButton.textContent = "Update progress";


    updateButton.onclick = () => {

        const pagesRead = Number(input.value);

        if (
            input.value === "" ||
            !Number.isInteger(pagesRead) ||
            pagesRead < 0 ||
            (totalPages > 0 && pagesRead > totalPages)
        ) {
            
            alert("Enter a valid number of pages.");

            return;
        }

        saveHistory();

        book.progress = pagesRead;


        // Move book to Done when completed
        if (totalPages > 0 && pagesRead === totalPages) {

            const rating = prompt(
                "You completed the book! Give a rating from 1 to 5:",
                "5"
            );

            const value = Number(rating);

            if (
                rating !== null &&
                Number.isInteger(value) &&
                value >= 1 &&
                value <= 5
            ) {
                book.rating = value;
            }

            shelf.reading.splice(index, 1);

            shelf.done.push(book);

        }

        saveShelf();

        renderShelf();

    };


    // Append Reading Elements
    card.append(
        progress,
        progressBar,
        input,
        updateButton
    );

}


        // DONE BUTTON
        if (type === "done") {

            const rating = document.createElement("p");

            rating.className = "rating";

            rating.textContent =
                `Rating: ${book.rating || "Not rated"} / 5`;

            const rateButton = document.createElement("button");

            rateButton.textContent = "Rate Book";

            rateButton.onclick = () => {

                const value = prompt("Give a rating from 1 to 5:");

                if (value === null) return;

                const number = Number(value);

                if (
                    !Number.isInteger(number) ||
                    number < 1 ||
                    number > 5
                ) {

                    alert("Please enter a rating between 1 and 5.");

                    return;
                }

                saveHistory();

                book.rating = number;

                saveShelf();

                renderShelf();

            };

            card.append(rating, rateButton);

        }


        // REMOVE BUTTON
        const removeButton = document.createElement("button");

        removeButton.textContent = "Remove";

        removeButton.onclick = () => {

            if (!confirm("Remove this book from your shelf?")) return;

            saveHistory();

            shelf[type].splice(index, 1);

            saveShelf();

            renderShelf();

        };

        card.appendChild(removeButton);

        container.appendChild(card);

    });

}

function addReadingProgress(book, card) {

    const totalPages = Number(book.pages) || 0;
    const pagesRead = Number(book.progress) || 0;

    const percentage = totalPages > 0
        ? Math.min(100, (pagesRead / totalPages) * 100)
        : 0;

    // Progress details
    const progressDetails = document.createElement("p");

    progressDetails.className = "progress-details";

    progressDetails.textContent =
        `${pagesRead} / ${totalPages} pages · ${percentage.toFixed(1)}%`;

    // Progress bar container
    const progressBar = document.createElement("div");

    progressBar.className = "progress-bar";

    const progressFill = document.createElement("div");

    progressFill.className = "progress-fill";

    progressFill.style.width = `${percentage}%`;

    progressBar.appendChild(progressFill);

    // Update button
    const updateButton = document.createElement("button");

    updateButton.textContent = "Update progress";

    updateButton.className = "update-progress-btn";

    updateButton.addEventListener("click", function () {

        const newPages = prompt(
            `How many pages have you read? (Maximum ${totalPages})`,
            pagesRead
        );

        if (newPages === null || newPages.trim() === "") {
            return;
        }

        const pages = Number(newPages);

        if (
            !Number.isInteger(pages) ||
            pages < 0 ||
            pages > totalPages
        ) {
            return;
        }

        // Update reading progress
        book.progress = pages;

        saveShelf();

        renderShelf();

    });

    card.append(
        progressDetails,
        progressBar,
        updateButton
    );
}
// ======================================
// 8. MOVE BOOK BETWEEN COLUMNS
// ======================================

function moveBook(index, from, to) {

    saveHistory();

    const book = shelf[from].splice(index, 1)[0];

    shelf[to].push(book);

    saveShelf();

    renderShelf();

}


// ======================================
// 9. BOOK DETAILS MODAL
// ======================================

async function showBookDetails(book) {

    bookModal.style.display = "flex";

    modalDetails.textContent = "Loading book details...";

    try {

        let description = "Description is not available.";

        if (book.key) {

            const response = await fetch(
                `https://openlibrary.org${book.key}.json`
            );

            if (response.ok) {

                const data = await response.json();

                if (data.description) {

                    description =
                        typeof data.description === "string"
                            ? data.description
                            : data.description.value;

                }

            }

        }

        const cover = book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
            : "https://placehold.co/200x280?text=No+Cover";

        modalDetails.replaceChildren();

        const image = document.createElement("img");

        image.src = cover;

        image.className = "modal-book-image";

        image.alt = book.title || "Book cover";

        const title = document.createElement("h2");

        title.textContent = book.title || "Unknown Title";

        const author = document.createElement("p");

        author.textContent =
            "Author: " + (book.author_name?.join(", ") || "Unknown");

        const year = document.createElement("p");

        year.textContent =
            "Published: " + (book.first_publish_year || "N/A");

        const pages = document.createElement("p");

        pages.textContent =
            "Pages: " + (book.number_of_pages_median || "N/A");

        const content = document.createElement("p");

        content.className = "modal-description";

        content.textContent = description;

        modalDetails.append(
            image,
            title,
            author,
            year,
            pages,
            content
        );

    }

    catch (error) {

        modalDetails.textContent =
            "Unable to load the book description.";

        console.error(error);

    }

}


// Close Modal
document.getElementById("closeModal").onclick = () => {

    bookModal.style.display = "none";

};

bookModal.addEventListener("click", event => {

    if (event.target === bookModal) {

        bookModal.style.display = "none";

    }

});


// ======================================
// 10. SEARCH BUTTON
// ======================================

searchBtn.addEventListener("click", () => {

    const query = searchInput.value.trim();

    if (!query) {

        statusMessage.textContent =
            "Please enter a book title or author.";

        return;
    }

    fetchBooks(query);

});


// Enter Key Search
searchInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        searchBtn.click();

    }

});


// ======================================
// 11. RANDOM BOOK
// ======================================

randomBtn.addEventListener("click", () => {

    const subjects = [
        "fantasy",
        "science",
        "history",
        "romance",
        "mystery"
    ];

    const random =
        subjects[Math.floor(Math.random() * subjects.length)];

    searchInput.value = random;

    fetchBooks(random);

});


// ======================================
// 12. SUBJECT BUTTONS
// ======================================

document.querySelectorAll(".subject-btn").forEach(button => {

    button.addEventListener("click", () => {

        const subject = button.dataset.subject;

        searchInput.value = subject;

        fetchBooks(subject);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

});


// ======================================
// 13. SORT BY TITLE
// ======================================

document.getElementById("sortTitleBtn").onclick = () => {

    saveHistory();

    Object.keys(shelf).forEach(type => {

        shelf[type].sort((a, b) =>
            a.title.localeCompare(b.title)
        );

    });

    saveShelf();

    renderShelf();

};


// ======================================
// 14. SORT BY RATING
// ======================================

document.getElementById("sortRatingBtn").onclick = () => {

    saveHistory();

    Object.keys(shelf).forEach(type => {

        shelf[type].sort((a, b) =>
            (b.rating || 0) - (a.rating || 0)
        );

    });

    saveShelf();

    renderShelf();

};


// ======================================
// 15. UNDO BUTTON
// ======================================

document.getElementById("undoBtn").onclick = () => {

    if (history.length === 0) {

        alert("Nothing to undo.");

        return;
    }

    shelf = JSON.parse(history.pop());

    saveShelf();

    renderShelf();

};


// ======================================
// 16. EXPORT JSON
// ======================================

document.getElementById("exportBtn").onclick = () => {

    const jsonData = JSON.stringify(shelf, null, 4);

    const blob = new Blob(
        [jsonData],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "ShelfSpace-Books.json";

    link.click();

    URL.revokeObjectURL(url);

};


// ======================================
// 17. INITIALIZE WEBSITE
// ======================================

renderShelf();

fetchBooks("fiction");



