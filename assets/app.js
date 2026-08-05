(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const one = (selector, scope = document) => scope.querySelector(selector);
  const all = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let registerMotionElements = () => {};

  const animateItems = (items, distance = 14) => {
    if (reducedMotion.matches || typeof Element.prototype.animate !== "function") return;
    items.forEach((item, index) => item.animate([
      { opacity: 0, transform: `translateY(${distance}px)` },
      { opacity: 1, transform: "translateY(0)" }
    ], {
      duration: 480,
      delay: Math.min(index, 8) * 42,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both"
    }));
  };

  const syncBodyLock = () => {
    const dialogOpen = all("dialog").some((dialog) => dialog.open);
    const menuOpen = one("[data-mobile-menu]")?.classList.contains("is-open");
    body.classList.toggle("dialog-open", dialogOpen || menuOpen);
  };

  function setupMotionSystem() {
    const selector = [
      ".page-hero .section-shell > *",
      ".section-heading > *",
      ".featured-entry > *",
      ".article-row",
      ".topic-band-row",
      ".directory-index-row",
      ".tag-cloud button",
      ".archive-year",
      ".about-intro > *",
      ".about-content > *",
      ".post-hero > *",
      ".article-content > :is(h2, h3, h4, figure, blockquote, table)",
      ".toc-column",
      ".post-tools > *",
      ".post-pagination > *",
      ".related-posts > *",
      ".site-footer > *"
    ].join(",");

    const revealObserver = reducedMotion.matches || !("IntersectionObserver" in window) ? null : new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

    registerMotionElements = (scope = document) => {
      all(selector, scope).forEach((element) => {
        if (element.dataset.motionBound === "true" || element.tagName === "SCRIPT") return;
        element.dataset.motionBound = "true";
        element.classList.add("motion-reveal");
        const siblings = [...element.parentElement.children];
        const siblingIndex = Math.max(0, siblings.indexOf(element));
        const delay = element.parentElement.matches(".article-content, .article-list") ? 0 : Math.min(siblingIndex, 5) * 55;
        element.style.setProperty("--motion-delay", `${delay}ms`);
        if (!revealObserver) {
          element.classList.add("is-visible");
          return;
        }
        revealObserver.observe(element);
      });
    };

    registerMotionElements();
    requestAnimationFrame(() => body.classList.add("motion-ready"));

    const header = one("[data-site-header]");
    if (header) {
      let headerFrame = 0;
      const updateHeader = () => {
        header.classList.toggle("is-scrolled", scrollY > 18);
        headerFrame = 0;
      };
      addEventListener("scroll", () => {
        if (!headerFrame) headerFrame = requestAnimationFrame(updateHeader);
      }, { passive: true });
      updateHeader();
    }

    const pressables = "button, .hero-action-primary, .home-peek, .featured-entry, .article-row-link, .directory-index-row, .topic-band-row, .post-pagination a, .related-posts a, .about-social a";
    document.addEventListener("pointerdown", (event) => {
      if (reducedMotion.matches || event.button > 0) return;
      const target = event.target.closest(pressables);
      if (!target || target.matches(":disabled")) return;
      const rect = target.getBoundingClientRect();
      const ripple = document.createElement("span");
      const size = Math.max(rect.width, rect.height) * 2.1;
      ripple.className = "motion-ripple";
      ripple.style.setProperty("--ripple-size", `${size}px`);
      ripple.style.setProperty("--ripple-x", `${event.clientX - rect.left}px`);
      ripple.style.setProperty("--ripple-y", `${event.clientY - rect.top}px`);
      target.classList.add("has-press-motion");
      target.append(ripple);
      ripple.addEventListener("animationend", () => {
        ripple.remove();
        if (!one(".motion-ripple", target)) target.classList.remove("has-press-motion");
      }, { once: true });
    }, { passive: true });

    const hero = one("[data-hero]");
    if (hero && !reducedMotion.matches && matchMedia("(hover: hover) and (pointer: fine)").matches) {
      let pointerFrame = 0;
      let pointerX = 0;
      let pointerY = 0;
      const applyPointer = () => {
        const rect = hero.getBoundingClientRect();
        const x = ((pointerX - rect.left) / rect.width - 0.5) * -10;
        const y = ((pointerY - rect.top) / rect.height - 0.5) * -7;
        hero.style.setProperty("--hero-shift-x", `${x}px`);
        hero.style.setProperty("--hero-shift-y", `${y}px`);
        pointerFrame = 0;
      };
      hero.addEventListener("pointermove", (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (!pointerFrame) pointerFrame = requestAnimationFrame(applyPointer);
      }, { passive: true });
      hero.addEventListener("pointerleave", () => {
        hero.style.setProperty("--hero-shift-x", "0px");
        hero.style.setProperty("--hero-shift-y", "0px");
      });
    }
  }

  function setupTheme() {
    const button = one("[data-theme-toggle]");
    if (!button) return;
    button.addEventListener("click", () => {
      const current = root.dataset.theme || "auto";
      const resolvedDark = current === "dark" || (current === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
      const next = resolvedDark ? "light" : "dark";
      const applyTheme = () => {
        root.dataset.theme = next;
        try { localStorage.setItem("yiyi-theme", next); } catch (_) { /* Storage may be disabled. */ }
        button.setAttribute("aria-label", next === "dark" ? "切换到浅色主题" : "切换到深色主题");
        one('meta[name="theme-color"]')?.setAttribute("content", next === "dark" ? "#0d0e12" : "#f7f8fa");
      };
      if (document.startViewTransition && !reducedMotion.matches) document.startViewTransition(applyTheme);
      else applyTheme();
      if (!reducedMotion.matches) button.animate([
        { transform: "rotate(0) scale(1)" },
        { transform: "rotate(100deg) scale(0.72)" },
        { transform: "rotate(180deg) scale(1)" }
      ], { duration: 520, easing: "cubic-bezier(0.16, 1.15, 0.3, 1)" });
    });
  }

  function setupActiveNavigation() {
    const currentPath = location.pathname.replace(/index\.html$/, "");
    all(".site-nav-link, .mobile-menu-link, .footer-links nav a, .hero-nav-link").forEach((link) => {
      const path = new URL(link.href, location.href).pathname.replace(/index\.html$/, "");
      const current = path !== "/" && currentPath.startsWith(path);
      link.classList.toggle("is-current", current);
      if (current) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function setupMobileMenu() {
    const menu = one("[data-mobile-menu]");
    if (!(menu instanceof HTMLDialogElement)) return;
    const toggles = all("[data-menu-toggle]");
    let restoreFocusTo = null;
    let closeTimer = 0;
    const syncToggles = (open) => toggles.forEach((toggle) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    });
    const finishClose = (restoreFocus) => {
      if (menu.open) menu.close();
      window.clearTimeout(closeTimer);
      closeTimer = 0;
      syncBodyLock();
      if (restoreFocus && restoreFocusTo?.isConnected) restoreFocusTo.focus({ preventScroll: true });
      restoreFocusTo = null;
    };
    const close = ({ restoreFocus = true } = {}) => {
      if (!menu.open && !menu.classList.contains("is-open")) return;
      menu.classList.remove("is-open");
      body.classList.remove("menu-open");
      syncToggles(false);
      if (reducedMotion.matches) finishClose(restoreFocus);
      else closeTimer = window.setTimeout(() => finishClose(restoreFocus), 300);
    };
    const open = (trigger) => {
      window.clearTimeout(closeTimer);
      restoreFocusTo = trigger instanceof HTMLElement ? trigger : document.activeElement;
      if (!menu.open) menu.showModal();
      body.classList.add("menu-open");
      syncToggles(true);
      requestAnimationFrame(() => {
        menu.classList.add("is-open");
        one("a", menu)?.focus({ preventScroll: true });
      });
      syncBodyLock();
    };
    toggles.forEach((toggle) => toggle.addEventListener("click", () => menu.open ? close() : open(toggle)));
    one("[data-menu-close]", menu)?.addEventListener("click", close);
    all("a", menu).forEach((link) => link.addEventListener("click", () => close({ restoreFocus: false })));
    menu.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
  }

  function setupHero() {
    const hero = one("[data-hero]");
    if (!hero) return;
    const videos = all("[data-hero-video]", hero);
    const switches = all("[data-video-switch]", hero);
    const darkScenes = new Set((hero.dataset.darkScenes || "").split(",").filter(Boolean).map(Number));
    const saveData = Boolean(navigator.connection?.saveData);
    let active = 0;
    let transitioning = false;
    let heroVisible = true;

    const shouldPlay = () => !document.hidden && heroVisible && !reducedMotion.matches && !saveData;
    const syncPlayback = () => {
      videos.forEach((video, index) => {
        if (index === active && shouldPlay()) video.play().catch(() => {});
        else video.pause();
      });
    };

    const select = async (index) => {
      if (index === active || transitioning || !videos[index]) return;
      transitioning = true;
      hero.classList.add("is-switching");
      const previous = active;
      active = index;
      const nextVideo = videos[index];
      try {
        nextVideo.preload = "auto";
        if (shouldPlay()) await nextVideo.play();
      } catch (_) { /* The poster remains visible if autoplay is blocked. */ }
      videos.forEach((video, videoIndex) => video.classList.toggle("is-active", videoIndex === index));
      switches.forEach((button, buttonIndex) => {
        const selected = buttonIndex === index;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      hero.classList.toggle("is-dark-content", darkScenes.has(index));
      window.setTimeout(() => {
        videos[previous]?.pause();
        transitioning = false;
        hero.classList.remove("is-switching");
      }, 1000);
    };

    switches.forEach((button) => button.addEventListener("click", () => select(Number(button.dataset.videoSwitch))));
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        heroVisible = entry.isIntersecting && entry.intersectionRatio >= 0.2;
        syncPlayback();
      }, { threshold: [0, 0.2] }).observe(hero);
    }
    document.addEventListener("visibilitychange", syncPlayback);
    reducedMotion.addEventListener?.("change", syncPlayback);
    syncPlayback();
  }

  function setupArticleList() {
    const list = one("[data-article-list]");
    if (!list) return;
    const rows = all("[data-article-item]", list);
    const filters = all("[data-article-filter]");
    const loadMore = one("[data-load-more]");
    const empty = one("[data-filter-empty]");
    const pageSize = Number(list.dataset.pageSize || 8);
    let limit = pageSize;
    let filter = "全部";

    const render = () => {
      let visible = 0;
      let matching = 0;
      const newlyVisible = [];
      rows.forEach((row) => {
        const wasHidden = row.hidden || row.classList.contains("is-initially-hidden");
        row.classList.remove("is-initially-hidden");
        const matches = filter === "全部" || row.dataset.topic === filter;
        if (matches) matching += 1;
        const show = matches && visible < limit;
        row.hidden = !show;
        if (show) {
          visible += 1;
          if (wasHidden) newlyVisible.push(row);
        }
      });
      if (loadMore) loadMore.hidden = matching <= limit;
      if (empty) empty.hidden = matching !== 0;
      animateItems(newlyVisible);
    };

    filters.forEach((button) => button.addEventListener("click", () => {
      filter = button.dataset.articleFilter;
      limit = pageSize;
      filters.forEach((candidate) => {
        const selected = candidate === button;
        candidate.classList.toggle("is-active", selected);
        candidate.setAttribute("aria-pressed", String(selected));
      });
      render();
    }));
    loadMore?.addEventListener("click", () => { limit += pageSize; render(); });
    render();
  }

  function setupDirectoryFilters() {
    const buttons = all("[data-directory-filter]");
    if (!buttons.length) return;
    const rows = all(".directory-results [data-article-item]");
    const title = one("[data-directory-title]");
    const clear = one("[data-directory-clear]");
    const params = new URLSearchParams(location.search);
    let filter = params.get("topic") || "";

    const render = () => {
      const newlyVisible = [];
      rows.forEach((row) => {
        const wasHidden = row.hidden;
        row.hidden = Boolean(filter) && row.dataset.topic !== filter;
        if (wasHidden && !row.hidden) newlyVisible.push(row);
      });
      buttons.forEach((button) => {
        const selected = button.dataset.directoryFilter === filter;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      if (title) title.textContent = filter || "全部专题";
      if (clear) clear.hidden = !filter;
      const url = new URL(location.href);
      filter ? url.searchParams.set("topic", filter) : url.searchParams.delete("topic");
      history.replaceState({}, "", url);
      animateItems(newlyVisible);
    };

    buttons.forEach((button) => button.addEventListener("click", () => { filter = button.dataset.directoryFilter; render(); one(".directory-results")?.scrollIntoView({ behavior: "smooth", block: "start" }); }));
    clear?.addEventListener("click", () => { filter = ""; render(); });
    render();
  }

  function setupTagFilters() {
    const buttons = all("[data-tag-filter]");
    if (!buttons.length) return;
    const wrappers = all("[data-tag-item]");
    const title = one("[data-tag-title]");
    const clear = one("[data-tag-clear]");
    const params = new URLSearchParams(location.search);
    let filter = params.get("tag") || "";

    const render = () => {
      const newlyVisible = [];
      wrappers.forEach((wrapper) => {
        let tags = [];
        try { tags = JSON.parse(wrapper.dataset.tags || "[]"); } catch (_) { tags = []; }
        const wasHidden = wrapper.hidden;
        wrapper.hidden = Boolean(filter) && !tags.includes(filter);
        if (wasHidden && !wrapper.hidden) newlyVisible.push(wrapper);
      });
      buttons.forEach((button) => {
        const selected = button.dataset.tagFilter === filter;
        button.classList.toggle("is-active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      if (title) title.textContent = filter ? `#${filter}` : "全部标签";
      if (clear) clear.hidden = !filter;
      const url = new URL(location.href);
      filter ? url.searchParams.set("tag", filter) : url.searchParams.delete("tag");
      history.replaceState({}, "", url);
      animateItems(newlyVisible);
    };

    buttons.forEach((button) => button.addEventListener("click", () => { filter = button.dataset.tagFilter; render(); one(".directory-results")?.scrollIntoView({ behavior: "smooth", block: "start" }); }));
    clear?.addEventListener("click", () => { filter = ""; render(); });
    render();
  }

  function setupSearch() {
    const dialog = one("[data-search-dialog]");
    if (!dialog) return;
    const input = one("[data-search-input]", dialog);
    const results = one("[data-search-results]", dialog);
    const status = one("[data-search-status]", dialog);
    const resultIcon = one("[data-search-result-icon]", dialog);
    let indexPromise;

    const loadIndex = () => indexPromise ||= fetch("/search-index.json").then((response) => {
      if (!response.ok) throw new Error("搜索索引加载失败");
      return response.json();
    });
    const normalize = (value) => String(value || "").normalize("NFKC").toLowerCase();
    const scoreEntry = (entry, terms) => {
      const fields = {
        title: normalize(entry.title),
        tags: normalize(entry.tags.join(" ")),
        topic: normalize(entry.topic),
        excerpt: normalize(entry.excerpt),
        content: normalize(entry.content)
      };
      let score = 0;
      for (const term of terms) {
        const anywhere = Object.values(fields).some((field) => field.includes(term));
        if (!anywhere) return 0;
        if (fields.title.includes(term)) score += 60;
        if (fields.tags.includes(term)) score += 30;
        if (fields.topic.includes(term)) score += 20;
        if (fields.excerpt.includes(term)) score += 12;
        if (fields.content.includes(term)) score += 2;
      }
      return score;
    };
    const renderResult = (entry, index) => {
      const link = document.createElement("a");
      link.className = "search-result";
      link.href = entry.href;
      link.style.setProperty("--result-index", index);
      const copy = document.createElement("div");
      const meta = document.createElement("small");
      meta.textContent = `${entry.topic} · ${entry.dateLabel}`;
      const heading = document.createElement("strong");
      heading.textContent = entry.title;
      const excerpt = document.createElement("p");
      excerpt.textContent = entry.excerpt;
      copy.append(meta, heading, excerpt);
      link.append(copy, resultIcon.content.cloneNode(true));
      return link;
    };
    const runSearch = async () => {
      const terms = normalize(input.value).split(/\s+/).filter(Boolean);
      results.replaceChildren();
      if (!terms.length) {
        const index = await loadIndex();
        status.textContent = `输入关键词，查找 ${index.length} 篇记录。`;
        return;
      }
      try {
        const index = await loadIndex();
        const matches = index.map((entry) => ({ entry, score: scoreEntry(entry, terms) }))
          .filter((result) => result.score > 0)
          .sort((a, b) => b.score - a.score || new Date(b.entry.date) - new Date(a.entry.date))
          .slice(0, 12);
        status.textContent = matches.length ? `找到 ${matches.length} 条最相关结果。` : "没有找到匹配的文章。";
        results.append(...matches.map(({ entry }, index) => renderResult(entry, index)));
      } catch (error) {
        status.textContent = error.message;
      }
    };
    const open = async (query = "") => {
      if (!dialog.open) dialog.showModal();
      syncBodyLock();
      input.value = query || input.value;
      await runSearch();
      requestAnimationFrame(() => input.focus());
    };
    const close = () => { dialog.close(); syncBodyLock(); };

    all("[data-open-search]").forEach((button) => button.addEventListener("click", () => open()));
    one("[data-close-search]", dialog)?.addEventListener("click", close);
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    dialog.addEventListener("close", syncBodyLock);
    input.addEventListener("input", runSearch);
    document.addEventListener("keydown", (event) => {
      const target = event.target;
      const editing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
      if ((event.key === "/" && !editing) || (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey))) {
        event.preventDefault();
        open();
      }
    });

    const initialQuery = new URLSearchParams(location.search).get("q");
    if (initialQuery) open(initialQuery);
  }

  const copyText = async (text) => {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  };

  function setupCopyActions() {
    document.addEventListener("click", async (event) => {
      const codeButton = event.target.closest("[data-copy-code]");
      if (codeButton) {
        const code = codeButton.closest(".code-block")?.querySelector("code")?.textContent || "";
        await copyText(code);
        const label = codeButton.querySelector("span");
        if (label) label.textContent = "已复制";
        codeButton.classList.add("is-success");
        window.setTimeout(() => {
          if (label) label.textContent = "复制";
          codeButton.classList.remove("is-success");
        }, 1500);
      }
      const linkButton = event.target.closest("[data-copy-link]");
      if (linkButton) {
        await copyText(location.href);
        const label = linkButton.querySelector("span");
        if (label) label.textContent = "链接已复制";
        linkButton.classList.add("is-success");
        window.setTimeout(() => {
          if (label) label.textContent = "复制链接";
          linkButton.classList.remove("is-success");
        }, 1500);
      }
    });
  }

  let tocObserver;
  function setupTocObserver() {
    tocObserver?.disconnect();
    const content = one("[data-article-content]");
    const links = all(".post-toc a");
    if (!content || !links.length) return;
    const byId = new Map(links.map((link) => [decodeURIComponent(link.hash.slice(1)), link]));
    tocObserver = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (!visible) return;
      links.forEach((link) => link.classList.toggle("is-active", link === byId.get(visible.target.id)));
    }, { rootMargin: "-15% 0px -72% 0px", threshold: 0 });
    all("h2[id], h3[id]", content).forEach((heading) => tocObserver.observe(heading));
  }

  function buildDynamicToc() {
    const toc = one("[data-dynamic-toc]");
    const content = one("[data-article-content]");
    const list = one("[data-toc-list]", toc || document);
    if (!toc || !content || !list) return;
    const headings = all("h2[id], h3[id]", content);
    list.replaceChildren(...headings.map((heading) => {
      const link = document.createElement("a");
      link.className = `toc-depth-${heading.tagName === "H2" ? 2 : 3}`;
      link.href = `#${encodeURIComponent(heading.id)}`;
      link.textContent = heading.childNodes[0]?.textContent?.trim() || heading.textContent.replace(/#$/, "").trim();
      return link;
    }));
    if (!headings.length) {
      const empty = document.createElement("p");
      empty.textContent = "本文没有分节";
      list.append(empty);
      one("[data-toc-toggle]")?.setAttribute("hidden", "");
    }
    setupTocObserver();
  }

  function setupArticleUtilities() {
    const article = one("[data-article-content]");
    const progress = one("[data-reading-progress]");
    if (article && progress) {
      const update = () => {
        const start = article.getBoundingClientRect().top + scrollY;
        const end = start + article.offsetHeight - innerHeight;
        const value = end <= start ? 1 : Math.min(1, Math.max(0, (scrollY - start) / (end - start)));
        progress.style.width = `${value * 100}%`;
      };
      addEventListener("scroll", update, { passive: true });
      addEventListener("resize", update);
      update();
    }
    const tocColumn = one(".toc-column");
    const tocToggle = one("[data-toc-toggle]");
    const setTocOpen = (open) => {
      tocColumn?.classList.toggle("is-open", open);
      tocToggle?.setAttribute("aria-expanded", String(open));
      tocToggle?.setAttribute("aria-label", open ? "关闭目录" : "打开目录");
      tocToggle?.setAttribute("data-tooltip", open ? "关闭目录" : "目录");
    };
    setTocOpen(false);
    tocToggle?.addEventListener("click", () => setTocOpen(!tocColumn?.classList.contains("is-open")));
    document.addEventListener("click", (event) => {
      if (event.target.closest(".post-toc a")) setTocOpen(false);
      if (!tocColumn?.classList.contains("is-open")) return;
      if (!tocColumn.contains(event.target) && !event.target.closest("[data-toc-toggle]")) setTocOpen(false);
    });
    setupTocObserver();
  }

  const base64Bytes = (value) => Uint8Array.from(atob(value), (character) => character.charCodeAt(0));

  function setupProtectedPost() {
    const form = one("[data-unlock-form]");
    const dataNode = one("#protected-post-data");
    const article = one("[data-article-content]");
    if (!form || !dataNode || !article) return;
    const status = one("[data-unlock-status]");
    const submit = one("button[type=submit]", form);
    const payload = JSON.parse(dataNode.textContent);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const password = new FormData(form).get("password");
      if (!password) return;
      submit.disabled = true;
      status.textContent = "正在本地解密…";
      try {
        const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(password)), "PBKDF2", false, ["deriveKey"]);
        const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: base64Bytes(payload.salt), iterations: payload.iterations, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
        const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64Bytes(payload.iv), tagLength: 128 }, key, base64Bytes(payload.payload));
        article.innerHTML = new TextDecoder().decode(plaintext);
        buildDynamicToc();
        registerMotionElements(article);
        article.focus({ preventScroll: true });
      } catch (_) {
        status.textContent = "密码不正确，请重新输入。";
        submit.disabled = false;
        one("input", form)?.select();
      }
    });
  }

  function setupImageLightbox() {
    const dialog = one("[data-image-lightbox]");
    if (!dialog) return;
    const image = one("[data-lightbox-image]", dialog);
    const caption = one("[data-lightbox-caption]", dialog);
    document.addEventListener("click", (event) => {
      const source = event.target.closest(".article-image img");
      if (!source) return;
      image.src = source.currentSrc || source.src;
      image.alt = source.alt;
      caption.textContent = source.alt;
      dialog.showModal();
      syncBodyLock();
    });
    const close = () => { dialog.close(); image.removeAttribute("src"); syncBodyLock(); };
    one("[data-lightbox-close]", dialog)?.addEventListener("click", close);
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    dialog.addEventListener("close", syncBodyLock);

    document.addEventListener("error", (event) => {
      const source = event.target.closest?.(".article-image img");
      if (!source) return;
      const message = document.createElement("div");
      message.className = "image-error";
      message.textContent = source.alt ? `图片加载失败：${source.alt}` : "图片加载失败";
      source.replaceWith(message);
    }, true);
  }

  setupMotionSystem();
  setupTheme();
  setupActiveNavigation();
  setupMobileMenu();
  setupHero();
  setupArticleList();
  setupDirectoryFilters();
  setupTagFilters();
  setupSearch();
  setupCopyActions();
  setupArticleUtilities();
  setupProtectedPost();
  setupImageLightbox();
})();
