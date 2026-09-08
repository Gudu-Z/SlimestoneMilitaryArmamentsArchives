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
})();
