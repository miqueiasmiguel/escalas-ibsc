const [year, month, day] = "2026-02-27".split("-").map(Number);
const serviceType = "Noite";

const scaleStart = new Date(year, month - 1, day);
const scaleEnd = new Date(year, month - 1, day);

if (serviceType === "Manhã") {
  scaleStart.setHours(8, 0, 0); // 08:00
  scaleEnd.setHours(12, 0, 0); // 12:00
} else if (serviceType === "Noite") {
  scaleStart.setHours(18, 0, 0); // 18:00
  scaleEnd.setHours(21, 30, 0); // 21:30
} else {
  scaleStart.setHours(0, 0, 0);
  scaleEnd.setHours(23, 59, 59);
}

const scaleStartTime = scaleStart.getTime();
const scaleEndTime = scaleEnd.getTime();

// Fake local unavailability input by user at 18:00 to 22:00
const inputStart = "2026-02-27T18:00";
const inputEnd = "2026-02-27T22:00";

// Server action creates UTC iso string:
const startISO = new Date(inputStart).toISOString();
const endISO = new Date(inputEnd).toISOString();

console.log("Start ISO:", startISO);
console.log("End ISO:", endISO);

const uStart = new Date(startISO).getTime();
const uEnd = new Date(endISO).getTime();

const overlap = scaleStartTime < uEnd && scaleEndTime > uStart;

console.log("Overlap:", overlap);
console.log("scaleStartTime:", new Date(scaleStartTime).toISOString());
console.log("uStart:", new Date(uStart).toISOString());
