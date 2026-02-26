const scaleDateStr = "2026-03-25";

const [year, month, day] = scaleDateStr.split("-").map(Number);
const scaleStart = new Date(year, month - 1, day);
scaleStart.setHours(0, 0, 0, 0);
const scaleEnd = new Date(year, month - 1, day);
scaleEnd.setHours(23, 59, 59, 999);

const scaleStartTime = scaleStart.getTime();
const scaleEndTime = scaleEnd.getTime();

// Input from database:
const inputStart = "2026-03-25T00:59";
const inputEnd = "2026-03-25T12:59";

const startISO = new Date(inputStart).toISOString();
const endISO = new Date(inputEnd).toISOString();

const uStartObj = new Date(startISO);
uStartObj.setHours(0, 0, 0, 0); // Ignore time, lock to start of day
const uStart = uStartObj.getTime();

const uEndObj = new Date(endISO);
uEndObj.setHours(23, 59, 59, 999); // Ignore time, lock to end of day
const uEnd = uEndObj.getTime();

const overlap = scaleStartTime <= uEnd && scaleEndTime >= uStart;

console.log({
  overlap,
});
