const API_URL = 'http://localhost:5001/api/v1/products';

const tbody = document.querySelector('#productTable tbody');
const messageBox = document.getElementById('message');
const categoryFilter = document.getElementById('categoryFilter');

let products = [];      // the rows currently shown in the table
let editingId = null;   // id of the row being edited (null = no row in edit mode)

// ---------- Helpers ----------

// Show a visible message in the UI (not only in the Console)
function showMessage(text, type = 'error') {
    messageBox.textContent = text;
    messageBox.className = `message ${type}`;
}

function clearMessage() {
    messageBox.textContent = '';
    messageBox.className = 'message';
}

// fetch() only rejects on a network failure, so we also check response.ok
async function request(url, options = {}) {
    let response;
    try {
        response = await fetch(url, options);
    } catch (error) {
        throw new Error('Cannot reach the API at http://localhost:5001. Is the backend running?');
    }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.message || `Request failed with status ${response.status}`);
    }
    return result;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// ---------- Category filter ----------

// Fill the dropdown with the distinct categories in the data
async function loadCategories() {
    const result = await request(API_URL); // always the full list
    const categories = [...new Set(result.data.map(p => p.category))].sort();
    const current = categoryFilter.value;

    categoryFilter.innerHTML = '<option value="">All categories</option>';
    categories.forEach(c => {
        const option = document.createElement('option');
        option.value = c;
        option.textContent = c;
        categoryFilter.appendChild(option);
    });
    // keep the selected category if it still exists
    categoryFilter.value = categories.includes(current) ? current : '';
}

// ---------- Rendering ----------

function renderTable() {
    tbody.innerHTML = '';

    products.forEach(p => {
        const tr = document.createElement('tr');

        if (p.id === editingId) {
            // Edit mode: the row turns into inputs with Save / Cancel
            tr.innerHTML = `
        <td>${p.id}</td>
        <td><input type="text" id="edit-name" value="${escapeHtml(p.name)}"></td>
        <td><input type="number" id="edit-price" value="${p.price}"></td>
        <td><input type="text" id="edit-category" value="${escapeHtml(p.category)}"></td>
        <td>
          <button class="btn-save" onclick="saveProduct(${p.id})">Save</button>
          <button class="btn-cancel" onclick="cancelEdit()">Cancel</button>
        </td>
      `;
        } else {
            tr.innerHTML = `
        <td>${p.id}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${new Intl.NumberFormat('en-US').format(p.price)} VND</td>
        <td>${escapeHtml(p.category)}</td>
        <td>
          <button class="btn-edit" onclick="startEdit(${p.id})">Edit</button>
          <button class="btn-delete" onclick="deleteProduct(${p.id})">Delete</button>
        </td>
      `;
        }
        tbody.appendChild(tr);
    });
}

// ---------- API calls ----------

// 1. Load the product list (with the selected category, if any)
async function fetchProducts() {
    try {
        const category = categoryFilter.value;
        const url = category ? `${API_URL}?category=${encodeURIComponent(category)}` : API_URL;
        const result = await request(url);
        products = result.data;
        renderTable();
    } catch (error) {
        console.error('Error fetching products:', error);
        products = [];
        renderTable();
        showMessage(error.message);
    }
}

// Reload both the dropdown and the table
async function refresh() {
    try {
        await loadCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
    await fetchProducts();
}

// 2. Add a new product
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const productData = {
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        category: document.getElementById('category').value
    };

    try {
        const result = await request(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        document.getElementById('productForm').reset();
        showMessage(result.message, 'success');
        refresh(); // Reload the table
    } catch (error) {
        console.error('Error adding product:', error);
        showMessage(error.message);
    }
});

// 3. Inline edit
function startEdit(id) {
    editingId = id;
    clearMessage();
    renderTable();
}

function cancelEdit() {
    editingId = null;
    renderTable();
}

async function saveProduct(id) {
    const productData = {
        name: document.getElementById('edit-name').value,
        price: document.getElementById('edit-price').value,
        category: document.getElementById('edit-category').value
    };

    try {
        const result = await request(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        editingId = null;
        showMessage(result.message, 'success');
        refresh();
    } catch (error) {
        console.error('Error updating product:', error);
        showMessage(error.message); // keep the row in edit mode so the user can fix it
    }
}

// 4. Delete a product
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
        const result = await request(`${API_URL}/${id}`, { method: 'DELETE' });
        showMessage(result.message, 'success');
        refresh();
    } catch (error) {
        console.error('Error deleting product:', error);
        showMessage(error.message);
    }
}

// Changing the dropdown re-fetches the list with ?category=
categoryFilter.addEventListener('change', () => {
    editingId = null;
    clearMessage();
    fetchProducts();
});

refresh();
