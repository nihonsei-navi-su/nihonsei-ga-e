// フィルター処理
function filterProducts() {
    const searchInputEl = document.getElementById('searchInput');
    const searchTerm = searchInputEl ? searchInputEl.value.toLowerCase() : '';
    const categoryFilter = document.getElementById('category-filter').value.trim().toLowerCase();
    const manufacturerFilter = document.getElementById('manufacturer-filter').value.trim().toLowerCase();
    let filtered = productsData;

    console.log("Filtering with category:", categoryFilter);  // カテゴリーフィルタが正しく動作しているか

    // 検索条件（タイトルとメーカーのみ）
    if (searchTerm) {
        filtered = filtered.filter(p => {
            const name = (p.title || '').toLowerCase();
            const manufacturer = (p.manufacturer || '').toLowerCase();
            return name.includes(searchTerm) || manufacturer.includes(searchTerm);
        });
    }

    // カテゴリー条件
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => {
            // カテゴリー名と一致しているか確認
            console.log(`Product Category: ${p.category.toLowerCase()} matches filter: ${categoryFilter}`);
            return p.category.toLowerCase() === categoryFilter; // 小文字で比較
        });
    }

    // メーカー条件
    if (manufacturerFilter !== 'all') {
        filtered = filtered.filter(p => p.manufacturer.toLowerCase() === manufacturerFilter);
    }

    console.log("Filtered products:", filtered);  // フィルタリング後の製品リストを確認
    displayProducts(filtered);
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
        const name = product.title || 'Unknown';
        const manufacturer = product.manufacturer || 'Unknown';
        const category = product.category || 'Unknown';
        const amazonUrl = product.url || `https://www.amazon.co.jp/dp/${product.asin}`;
        
        return `
        <tr>
            <td>${name}</td>
            <td>${manufacturer}</td>
            <td>${category}</td>
            <td><a href="${amazonUrl}" target="_blank">Amazonで見る</a></td>
        </tr>
        `;
    }).join('');

    tbody.innerHTML = html;
}

// すべてのデータが空の場合、フィルターが無効
function resetFilters() {
    document.getElementById('category-filter').value = 'all';
    document.getElementById('manufacturer-filter').value = 'all';
    displayProducts(productsData);
}
