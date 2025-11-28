console.log('main.js loaded');

// 製品データを取得
let productsData = [];

// タイトルに日本語（ひらがな・カタカナ・漢字）が含まれているかどうか判定
function hasJapanese(str) {
    if (!str) return false;
    return /[\u3040-\u30FF\u4E00-\u9FFF]/.test(str);
}

// 製品一覧までスクロール
function scrollToProducts() {
    const section = document.querySelector('.products-section');
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// サイト全体のカテゴリ一覧（12カテゴリ）
const SITE_CATEGORIES = [
    '包丁・ナイフ',
    'フライパン・鍋',
    'ケトル・コーヒー用品',
    'ボウル・ざる・計量',
    'キッチンツール・調理小物',
    '食器・カトラリー',
    'キッチンマット・シンク周り',
    '食品・お茶・調味料',
    '生活雑貨・インテリア',
    'ホビー・クラフト',
    '服飾・アクセサリー',
    'ヘルス・ビューティー・日用品'
];

// サイト内カテゴリ（12カテゴリ）のラベルを決める
function determineSiteCategoryLabel(raw) {
    const title = (raw.title || raw.originalTitle || '').trim();
    const category = (raw.category || '').trim();
    const text = title + ' ' + category; // 日本語をまとめて判定

    // 1. 包丁・ナイフ
    if (/(包丁|ナイフ|ペティ|牛刀|三徳|菜切|柳刃|パン切り|中華包丁)/.test(text)) {
        return '包丁・ナイフ';
    }

    // 2. フライパン・鍋
    if (/(フライパン|いため鍋|炒め鍋|ソテーパン|卵焼き|玉子焼|天ぷら鍋|土鍋|鍋)/.test(text)) {
        return 'フライパン・鍋';
    }

    // 3. ケトル・コーヒー用品
    if (/(ケトル|ドリップケトル|ポット|コーヒー|コーヒーメーカー|ドリッパー|サーバー)/.test(text)) {
        return 'ケトル・コーヒー用品';
    }

    // 4. ボウル・ざる・計量
    if (/(ボウル|ボール|ざる|ザル|水切り|こし器|裏ごし|うらごし|メジャーカップ|計量カップ)/.test(text) ||
        category === '計量カップ') {
        return 'ボウル・ざる・計量';
    }

    // 5. キッチンツール・調理小物
    if (/(トング|ターナー|ヘラ|へら|スパチュラ|スケッパー|ピーラー|おろし器|おろし金|刷毛|ハケ|しゃもじ|キッチンはさみ|キッチンバサミ|キッチンばさみ)/.test(text) ||
        /(キッチンツール|調理小物|へら・スパチュラ)/.test(category)) {
        return 'キッチンツール・調理小物';
    }

    // 6. 食器・カトラリー
    if (/(皿|プレート|パスタ皿|カレー皿|マグカップ|マグ|カップ|湯呑|湯のみ|茶碗|丼|どんぶり|急須)/.test(text) ||
        /(スプーン|フォーク|カトラリー|箸)/.test(text) ||
        /(食器・キッチン|食器)/.test(category)) {
        return '食器・カトラリー';
    }

    // 7. キッチンマット・シンク周り
    if (/(滑り止め|すべり止め|キッチンマット|マット|カーペット)/.test(text) ||
        /(排水口|排水溝|ゴミ受け)/.test(text) ||
        category === '排水口カバー') {
        return 'キッチンマット・シンク周り';
    }

    // 8. 食品・お茶・調味料
    if (/(中国茶|ほうじ茶|煎茶|緑茶|番茶|麦茶|ハーブティー|茶葉|粉末ティー|よもぎ茶|はと麦茶|三年番茶)/.test(text) ||
        /(みりん|はちみつ|蜂蜜|ハチミツ|パン粉|干し芋|乾燥芋|ほしいも|蒲焼|うなぎ|鰻)/.test(text) ||
        /(高野豆腐|青汁|ドリンクギフト|はちみつ|魚介類・水産加工品ギフト|茶葉・粉末ティー|パン粉)/.test(category)) {
        return '食品・お茶・調味料';
    }

    // 9. 生活雑貨・インテリア
    if (/(カーテン|インテリア|収納|クッション|ラグ|マルチカバー|エコバッグ|買い物袋|レジ袋)/.test(text) ||
        /(カーテン)/.test(category)) {
        return '生活雑貨・インテリア';
    }

    // 10. ホビー・クラフト
    if (/(ギター|ベース|楽器|ストラップ|ピック|ホビー|クラフト|手芸|釣り|PEライン)/.test(text) ||
        /(楽器|ホビー|PEライン)/.test(category)) {
        return 'ホビー・クラフト';
    }

    // 11. 服飾・アクセサリー
    if (/(リング|指輪|ネックレス|ブレスレット|ピアス|イヤリング|アクセサリー|財布|バッグ|ベルト)/.test(text) ||
        /(インナーシャツ|ストッキング|ショーツ|クルーソックス|靴下)/.test(category)) {
        return '服飾・アクセサリー';
    }

    // 12. ヘルス・ビューティー・日用品
    if (/(石鹸|ソープ|シャンプー|リンス|コンディショナー|ローション|クリーム|マスク|入浴剤|バスソルト|タオル|フェイスタオル|バスタオル|爪切り|マスク)/.test(text) ||
        /(ビューティー|ドラッグストア|ヘルスケア|布マスク|爪切り|害獣・害虫対策用品)/.test(category)) {
        return 'ヘルス・ビューティー・日用品';
    }

    // どれにも当てはまらない場合は、汎用の受け皿
    return '生活雑貨・インテリア';
}

// 正規化された製品データを返す
function normalizeProduct(raw) {
    if (!raw) return null;

    const asin = raw.asin || '';
    let manufacturer = raw.manufacturer || '';
    const url = raw.url || '';

    const rawTitle = (raw.title || raw.name || '').trim();
    let title = rawTitle;

    // "ハリオ" を "HARIO" に変更
    if (manufacturer === 'ハリオ') {
        manufacturer = 'HARIO';
    }

    // ★ 日本製かどうか・素材だけ日本かどうかの判定は
    //    すべて Python 側で完了している前提。
    //    ここでは一切除外処理を行わない。

    // サイト内カテゴリ（12カテゴリ）のラベルを決定
    const siteCategoryLabel = determineSiteCategoryLabel(raw);

    // タイトルに日本語が無い場合のフォールバック
    if (!hasJapanese(title)) {
        if (manufacturer && siteCategoryLabel) {
            title = `${manufacturer}（${siteCategoryLabel}）`;
        } else if (manufacturer) {
            title = manufacturer;
        } else if (siteCategoryLabel) {
            title = siteCategoryLabel;
        } else if (asin) {
            title = asin;
        } else {
            title = '日本製の製品';
        }
    }

    return {
        asin,
        title,
        manufacturer,
        category: siteCategoryLabel, // 12カテゴリのラベルをここに入れる
        url,
        madeInJapan: !!raw.madeInJapan,
        available: raw.available !== false
    };
}

/* ------------------------------
   カテゴリボタン生成
------------------------------ */
function renderCategoryButtons() {
    const container = document.getElementById('category-buttons');
    if (!container) return;

    const html = SITE_CATEGORIES.map(cat => `
        <button class="category-button" data-category="${cat}">
            ${cat}
        </button>
    `).join('');

    container.innerHTML = html;

    container.querySelectorAll('.category-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentActive = container.querySelector('.category-button.active');
            const clickedCategory = btn.dataset.category;

            if (currentActive === btn) {
                // もう一度押したら解除（すべて表示）
                btn.classList.remove('active');
            } else {
                if (currentActive) currentActive.classList.remove('active');
                btn.classList.add('active');
            }

            filterProducts();
            scrollToProducts();
        });
    });
}

/* ------------------------------
   データ読み込み
------------------------------ */
fetch('data/products.json')
    .then(response => response.json())
    .then(data => {
        productsData = data.map(normalizeProduct).filter(p => p !== null);

        // フッターの総件数（あれば更新）
        const footerCount = document.getElementById('footer-product-count');
        if (footerCount) {
            footerCount.textContent = `掲載製品数：${productsData.length}件`;
        }

        initPage();
    })
    .catch(error => console.error('Error loading products:', error));

/* ------------------------------
   ページ初期化
------------------------------ */
function initPage() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);

    if (filename === 'index.html' || filename === '') {
        initHomePage();
    } else if (filename === 'submit.html') {
        initSubmitPage();
    }
}

/* ------------------------------
   ホームページ初期化
------------------------------ */
function initHomePage() {
    renderCategoryButtons();

    // 総商品数を表示
    const totalElement = document.getElementById('product-total');
    if (totalElement) {
        totalElement.textContent = `掲載製品数：${productsData.length}件`;
    }

    // 検索欄（リアルタイム）
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterProducts();
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                filterProducts();
                scrollToProducts();
            }
        });
    }

    // 初期表示
    displayProducts(productsData);
}

/* ------------------------------
   フィルター処理
------------------------------ */
function filterProducts() {
    const searchInputEl = document.getElementById('search-input');
    const searchTerm = searchInputEl ? searchInputEl.value.toLowerCase().trim() : '';

    const activeCategoryBtn = document.querySelector('#category-buttons .category-button.active');
    const categoryFilter = activeCategoryBtn ? activeCategoryBtn.dataset.category : 'all';

    let filtered = productsData.slice();

    // 検索条件（タイトルとメーカー）
    if (searchTerm) {
        filtered = filtered.filter(p => {
            const name = (p.title || '').toLowerCase();
            const manufacturer = (p.manufacturer || '').toLowerCase();
            return name.includes(searchTerm) || manufacturer.includes(searchTerm);
        });
    }

    // カテゴリー条件（12カテゴリラベル）
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => (p.category || '').trim() === categoryFilter);
    }

    displayProducts(filtered);
}

/* ------------------------------
   商品カード描画
------------------------------ */
function displayProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = '<p>条件に一致する日本製・国産の製品が見つかりませんでした。</p>';
        return;
    }

    const html = products.map(product => {
        const name = product.title || '不明な商品';
        const manufacturer = product.manufacturer || '';
        const category = product.category || '';
        const amazonUrl = product.url || `https://www.amazon.co.jp/dp/${product.asin}`;

        return `
        <article class="product-card" data-asin="${product.asin}">
          <div class="product-meta">
            <h3 class="product-title">${name}</h3>
            ${manufacturer ? `<p class="product-brand">${manufacturer}</p>` : ''}
            <div class="product-tags">
              <span class="tag tag-japan">日本製・国産</span>
              ${category ? `<span class="tag">${category}</span>` : ''}
            </div>
          </div>
          <div class="product-actions">
            <a href="${amazonUrl}" class="btn btn-primary amazon-link" target="_blank" rel="noopener">
              Amazonで見る
            </a>
          </div>
        </article>
        `;
    }).join('');

    container.innerHTML = html;
}

/* ------------------------------
   投稿フォームページ（submit.html 用）
------------------------------ */
function initSubmitPage() {
    const form = document.getElementById('submit-form');
    if (!form) return;
    const formMessage = document.getElementById('form-message');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        if (formMessage) {
            formMessage.style.display = 'block';
            formMessage.className = 'form-message success';
            formMessage.textContent = 'ご投稿ありがとうございます！';
        }

        form.reset();

        if (formMessage) {
            setTimeout(() => {
                formMessage.style.display = 'none';
            }, 5000);
        }
    });
}

/* ------------------------------
   Amazon リンク クリック計測（GA4）
------------------------------ */
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (!link) return;

    // Amazonリンクのみ計測
    if (!link.href || !link.href.includes('amazon.co.jp')) return;

    const card = link.closest('.product-card');
    const asin = card?.dataset.asin || '';
    const name = card?.querySelector('.product-title')?.textContent?.trim() || '';
    const manufacturer = card?.querySelector('.product-brand')?.textContent?.trim() || '';
    const category = card?.querySelector('.tag:not(.tag-japan)')?.textContent?.trim() || '';

    console.log('amazon_click fired', { asin, name, manufacturer, category, href: link.href });

    if (typeof gtag === 'function') {
        gtag('event', 'amazon_click', {
            product_asin: asin,
            product_name: name,
            product_manufacturer: manufacturer,
            product_category: category,
            link_url: link.href,
            page_path: location.pathname
        });
    }
});
