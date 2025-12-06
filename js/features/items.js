import db from '../db.js';

export async function initItems(container) {
    container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h2>Items Management</h2>
            <button id="add-item-btn" class="btn btn-primary">Add New Item</button>
        </div>
        <div id="item-form-container" style="display:none; margin-bottom:1rem; padding:1rem; background:white; border-radius:0.5rem; border:1px solid #ddd;">
            <h3>Add Item</h3>
            <form id="add-item-form" style="display:grid; gap:0.5rem;">
                <input type="text" id="item-name" placeholder="Item Name" required style="padding:0.5rem;">
                <input type="number" id="item-price" placeholder="Price" step="0.01" required style="padding:0.5rem;">
                <input type="text" id="item-category" placeholder="Category" style="padding:0.5rem;">
                <input type="number" id="item-stock" placeholder="Stock Quantity" required style="padding:0.5rem;">
                <div style="display:flex; gap:0.5rem;">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" id="cancel-item-btn" class="btn">Cancel</button>
                </div>
            </form>
        </div>
        <div id="items-list" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:1rem;"></div>

        <!-- Delete Confirmation Modal -->
        <div id="delete-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center; z-index:1000;">
            <div style="background:white; padding:2rem; border-radius:0.5rem; width:300px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <h3 style="margin-bottom:1rem;">Confirm Delete</h3>
                <p style="margin-bottom:1.5rem; color:#666;">Are you sure you want to delete this item?</p>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button id="cancel-delete-btn" class="btn" style="background:#f3f4f6;">Cancel</button>
                    <button id="confirm-delete-btn" class="btn" style="background:#ef4444; color:white;">Delete</button>
                </div>
            </div>
        </div>
    `;

    const formContainer = document.getElementById('item-form-container');
    const addItemBtn = document.getElementById('add-item-btn');
    const cancelItemBtn = document.getElementById('cancel-item-btn');
    const form = document.getElementById('add-item-form');
    const itemsList = document.getElementById('items-list');

    // Modal Elements
    const deleteModal = document.getElementById('delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

    let itemToDeleteId = null;

    // ... inside initItems ...

    // Add hidden ID field to form
    const formTitle = container.querySelector('#item-form-container h3');
    const submitBtn = container.querySelector('#add-item-form button[type="submit"]');

    let editingId = null;

    addItemBtn.onclick = () => {
        editingId = null;
        form.reset();
        formTitle.textContent = 'Add Item';
        submitBtn.textContent = 'Save';
        formContainer.style.display = 'block';
    };

    cancelItemBtn.onclick = () => {
        formContainer.style.display = 'none';
        editingId = null;
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('item-name').value;
        const price = parseFloat(document.getElementById('item-price').value);
        const category = document.getElementById('item-category').value;
        const stock = parseInt(document.getElementById('item-stock').value);

        if (editingId) {
            await db.items.update(editingId, { name, price, category, stock });
        } else {
            await db.items.add({ name, price, category, stock });
        }

        form.reset();
        formContainer.style.display = 'none';
        editingId = null;
        renderItems();
    };

    async function renderItems() {
        itemsList.innerHTML = '';
        const items = await db.items.toArray();
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h4>${item.name}</h4>
                <p>Price: ₹${item.price.toFixed(2)}</p>
                <p>Stock: ${item.stock}</p>
                <div style="margin-top:0.5rem; display:flex; gap:0.5rem;">
                    <button class="btn" style="background:#e0f2fe; color:#0284c7;" onclick="window.editItem(${item.id})">Edit</button>
                    <button class="btn" style="background:#ef4444; color:white;" onclick="window.openDeleteModal(${item.id})">Delete</button>
                </div>
            `;
            itemsList.appendChild(card);
        });
    }

    window.editItem = async (id) => {
        const item = await db.items.get(id);
        if (item) {
            editingId = item.id;
            document.getElementById('item-name').value = item.name;
            document.getElementById('item-price').value = item.price;
            document.getElementById('item-category').value = item.category;
            document.getElementById('item-stock').value = item.stock;

            formTitle.textContent = 'Edit Item';
            submitBtn.textContent = 'Update';
            formContainer.style.display = 'block';
            window.scrollTo(0, 0);
        }
    };

    window.openDeleteModal = (id) => {
        itemToDeleteId = id;
        deleteModal.style.display = 'flex';
    };

    cancelDeleteBtn.onclick = () => {
        deleteModal.style.display = 'none';
        itemToDeleteId = null;
    };

    confirmDeleteBtn.onclick = async () => {
        if (itemToDeleteId) {
            await db.items.delete(itemToDeleteId);
            renderItems();
            deleteModal.style.display = 'none';
            itemToDeleteId = null;
        }
    };

    renderItems();
}
