// Giao diện sáng / tối. Nạp trong <head> (không defer) để không nháy màu lúc tải trang.
// Chưa chọn: theo máy (prefers-color-scheme). Đã chọn: lưu localStorage, đặt data-theme trên <html>.
(function () {
  var KEY = "smt-theme";
  var root = document.documentElement;
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* trình duyệt chặn bộ nhớ: theo máy */ }
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  function current() {
    var t = root.getAttribute("data-theme");
    if (t) return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function label(btn) {
    var dark = current() === "dark";
    // Trang public (VI / EN) đặt chữ trên nút: data-to-light / data-to-dark.
    var text = dark ? (btn.getAttribute("data-to-light") || "Chuyển sang giao diện sáng")
      : (btn.getAttribute("data-to-dark") || "Chuyển sang giao diện tối");
    btn.setAttribute("aria-label", text);
    btn.setAttribute("title", text);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("theme-btn");
    if (!btn) return;
    label(btn);
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* không lưu được thì chỉ đổi cho trang này */ }
      label(btn);
    });
  });
})();

// Menu bên thu gọn (chỉ còn icon) / mở. Nhớ trong localStorage, đặt data-nav="mini" trên <html> trước khi vẽ trang.
(function () {
  var KEY = "smt-nav";
  var root = document.documentElement;
  try { if (localStorage.getItem(KEY) === "mini") root.setAttribute("data-nav", "mini"); } catch (e) { /* bỏ qua */ }
  // Bắt sự kiện ở document: nút nằm ở đầu trang, bị thay mới khi chuyển trong trang (app.js).
  function sync() {
    var btn = document.getElementById("nav-btn");
    if (btn) btn.setAttribute("aria-expanded", root.getAttribute("data-nav") === "mini" ? "false" : "true");
  }
  document.addEventListener("DOMContentLoaded", sync);
  document.addEventListener("smt:swap", sync);
  document.addEventListener("click", function (ev) {
    if (!ev.target.closest("#nav-btn")) return;
    var mini = root.getAttribute("data-nav") !== "mini";
    if (mini) root.setAttribute("data-nav", "mini"); else root.removeAttribute("data-nav");
    try { localStorage.setItem(KEY, mini ? "mini" : "full"); } catch (e) { /* chỉ đổi cho trang này */ }
    sync();
  });
})();
