const computeDeadline = (weekNumber: number | null, batchDate?: string) => {
  if (!weekNumber) return null;

  // Use provided batchDate or fallback to active batch start date
  const dateStr = batchDate || activeBatch?.start_date;
  if (!dateStr) return null;

  // Normalize date string
  let start: Date;
  if (dateStr.includes("/")) { // MM/DD/YYYY
    const [month, day, year] = dateStr.split("/").map(Number);
    start = new Date(year, month - 1, day);
  } else if (dateStr.includes("-")) { // MM-DD-YYYY or YYYY-MM-DD
    const parts = dateStr.split("-").map(Number);
    if (parts[0] > 31) { // assume YYYY-MM-DD
      start = new Date(parts[0], parts[1] - 1, parts[2]);
    } else { // MM-DD-YYYY
      start = new Date(parts[2], parts[0] - 1, parts[1]);
    }
  } else {
    start = new Date(dateStr); // fallback for ISO format
  }

  start.setDate(start.getDate() + (weekNumber - 1) * 7); // Week 1 = start date
  return start.toISOString();
};
