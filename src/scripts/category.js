/* Category page JS
   Provides: initCategoryPage(), renderProducts(), applyFiltersAndSort(), initFiltersUI(), initSortUI(), initActiveChipsUI(), initQuickView(), initLoadMore()
*/
(function () {
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  function money(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function generateMock(nameBase, count = 24) {
    const colors = ["Preto", "Branco", "Cinza"];
    const sizes = ["P", "M", "G", "GG"];
    return Array.from({ length: count }).map((_, i) => ({
      id: nameBase.toLowerCase().replace(/\s+/g, "-") + "-" + (i + 1),
      name: `${nameBase} ${i + 1}`,
      price: Math.round(50 + Math.random() * 350) * 1,
      colors: [colors[i % 3]],
      sizes: [sizes[i % 4]],
      inStock: Math.random() > 0.1,
      badge: i % 7 === 0 ? "New" : i % 5 === 0 ? "Best Seller" : "",
      images: ["/assets/img/placeholder.svg", "/assets/img/placeholder.svg"],
    }));
  }

  const datasets = {
    Camisas: generateMock("Camisa", 24),
    Tênis: generateMock("Tênis", 24),
    Calças: generateMock("Calca", 24),
    Acessórios: generateMock("Acessorio", 24),
  };

  // state
  let state = {
    all: [],
    visible: [],
    filters: {
      sizes: new Set(),
      colors: new Set(),
      brands: new Set(),
      inStock: false,
      price: [0, 9999],
    },
    sort: "Relevância",
    pageSize: 24,
  };

  function initCategoryPage() {
    const cat = document.body.dataset.category || "Camisas";
    state.all = datasets[cat]
      ? datasets[cat].slice()
      : datasets["Camisas"].slice();
    state.visible = state.all.slice(0, state.pageSize);
    renderProducts(state.visible);
    initFiltersUI();
    initSortUI();
    initActiveChipsUI();
    initQuickView();
    initLoadMore();
    // animations
    if (window.gsap) {
      gsap.from(".category-hero h1", { y: 20, opacity: 0, duration: 0.6 });
      gsap.from(".product-card", {
        y: 10,
        opacity: 0,
        stagger: 0.05,
        duration: 0.45,
      });
    }
  }

  function renderProducts(products, opts = { append: false }) {
    const grid = qs("#productsGrid");
    if (!grid) return;
    if (!opts.append) grid.innerHTML = "";
    products.forEach((p) => {
      const el = document.createElement("article");
      el.className = "product-card";
      el.setAttribute("data-id", p.id);
      el.innerHTML = `
        ${p.badge ? `<div class="badge small">${p.badge}</div>` : ""}
        <div class="thumb"><img src="${p.images[0]}" alt="${p.name}" data-alt="${p.images[1]}"></div>
        <div class="product-info"><div class="product-name">${p.name}</div><div class="product-price">${money(p.price)}</div></div>
        <button class="quick-add" aria-label="Adicionar ${p.name} ao carrinho">+ Carrinho</button>
      `;
      // hover swap
      el.querySelector("img").addEventListener("mouseenter", (e) => {
        e.target.src = e.target.dataset.alt;
      });
      el.querySelector("img").addEventListener("mouseleave", (e) => {
        e.target.src = p.images[0];
      });
      el.querySelector(".quick-add").addEventListener("click", () => {
        alert(p.name + " adicionado");
      });
      el.addEventListener("click", (ev) => {
        if (!ev.target.classList.contains("quick-add")) openQuickView(p);
      });
      grid.appendChild(el);
    });
    qs("#resultsCount").textContent = state.all.length;
  }

  function applyFiltersAndSort() {
    let res = state.all.slice();
    // sizes
    if (state.filters.sizes.size) {
      res = res.filter((p) => p.sizes.some((s) => state.filters.sizes.has(s)));
    }
    // colors
    if (state.filters.colors.size) {
      res = res.filter((p) =>
        p.colors.some((c) => state.filters.colors.has(c)),
      );
    }
    // stock
    if (state.filters.inStock) {
      res = res.filter((p) => p.inStock);
    }
    // price
    res = res.filter(
      (p) =>
        p.price >= state.filters.price[0] && p.price <= state.filters.price[1],
    );
    // sort
    if (state.sort === "Preço: menor") res.sort((a, b) => a.price - b.price);
    if (state.sort === "Preço: maior") res.sort((a, b) => b.price - a.price);
    if (state.sort === "Novidades")
      res.sort((a, b) => b.id.localeCompare(a.id));
    // update visible
    state.visible = res.slice(0, state.pageSize);
    renderProducts(state.visible);
    // animation
    if (window.gsap)
      gsap.from(".product-card", {
        y: 8,
        opacity: 0,
        stagger: 0.04,
        duration: 0.35,
      });
  }

  function initFiltersUI() {
    const container = qs("#filtersInner");
    if (!container) return;
    container.innerHTML = `
      <div class="filter-group"><h4>Tamanho</h4><div class="options" id="sizesOpt"></div></div>
      <div class="filter-group"><h4>Cor</h4><div class="options" id="colorsOpt"></div></div>
      <div class="filter-group"><h4>Marca</h4><div class="options" id="brandsOpt"></div></div>
      <div class="filter-group"><h4>Disponibilidade</h4><label><input type="checkbox" id="inStock"> Em estoque</label></div>
      <div class="filter-actions"><button id="clearFilters">Limpar filtros</button></div>
    `;
    const sizes = ["P", "M", "G", "GG"];
    const colors = ["Preto", "Branco", "Cinza"];
    const sizesOpt = qs("#sizesOpt");
    sizes.forEach((s) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.textContent = s;
      b.addEventListener("click", () => {
        toggleSet(state.filters.sizes, s);
        applyFiltersAndSort();
        updateChips();
      });
      sizesOpt.appendChild(b);
    });
    const colorsOpt = qs("#colorsOpt");
    colors.forEach((c) => {
      const b = document.createElement("button");
      b.className = "opt";
      b.textContent = c;
      b.addEventListener("click", () => {
        toggleSet(state.filters.colors, c);
        applyFiltersAndSort();
        updateChips();
      });
      colorsOpt.appendChild(b);
    });
    qs("#inStock").addEventListener("change", (e) => {
      state.filters.inStock = e.target.checked;
      applyFiltersAndSort();
      updateChips();
    });
    qs("#clearFilters").addEventListener("click", () => {
      state.filters = {
        sizes: new Set(),
        colors: new Set(),
        brands: new Set(),
        inStock: false,
        price: [0, 9999],
      };
      qsa("#filtersInner .opt").forEach((n) => n.classList.remove("active"));
      qs("#inStock").checked = false;
      applyFiltersAndSort();
      updateChips();
    });
  }

  function toggleSet(set, val) {
    if (set.has(val)) set.delete(val);
    else set.add(val);
  }

  function initSortUI() {
    const sel = qs("#sortSelect");
    if (!sel) return;
    sel.addEventListener("change", () => {
      state.sort = sel.value;
      applyFiltersAndSort();
    });
  }

  function updateChips() {
    const chips = qs("#activeChips");
    chips.innerHTML = "";
    state.filters.sizes.forEach((s) => {
      const c = document.createElement("div");
      c.className = "chip";
      c.textContent = s;
      c.addEventListener("click", () => {
        state.filters.sizes.delete(s);
        applyFiltersAndSort();
        updateChips();
      });
      chips.appendChild(c);
    });
    state.filters.colors.forEach((s) => {
      const c = document.createElement("div");
      c.className = "chip";
      c.textContent = s;
      c.addEventListener("click", () => {
        state.filters.colors.delete(s);
        applyFiltersAndSort();
        updateChips();
      });
      chips.appendChild(c);
    });
    if (state.filters.inStock) {
      const c = document.createElement("div");
      c.className = "chip";
      c.textContent = "Em estoque";
      c.addEventListener("click", () => {
        state.filters.inStock = false;
        applyFiltersAndSort();
        updateChips();
      });
      chips.appendChild(c);
    }
  }

  function initActiveChipsUI() {
    updateChips();
  }

  // Quick view modal (basic)
  let currentQuick = null;
  function initQuickView() {
    const modal = qs("#quickView");
    if (!modal) return;
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeQuickView();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeQuickView();
    });
  }

  function openQuickView(product) {
    const modal = qs("#quickView");
    modal.innerHTML = `<div class="panel" role="dialog" aria-modal="true"><button class="close">Fechar</button><div class="q-body"><h2>${product.name}</h2><div class="q-grid"><div class="q-media"><img src="${product.images[0]}" alt="${product.name}"></div><div class="q-meta"><div class="product-price">${money(product.price)}</div><div><label>Tamanho</label><select><option>P</option><option>M</option><option>G</option></select></div><button class="add">Adicionar ao carrinho</button></div></div></div>`;
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector(".close").addEventListener("click", closeQuickView);
    modal.querySelector(".add")?.addEventListener("click", () => {
      alert("Adicionado: " + product.name);
    });
  }
  function closeQuickView() {
    const modal = qs("#quickView");
    if (!modal) return;
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
  }

  function initLoadMore() {
    const btn = qs("#loadMore");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const current = document.querySelectorAll(".product-card").length;
      const toAppend = state.all.slice(current, current + state.pageSize);
      renderProducts(toAppend, { append: true });
      if (window.gsap)
        gsap.from(".product-card", {
          y: 8,
          opacity: 0,
          stagger: 0.03,
          duration: 0.35,
        });
    });
  }

  // expose
  window.initCategoryPage = initCategoryPage;
  // auto init on DOM
  document.addEventListener("DOMContentLoaded", () => {
    if (document.body.dataset.category) initCategoryPage();
  });
})();
