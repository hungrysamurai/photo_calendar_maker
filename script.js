const daysGrid = document.querySelector("#days-grid");

const dayCellWidth = 25;
const dayCellHeight = 15;

function createDay(x, y, cellNumber) {
  let dayGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

  dayGroup.setAttribute("width", dayCellWidth);
  dayGroup.setAttribute("height", dayCellHeight);
  dayGroup.setAttribute("id", `day-${cellNumber}-cell`);
  dayGroup.innerHTML = `
     <rect x="${x}" y="${y}" width="${dayCellWidth}" height="${dayCellHeight}"
            style="fill: none; stroke: #939598; stroke-miterlimit: 10; stroke-width: .5px;"></rect>

      <text
        transform="translate(${x + dayCellWidth / 2} ${
    y + dayCellHeight / 2 + 0.5
  })"
        style="fill: #231f20; font-family: Poppins, 'Poppins'; font-size: 7px; font-weight: 700"
      >
    
      </text>;
    `;
  return dayGroup;
}

function createDaysGrid(startIndex, totalDays, prevMonthDaysNumber) {
  let x = 8.25;
  let y = 37;

  let currentDayIndex = startIndex;
  let prevMonthDaysCount = prevMonthDaysNumber;
  // let lastCell;

  // Set empty grid
  for (let i = 1; i < 43; i++) {
    if (i % 7 !== 0) {
      daysGrid.appendChild(createDay(x, y, i));
      x += dayCellWidth;
    } else {
      daysGrid.appendChild(createDay(x, y, i));
      x = 8.25;
      y += dayCellHeight;
    }
  }

  // Set days digits in cells
  for (let i = 1; i < totalDays + 1; i++) {
    daysGrid.querySelectorAll("g text")[currentDayIndex].textContent = i;
    currentDayIndex++;
    // if (i === totalDays) {
    //   lastCell = daysGrid.querySelectorAll("g")[currentDayIndex];
    // }
  }

  // Prepend previous month
  if (startIndex !== 0) {
    for (let i = startIndex - 1; i >= 0; i--) {
      daysGrid.querySelectorAll("g text")[i].textContent = prevMonthDaysCount;
      prevMonthDaysCount--;

      daysGrid
        .querySelectorAll("g text")
        [i].setAttribute(
          "style",
          `fill: #999999; font-family: Poppins, 'Poppins'; font-size: 7px; font-weight: 400""`
        );
    }
  }

  // Extend on next month
  if (currentDayIndex <= 42) {
    for (let i = 1; currentDayIndex < 42; currentDayIndex++) {
      daysGrid.querySelectorAll("g text")[currentDayIndex].textContent = i;
      daysGrid
        .querySelectorAll("g text")
        [currentDayIndex].setAttribute(
          "style",
          `fill: #999999; font-family: Poppins, 'Poppins'; font-size: 7px; font-weight: 400""`
        );
      i++;
    }
  }
}

const getButton = document.querySelector("#get-button");
const monthInput = document.querySelector("#month-input");
const yearInput = document.querySelector("#year-input");

const monthEl = document.querySelector("#month-title");
const yearEl = document.querySelector("#year-title");

getButton.addEventListener("click", (e) => {
  const year = +yearInput.value;
  const month = +monthInput.value;

  yearEl.textContent = yearInput.value;
  monthEl.textContent =
    monthInput.options[monthInput.selectedIndex].dataset.name;

  createDaysGrid(
    getFirstDay(month - 1, year).getDay() - 1,
    daysInMonth(month, year),
    daysInMonth(month - 1, year)
  );
});

// function getDaysInMonth(month, year) {
//   var date = new Date(year, month, 1);
//   console.log(date.getMonth());
//   var days = [];
//   while (date.getMonth() === month) {
//     days.push(new Date(date));
//     date.setDate(date.getDate() + 1);
//   }
//   return days;
// }
// console.log(getDaysInMonth(3, 2018));
function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function getFirstDay(month, year) {
  return new Date(year, month, 1);
}

// console.log();
// console.log();
// console.log(daysInMonth(6, 2018));
