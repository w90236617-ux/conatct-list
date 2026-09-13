// ==========================================
// FIREBASE DATABASE REFERENCE (Changed to 'users')
// ==========================================
const database = firebase.database();
const usersRef = database.ref('users'); // 'contacts' ki jagah 'users'

// ==========================================
// DOM ELEMENTS
// ==========================================
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const contactIdInput = document.getElementById("contactId");
const addBtn = document.getElementById("addBtn");
const updateBtn = document.getElementById("updateBtn");
const cancelBtn = document.getElementById("cancelBtn");
const listContainer = document.getElementById("contactListContainer");
const searchInput = document.getElementById("searchInput");
const contactCount = document.getElementById("contactCount");
const themeToggleBtn = document.getElementById("themeToggleBtn");

// Store all contacts in memory
let allContacts = [];

// ==========================================
// THEME TOGGLE - DARK/LIGHT MODE
// ==========================================
themeToggleBtn.addEventListener("click", () => {
    const body = document.body;
    const icon = themeToggleBtn.querySelector("i");
    
    if (body.classList.contains("dark-mode")) {
        // Switch to Light Mode
        body.classList.remove("dark-mode");
        icon.className = "fas fa-moon";
        localStorage.setItem("theme", "light");
    } else {
        // Switch to Dark Mode
        body.classList.add("dark-mode");
        icon.className = "fas fa-sun";
        localStorage.setItem("theme", "dark");
    }
});

// Load saved theme on page load
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggleBtn.querySelector("i").className = "fas fa-sun";
}

// ==========================================
// 1. ADD CONTACT TO FIREBASE (With Auto-Generated Key)
// ==========================================
addBtn.addEventListener("click", () => {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();

    if (!username || !email) {
        alert("Please enter both Username and Email!");
        return;
    }

    // push() automatically generates a unique key (like: -NzXy123abc...)
    const newUserRef = usersRef.push();
    const generatedKey = newUserRef.key; // Get the generated key
    
    console.log("Generated Key:", generatedKey);

    // Save data with the generated key
    newUserRef.set({
        username: username,
        email: email,
        timestamp: Date.now()
    }).then(() => {
        console.log("✅ User added with key:", generatedKey);
        // Clear form after successful add
        usernameInput.value = "";
        emailInput.value = "";
    }).catch((error) => {
        console.error("❌ Error adding user:", error);
        alert("Failed to add user!");
    });
});

// ==========================================
// 2. LOAD USERS FROM FIREBASE (Real-time Listener)
// ==========================================
usersRef.on('value', (snapshot) => {
    const data = snapshot.val();
    listContainer.innerHTML = "";
    allContacts = [];

    if (!data) {
        listContainer.innerHTML = '<p class="loading-text">No users found. Add one!</p>';
        contactCount.textContent = "0";
        return;
    }

    // Convert object to array with IDs
    Object.keys(data).forEach(key => {
        allContacts.push({
            id: key, // This is the auto-generated key from Firebase
            username: data[key].username,
            email: data[key].email,
            timestamp: data[key].timestamp || 0
        });
    });

    // Sort by timestamp (newest first)
    allContacts.sort((a, b) => b.timestamp - a.timestamp);
    
    // Render contacts
    renderContacts(allContacts);
    contactCount.textContent = allContacts.length;
});

// ==========================================
// 3. RENDER CONTACTS ON SCREEN
// ==========================================
function renderContacts(contacts) {
    listContainer.innerHTML = "";

    if (contacts.length === 0) {
        listContainer.innerHTML = '<p class="loading-text">No users match your search.</p>';
        return;
    }

    contacts.forEach(contact => {
        const div = document.createElement("div");
        div.className = "contact-item";
        div.innerHTML = `
            <div class="contact-info">
                <h3>${contact.username}</h3>
                <p>${contact.email}</p>
            </div>
            <div class="action-buttons">
                <button class="icon-btn btn-edit" onclick="editUI('${contact.id}', '${contact.username}', '${contact.email}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="icon-btn btn-delete" onclick="deleteContact('${contact.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

// ==========================================
// 4. SEARCH FUNCTIONALITY (Matching items appear at top)
// ==========================================
searchInput.addEventListener("keyup", () => {
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!searchTerm) {
        // If search is empty, show all contacts normally
        renderContacts(allContacts);
        return;
    }

    // Filter matching contacts
    const matchingContacts = allContacts.filter(contact => {
        return contact.username.toLowerCase().includes(searchTerm) || 
               contact.email.toLowerCase().includes(searchTerm);
    });

    // Separate matching and non-matching
    const nonMatchingContacts = allContacts.filter(contact => {
        return !contact.username.toLowerCase().includes(searchTerm) && 
               !contact.email.toLowerCase().includes(searchTerm);
    });

    // Combine: matching first, then non-matching
    const sortedContacts = [...matchingContacts, ...nonMatchingContacts];
    
    // Render sorted list
    renderContacts(sortedContacts);
});

// ==========================================
// 5. EDIT UI - Prepare form for update
// ==========================================
window.editUI = (id, username, email) => {
    contactIdInput.value = id;
    usernameInput.value = username;
    emailInput.value = email;

    // Show Update and Cancel buttons, hide Add button
    addBtn.style.display = "none";
    updateBtn.style.display = "flex";
    cancelBtn.style.display = "flex";
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ==========================================
// 6. UPDATE USER IN FIREBASE
// ==========================================
updateBtn.addEventListener("click", () => {
    const id = contactIdInput.value;
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();

    if (!username || !email) {
        alert("Fields cannot be empty!");
        return;
    }

    // Update in Firebase using the auto-generated key
    usersRef.child(id).update({
        username: username,
        email: email
    }).then(() => {
        console.log("✅ User updated successfully!");
        // Reset form after update
        resetForm();
    }).catch((error) => {
        console.error("❌ Error updating user:", error);
        alert("Failed to update user!");
    });
});

// ==========================================
// 7. DELETE USER FROM FIREBASE
// ==========================================
window.deleteContact = (id) => {
    if (confirm("Are you sure you want to delete this user?")) {
        usersRef.child(id).remove()
            .then(() => {
                console.log("✅ User deleted successfully!");
            })
            .catch((error) => {
                console.error("❌ Error deleting user:", error);
                alert("Failed to delete user!");
            });
    }
};

// ==========================================
// 8. CANCEL EDIT / RESET FORM
// ==========================================
cancelBtn.addEventListener("click", resetForm);

function resetForm() {
    usernameInput.value = "";
    emailInput.value = "";
    contactIdInput.value = "";
    addBtn.style.display = "flex";
    updateBtn.style.display = "none";
    cancelBtn.style.display = "none";
}