import encodedFonts from "./fonts.js";

let daysGrid;
const dayCellWidth = 25;
const dayCellHeight = 15;

function createMonthGrid(startIndex, totalDays, prevMonthDaysNumber) {
  let x = 12;
  let y = 195.8;

  let currentDayIndex = startIndex;
  let prevMonthDaysCount = prevMonthDaysNumber;
  // let lastCell;

  // Set empty grid
  for (let i = 1; i < 43; i++) {
    if (i % 7 !== 0) {
      daysGrid.appendChild(createDayCell(x, y, i));
      x += dayCellWidth;
    } else {
      daysGrid.appendChild(createDayCell(x, y, i));
      x = 12;
      y += dayCellHeight;
    }
  }

  // Set days digits in cells
  for (let i = 1; i < totalDays + 1; i++) {
    daysGrid.querySelectorAll("g text")[currentDayIndex].textContent = i;
    currentDayIndex++;
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
        `fill: #999999; font-family: Poppins-Regular; font-size: 7px; font-weight: 400; text-anchor: middle;
    dominant-baseline: middle;`
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
        `fill: #999999; font-family: Poppins-Regular; font-size: 7px; font-weight: 400; text-anchor: middle;
    dominant-baseline: middle;`
      );
      i++;
    }
  }
}

function createDayCell(x, y, cellNumber) {

  let dayGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");

  dayGroup.setAttribute("width", dayCellWidth);
  dayGroup.setAttribute("height", dayCellHeight);
  dayGroup.setAttribute("id", `day-${cellNumber}-cell`);
  dayGroup.innerHTML = `
     <rect x="${x}" y="${y}" width="${dayCellWidth}" height="${dayCellHeight}"
            style="fill: none; stroke: #999999; stroke-miterlimit: 10; stroke-width: .5px;"></rect>

      <text
        transform="translate(${x + dayCellWidth / 2} 
        ${y + dayCellHeight / 2 + 0.5})"

        style="fill: #231f20; font-family: Poppins-Bold; font-size: 7px; font-weight: 700; text-anchor: middle;
        dominant-baseline: middle;"
      >

      </text>;
    `;
  return dayGroup;
}


const getButton = document.querySelector("#get-button");
const monthInput = document.querySelector("#month-input");
const yearInput = document.querySelector("#year-input");

const monthContainer = document.querySelector(".calendar-container");

getButton.addEventListener("click", () => {
  const year = +yearInput.value;
  const month = +monthInput.value;

  monthContainer.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300">

  <defs>
    <style type="text/css">
      @font-face {
        font-family: Poppins-Bold;
        src: url('${encodedFonts.PoppinsBold}')
      }
      @font-face {
        font-family: Poppins-Regular;
        src: url('${encodedFonts.PoppinsRegular}')
      }
    </style>
  </defs>
      
        <rect
          id="background-rect"
          width="200"
          height="300"
          style="fill: #fff"
        />
   
        <g id="days-grid"></g>
        
        <g id="text-group">

          <text
            id="month-title"
            transform="translate(30 183)"
            style="
              isolation: isolate;
              font-size: 14px;
              fill: #231f20;
              font-family: Poppins-Bold;">
              April
          </text>

          <text
            id="year-title"
            transform="translate(140 183)"
            style="
              isolation: isolate;
              font-size: 12px;
              fill: #231f20;
              font-family: Poppins-Bold;">
            2020
          </text>

          <g id="days-titles">
            <text
              transform="translate(17.72 192.79)"
              style="
                isolation: isolate;
                font-size: 3.3px;
                fill: #231f20;
                font-family: Poppins-Bold;">
              Monday
            </text>
            <text
              transform="translate(42.72 192.79)"
              style="
                isolation: isolate;
                font-size: 3.3px;
                fill: #231f20;
                font-family: Poppins-Bold;">
              Tuesday
            </text>
            <text
              transform="translate(64.72 192.79)"
              style="
                isolation: isolate;
                font-size: 3.3px;
                fill: #231f20;
                font-family: Poppins-Bold;">
              Wednesday
            </text>
            <text
              transform="translate(91.72 192.79)"
              style="
                isolation: isolate;
                font-size: 3.3px;
                fill: #231f20;
                font-family: Poppins-Bold;">
              Thursday
            </text>
            <text
              transform="translate(119.72 192.79)"
              style="
                isolation: isolate;
                font-size: 3.3px;
                fill: #231f20;
                font-family: Poppins-Bold;">
              Friday
            </text>
            <text
              transform="translate(142 192.79)"
              style="
                isolation: isolate;
                font-size: 3.3px;
                fill: #231f20;
                font-family: Poppins-Bold;">
              Saturday
            </text>
            <text
              transform="translate(168 192.79)"
              style="
                isolation: isolate;
                font-size: 3.3px;
                fill: #231f20;
                font-family: Poppins-Bold;">
              Sunday
            </text>
          </g>
        </g>

        <g id="image-group">
        
        <rect id="image-placeholder"
          x="10.9"
          y="11.4"
          width="178.3"
          height="150"
          style="fill: #e8e8e8"/>
        </g>

      </svg>
  `;

  const monthEl = document.querySelector("#month-title");
  const yearEl = document.querySelector("#year-title");

  yearEl.textContent = yearInput.value;
  monthEl.textContent =
    monthInput.options[monthInput.selectedIndex].dataset.name;

  daysGrid = document.querySelector("#days-grid");
  createMonthGrid(
    getFirstDay(month - 1, year) - 1,
    daysInMonth(month, year),
    daysInMonth(month - 1, year)
  );
});

function daysInMonth(month, year) {
  return new Date(year, month, 0).getDate();
}

function getFirstDay(month, year) {
  let index = new Date(year, month, 1);
  if (index.getDay() === 0) {
    return 7;
  }
  return index.getDay();
}


function uploadImg(e) {

  var reader = new FileReader();
  reader.onload = function (e) {

    const imageGroup = document.querySelector('#image-group');
    const imagePlaceholder = imageGroup.querySelector('#image-placeholder');

    const elHeight = +imagePlaceholder.getAttribute('height');
    const elWidth = +imagePlaceholder.getAttribute('width');
    const elX = +imagePlaceholder.getAttribute('x');
    const elY = +imagePlaceholder.getAttribute('y');


    imagePlaceholder.remove();

    const imageEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');

    imageEl.setAttribute('height', elHeight);
    imageEl.setAttribute('width', elWidth);
    imageEl.setAttribute('x', elX);
    imageEl.setAttribute('y', elY);

    imageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'href', e.target.result);
    // imageEl.setAttribute('clip-path', "url(#image-clip)");

    imageGroup.appendChild(imageEl);
    console.log(getComputedStyle(imageEl).transform);
    console.log(imageEl.getBoundingClientRect());

    // Here to mess with cropper
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.left = `${imageEl.getBoundingClientRect().left}px`;
    temp.style.top = `${imageEl.getBoundingClientRect().top}px`;
    temp.style.width = `${imageEl.getBoundingClientRect().width}px`;
    temp.style.height = `${imageEl.getBoundingClientRect().height}px`;


    document.body.append(temp);

  };

  reader.readAsDataURL(this.files[0]);
}

// Download
function downloadSVGAsText() {

  const svg = document.querySelector('svg');
  const base64doc = btoa(decodeURIComponent(encodeURIComponent(svg.outerHTML)));

  const a = document.createElement('a');
  const e = new MouseEvent('click');

  a.download = 'download.svg';
  a.href = 'data:image/svg+xml;base64,' + base64doc;
  a.dispatchEvent(e);
}

function downloadSVGAsPNG(e) {
  var svg = document.querySelector('svg');
  var svgData = new XMLSerializer().serializeToString(svg);

  var canvas = document.createElement("canvas");
  canvas.width = 2000;
  canvas.height = 3000;
  var ctx = canvas.getContext("2d");

  //display image
  var img = document.createElement("img");
  img.setAttribute("src", "data:image/svg+xml;base64," + btoa(svgData));


  img.onload = function () {
    ctx.drawImage(img, 0, 0);

    const dataURL = canvas.toDataURL('image/png');
    if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(canvas.msToBlob(), "download.png");
      e.preventDefault();
    } else {
      const a = document.createElement('a');
      const my_evt = new MouseEvent('click');
      a.download = 'download.png';
      a.href = dataURL;
      a.dispatchEvent(my_evt);
    }
  };
}


const downloadSvgBtn = document.querySelector('#svg-download');
const downloadPngBtn = document.querySelector('#png-download');
const uploadImgInput = document.querySelector('#upload-input');

downloadSvgBtn.addEventListener('click', downloadSVGAsText)
downloadPngBtn.addEventListener('click', downloadSVGAsPNG)
uploadImgInput.addEventListener('change', uploadImg)