const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");

document.querySelectorAll(".demo-action").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    alert("Esta es una demo de prueba");
  });
});

toggle?.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".main-nav a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle?.setAttribute("aria-expanded", "false");
  });
});

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- Reserva con pago por Mercado Pago ---------- */

const PRICES = { weekday: 50000, weekend: 100000 };
const WEEKEND_DAYS = [0, 6]; // 0 = domingo, 6 = sábado. Sumá 5 para incluir el viernes.

const form = document.getElementById("reserve-form");
const dateInput = document.getElementById("fecha");
const priceBox = document.getElementById("price-box");
const calendarDays = document.getElementById("calendar-days");
const calendarMonth = document.getElementById("calendar-month");
const calendarYear = document.getElementById("calendar-year");
const dialog = document.getElementById("pay-dialog");
const servicioSelect = document.getElementById("servicio");
const peloteroNotice = document.getElementById("pelotero-notice");

servicioSelect?.addEventListener("change", () => {
  peloteroNotice.hidden = servicioSelect.value !== "Quincho + Pelotero";
});

const money = n => "$ " + new Intl.NumberFormat("es-AR").format(n);

function priceFor(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay(); // fecha local, sin desfase de zona horaria
  const weekend = WEEKEND_DAYS.includes(day);
  return {
    type: weekend ? "weekend" : "weekday",
    amount: weekend ? PRICES.weekend : PRICES.weekday,
    label: weekend ? "fin de semana" : "entre semana"
  };
}

function prettyDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
}

if (dateInput && calendarDays) {
  const today = new Date();
  const todayValue = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, "0"), String(today.getDate()).padStart(2, "0")].join("-");
  let visibleMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  function renderCalendar() {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendarMonth.textContent = visibleMonth.toLocaleDateString("es-AR", { month: "long" });
    calendarYear.textContent = year;
    calendarDays.replaceChildren();

    for (let blank = 0; blank < firstWeekday; blank += 1) {
      const spacer = document.createElement("span");
      spacer.className = "calendar-empty";
      spacer.setAttribute("aria-hidden", "true");
      calendarDays.append(spacer);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const value = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const button = document.createElement("button");
      button.className = "calendar-day";
      button.type = "button";
      button.textContent = day;
      button.disabled = value < todayValue;
      button.setAttribute("aria-label", new Date(year, month, day).toLocaleDateString("es-AR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
      }));
      button.setAttribute("aria-pressed", String(dateInput.value === value));
      if (dateInput.value === value) button.classList.add("is-selected");
      button.addEventListener("click", () => {
        dateInput.value = value;
        dateInput.dispatchEvent(new Event("input", { bubbles: true }));
      });
      calendarDays.append(button);
    }
  }

  document.querySelectorAll("[data-month-step]").forEach(button => {
    button.addEventListener("click", () => {
      visibleMonth.setMonth(visibleMonth.getMonth() + Number(button.dataset.monthStep));
      renderCalendar();
    });
  });

  document.querySelectorAll("[data-year-step]").forEach(button => {
    button.addEventListener("click", () => {
      visibleMonth.setFullYear(visibleMonth.getFullYear() + Number(button.dataset.yearStep));
      renderCalendar();
    });
  });

  dateInput.addEventListener("input", () => {
    const p = priceFor(dateInput.value);
    priceBox.innerHTML = p
      ? `Precio (${p.label}): <strong>${money(p.amount)}</strong>`
      : "Elegí una fecha para ver el precio.";
    renderCalendar();
  });

  renderCalendar();
}

form?.addEventListener("submit", e => {
  e.preventDefault();
  const p = priceFor(dateInput.value);
  if (!p) return;

  const data = Object.fromEntries(new FormData(form));
  const withPelotero = data.servicio === "Quincho + Pelotero";

  document.getElementById("pay-summary").textContent = withPelotero
    ? `${prettyDate(data.fecha)}${data.hora ? ", " + data.hora + " hs" : ""}. Incluye Quincho + Pelotero: el monto exacto figura en Mercado Pago.`
    : `${prettyDate(data.fecha)}${data.hora ? ", " + data.hora + " hs" : ""}. Total a pagar: ${money(p.amount)}.`;

  document.getElementById("qr").textContent = "Pago desactivado en esta demo.";

  dialog.showModal();
});

document.getElementById("pay-close")?.addEventListener("click", () => dialog.close());
dialog?.addEventListener("click", e => { if (e.target === dialog) dialog.close(); });
