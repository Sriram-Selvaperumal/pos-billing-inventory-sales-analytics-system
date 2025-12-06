import db from '../db.js';

export async function initDashboard(container) {
    container.innerHTML = `
        <h2>Dashboard</h2>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin-bottom:2rem;">
            <div class="card">
                <h3>Today's Sales</h3>
                <p id="today-sales" style="font-size:2rem; font-weight:bold; color:var(--primary-color);">₹0.00</p>
            </div>
            <div class="card">
                <h3>Total Customers</h3>
                <p id="total-customers" style="font-size:2rem; font-weight:bold; color:var(--primary-color);">0</p>
            </div>
        </div>
        <div class="card">
            <h3>Sales Trend (Last 7 Days)</h3>
            <canvas id="sales-chart"></canvas>
        </div>
    `;

    const todaySalesEl = document.getElementById('today-sales');
    const totalCustomersEl = document.getElementById('total-customers');
    const ctx = document.getElementById('sales-chart').getContext('2d');

    // Calculate Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const invoices = await db.invoices.toArray();

    const todayInvoices = invoices.filter(inv => inv.date >= today);
    const todayTotal = todayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    const uniqueCustomers = new Set(invoices.map(inv => inv.customerName)).size;

    todaySalesEl.textContent = `₹${todayTotal.toFixed(2)}`;
    totalCustomersEl.textContent = uniqueCustomers;

    // Chart Data (Last 7 Days)
    const labels = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        labels.push(label);

        const dayInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.date);
            invDate.setHours(0, 0, 0, 0);
            return invDate.getTime() === d.getTime();
        });

        const dayTotal = dayInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        data.push(dayTotal);
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (₹)',
                data: data,
                backgroundColor: '#2563eb',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
