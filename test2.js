const serviceType = "Noite";
const scaleDateStr = "2026-03-25";

const [year, month, day] = scaleDateStr.split("-").map(Number);
const scaleStart = new Date(year, month - 1, day);
const scaleEnd = new Date(year, month - 1, day);

if (serviceType === "Manhã") {
  scaleStart.setHours(8, 0, 0); // 08:00
  scaleEnd.setHours(12, 0, 0); // 12:00
} else if (serviceType === "Noite") {
  scaleStart.setHours(18, 0, 0); // 18:00
  scaleEnd.setHours(21, 30, 0); // 21:30
} else {
  // Especial: consider the whole day
  scaleStart.setHours(0, 0, 0);
  scaleEnd.setHours(23, 59, 59);
}

const scaleStartTime = scaleStart.getTime();
const scaleEndTime = scaleEnd.getTime();

// Fake local unavailability input
const inputStart = "2026-03-25T00:59";
const inputEnd = "2026-03-25T12:59";

// Server action creates UTC iso string:
const startISO = new Date(inputStart).toISOString();
const endISO = new Date(inputEnd).toISOString();

const uStart = new Date(startISO).getTime();
const uEnd = new Date(endISO).getTime();

const overlap = scaleStartTime < uEnd && scaleEndTime > uStart;

console.log({
  scaleStartTime: new Date(scaleStartTime).toLocaleString(),
  scaleEndTime: new Date(scaleEndTime).toLocaleString(),
  unavailStart: new Date(uStart).toLocaleString(),
  unavailEnd: new Date(uEnd).toLocaleString(),
  overlap,
});
