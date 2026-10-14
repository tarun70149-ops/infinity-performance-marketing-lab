(function () {
  "use strict";

  const CART_KEY = "dods_demo_cart_v1";

  const products = Array.isArray(window.DODS_PRODUCTS)
    ? window.DODS_PRODUCTS
    : [];

  function formatINR(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(amount) || 0);
  }

  function getCart() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(CART_KEY) || "[]"
      );

      if (!Array.isArray(saved)) {
        return [];
      }

      return saved
        .filter(function (item) {
          return item &&
            typeof item.id === "string" &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            products.some(function (product) {
              return String(product.id) === item.id;
            });
        })
        .map(function (item) {
          return {
            id: item.id,
            quantity: Math.min(item.quantity, 99)
          };
        });
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      updateCartCount();
      return true;
    } catch (error) {
      alert("Unable to save cart. Please check browser storage.");
      return false;
    }
  }

  function updateCartCount() {
    const cart = getCart();

    const count = cart.reduce(function (total, item) {
      return total + item.quantity;
    }, 0);

    document.querySelectorAll(
      "[data-cart-count], #cart-count, .cart-count"
    ).forEach(function (element) {
      element.textContent = String(count);
      element.setAttribute(
        "aria-label",
        count + " items in cart"
      );
    });
  }

  function addToCart(productId) {
    const product = products.find(function (item) {
      return String(item.id) === String(productId);
    });

    if (!product) {
      alert("Product not found.");
      return;
    }

    if (product.availability === "out_of_stock") {
      alert("This product is currently unavailable.");
      return;
    }

    const cart = getCart();

    const existingItem = cart.find(function (item) {
      return item.id === String(product.id);
    });

    if (existingItem) {
      if (existingItem.quantity >= 99) {
        alert("Maximum quantity reached.");
        return;
      }

      existingItem.quantity += 1;
    } else {
      cart.push({
        id: String(product.id),
        quantity: 1
      });
    }

    if (!saveCart(cart)) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent("infinity:ecommerce-demo-add-to-cart", {
        detail: {
          item_id: String(product.id),
          item_name: String(product.name || ""),
          item_category: String(product.category || ""),
          price: Number(product.price) || 0,
          quantity: 1
        }
      })
    );

    showToast((product.name || "Product") + " added to cart!");
  }

  function showToast(message) {
    let toast = document.getElementById("catalog-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "catalog-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");

      Object.assign(toast.style, {
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#c7f36b",
        color: "#10131c",
        padding: "12px 20px",
        borderRadius: "10px",
        fontWeight: "700",
        fontSize: "14px",
        zIndex: "9999",
        boxShadow: "0 8px 25px rgba(0,0,0,0.25)"
      });

      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.hidden = false;

    if (toast.hideTimer) {
      clearTimeout(toast.hideTimer);
    }

    toast.hideTimer = setTimeout(function () {
      toast.hidden = true;
    }, 2200);
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"']/g,
      function (character) {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        };

        return entities[character];
      }
    );
  }

  function renderProducts() {
    const grid = document.getElementById("product-grid");

    if (!grid) {
      return;
    }

    if (!products.length) {
      grid.textContent = "No products are available.";
      return;
    }

    grid.innerHTML = products.map(function (product) {
      const id = escapeHTML(product.id);
      const name = escapeHTML(product.name || "Product");
      const category = escapeHTML(product.category || "General");
      const image = escapeHTML(product.image || "");
      const price = formatINR(product.price);
      const comparePrice = Number(product.compareAtPrice);
      const currentPrice = Number(product.price);

      const discount =
        Number.isFinite(comparePrice) &&
        Number.isFinite(currentPrice) &&
        comparePrice > currentPrice
          ? Math.round(
              ((comparePrice - currentPrice) / comparePrice) * 100
            )
          : 0;

      const unavailable = product.availability === "out_of_stock";

      return `
        <article class="product-card">
          <a
            href="product.html?id=${encodeURIComponent(product.id)}"
            class="product-card-link"
          >
            <img
              src="${image}"
              alt="${name}"
              loading="lazy"
            >

            <div class="product-card-info">
              <p class="product-category">${category}</p>
              <h3>${name}</h3>

              <div class="product-price">
                <span>${price}</span>

                ${
                  discount
                    ? `<span class="product-discount">${discount}% OFF</span>`
                    : ""
                }
              </div>
            </div>
          </a>

          <button
            type="button"
            class="add-to-cart-button"
            data-add-to-cart="${id}"
            ${unavailable ? "disabled" : ""}
          >
            ${unavailable ? "Unavailable" : "Add to Cart"}
          </button>
        </article>
      `;
    }).join("");

    grid.querySelectorAll("[data-add-to-cart]").forEach(
      function (button) {
        button.addEventListener("click", function () {
          addToCart(button.dataset.addToCart);
        });
      }
    );
  }

  function setupCartNavigation() {
    /*
      Connect homepage cart links/buttons.
      Works with common cart selectors.
    */

    document.querySelectorAll(
      'a[href="#cart"], a[href="cart"], a[href="cart.html"], ' +
      '[data-cart-link], #cart-button'
    ).forEach(function (element) {
      if (element.tagName === "A") {
        element.setAttribute("href", "cart.html");
      } else {
        element.style.cursor = "pointer";

        element.addEventListener("click", function () {
          window.location.href = "cart.html";
        });
      }
    });
  }

  function initialize() {
    renderProducts();
    updateCartCount();
    setupCartNavigation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }

})();
