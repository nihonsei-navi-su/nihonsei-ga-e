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

/* ==============================
   カテゴリ最適化（自動付与）
   - ボタンは大分類10固定
   - determineSiteCategoryLabel() も大分類10を返す
============================== */

// サイト全体のカテゴリ一覧（大分類 10 固定）
const SITE_CATEGORIES = [
    '食品・飲料',
    'キッチン・調理用品',
    '生活用品・日用品',
    '家電・電子機器',
    'インテリア・家具',
    'ファッション・身につけるもの',
    '美容・健康',
    '工具・DIY・作業用品',
    'アウトドア・スポーツ',
    '文具・趣味・その他'
];

// 食品カテゴリから除外したいキーワード（調理器具・サプリなど）
// ※ 食品判定の誤爆を防ぐために使用
const NON_FOOD_KEYWORDS = /(ボウル|ボール|ざる|ザル|colander|ストレーナー|水切りボウル|計量カップ|フライパン|鍋|ケトル|やかん|ドリップケトル|コーヒーミル|コーヒードリッパー|コーヒーサーバー|ドリッパー|コーヒーポット|ティーポット|急須|スプーン|フォーク|箸|包丁|ナイフ|まな板|キッチンツール|サプリ|サプリメント|健康補助食品|栄養補助食品|プロテイン)/;

// サイト内カテゴリのラベルを決める（大分類10）
function determineSiteCategoryLabel(raw) {
    const title = (raw.title || raw.originalTitle || '').trim();
    const category = (raw.category || '').trim();
    const text = `${title} ${category}`;

    // 1) 食品・飲料（最優先）
    if (
        !NON_FOOD_KEYWORDS.test(text) &&
        (
            /(食品|食材|調味料|だし|出汁|味噌|みそ|醤油|しょうゆ|お茶|緑茶|日本茶|コーヒー|紅茶|ほうじ茶|玄米茶|米|お菓子|スナック|乾物|漬物|海苔|のり|昆布|だしパック|だしの素)/.test(text) ||
            /(食品|飲料|お茶|コーヒー|紅茶|調味料)/.test(category)
        )
    ) {
        return '食品・飲料';
    }

    // 2) 美容・健康（サプリはここに固定）
    if (
        /(石鹸|ソープ|シャンプー|リンス|コンディショナー|トリートメント|ローション|クリーム|乳液|マスク|フェイスマスク|入浴剤|バスソルト|爪切り|ネイルクリッパー|歯ブラシ|マウスウォッシュ)/.test(text) ||
        /(サプリ|サプリメント|ビタミン|ミネラル|プロテイン|アミノ酸|コラーゲン|グルコサミン|健康補助食品|栄養補助食品)/.test(text) ||
        /(ビューティー|ドラッグストア|ヘルスケア|布マスク|害獣・害虫対策用品)/.test(category)
    ) {
        return '美容・健康';
    }

    // 3) キッチン・調理用品（包丁/鍋/ボウル/食器など全部統合）
    if (
        /(包丁|ナイフ|ペティ|牛刀|三徳|菜切|柳刃|パン切り|中華包丁|フライパン|いため鍋|炒め鍋|ソテーパン|卵焼き|玉子焼|天ぷら鍋|土鍋|鍋|ケトル|やかん|ドリップケトル|コーヒーミル|コーヒーグラインダー|コーヒードリッパー|コーヒーサーバー|ドリッパー|コーヒーポット|ティーポット|急須|マグ|マグカップ|めん棒|麺棒|まな板|カッティングボード|おろし器|ピーラー|キッチンバサミ|キッチンはさみ|キッチンスケール|はかり|計量スプーン|しゃもじ|菜箸|トング|泡立て器|キッチンタイマー|保存容器|キッチンツール|ボウル|ボール|ざる|ザル|colander|ストレーナー|水切りボウル|計量カップ|食器|プレート|皿|大皿|小皿|ランチプレート|茶碗|ちゃわん|飯碗|汁椀|お椀|カップ|湯のみ|グラス|コップ|カトラリー|箸|お箸|スプーン|フォーク)/.test(text) ||
        /(キッチン用品|キッチンツール|キッチン|調理|食器|コーヒー|ティーウェア)/.test(category)
    ) {
        return 'キッチン・調理用品';
    }

    // 4) ファッション・身につけるもの
    if (
        /(指輪|ネックレス|ブレスレット|バングル|ピアス|イヤリング|アクセサリー|帽子|ベルト|財布|ウォレット|ポーチ|ハンカチ|靴|シューズ|パンプス|サンダル|ブーツ|ローファー|衣類|服|インナーシャツ|ストッキング|ショーツ|クルーソックス|靴下)/.test(text) ||
        /(服＆ファッション小物|ジュエリー|シューズ＆バッグ)/.test(category)
    ) {
        return 'ファッション・身につけるもの';
    }

    // 5) 生活用品・日用品
    if (
        /(掃除|洗濯|バス|トイレ|収納|ボックス|収納ケース|ティッシュケース|タオルハンガー|日用品|消耗品|カレンダー|卓上カレンダー|壁掛けカレンダー)/.test(text) ||
        /(日用品|収納用品)/.test(category)
    ) {
        return '生活用品・日用品';
    }

    // 6) 家電・電子機器
    if (
        /(家電|電気|照明|ライト|シーリングライト|スタンドライト|デスクライト|ペンダントライト|間接照明|ケーブル|USB|充電|イヤホン|スピーカー|PC|周辺機器|プロジェクター)/.test(text) ||
        /(家電|TV|オーディオ|パソコン)/.test(category)
    ) {
        return '家電・電子機器';
    }

    // 7) インテリア・家具
    if (
        /(家具|寝具|ベッド|枕|布団|カーテン|のれん|インテリア|ラグ|マット|玄関マット|クッション|スリッパ|収納ボックス)/.test(text) ||
        /(家具|インテリア)/.test(category)
    ) {
        return 'インテリア・家具';
    }

    // 8) 工具・DIY・作業用品
    if (
        /(工具|DIY|作業|計測|ドライバー|レンチ|ニッパー|ハンマー)/.test(text) ||
        /(工具|産業)/.test(category)
    ) {
        return '工具・DIY・作業用品';
    }

    // 9) アウトドア・スポーツ
    if (
        /(キャンプ|登山|アウトドア|ゴルフ|釣り|ルアー|PEライン|トレーニング|フィットネス)/.test(text) ||
        /(スポーツ|アウトドア)/.test(category)
    ) {
        return 'アウトドア・スポーツ';
    }

    // 10) 文具・趣味・その他（受け皿）
    return '文具・趣味・その他';
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

    // サイト内カテゴリ（大分類10）のラベルを決定
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
        category: siteCategoryLabel, // 大分類10カテゴリのラベル
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

    // カテゴリー条件（大分類10カテゴリラベル）
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

/* ------------------------------
   トップへ戻るボタン
------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    // スクロールしたら表示
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.style.display = 'flex';
        } else {
            btn.style.display = 'none';
        }
    });

    // クリックでスムーズスクロール
    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
