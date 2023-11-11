import { getMonthsList } from "../getMonthsList";

export const createMonthsOptions = (): string => {
  const monthsList = getMonthsList();
  const currentMonth = new Date().getMonth();

  return monthsList
    .map((monthName, i) => {
      return `<option value="${i}" data-name="${monthName}" ${
        i === currentMonth ? "selected" : ""
      }>${monthName}</option>`;
    })
    .join("");
};
