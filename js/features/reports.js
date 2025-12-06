import db from '../db.js';

export async function initReports(container) {
    container.innerHTML = `
        <h2>Reports</h2>
        <div style="margin-top:1rem; display:flex; gap:1rem; border-bottom:1px solid #ddd; padding-bottom:0.5rem;">
            <button class="btn btn-tab active" data-tab="today">Today's Sales</button>
            <button class="btn btn-tab" data-tab="weekly">Weekly Sales</button>
            <button class="btn btn-tab" data-tab="monthly">Monthly Sales</button>
            <button class="btn btn-tab" data-tab="all">All Transactions</button>
        </div>

        <div id="report-content" class="card" style="margin-top:1rem; overflow-x:auto;">
            <!-- Content will be loaded here -->
        </div>

        <!-- Edit Sale Modal -->
        <div id="edit-sale-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center; z-index:1000;">
            <div style="background:white; padding:2rem; border-radius:0.5rem; width:300px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <h3 style="margin-bottom:1rem;">Edit Sale</h3>
                <input type="hidden" id="edit-invoice-id">
                <div style="margin-bottom:1rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem;">Customer Name</label>
                    <input type="text" id="edit-customer-name" style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.25rem;">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem;">Payment Method</label>
                    <select id="edit-payment-method" style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.25rem;">
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="UPI">UPI</option>
                    </select>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button id="cancel-edit-btn" class="btn" style="background:#f3f4f6;">Cancel</button>
                    <button id="save-edit-btn" class="btn btn-primary">Save Changes</button>
                </div>
            </div>
        </div>

        <!-- Delete Sale Modal -->
        <div id="delete-sale-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center; z-index:1000;">
            <div style="background:white; padding:2rem; border-radius:0.5rem; width:300px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <h3 style="margin-bottom:1rem;">Delete Sale</h3>
                <p style="margin-bottom:1rem; color:#666;">Are you sure you want to delete this sale? Stock will be restored.</p>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button id="cancel-delete-sale-btn" class="btn" style="background:#f3f4f6;">Cancel</button>
                    <button id="confirm-delete-sale-btn" class="btn" style="background:#ef4444; color:white;">Delete & Restore Stock</button>
                </div>
            </div>
        </div>
    `;

    const tabs = container.querySelectorAll('.btn-tab');
    const contentDiv = document.getElementById('report-content');

    // Edit Modal Elements
    const editModal = document.getElementById('edit-sale-modal');
    const editNameInput = document.getElementById('edit-customer-name');
    const editPaymentInput = document.getElementById('edit-payment-method');
    const editIdInput = document.getElementById('edit-invoice-id');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveEditBtn = document.getElementById('save-edit-btn');

    // Delete Modal Elements
    const deleteModal = document.getElementById('delete-sale-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-sale-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-sale-btn');
    let saleToDeleteId = null;

    let invoices = [];

    async function loadData() {
        invoices = await db.invoices.reverse().toArray();
    }

    // Tab Switching Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.backgroundColor = 'transparent';
                t.style.color = 'var(--text-main)';
            });
            tab.classList.add('active');
            tab.style.backgroundColor = '#eff6ff';
            tab.style.color = 'var(--primary-color)';
            renderTabContent(tab.dataset.tab);
        });
    });

    // Initial Style for Active Tab
    const activeTab = container.querySelector('.btn-tab.active');
    if (activeTab) {
        activeTab.style.backgroundColor = '#eff6ff';
        activeTab.style.color = 'var(--primary-color)';
    }

    async function renderTabContent(tabName) {
        await loadData(); // Refresh data
        contentDiv.innerHTML = '';
        if (tabName === 'today') renderTodayReport();
        else if (tabName === 'weekly') renderWeeklyReport();
        else if (tabName === 'monthly') renderMonthlyReport();
        else if (tabName === 'all') renderAllTransactions();
    }

    function renderTodayReport() {
        const today = new Date().toLocaleDateString();
        const todayInvoices = invoices.filter(inv => new Date(inv.date).toLocaleDateString() === today);

        if (todayInvoices.length === 0) {
            contentDiv.innerHTML = '<p style="padding:1rem; text-align:center; color:#888;">No sales today</p>';
            return;
        }

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.minWidth = '600px';

        table.innerHTML = `
            <thead>
                <tr style="background:#f9fafb; text-align:left;">
                    <th style="padding:0.75rem;">Time</th>
                    <th style="padding:0.75rem;">Customer</th>
                    <th style="padding:0.75rem;">Items</th>
                    <th style="padding:0.75rem;">Total</th>
                    <th style="padding:0.75rem;">Payment</th>
                    <th style="padding:0.75rem;">Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');
        todayInvoices.forEach(inv => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';

            const timeStr = new Date(inv.date).toLocaleTimeString();
            const itemsSummary = inv.items.map(i => `${i.name} (${i.quantity})`).join(', ');

            tr.innerHTML = `
                <td style="padding:0.75rem;">${timeStr}</td>
                <td style="padding:0.75rem;">${inv.customerName}</td>
                <td style="padding:0.75rem; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${itemsSummary}">${itemsSummary}</td>
                <td style="padding:0.75rem; font-weight:bold;">₹${inv.totalAmount.toFixed(2)}</td>
                <td style="padding:0.75rem;">${inv.paymentMethod}</td>
                <td style="padding:0.75rem; display:flex; gap:0.5rem;">
                    <button class="btn" style="padding:0.2rem 0.5rem; font-size:0.8rem; background:#e0f2fe; color:#0284c7;" onclick="window.openEditSale(${inv.id})">Edit</button>
                    <button class="btn" style="padding:0.2rem 0.5rem; font-size:0.8rem; background:#fee2e2; color:#ef4444;" onclick="window.openDeleteSale(${inv.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        contentDiv.appendChild(table);
    }

    function renderAllTransactions() {
        if (invoices.length === 0) {
            contentDiv.innerHTML = '<p style="padding:1rem; text-align:center; color:#888;">No transactions found</p>';
            return;
        }

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.minWidth = '600px';

        table.innerHTML = `
            <thead>
                <tr style="background:#f9fafb; text-align:left;">
                    <th style="padding:0.75rem;">Date</th>
                    <th style="padding:0.75rem;">Customer</th>
                    <th style="padding:0.75rem;">Items</th>
                    <th style="padding:0.75rem;">Total</th>
                    <th style="padding:0.75rem;">Payment</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');
        invoices.forEach(inv => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';

            const dateStr = new Date(inv.date).toLocaleString();
            const itemsSummary = inv.items.map(i => `${i.name} (${i.quantity})`).join(', ');

            tr.innerHTML = `
                <td style="padding:0.75rem;">${dateStr}</td>
                <td style="padding:0.75rem;">${inv.customerName}</td>
                <td style="padding:0.75rem; max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${itemsSummary}">${itemsSummary}</td>
                <td style="padding:0.75rem; font-weight:bold;">₹${inv.totalAmount.toFixed(2)}</td>
                <td style="padding:0.75rem;">${inv.paymentMethod}</td>
            `;
            tbody.appendChild(tr);
        });
        contentDiv.appendChild(table);
    }

    function renderWeeklyReport() {
        const weeklyData = {};

        invoices.forEach(inv => {
            const date = new Date(inv.date);
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday
            startOfWeek.setHours(0, 0, 0, 0);
            const key = startOfWeek.toLocaleDateString();

            if (!weeklyData[key]) weeklyData[key] = 0;
            weeklyData[key] += inv.totalAmount;
        });

        if (Object.keys(weeklyData).length === 0) {
            contentDiv.innerHTML = '<p style="padding:1rem; text-align:center; color:#888;">No data available</p>';
            return;
        }

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        table.innerHTML = `
            <thead>
                <tr style="background:#f9fafb; text-align:left;">
                    <th style="padding:0.75rem;">Week Starting</th>
                    <th style="padding:0.75rem;">Total Sales</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');
        Object.entries(weeklyData).sort((a, b) => new Date(b[0]) - new Date(a[0])).forEach(([week, total]) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';
            tr.innerHTML = `
                <td style="padding:0.75rem;">${week}</td>
                <td style="padding:0.75rem; font-weight:bold; color:var(--primary-color);">₹${total.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
        contentDiv.appendChild(table);
    }

    function renderMonthlyReport() {
        const monthlyData = {};

        invoices.forEach(inv => {
            const date = new Date(inv.date);
            const key = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            if (!monthlyData[key]) monthlyData[key] = 0;
            monthlyData[key] += inv.totalAmount;
        });

        if (Object.keys(monthlyData).length === 0) {
            contentDiv.innerHTML = '<p style="padding:1rem; text-align:center; color:#888;">No data available</p>';
            return;
        }

        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';

        table.innerHTML = `
            <thead>
                <tr style="background:#f9fafb; text-align:left;">
                    <th style="padding:0.75rem;">Month</th>
                    <th style="padding:0.75rem;">Total Sales</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector('tbody');
        Object.entries(monthlyData).forEach(([month, total]) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';
            tr.innerHTML = `
                <td style="padding:0.75rem;">${month}</td>
                <td style="padding:0.75rem; font-weight:bold; color:var(--primary-color);">₹${total.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
        contentDiv.appendChild(table);
    }

    // Modal Logic
    window.openEditSale = async (id) => {
        const invoice = await db.invoices.get(id);
        if (invoice) {
            editIdInput.value = invoice.id;
            editNameInput.value = invoice.customerName;
            editPaymentInput.value = invoice.paymentMethod || 'Cash';
            editModal.style.display = 'flex';
        }
    };

    cancelEditBtn.onclick = () => editModal.style.display = 'none';

    saveEditBtn.onclick = async () => {
        const id = parseInt(editIdInput.value);
        const customerName = editNameInput.value;
        const paymentMethod = editPaymentInput.value;

        if (id) {
            await db.invoices.update(id, { customerName, paymentMethod });
            editModal.style.display = 'none';
            renderTabContent('today');
        }
    };

    window.openDeleteSale = (id) => {
        saleToDeleteId = id;
        deleteModal.style.display = 'flex';
    };

    cancelDeleteBtn.onclick = () => {
        deleteModal.style.display = 'none';
        saleToDeleteId = null;
    };

    confirmDeleteBtn.onclick = async () => {
        if (saleToDeleteId) {
            const invoice = await db.invoices.get(saleToDeleteId);
            if (invoice) {
                // Restore stock
                for (const item of invoice.items) {
                    if (item.id) {
                        const dbItem = await db.items.get(item.id);
                        if (dbItem) {
                            await db.items.update(item.id, { stock: dbItem.stock + item.quantity });
                        }
                    }
                }
                // Delete invoice
                await db.invoices.delete(saleToDeleteId);
                deleteModal.style.display = 'none';
                saleToDeleteId = null;
                renderTabContent('today');
            }
        }
    };

    // Initial Load
    await loadData();
    renderTabContent('today');
}
