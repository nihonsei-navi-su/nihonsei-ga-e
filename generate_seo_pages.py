#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import html
from pathlib import Path
from datetime import date

ROOT = Path("/Users/user/nihonsei-ga-e")
PRODUCTS_JSON = ROOT / "data" / "products.json"
PRODUCTS_DIR = ROOT / "products"
SITEMAP_XML = ROOT / "sitemap.xml"
ROBOTS_TXT = ROOT / "robots.txt"

SITE_URL = "https://nihonsei-ga-e.com"


def esc(value):
    return html.escape(str(value or ""), quote=True)


def load_products():
    with PRODUCTS_JSON.open("r", encoding="utf-8") as f:
        data = json.load(f)

    if not isinstance(data, list):
        raise ValueError("products.json が配列ではありません")

    products = []
    seen = set()

    for item in data:
        asin = str(item.get("asin", "")).strip()
        if not asin or asin in seen:
            continue
        seen.add(asin)
        products.append(item)

    return products


def build_product_html(item):
    asin = esc(item.get("asin", ""))
    title = esc(item.get("title") or item.get("name") or "日本製・国産の商品")
    manufacturer = esc(item.get("manufacturer", ""))
    category = esc(item.get("category", ""))
    amazon_url = esc(item.get("url") or f"https://www.amazon.co.jp/dp/{asin}")

    page_url = f"{SITE_URL}/products/{asin}.html"

    return f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>{title} | 日本製がいい！</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{title}。日本製・国産の商品を探せるAmazon非公式検索サイト「日本製がいい！」の掲載商品ページです。">
  <link rel="canonical" href="{page_url}">
  <link rel="stylesheet" href="../css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <div class="site-logo">
        <a href="../index.html">
          <img src="../img/pic-header220-48pix.png" alt="日本製がいい！" class="header-logo">
        </a>
      </div>
      <nav class="site-nav">
        <ul>
          <li><a href="../index.html">トップ</a></li>
          <li><a href="../about.html">サイトについて</a></li>
          <li><a href="../contact.html">お問い合わせ</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main>
    <section class="products-section">
      <div class="container">
        <article class="product-card">
          <div class="product-meta">
            <h1 class="product-title">{title}</h1>
            {"<p class='product-brand'>" + manufacturer + "</p>" if manufacturer else ""}
            <div class="product-tags">
              <span class="tag tag-japan">日本製・国産</span>
              {"<span class='tag'>" + category + "</span>" if category else ""}
            </div>
            <p>このページは、日本製・国産の商品を探す方向けの商品掲載ページです。</p>
          </div>

          <div class="product-actions">
            <a href="{amazon_url}" class="btn btn-primary amazon-link" target="_blank" rel="noopener sponsored">
              Amazonで見る
            </a>
          </div>
        </article>

        <p style="margin-top:24px;">
          <a href="../index.html">日本製・国産の商品一覧へ戻る</a>
        </p>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p class="footer-logo">日本製がいい！</p>
      <p class="footer-disclaimer">
        当サイトでは Amazon に日本製と記載された商品を掲載しておりますが、製造国の保証はいたしかねます。
        Amazon.co.jp の最新情報をご確認ください。
      </p>
      <p class="footer-copy">&copy; 2025 日本製がいい！ All rights reserved.</p>
    </div>
  </footer>
</body>
</html>
"""


def write_product_pages(products):
    PRODUCTS_DIR.mkdir(exist_ok=True)

    count = 0
    for item in products:
        asin = str(item.get("asin", "")).strip()
        if not asin:
            continue

        out = PRODUCTS_DIR / f"{asin}.html"
        out.write_text(build_product_html(item), encoding="utf-8")
        count += 1

    return count


def write_sitemap(products):
    today = date.today().isoformat()

    urls = [
        f"""  <url>
    <loc>{SITE_URL}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>""",
        f"""  <url>
    <loc>{SITE_URL}/about.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>""",
        f"""  <url>
    <loc>{SITE_URL}/contact.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>""",
    ]

    for item in products:
        asin = str(item.get("asin", "")).strip()
        if not asin:
            continue

        urls.append(f"""  <url>
    <loc>{SITE_URL}/products/{esc(asin)}.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>""")

    xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
""" + "\n".join(urls) + """
</urlset>
"""

    SITEMAP_XML.write_text(xml, encoding="utf-8")


def write_robots():
    ROBOTS_TXT.write_text(
        f"""User-agent: *
Allow: /

Sitemap: {SITE_URL}/sitemap.xml
""",
        encoding="utf-8",
    )


def main():
    products = load_products()
    page_count = write_product_pages(products)
    write_sitemap(products)
    write_robots()

    print(f"products loaded: {len(products)}")
    print(f"product pages written: {page_count}")
    print(f"sitemap written: {SITEMAP_XML}")
    print(f"robots written: {ROBOTS_TXT}")


if __name__ == "__main__":
    main()