// SVR ONE site interactions:
// mobile nav, scroll reveal, animated counters, FAQ accordion,
// header shadow, footer year, 3D tilt, magnetic buttons,
// cursor glow, scroll progress, GSAP entrance + parallax.
(function () {
  "use strict";

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Header shadow + scroll progress
  var header = document.querySelector(".site-header");
  var progress = document.querySelector(".scroll-progress");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 12);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Reveal on scroll
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  // Animated counters
  var counters = document.querySelectorAll(".count[data-count]");
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduceMotion) { el.textContent = target; return; }
    var dur = 900, start = null;
    function frame(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  if ("IntersectionObserver" in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // FAQ accordion (single open)
  document.querySelectorAll(".acc-item").forEach(function (item) {
    var btn = item.querySelector(".acc-btn");
    var panel = item.querySelector(".acc-panel");
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".acc-item.open").forEach(function (other) {
        other.classList.remove("open");
        other.querySelector(".acc-panel").style.maxHeight = null;
        other.querySelector(".acc-btn").setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        panel.style.maxHeight = panel.scrollHeight + "px";
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  // 3D tilt on cards (desktop, no reduced motion)
  if (finePointer && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var strength = parseFloat(card.getAttribute("data-tilt")) || 8;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -strength;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * strength;
        card.style.transform =
          "perspective(950px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-4px)";
        // spotlight position for bento cards
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });

    // Magnetic buttons
    document.querySelectorAll(".magnetic").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.16;
        var y = (e.clientY - r.top - r.height / 2) * 0.26;
        btn.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.transform = "";
      });
    });

    // Cursor glow follows the pointer
    var glow = document.querySelector(".cursor-glow");
    if (glow) {
      var gx = -600, gy = -600, cx = -600, cy = -600, shown = false;
      window.addEventListener("pointermove", function (e) {
        gx = e.clientX; gy = e.clientY;
        if (!shown) { shown = true; glow.style.opacity = "1"; }
      }, { passive: true });
      (function follow() {
        cx += (gx - cx) * 0.08;
        cy += (gy - cy) * 0.08;
        glow.style.transform = "translate(" + (cx - 260) + "px," + (cy - 260) + "px)";
        requestAnimationFrame(follow);
      })();
    }
  }

  // GSAP: hero entrance + scroll parallax (progressive enhancement)
  function gsapIntro() {
    if (!window.gsap || reduceMotion) return;
    try {
      gsap.from(".hero-anim", {
        y: 34, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.12, delay: 0.15,
        clearProps: "transform,opacity",
      });
      if (window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        gsap.utils.toArray("[data-parallax]").forEach(function (el) {
          gsap.fromTo(el, { yPercent: -8 }, {
            yPercent: 8, ease: "none",
            scrollTrigger: { trigger: el.closest("figure, section") || el, start: "top bottom", end: "bottom top", scrub: true },
          });
        });
        gsap.utils.toArray(".eyebrow").forEach(function (el) {
          gsap.from(el, {
            x: -18, opacity: 0, duration: 0.7, ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });
      }
    } catch (err) { /* keep the static site usable */ }
  }
  if (document.readyState === "complete") gsapIntro();
  else window.addEventListener("load", gsapIntro);

  // Footer year
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
