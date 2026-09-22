// 军用绿萌军备档案馆 — 交互脚本
(function () {
  "use strict";

  // ---------- 移动端导航切换 ----------
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "✕" : "☰";
    });

    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "☰";
      }
    });
  }

  // ---------- 导航滑动指示器 ----------
  var navLinks = nav ? nav.querySelectorAll("a") : [];
  if (nav && navLinks.length) {
    var indicator = document.createElement("span");
    indicator.className = "nav-indicator";
    nav.appendChild(indicator);

    var activeLink = nav.querySelector("a.active") || navLinks[0];

    function positionIndicator(link, instant) {
      if (!link) return;
      if (instant) indicator.style.transition = "none";
      indicator.style.width = link.offsetWidth + "px";
      indicator.style.height = link.offsetHeight + "px";
      indicator.style.transform =
        "translateX(" + link.offsetLeft + "px) translateY(" + link.offsetTop + "px)";
      if (instant) {
        void indicator.offsetWidth; // 强制重排，使定位立即生效
        indicator.style.transition = "";
      }
    }

    // 初始立即定位（无淡入/无动画），仅 hover 时平滑滑动
    positionIndicator(activeLink, true);

    navLinks.forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        positionIndicator(link);
      });
      link.addEventListener("mouseleave", function () {
        positionIndicator(activeLink);
      });
    });

    window.addEventListener("load", function () {
      positionIndicator(activeLink, true);
    });
    window.addEventListener("resize", function () {
      positionIndicator(activeLink, true);
    });
  }

  // ---------- 首页：导航自动隐藏（顶部悬停显示、下滑常驻） ----------
  if (document.body.classList.contains("is-home")) {
    var header = document.querySelector(".site-header");
    var threshold = 60; // 滚动超过该值后导航常驻显示
    var topZone = 96;   // 顶部悬停触发区高度（px）

    // 通过 #home 锚点返回首页时，初始显示导航，避免突兀消失
    var fromInternal = location.hash === "#home";
    if (fromInternal) {
      try {
        history.replaceState(null, "", location.pathname + location.search);
      } catch (err) {}
    }

    // 移除 head 内联脚本设置的 home-fresh，改由 nav-hidden 接管
    document.documentElement.classList.remove("home-fresh");

    var pointerY = fromInternal ? 0 : 9999; // 站内返回视为鼠标在顶部 → 显示

    function setNavHidden(hidden) {
      if (!header) return;
      header.classList.toggle("nav-hidden", hidden);
    }

    function updateNav() {
      if (window.scrollY <= threshold) {
        // 顶部：鼠标在触发区内则显示，否则隐藏
        setNavHidden(pointerY > topZone);
      } else {
        // 下滑后常驻显示
        setNavHidden(false);
      }
    }

    document.addEventListener("mousemove", function (e) {
      pointerY = e.clientY;
      updateNav();
    });

    window.addEventListener("scroll", updateNav, { passive: true });
    updateNav();
  }

  // ---------- 滚动浮现（reveal） ----------
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );
      revealEls.forEach(function (el) {
        io.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("in-view");
      });
    }
  }

  // ---------- 顶部搜索 ----------
  var searchBox = document.querySelector(".nav-search");
  var searchInput = searchBox ? searchBox.querySelector(".search-input") : null;
  var searchResults = searchBox ? searchBox.querySelector(".search-results") : null;

  if (searchInput && searchResults && window.SEARCH_INDEX) {
    function norm(s) { return (s || "").toLowerCase(); }
    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    }

    function runSearch() {
      var q = norm(searchInput.value.trim());
      if (!q) { searchResults.hidden = true; searchResults.innerHTML = ""; return; }
      var toks = q.split(/\s+/);
      var hits = window.SEARCH_INDEX.filter(function (item) {
        var hay = norm(item.title + " " + (item.cat || "") + " " + (item.keys || ""));
        return toks.every(function (t) { return hay.indexOf(t) !== -1; });
      });
      var articles = hits.filter(function (i) { return i.type === "article"; });
      var files = hits.filter(function (i) { return i.type === "file"; });

      var html = "";
      function row(item) {
        var label = item.type === "article" ? "文章" : ("投影 · " + item.cat);
        return '<a class="search-item" href="' + item.url + '">' +
          '<span class="search-item-label">' + esc(label) + '</span>' +
          '<span class="search-item-title">' + esc(item.title) + '</span>' +
          '</a>';
      }
      if (articles.length) html += '<div class="search-group">文章</div>' + articles.map(row).join("");
      if (files.length) html += '<div class="search-group">投影文件</div>' + files.map(row).join("");
      if (!articles.length && !files.length) html += '<div class="search-empty">无匹配结果</div>';

      searchResults.innerHTML = html;
      searchResults.hidden = false;
    }

    searchInput.addEventListener("input", runSearch);
    searchInput.addEventListener("focus", runSearch);

    searchResults.addEventListener("click", function (e) {
      if (e.target.closest("a")) searchResults.hidden = true;
    });

    document.addEventListener("click", function (e) {
      if (searchBox && !searchBox.contains(e.target)) searchResults.hidden = true;
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") searchResults.hidden = true;
    });
  }

  // ---------- 页内目录生成（可复用） ----------
  function buildPageToc(proseEl, tocEl) {
    if (!proseEl || !tocEl) return;
    var headings = [];
    for (var i = 0; i < proseEl.children.length; i++) {
      var el = proseEl.children[i];
      if (el.tagName === "H2" || el.tagName === "H3") headings.push(el);
    }
    if (headings.length) {
      var tocHtml = "";
      headings.forEach(function (h, idx) {
        var id = "sec-" + (idx + 1);
        h.id = id;
        var cls = h.tagName === "H3" ? "toc-sub" : "toc-top";
        tocHtml += '<li class="' + cls + '"><a href="#' + id + '">' + h.textContent.trim() + '</a></li>';
      });
      tocEl.innerHTML = tocHtml;
    } else {
      tocEl.innerHTML = '<li class="toc-empty">（无）</li>';
    }
  }

  // ---------- 文章加载（运行时读取 .md） ----------
  var articleBody = document.getElementById("article-body");
  if (articleBody) {
    function escHtml(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
      });
    }

    var slug = new URLSearchParams(location.search).get("article");
    var articles = window.ARTICLES || [];
    var currentIdx = -1;
    var article = null;
    for (var a = 0; a < articles.length; a++) {
      if (articles[a].slug === slug) { article = articles[a]; currentIdx = a; break; }
    }

    // 文章目录（侧栏列表，高亮当前）
    var tocArticles = document.getElementById("toc-articles");
    if (tocArticles && articles.length) {
      tocArticles.innerHTML = articles.map(function (item) {
        return '<li><a href="article.html?article=' + item.slug + '"' +
          (item.slug === slug ? ' class="active"' : '') + '>' + escHtml(item.short) + '</a></li>';
      }).join("");
    }

    // 上下章导航
    var postNav = document.getElementById("post-nav");
    if (postNav && articles.length) {
      var prev = currentIdx > 0 ? articles[currentIdx - 1] : null;
      var next = currentIdx < articles.length - 1 ? articles[currentIdx + 1] : null;
      var navHtml = "";
      if (prev) {
        navHtml += '<a class="post-nav-prev" href="article.html?article=' + prev.slug + '">' +
          '<span class="post-nav-label">← 上一章</span>' +
          '<span class="post-nav-title">' + escHtml(prev.short) + '</span></a>';
      } else {
        navHtml += '<a class="post-nav-prev" href="tutorials.html">' +
          '<span class="post-nav-label">← 返回</span>' +
          '<span class="post-nav-title">视频教程列表</span></a>';
      }
      if (next) {
        navHtml += '<a class="post-nav-next" href="article.html?article=' + next.slug + '">' +
          '<span class="post-nav-label">下一章 →</span>' +
          '<span class="post-nav-title">' + escHtml(next.short) + '</span></a>';
      } else {
        navHtml += '<a class="post-nav-next" href="tutorials.html">' +
          '<span class="post-nav-label">返回 →</span>' +
          '<span class="post-nav-title">视频教程列表</span></a>';
      }
      postNav.innerHTML = navHtml;
    }

    if (!article) {
      document.title = "文章未找到 · 军用绿萌军备档案馆";
      document.getElementById("article-title").textContent = "文章未找到";
      document.getElementById("article-crumb").textContent = "未找到";
      document.getElementById("article-tag").textContent = "—";
      articleBody.innerHTML = '<div class="note">没有找到这篇文章。<a href="tutorials.html">返回教程列表</a></div>';
    } else {
      var crumbLabel = (article.short || article.title).split(" · ")[0].trim();
      document.title = article.title + " · 军用绿萌军备档案馆";
      document.getElementById("article-title").textContent = article.title;
      document.getElementById("article-crumb").textContent = crumbLabel;
      document.getElementById("article-tag").textContent = article.tag;
      var metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && article.description) metaDesc.setAttribute("content", article.description);

      if (typeof marked === "undefined") {
        articleBody.innerHTML = '<div class="note">Markdown 解析器加载失败，请检查网络或 assets/js/marked.min.js。</div>';
      } else {
        fetch(encodeURI(article.file))
          .then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.text();
          })
          .then(function (md) {
            articleBody.innerHTML = marked.parse(md);
            // 修正 .md 里的相对路径（图片/链接相对其所在目录解析）
            var baseDir = article.file.slice(0, article.file.lastIndexOf("/") + 1);
            articleBody.querySelectorAll('img[src], a[href]').forEach(function (el) {
              var attr = el.tagName === "IMG" ? "src" : "href";
              var val = el.getAttribute(attr);
              if (!val || /^(https?:)?\/\/|^data:|^mailto:|^#/.test(val)) return;
              el.setAttribute(attr, baseDir + val.replace(/^\.\//, ""));
            });
            // 正文里的外链统一新窗口打开
            articleBody.querySelectorAll('a[href^="http"]').forEach(function (link) {
              link.target = "_blank";
              link.rel = "noopener";
            });
            buildPageToc(articleBody, document.getElementById("toc-sections"));
          })
          .catch(function (err) {
            articleBody.innerHTML = '<div class="note">加载文章失败：' + escHtml(err.message) +
              '<br><br>提示：如果用 file:// 双击打开，浏览器会禁止读取本地 .md。请改用本地服务器访问，例如 VS Code 的 Live Server 插件，或在本目录运行 <code>python -m http.server</code> 后访问 http://localhost:8000/。</div>';
          });
      }
    }
  }
})();
