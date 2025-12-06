import db from '../db.js';
import { renderItemCard } from '../components.js';

export async function initPOS(container) {
    container.innerHTML = `
        <div style="display:grid; grid-template-columns: 2fr 1fr; gap:1rem; height:100%;">
            <div style="overflow-y:auto;">
                <h2>Select Items</h2>
                <div id="pos-items-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap:1rem; margin-top:1rem;"></div>
            </div>
            <div style="background:white; padding:1rem; border-radius:0.5rem; display:flex; flex-direction:column;">
                <h2>Current Bill</h2>
                <div id="cart-items" style="flex:1; overflow-y:auto; margin:1rem 0;">
                    <p style="color:#888; text-align:center;">Cart is empty</p>
                </div>
                <div style="border-top:1px solid #eee; padding-top:1rem;">
                    <div style="display:flex; justify-content:space-between; font-size:1.2rem; font-weight:bold; margin-bottom:1rem;">
                        <span>Total:</span>
                        <span id="cart-total">₹0.00</span>
                    </div>
                    <button id="checkout-btn" class="btn btn-primary" style="width:100%;" disabled>Checkout</button>
                </div>
            </div>
        </div>

        <!-- Checkout Modal -->
        <div id="checkout-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center; z-index:1000;">
            <div style="background:white; padding:2rem; border-radius:0.5rem; width:300px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                <h3 style="margin-bottom:1rem;">Checkout</h3>
                <div style="margin-bottom:1rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem;">Customer Name</label>
                    <input type="text" id="customer-name-input" placeholder="Guest" style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.25rem;">
                </div>
                <div style="margin-bottom:1rem;">
                    <label style="display:block; margin-bottom:0.5rem; font-size:0.9rem;">Payment Method</label>
                    <select id="payment-method-select" style="width:100%; padding:0.5rem; border:1px solid #ddd; border-radius:0.25rem;">
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                    </select>
                </div>
                <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
                    <button id="cancel-checkout-btn" class="btn" style="background:#f3f4f6;">Cancel</button>
                    <button id="confirm-checkout-btn" class="btn btn-primary">Confirm Payment</button>
                </div>
            </div>
        </div>
    `;

    const itemsGrid = document.getElementById('pos-items-grid');
    const cartContainer = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Modal Elements
    const modal = document.getElementById('checkout-modal');
    const nameInput = document.getElementById('customer-name-input');
    const paymentSelect = document.getElementById('payment-method-select');
    const cancelBtn = document.getElementById('cancel-checkout-btn');
    const confirmBtn = document.getElementById('confirm-checkout-btn');

    let cart = [];

    async function loadItems() {
        const items = await db.items.toArray();
        itemsGrid.innerHTML = '';
        items.forEach(item => {
            const card = renderItemCard(item, addToCart);
            itemsGrid.appendChild(card);
        });
    }

    function addToCart(item) {
        const existing = cart.find(i => i.id === item.id);
        if (existing) {
            existing.quantity++;
        } else {
            cart.push({ ...item, quantity: 1 });
        }
        renderCart();
    }

    function renderCart() {
        if (cart.length === 0) {
            cartContainer.innerHTML = '<p style="color:#888; text-align:center;">Cart is empty</p>';
            checkoutBtn.disabled = true;
            totalEl.textContent = '₹0.00';
            return;
        }

        cartContainer.innerHTML = '';
        let total = 0;

        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.marginBottom = '0.5rem';
            div.innerHTML = `
                <div style="flex:1;">
                    <div>${item.name}</div>
                    <div style="font-size:0.8rem; color:#666;">₹${item.price} each</div>
                </div>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <input type="number" min="1" value="${item.quantity}" style="width:50px; padding:0.2rem;" onchange="window.updateCartQuantity(${index}, this.value)">
                    <div style="width:60px; text-align:right;">₹${itemTotal.toFixed(2)}</div>
                    <button class="btn" style="padding:0.2rem 0.5rem; font-size:0.8rem; background:#fee2e2; color:#ef4444;" onclick="window.removeFromCart(${index})">X</button>
                </div>
            `;
            cartContainer.appendChild(div);
        });

        totalEl.textContent = `₹${total.toFixed(2)}`;
        checkoutBtn.disabled = false;
    }

    window.updateCartQuantity = (index, value) => {
        const qty = parseInt(value);
        if (qty > 0) {
            cart[index].quantity = qty;
            renderCart();
        }
    };

    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        renderCart();
    };

    // Checkout Flow
    checkoutBtn.onclick = () => {
        modal.style.display = 'flex';
        nameInput.value = 'Guest';
        paymentSelect.value = 'Cash'; // Default to Cash
        nameInput.focus();
    };

    cancelBtn.onclick = () => {
        modal.style.display = 'none';
    };

    confirmBtn.onclick = async () => {
        const customerName = nameInput.value || 'Guest';
        const paymentMethod = paymentSelect.value;

        try {
            const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const itemsToSave = JSON.parse(JSON.stringify(cart));

            const invoice = {
                date: new Date(),
                customerName,
                items: itemsToSave,
                totalAmount,
                paymentMethod
            };

            await db.invoices.add(invoice);

            // Update stock
            for (const item of cart) {
                if (item.id) {
                    const dbItem = await db.items.get(item.id);
                    if (dbItem) {
                        await db.items.update(item.id, { stock: dbItem.stock - item.quantity });
                    }
                }
            }

            alert('Bill Saved Successfully!');
            cart = [];
            renderCart();
            loadItems();
            modal.style.display = 'none';
        } catch (error) {
            console.error('Checkout failed:', error);
            alert('Error saving bill: ' + error.message);
        }
    };

    loadItems();
}
