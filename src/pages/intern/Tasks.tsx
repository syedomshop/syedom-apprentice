// computeDeadline.ts
export const computeDeadline = (weekNumber: number | null, batchStartDate?: string) => {
  if (!weekNumber || !batchStartDate) return null;

  let start: Date;

  // Flexible date parsing
  if (batchStartDate.includes("/")) {
    // MM/DD/YYYY
    const [month, day, year] = batchStartDate.split("/").map(Number);
    start = new Date(year, month - 1, day);
  } else if (batchStartDate.includes("-")) {
    // MM-DD-YYYY or YYYY-MM-DD
    const parts = batchStartDate.split("-").map(Number);
    if (parts[0] > 31) {
      // YYYY-MM-DD
      start = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      // MM-DD-YYYY
      start = new Date(parts[2], parts[0] - 1, parts[1]);
    }
  } else {
    // fallback for ISO or unknown format
    start = new Date(batchStartDate);
  }

  // Add week offset (Week 1 = start date)
  start.setDate(start.getDate() + (weekNumber - 1) * 7);

  return start.toISOString();
};
