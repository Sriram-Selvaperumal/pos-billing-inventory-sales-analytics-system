export function renderItemCard(item, onAdd) {
    const card = document.createElement('div');
    card.className = 'card item-card';
    card.style.padding = '1rem';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.gap = '0.5rem';

    card.innerHTML = `
        <h3 style="margin:0;">${item.name}</h3>
        <p style="color:var(--text-muted); font-size:0.9rem;">${item.category}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
            <span style="font-weight:bold; color:var(--primary-color);">₹${parseFloat(item.price).toFixed(2)}</span>
            <span style="font-size:0.8rem; color:${item.stock > 0 ? 'green' : 'red'}">${item.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
        </div>
    `;

    if (onAdd) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary';
        btn.style.marginTop = '0.5rem';
        btn.textContent = 'Add to Cart';
        btn.onclick = () => onAdd(item);
        card.appendChild(btn);
    }

    return card;
}
