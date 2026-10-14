/* DODS Commerce — Product Catalog Engine */

(function () {
  "use strict";

  const products = Array.isArray(window.DODS_PRODUCTS)
    ? window.DODS_PRODUCTS
    : [];

  const grid = document.getElementById("product-grid");
  const searchInput = document.getElementById("product-search");
  const catalogNote = document.getElementById("catalog-note");

  if (!grid) return;

  // Format prices in Indian currency.
  function money(amount, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Escape text before inserting it into HTML.
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  // Create one product card.
  function createProductCard(product) {
    const comparePrice =
      product.compareAtPrice > product.price
        ? `<del>${money(
            product.compareAtPrice,
            product.currency
          )}</del>`
        : "";

    return `
      <article class="product"
        data-name="${escapeHTML(product.name)}"
        data-category="${escapeHTML(product.category)}">

        <a class="product-image"
          href="product.html?id=${encodeURIComponent(product.id)}">

          <img
            loading="lazy"
            src="${escapeHTML(product.image)}"
            alt="${escapeHTML(product.imageAlt || product.name)}">

          ${
            product.badge
              ? `<span class="badge">${escapeHTML(product.badge)}</span>`
              : ""
          }
        </a>

        <div class="product-info">

          <div class="product-category">
            ${escapeHTML(product.category)}
          </div>

          <h3>
            <a href="product.html?id=${encodeURIComponent(product.id)}">
              ${escapeHTML(product.name)}
            </a>
          </h3>

          <div class="product-bottom">

            <div class="price">
              ${money(product.price, product.currency)}
              ${comparePrice}
            </div>

            <button
              class="add-btn"
              type="button"
              data-add="${escapeHTML(product.id)}"
              aria-label="Add ${escapeHTML(product.name)} to demo cart">
              +
            </button>

          </div>
        </div>
      </article>
    `;
  }

  // Render products and apply search.
  function renderCatalog(query = "") {
    const search = query.trim().toLowerCase();

    const filteredProducts = products.filter(product => {
      const searchableText = [
        product.name,
        product.category,
        product.description,
        ...(product.features || [])
      ].join(" ").toLowerCase();

      return searchableText.includes(search);
    });

    grid.innerHTML = filteredProducts.length
      ? filteredProducts.map(createProductCard).join("")
      : `<div class="empty-state">
           No matching products found. Try another search.
         </div>`;

    if (catalogNote) {
      catalogNote.textContent =
        `Showing ${filteredProducts.length} sample products.`;
    }

    // Demo-only add-to-cart interaction.
    grid.querySelectorAll("[data-add]").forEach(button => {
      button.addEventListener("click", () => {
        const product = products.find(
          item => item.id === button.dataset.add
        );

        if (!product) return;

        const count = document.getElementById("cart-count");

        if (count) {
          count.textContent =
            String(Number(count.textContent || 0) + 1);
        }

        const toast = document.getElementById("toast");

        if (toast) {
          toast.textContent =
            `${product.name} added to your demo cart. No order was created.`;

          toast.classList.add("show");

          clearTimeout(window.dodsToastTimer);

          window.dodsToastTimer = setTimeout(() => {
            toast.classList.remove("show");
          }, 2800);
        }

        window.dispatchEvent(
          new CustomEvent("infinity:ecommerce-demo-add-to-cart", {
            detail: {
              item_id: product.id,
              item_name: product.name,
              price: product.price,
              demo: true
            }
          })
        );
      });
    });
  }

  // Search products.
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderCatalog(searchInput.value);
    });
  }

  // Filter products when a category is selected.
  document.querySelectorAll("[data-category-filter]")
    .forEach(link => {
      link.addEventListener("click", () => {
        const category = link.dataset.categoryFilter || "";

        if (searchInput) {
          searchInput.value = category;
        }

        renderCatalog(category);
      });
    });

  // Initial catalog.
  renderCatalog();

})();
