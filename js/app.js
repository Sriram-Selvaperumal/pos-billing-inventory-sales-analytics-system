import { initDashboard } from './features/dashboard.js';
import { initPOS } from './features/pos.js';
import { initItems } from './features/items.js';
import { initReports } from './features/reports.js';

const contentArea = document.getElementById('content-area');
const pageTitle = document.getElementById('page-title');
const navLinks = document.querySelectorAll('nav a');

const routes = {
    dashboard: { title: 'Dashboard', init: initDashboard },
    pos: { title: 'Point of Sale', init: initPOS },
    items: { title: 'Items Management', init: initItems },
    reports: { title: 'Reports', init: initReports }
};

async function navigate(pageId) {
    const route = routes[pageId];
    if (!route) return;

    // Update Title
    pageTitle.textContent = route.title;

    // Update Active State
    navLinks.forEach(link => {
        if (link.dataset.page === pageId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    // Clear Content
    contentArea.innerHTML = '';

    // Init Feature
    await route.init(contentArea);

    // Render Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Expose for debugging
window.navigate = navigate;

// Event Listeners
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        console.log('Navigating to:', page);
        navigate(page);
    });
});

// Initial Load
console.log('App initialized');
navigate('dashboard');
