// Trang public: lọc + chia trang nhật ký tín hiệu ngay trên trình duyệt (trang tĩnh), form liên hệ mở ứng dụng email.
// Không gửi gì đi đâu, không lưu gì. Không có JS thì nhật ký hiện đủ mọi dòng, form gửi bằng mailto thường.

(function () {
  var SIZE = 20;
  document.addEventListener("DOMContentLoaded", function () {
    var box = document.getElementById("siglog");
    if (!box) return;
    var rows = Array.prototype.slice.call(box.querySelectorAll("tbody tr"));
    var pager = document.getElementById("log-pager");
    var info = document.getElementById("log-info");
    var pageEl = document.getElementById("log-page");
    var none = document.getElementById("log-none");
    var text = {};
    try { text = JSON.parse(box.getAttribute("data-i18n") || "{}"); } catch (e) { text = {}; }
    var f = { d: "", st: "", m: "" }, page = 1;

    function render() {
      var hit = rows.filter(function (r) {
        return (!f.d || r.getAttribute("data-d") === f.d) && (!f.st || r.getAttribute("data-st") === f.st)
          && (!f.m || r.getAttribute("data-m") === f.m);
      });
      var pages = Math.max(1, Math.ceil(hit.length / SIZE));
      page = Math.min(Math.max(1, page), pages);
      var a = (page - 1) * SIZE;
      rows.forEach(function (r) { r.hidden = true; });
      hit.slice(a, a + SIZE).forEach(function (r) { r.hidden = false; });
      if (none) none.hidden = hit.length > 0;
      if (pager) {
        pager.hidden = hit.length === 0;
        info.textContent = (text.info || "{a}–{b} / {n}").replace("{a}", hit.length ? a + 1 : 0)
          .replace("{b}", Math.min(a + SIZE, hit.length)).replace("{n}", hit.length);
        pageEl.textContent = page + " / " + pages;
        pager.querySelector('[data-step="-1"]').disabled = page <= 1;
        pager.querySelector('[data-step="1"]').disabled = page >= pages;
      }
    }
    box.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-filter] button[data-v]");
      if (b) {
        var g = b.parentNode;
        g.querySelectorAll("button").forEach(function (x) {
          x.classList.toggle("on", x === b);
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
        f[g.getAttribute("data-filter")] = b.getAttribute("data-v");
        page = 1;
        render();
        return;
      }
      var s = ev.target.closest("[data-step]");
      if (s && !s.disabled) {
        page += Number(s.getAttribute("data-step"));
        render();
        box.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    box.addEventListener("change", function (ev) {
      var k = ev.target.getAttribute("data-filter");
      if (!k) return;
      f[k] = ev.target.value;
      page = 1;
      render();
    });
    render();
  });
})();

// Form liên hệ: ghép tiêu đề + nội dung rồi mở mailto. Không có máy chủ nào nhận dữ liệu.
document.addEventListener("submit", function (ev) {
  var form = ev.target;
  if (form.id !== "mailform") return;
  ev.preventDefault();
  var get = function (n) { var el = form.elements[n]; return el ? String(el.value || "").trim() : ""; };
  var topic = get("topic");
  var lines = [get("body"), "", "—", get("name"), get("reply")].filter(function (x, i) { return i < 3 || x; });
  var subject = (form.getAttribute("data-subject") || "{topic}").replace("{topic}", topic);
  location.href = "mailto:" + form.getAttribute("data-email") + "?subject=" + encodeURIComponent(subject)
    + "&body=" + encodeURIComponent(lines.join("\n"));
});
