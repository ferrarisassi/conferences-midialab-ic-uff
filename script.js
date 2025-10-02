// Conference data storage with automatic persistence
let conferences = [];
let editingIndex = -1;
let currentFilters = {
    search: '',
    sortBy: 'name',
    showUpcoming: true,
    showPast: true,
    showActive: true
};

// Storage key for localStorage
const STORAGE_KEY = 'conference_manager_pro_data';

// DOM elements
const modal = document.getElementById('conferenceModal');
const addBtn = document.getElementById('addConferenceBtn');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const form = document.getElementById('conferenceForm');
const modalTitle = document.getElementById('modalTitle');
const conferenceList = document.getElementById('conferenceList');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const filterBtn = document.getElementById('filterBtn');
const filterPanel = document.getElementById('filterPanel');
const applyFilters = document.getElementById('applyFilters');
const exportBtn = document.getElementById('exportBtn');

// Stats elements
const totalConferences = document.getElementById('totalConferences');
const upcomingDeadlines = document.getElementById('upcomingDeadlines');
const activeConferences = document.getElementById('activeConferences');

// Load data from localStorage
function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            conferences = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading data:', e);
            conferences = [];
        }
    }
    
    // If no data exists, initialize with sample data
    if (conferences.length === 0) {
        initializeSampleData();
    }
    
    updateStats();
    renderConferences();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conferences));
    updateStats();
}

// Initialize with sample data
function initializeSampleData() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    conferences = [
        {
            name: "International Conference on Machine Learning",
            location: "Honolulu, Hawaii",
            website: "https://icml.cc",
            category: "computer-science",
            submissionDate: nextWeek.toISOString().split('T')[0],
            notificationDate: "2025-04-15",
            conferenceStartDate: "2025-07-21",
            conferenceEndDate: "2025-07-27",
            status: "planned",
            notes: "Premier conference on machine learning research. Planning to submit paper on neural architecture search."
        },
        {
            name: "ACM SIGCHI Conference",
            location: "Paris, France",
            website: "https://chi2025.acm.org",
            category: "computer-science",
            submissionDate: "2025-02-15",
            notificationDate: "2025-05-01",
            conferenceStartDate: "2025-09-10",
            conferenceEndDate: "2025-09-15",
            status: "submitted",
            notes: "Human-Computer Interaction conference. Submitted paper on UX design patterns."
        },
        {
            name: "NeurIPS 2025",
            location: "Vancouver, Canada",
            website: "https://neurips.cc",
            category: "computer-science",
            submissionDate: "2024-05-15",
            notificationDate: "2024-09-15",
            conferenceStartDate: "2025-12-10",
            conferenceEndDate: "2025-12-16",
            status: "accepted",
            notes: "Paper accepted! Topic: Federated Learning Optimization"
        }
    ];
    saveData();
}

// Update statistics
function updateStats() {
    totalConferences.textContent = conferences.length;
    
    const today = new Date();
    const upcomingCount = conferences.filter(conf => {
        const submissionDate = new Date(conf.submissionDate);
        return submissionDate >= today;
    }).length;
    
    upcomingDeadlines.textContent = upcomingCount;
    
    const activeCount = conferences.filter(conf => 
        conf.status === 'submitted' || conf.status === 'accepted'
    ).length;
    
    activeConferences.textContent = activeCount;
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Calculate days until date
function getDaysUntil(dateString) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Past', urgent: false };
    if (diffDays === 0) return { text: 'Today', urgent: true };
    if (diffDays === 1) return { text: '1 day', urgent: true };
    if (diffDays <= 7) return { text: `${diffDays} days`, urgent: true };
    return { text: `${diffDays} days`, urgent: false };
}

// Get status display info
function getStatusInfo(status) {
    const statusMap = {
        'planned': { text: 'Planned', class: 'planned' },
        'submitted': { text: 'Submitted', class: 'submitted' },
        'accepted': { text: 'Accepted', class: 'accepted' },
        'rejected': { text: 'Rejected', class: 'rejected' },
        'attended': { text: 'Attended', class: 'attended' }
    };
    return statusMap[status] || { text: status, class: 'planned' };
}

// Get category display name
function getCategoryName(category) {
    const categoryMap = {
        'computer-science': 'Computer Science',
        'engineering': 'Engineering',
        'medicine': 'Medicine',
        'business': 'Business',
        'social-sciences': 'Social Sciences',
        'other': 'Other'
    };
    return categoryMap[category] || category;
}

// Filter and sort conferences
function getFilteredConferences() {
    let filtered = conferences.filter(conf => {
        // Search filter
        const searchTerm = currentFilters.search.toLowerCase();
        const matchesSearch = !searchTerm || 
            conf.name.toLowerCase().includes(searchTerm) ||
            conf.location.toLowerCase().includes(searchTerm) ||
            (conf.notes && conf.notes.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
        
        // Status filters
        const submissionDate = new Date(conf.submissionDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const isUpcoming = submissionDate >= today;
        const isPast = submissionDate < today;
        const isActive = conf.status === 'submitted' || conf.status === 'accepted';
        
        if (isUpcoming && !currentFilters.showUpcoming) return false;
        if (isPast && !currentFilters.showPast) return false;
        if (isActive && !currentFilters.showActive) return false;
        
        return true;
    });
    
    // Sort conferences
    filtered.sort((a, b) => {
        switch (currentFilters.sortBy) {
            case 'submissionDate':
                return new Date(a.submissionDate) - new Date(b.submissionDate);
            case 'conferenceStartDate':
                return new Date(a.conferenceStartDate) - new Date(b.conferenceStartDate);
            case 'location':
                return a.location.localeCompare(b.location);
            case 'name':
            default:
                return a.name.localeCompare(b.name);
        }
    });
    
    return filtered;
}

// Render all conferences
function renderConferences() {
    const filteredConferences = getFilteredConferences();
    
    if (filteredConferences.length === 0) {
        conferenceList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 20px;"></i>
                <div>No conferences match your current filters.</div>
                <div style="margin-top: 10px; font-size: 1rem;">Try adjusting your search or filters.</div>
            </div>
        `;
        return;
    }

    conferenceList.innerHTML = filteredConferences.map((conf, index) => {
        const originalIndex = conferences.findIndex(c => c.name === conf.name && c.location === conf.location);
        const daysUntil = getDaysUntil(conf.submissionDate);
        const statusInfo = getStatusInfo(conf.status);
        const categoryName = getCategoryName(conf.category);
        
        return `
            <div class="conference-card ${daysUntil.urgent ? 'urgent' : ''} ${daysUntil.text === 'Past' ? '' : 'upcoming'}">
                <h3>${conf.name}</h3>
                
                <div class="conference-meta">
                    <span class="conference-category">${categoryName}</span>
                    <span class="conference-status ${statusInfo.class}">${statusInfo.text}</span>
                </div>
                
                <div class="conference-location">
                    <i class="fas fa-map-marker-alt"></i> ${conf.location}
                </div>
                
                ${conf.website ? `
                    <div class="conference-website">
                        <a href="${conf.website}" target="_blank">
                            <i class="fas fa-external-link-alt"></i> Visit Conference Website
                        </a>
                    </div>
                ` : ''}
                
                <div class="conference-dates">
                    <div class="date-item">
                        <span class="date-label">
                            <i class="fas fa-paper-plane"></i> Submission:
                        </span>
                        <span class="date-value ${daysUntil.urgent ? 'date-urgent' : ''}">
                            ${formatDate(conf.submissionDate)} (${daysUntil.text})
                        </span>
                    </div>
                    <div class="date-item">
                        <span class="date-label">
                            <i class="fas fa-bell"></i> Notification:
                        </span>
                        <span class="date-value">${formatDate(conf.notificationDate)}</span>
                    </div>
                    <div class="date-item">
                        <span class="date-label">
                            <i class="fas fa-calendar-day"></i> Conference:
                        </span>
                        <span class="date-value">
                            ${formatDate(conf.conferenceStartDate)} - ${formatDate(conf.conferenceEndDate)}
                        </span>
                    </div>
                </div>
                
                ${conf.notes ? `
                    <div class="conference-notes">
                        <strong>Notes:</strong> ${conf.notes}
                    </div>
                ` : ''}
                
                <div class="card-actions">
                    <button class="btn-edit" onclick="editConference(${originalIndex})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-delete" onclick="deleteConference(${originalIndex})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Open modal for adding
function openAddModal() {
    editingIndex = -1;
    modalTitle.innerHTML = '<i class="fas fa-calendar-plus"></i> Add New Conference';
    form.reset();
    
    // Set default dates
    const today = new Date();
    const defaultSubmission = new Date(today);
    defaultSubmission.setDate(today.getDate() + 30);
    
    document.getElementById('submissionDate').value = defaultSubmission.toISOString().split('T')[0];
    document.getElementById('notificationDate').value = '';
    document.getElementById('conferenceStartDate').value = '';
    document.getElementById('conferenceEndDate').value = '';
    
    modal.style.display = 'block';
}

// Open modal for editing
function editConference(index) {
    editingIndex = index;
    const conf = conferences[index];
    
    modalTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Conference';
    document.getElementById('confName').value = conf.name;
    document.getElementById('confLocation').value = conf.location;
    document.getElementById('confWebsite').value = conf.website || '';
    document.getElementById('confCategory').value = conf.category || '';
    document.getElementById('submissionDate').value = conf.submissionDate;
    document.getElementById('notificationDate').value = conf.notificationDate;
    document.getElementById('conferenceStartDate').value = conf.conferenceStartDate;
    document.getElementById('conferenceEndDate').value = conf.conferenceEndDate;
    document.getElementById('confStatus').value = conf.status || 'planned';
    document.getElementById('confNotes').value = conf.notes || '';
    
    modal.style.display = 'block';
}

// Delete conference
function deleteConference(index) {
    if (confirm('Are you sure you want to delete this conference? This action cannot be undone.')) {
        conferences.splice(index, 1);
        saveData();
        renderConferences();
        showNotification('Conference deleted successfully!', 'success');
    }
}

// Close modal
function closeModal() {
    modal.style.display = 'none';
    form.reset();
    editingIndex = -1;
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const conferenceData = {
        name: document.getElementById('confName').value.trim(),
        location: document.getElementById('confLocation').value.trim(),
        website: document.getElementById('confWebsite').value.trim(),
        category: document.getElementById('confCategory').value,
        submissionDate: document.getElementById('submissionDate').value,
        notificationDate: document.getElementById('notificationDate').value,
        conferenceStartDate: document.getElementById('conferenceStartDate').value,
        conferenceEndDate: document.getElementById('conferenceEndDate').value,
        status: document.getElementById('confStatus').value,
        notes: document.getElementById('confNotes').value.trim()
    };
    
    // Validate dates
    if (new Date(conferenceData.submissionDate) > new Date(conferenceData.notificationDate)) {
        showNotification('Submission deadline must be before notification date!', 'error');
        return;
    }
    
    if (new Date(conferenceData.notificationDate) > new Date(conferenceData.conferenceStartDate)) {
        showNotification('Notification date must be before conference start date!', 'error');
        return;
    }
    
    if (new Date(conferenceData.conferenceStartDate) > new Date(conferenceData.conferenceEndDate)) {
        showNotification('Conference start date must be before end date!', 'error');
        return;
    }
    
    if (editingIndex === -1) {
        // Add new conference
        conferences.push(conferenceData);
        showNotification('Conference added successfully!', 'success');
    } else {
        // Update existing conference
        conferences[editingIndex] = conferenceData;
        showNotification('Conference updated successfully!', 'success');
    }
    
    saveData();
    renderConferences();
    closeModal();
}

// Export data
function exportData() {
    const dataStr = JSON.stringify(conferences, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'conferences_backup.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}

// Show notification
function showNotification(message, type) {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}"></i>
        ${message}
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Event listeners
addBtn.addEventListener('click', openAddModal);
closeBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
form.addEventListener('submit', handleFormSubmit);
exportBtn.addEventListener('click', exportData);

// Search and filter events
searchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value;
    renderConferences();
});

sortSelect.addEventListener('change', (e) => {
    currentFilters.sortBy = e.target.value;
    renderConferences();
});

filterBtn.addEventListener('click', () => {
    filterPanel.classList.toggle('show');
});

applyFilters.addEventListener('click', () => {
    currentFilters.showUpcoming = document.getElementById('filterUpcoming').checked;
    currentFilters.showPast = document.getElementById('filterPast').checked;
    currentFilters.showActive = document.getElementById('filterActive').checked;
    renderConferences();
    filterPanel.classList.remove('show');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Initialize the app
loadData();