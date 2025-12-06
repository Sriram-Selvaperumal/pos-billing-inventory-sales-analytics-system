// Initialize Dexie
const db = new Dexie('InstabillDB');

// Define Schema
db.version(1).stores({
    items: '++id, name, price, category, stock', // Primary key and indexed props
    invoices: '++id, date, customerName, totalAmount, paymentMethod'
});

export default db;
