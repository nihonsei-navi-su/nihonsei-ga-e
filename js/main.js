let productsData = [];  // 製品データを格納する配列

// データ読み込み
fetch('data/products.json')
    .then(response => response.json())
    .then(data => {
        productsData = data;
        displayProducts(productsData);  // 初期表示（すべての製品を表示）
    })
    .catch(error => console.error('Error loading products:', error));

// カテゴリフィルタリング（カテゴリを絞り込む）
function filterProducts(category) {
    let filtered = productsData;
    
    // カテゴリに基づいて製品を絞り込む
    if (category !== 'all') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    displayProducts(filtered);  // 絞り込んだ製品を表示
}

// 製品を表示
function displayProducts(products) {
    const tbody = document.getElementById('products-tbody');
    
    // 製品がない場合にメッセージを表示
    if (!products || products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">製品が見つかりません</td></tr>';
        return;
    }

    const html = products.map(product => {
        return `
            <tr>
                <td>${product.title}</td>
                <td>${product.manufacturer}</td>
                <td>${product.category}</td>
                <td><a href="${product.url}" target="_blank">Amazonで見る</a></td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = html;
}

// ソート機能（クリックした列でソート）
function sortProducts(column) {
    const tbody = document.getElementById('products-tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const sortedRows = rows.sort((rowA, rowB) => {
        const cellA = rowA.querySelector(`td:nth-child(${column})`).textContent.trim();
        const cellB = rowB.querySelector(`td:nth-child(${column})`).textContent.trim();

        if (cellA < cellB) return 1;
        if (cellA > cellB) return -1;
        return 0;
    });
    tbody.innerHTML = '';  // ソートされた行をテーブルに反映
    sortedRows.forEach(row => tbody.appendChild(row));
}
