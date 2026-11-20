// Hành vi chung của mọi trang. Không dùng script inline: CSP script-src 'self'.

// Nút "Tải lại": tải lại trang, web đọc lại file của bot (cache theo thời điểm sửa file) và lấy giá mark mới.
document.addEventListener("click", function (ev) {
  var btn = ev.target.closest("#reload-btn");
  if (btn) { btn.classList.add("spin"); location.reload(); }
});

// Nút sao chép mã lệnh (data-copy).
document.addEventListener("click", function (ev) {
  var btn = ev.target.closest("[data-copy]");
  if (!btn) return;
  var text = btn.getAttribute("data-copy");
  var done = function () {
    var old = btn.textContent;
    btn.textContent = "Đã sao chép";
    setTimeout(function () { btn.textContent = old; }, 1500);
  };
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
});

// Phím "/" đưa con trỏ vào ô tìm mã ở menu bên.
document.addEventListener("keydown", function (ev) {
  if (ev.key !== "/" || ev.ctrlKey || ev.metaKey || ev.altKey) return;
  var t = ev.target;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
  var box = document.getElementById("jump");
  if (box) { ev.preventDefault(); box.focus(); }
});

// Hộp số trên biểu đồ: .chart-wrap[data-tip] = JSON [{x: 0..1, t: tiêu đề, r: [[nhãn, giá trị], ...]}].
// Di chuột (hoặc chạm, kéo ngang trên điện thoại) -> đường dọc + hộp số của điểm gần nhất.
(function () {
  function points(wrap) {
    if (wrap._pts === undefined) {
      try { wrap._pts = JSON.parse(wrap.getAttribute("data-tip") || "[]"); } catch (e) { wrap._pts = []; }
    }
    return wrap._pts;
  }
  function show(wrap, clientX) {
    var pts = points(wrap);
    var svg = wrap.querySelector("svg");
    if (!pts.length || !svg) return;
    var box = svg.getBoundingClientRect();
    var f = (clientX - box.left) / box.width;
    if (f < -0.02 || f > 1.02) { hide(wrap); return; }
    var best = pts[0];
    for (var i = 1; i < pts.length; i++) if (Math.abs(pts[i].x - f) < Math.abs(best.x - f)) best = pts[i];
    var wb = wrap.getBoundingClientRect();
    var x = box.left - wb.left + best.x * box.width;
    var lineEl = wrap.querySelector(".chartline");
    var tip = wrap.querySelector(".charttip");
    lineEl.style.left = x + "px";
    lineEl.classList.add("on");
    tip.textContent = "";
    var b = document.createElement("b");
    b.textContent = best.t;
    tip.appendChild(b);
    (best.r || []).forEach(function (row) {
      var d = document.createElement("div");
      var k = document.createElement("span");
      var v = document.createElement("span");
      k.textContent = row[0];
      v.textContent = row[1];
      d.appendChild(k);
      d.appendChild(v);
      tip.appendChild(d);
    });
    tip.classList.add("on");
    var tw = tip.offsetWidth;
    var left = x + 12;
    if (left + tw > wb.width) left = Math.max(0, x - tw - 12);
    tip.style.left = left + "px";
    tip.style.top = "8px";
  }
  function hide(wrap) {
    var l = wrap.querySelector(".chartline");
    var t = wrap.querySelector(".charttip");
    if (l) l.classList.remove("on");
    if (t) t.classList.remove("on");
  }
  document.addEventListener("pointermove", function (ev) {
    var wrap = ev.target.closest && ev.target.closest(".chart-wrap[data-tip]");
    document.querySelectorAll(".chart-wrap .charttip.on").forEach(function (t) {
      var w = t.parentNode;
      if (w !== wrap) hide(w);
    });
    if (wrap) show(wrap, ev.clientX);
  });
  document.addEventListener("pointerdown", function (ev) {
    var wrap = ev.target.closest && ev.target.closest(".chart-wrap[data-tip]");
    if (wrap) show(wrap, ev.clientX);
  });
  document.addEventListener("pointerleave", function (ev) {
    if (ev.target.classList && ev.target.classList.contains("chart-wrap")) hide(ev.target);
  }, true);
})();

// "Xem gần đây" ở menu bên: trang có <meta name="smt-recent" content="nhãn|đường dẫn"> (trang mã, lệnh đang xem)
// được nhớ trong localStorage của trình duyệt này, tối đa 5 mục. Chặn bộ nhớ thì chỉ không hiện danh sách.
(function () {
  var KEY = "smt-recent";
  function load() {
    try { var x = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(x) ? x : []; } catch (e) { return []; }
  }
  document.addEventListener("DOMContentLoaded", function () {
    var list = load();
    var meta = document.querySelector('meta[name="smt-recent"]');
    if (meta) {
      var parts = (meta.getAttribute("content") || "").split("|");
      if (parts.length === 2 && parts[1].charAt(0) === "/") {
        list = list.filter(function (it) { return it.h !== parts[1]; });
        list.unshift({ l: parts[0], h: parts[1] });
        list = list.slice(0, 5);
        try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* không lưu được: bỏ qua */ }
      }
    }
    var ul = document.getElementById("recent");
    if (!ul || !list.length) return;
    ul.textContent = "";
    list.forEach(function (it) {
      if (typeof it.h !== "string" || it.h.charAt(0) !== "/" || it.h.charAt(1) === "/") return;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = it.h;
      a.textContent = String(it.l || it.h).slice(0, 40);
      li.appendChild(a);
      ul.appendChild(li);
    });
  });
})();

// Chọn nhanh trong form (nút data-set="tên ô|giá trị" đặt giá trị cho ô rồi gửi form) — dùng ở bộ lọc dạng nút.
document.addEventListener("click", function (ev) {
  var b = ev.target.closest("[data-set]");
  if (!b) return;
  var parts = b.getAttribute("data-set").split("|");
  var form = b.closest("form");
  if (!form || parts.length !== 2) return;
  var input = form.querySelector('[name="' + parts[0] + '"]');
  if (!input) return;
  ev.preventDefault();
  input.value = parts[1];
  if (form.requestSubmit) form.requestSubmit(); else form.submit();
});

// Trang Cài đặt: nút +/− (data-stepper="khoá|bước"), chọn nhanh (data-setval="khoá|giá trị"), dòng "Sẽ đổi" và tác động.
(function () {
  function input(key) { return document.querySelector('[data-config-key="' + key + '"]'); }
  function fmt(x) { return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function refresh(key) {
    var el = input(key);
    if (!el) return;
    var oldv = null;
    try { oldv = JSON.parse(el.getAttribute("data-config-old")); } catch (e) { oldv = null; }
    var v = Number(el.value);
    var changed = el.value !== "" && oldv !== null && v !== Number(oldv);
    var diff = document.querySelector('[data-diff="' + key + '"]');
    if (diff) diff.textContent = changed ? (el.getAttribute("data-config-label") + " " + oldv + " → " + v) : "chưa đổi";
    var save = document.querySelector('[data-config-submit="' + key + '"]');
    if (save) save.disabled = !changed || el.disabled;
    document.querySelectorAll('[data-pick="' + key + '"]').forEach(function (b) {
      b.classList.toggle("on", Number(b.getAttribute("data-v")) === v);
    });
    var imp = document.querySelector('[data-impact="' + key + '"]');
    if (imp && el.value !== "") {
      if (imp.getAttribute("data-kind") === "risk") {
        var w = Number(imp.getAttribute("data-wallet")), n = Number(imp.getAttribute("data-max")) || 40;
        imp.textContent = (w ? "1 lệnh SL ≈ " + (v / w * 100).toFixed(1) + "% vốn " + fmt(w) + " · " : "")
          + n + " lệnh cùng dính SL ≈ −" + fmt(v * n) + " USDT";
      } else {
        var nt = Number(imp.getAttribute("data-notional"));
        imp.textContent = nt && v ? "Ký quỹ 1 lệnh trung vị ≈ " + fmt(nt / v) + " USDT ở " + v + "x" : "";
      }
    }
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-stepper], [data-setval]");
    if (!b || b.disabled) return;
    var spec = (b.getAttribute("data-stepper") || b.getAttribute("data-setval")).split("|");
    var el = input(spec[0]);
    if (!el || el.disabled) return;
    var v = b.hasAttribute("data-stepper") ? Number(el.value || 0) + Number(spec[1]) : Number(spec[1]);
    var lo = el.min === "" ? -Infinity : Number(el.min), hi = el.max === "" ? Infinity : Number(el.max);
    el.value = String(Math.min(hi, Math.max(lo, Math.round(v * 100) / 100)));
    refresh(spec[0]);
  });
  document.addEventListener("input", function (ev) {
    var k = ev.target.getAttribute && ev.target.getAttribute("data-config-key");
    if (k) refresh(k);
  });
  function all() {
    document.querySelectorAll("[data-config-key]").forEach(function (el) { refresh(el.getAttribute("data-config-key")); });
  }
  document.addEventListener("DOMContentLoaded", all);
  document.addEventListener("smt:swap", all);
})();

// Bộ chọn tháng (details.picker): bấm ra ngoài hoặc Esc thì đóng.
document.addEventListener("click", function (ev) {
  document.querySelectorAll("details.picker[open]").forEach(function (d) {
    if (!d.contains(ev.target)) d.removeAttribute("open");
  });
});
document.addEventListener("keydown", function (ev) {
  if (ev.key !== "Escape") return;
  document.querySelectorAll("details.picker[open]").forEach(function (d) {
    d.removeAttribute("open");
    var s = d.querySelector("summary");
    if (s) s.focus();
  });
});

// Chuyển trong cùng trang không tải lại cả trang: nút chọn, phân trang, ô lịch / lưới tháng, form lọc lấy trang mới
// bằng fetch rồi chỉ thay phần đầu trang + nội dung (#page), giữ vị trí cuộn, cập nhật URL (Back / gửi link vẫn đúng).
// Lỗi gì cũng quay về tải trang thường. Thanh #loadbar chạy cả khi chuyển sang trang khác.
(function () {
  var SOFT = ".seg a, .pager a, .uline a, .pick-grid a, .cal a.day, .heat-grid a.cell, a[data-soft]";
  var bar = null, timer = null;
  function barStart() {
    bar = bar || document.getElementById("loadbar");
    if (!bar) return;
    clearTimeout(timer);
    bar.className = "";
    void bar.offsetWidth;                       // cho trình duyệt vẽ lại từ 0 rồi mới chạy
    bar.className = "run";
  }
  function barDone() {
    if (!bar) return;
    bar.className = "done";
    timer = setTimeout(function () { bar.className = ""; }, 600);
  }
  function swap(doc) {
    var page = document.getElementById("page");
    var next = doc.getElementById("page");
    if (!page || !next) return false;
    [".pagehead", ".subnav"].forEach(function (sel) {
      var a = document.querySelector(sel), b = doc.querySelector(sel);
      if (a && b) a.replaceWith(b);
    });
    page.replaceWith(next);
    next.classList.add("enter");
    document.title = doc.title;
    var meta = doc.querySelector('meta[name="smt-recent"]'), cur = document.querySelector('meta[name="smt-recent"]');
    if (cur) cur.remove();
    if (meta) document.head.appendChild(meta);
    if (window.htmx) window.htmx.process(next);
    document.dispatchEvent(new CustomEvent("smt:swap"));
    return true;
  }
  function go(url, push, jump) {
    var page = document.getElementById("page");
    if (page) page.classList.add("busy");
    barStart();
    fetch(url, { credentials: "same-origin", headers: { "X-SMT-Soft": "1" } })
      .then(function (r) {
        if (!r.ok || new URL(r.url).pathname !== new URL(url, location.href).pathname) throw new Error("full");
        return r.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        if (push) history.pushState({ smt: 1 }, "", url);
        if (!swap(doc)) throw new Error("full");
        var h = new URL(url, location.href).hash;
        if (jump && h) {
          var el = document.getElementById(h.slice(1));
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        barDone();
      })
      .catch(function () { location.href = url; });
  }
  function sameOrigin(a) {
    return a.origin === location.origin && !a.target && !a.hasAttribute("download");
  }
  document.addEventListener("click", function (ev) {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    var a = ev.target.closest("a[href]");
    if (!a || !sameOrigin(a) || a.getAttribute("href").charAt(0) === "#" || a.hasAttribute("hx-get")) return;
    if (a.matches(SOFT) && a.pathname === location.pathname && !a.closest("details:not(.picker)")) {
      ev.preventDefault();
      var d = a.closest("details.picker");
      if (d) d.removeAttribute("open");
      go(a.href, true, a.closest(".heat-grid") !== null || a.hasAttribute("data-jump"));
      return;
    }
    barStart();                                 // sang trang khác: tải thường, vẫn có thanh chạy
  });
  document.addEventListener("submit", function (ev) {
    var f = ev.target;
    if (ev.defaultPrevented || !f.matches("form.filters") || (f.method || "get").toLowerCase() !== "get") {
      if (!ev.defaultPrevented) barStart();
      return;
    }
    var url = new URL(f.getAttribute("action") || location.pathname, location.href);
    var q = new URLSearchParams();
    new FormData(f).forEach(function (v, k) { if (v !== "") q.append(k, v); });
    url.search = q.toString();
    if (url.pathname !== location.pathname) return;
    ev.preventDefault();
    go(url.toString(), true, false);
  });
  history.replaceState({ smt: 1 }, "", location.href);
  window.addEventListener("popstate", function (ev) {
    if (ev.state && ev.state.smt) go(location.href, false, false);
  });
  window.addEventListener("pageshow", function () { barDone(); });
})();
