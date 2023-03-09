
const months = [
    `<path d="M2.73,19.19A6.89,6.89,0,0,1,0,17.08l2.52-3a4.54,4.54,0,0,0,3.64,2.15q2.77,0,2.77-3.25V3.64H2V0h11.4V12.71a7.41,7.41,0,0,1-1.79,5.42,7.13,7.13,0,0,1-5.27,1.81A8.8,8.8,0,0,1,2.73,19.19Z" style="fill: #231f20"/>
      <path d="M28.74,6a6.36,6.36,0,0,1,1.88,5v8.6H26.53V17.72c-.82,1.4-2.36,2.1-4.59,2.1a7.2,7.2,0,0,1-3-.58A4.61,4.61,0,0,1,17,17.61a4.19,4.19,0,0,1-.67-2.35A3.9,3.9,0,0,1,17.89,12a8,8,0,0,1,4.88-1.21h3.48a2.8,2.8,0,0,0-.87-2.2,3.86,3.86,0,0,0-2.61-.77,7.62,7.62,0,0,0-2.36.38,6.11,6.11,0,0,0-2,1l-1.57-3a9.43,9.43,0,0,1,2.95-1.34,13.14,13.14,0,0,1,3.54-.48A7.84,7.84,0,0,1,28.74,6ZM25,16.37a2.94,2.94,0,0,0,1.23-1.53V13.3h-3c-1.79,0-2.69.59-2.69,1.76a1.56,1.56,0,0,0,.66,1.33,3,3,0,0,0,1.81.49A3.88,3.88,0,0,0,25,16.37Z" style="fill: #231f20"/>
      <path d="M47.86,6a6.66,6.66,0,0,1,1.72,5V19.6H45.22v-8A3.9,3.9,0,0,0,44.43,9a2.89,2.89,0,0,0-2.26-.88,3.5,3.5,0,0,0-2.64,1,4.27,4.27,0,0,0-1,3V19.6H34.19V4.54h4.17V6.3a5.88,5.88,0,0,1,2.15-1.47,7.43,7.43,0,0,1,2.83-.52A6.19,6.19,0,0,1,47.86,6Z" style="fill: #231f20"/>
      <path d="M68.22,4.54V19.6H64.07V17.81A5.84,5.84,0,0,1,62,19.31a6.59,6.59,0,0,1-2.6.51,6.46,6.46,0,0,1-4.71-1.7A6.84,6.84,0,0,1,53,13.05V4.54h4.37V12.4c0,2.43,1,3.64,3.05,3.64a3.3,3.3,0,0,0,2.52-1,4.33,4.33,0,0,0,1-3V4.54Z" style="fill: #231f20"/>
      <path d="M83.42,6a6.36,6.36,0,0,1,1.88,5v8.6H81.21V17.72q-1.23,2.1-4.59,2.1a7.15,7.15,0,0,1-3-.58,4.58,4.58,0,0,1-2-1.63A4.19,4.19,0,0,1,71,15.26,3.9,3.9,0,0,1,72.57,12a8,8,0,0,1,4.89-1.21h3.47a2.8,2.8,0,0,0-.87-2.2,3.84,3.84,0,0,0-2.6-.77,7.63,7.63,0,0,0-2.37.38,6.11,6.11,0,0,0-2,1l-1.57-3a9.43,9.43,0,0,1,3-1.34A13.14,13.14,0,0,1,78,4.31,7.84,7.84,0,0,1,83.42,6ZM79.7,16.37a2.89,2.89,0,0,0,1.23-1.53V13.3h-3c-1.79,0-2.69.59-2.69,1.76a1.56,1.56,0,0,0,.66,1.33,3,3,0,0,0,1.81.49A3.88,3.88,0,0,0,79.7,16.37Z" style="fill: #231f20"/>
      <path d="M95.15,4.87a7.93,7.93,0,0,1,3.07-.56v4l-1-.05A4,4,0,0,0,94.3,9.34a4.24,4.24,0,0,0-1.07,3.15V19.6H88.87V4.54H93v2A4.91,4.91,0,0,1,95.15,4.87Z" style="fill: #231f20"/>
      <path d="M116.45,4.54l-6.81,16a7.83,7.83,0,0,1-2.56,3.67,6.29,6.29,0,0,1-3.68,1.07,7.77,7.77,0,0,1-2.33-.37,5.06,5.06,0,0,1-1.87-1l1.59-3.1a4,4,0,0,0,1.17.7,3.75,3.75,0,0,0,1.3.25,2.3,2.3,0,0,0,1.45-.44,3.64,3.64,0,0,0,1-1.44l.06-.14L99.25,4.54h4.51L108,14.76l4.26-10.22Z" style="fill: #231f20"/>`,
    `  <path d="M4.54,4.82V10h9.07v3.64H4.54v7.14H0V1.18H14.81V4.82Z" style="fill: #231f20"/>
      <path d="M31.67,14.48H20.27a3.56,3.56,0,0,0,1.46,2.21,4.8,4.8,0,0,0,2.85.81,5.87,5.87,0,0,0,2.09-.35A4.86,4.86,0,0,0,28.36,16l2.33,2.52A7.8,7.8,0,0,1,24.47,21,9.88,9.88,0,0,1,20,20a7.41,7.41,0,0,1-3-2.76,7.61,7.61,0,0,1-1.06-4,7.72,7.72,0,0,1,1-4,7.38,7.38,0,0,1,2.88-2.77,9,9,0,0,1,8.11,0,6.9,6.9,0,0,1,2.81,2.73,8.16,8.16,0,0,1,1,4.13C31.75,13.36,31.72,13.75,31.67,14.48ZM21.45,9.63a3.55,3.55,0,0,0-1.23,2.3h7.42A3.59,3.59,0,0,0,26.4,9.65a3.67,3.67,0,0,0-2.46-.86A3.75,3.75,0,0,0,21.45,9.63Z" style="fill: #231f20"/>
      <path d="M47.08,6.45a6.92,6.92,0,0,1,2.7,2.72,8.23,8.23,0,0,1,1,4.07,8.27,8.27,0,0,1-1,4.08A6.9,6.9,0,0,1,47.08,20a7.62,7.62,0,0,1-3.82,1,5.81,5.81,0,0,1-4.74-2v1.74H34.35V0h4.37V7.31a5.79,5.79,0,0,1,4.54-1.82A7.71,7.71,0,0,1,47.08,6.45Zm-1.82,9.83a4.22,4.22,0,0,0,1.08-3,4.19,4.19,0,0,0-1.08-3,3.91,3.91,0,0,0-5.52,0,4.19,4.19,0,0,0-1.07,3,4.21,4.21,0,0,0,1.07,3,3.91,3.91,0,0,0,5.52,0Z" style="fill: #231f20"/>
      <path d="M59.75,6.05a7.7,7.7,0,0,1,3.06-.56v4c-.48,0-.81-.06-1-.06a4,4,0,0,0-2.94,1,4.24,4.24,0,0,0-1.06,3.15v7.12H53.46V5.71h4.17v2A4.85,4.85,0,0,1,59.75,6.05Z" style="fill: #231f20"/>
      <path d="M80.16,5.71V20.78H76V19a5.68,5.68,0,0,1-2.07,1.5,7.14,7.14,0,0,1-7.31-1.19,6.84,6.84,0,0,1-1.73-5.07V5.71h4.37v7.87c0,2.43,1,3.64,3,3.64a3.3,3.3,0,0,0,2.52-1,4.34,4.34,0,0,0,1-3V5.71Z" style="fill: #231f20"/>
      <path d="M95.36,7.15a6.38,6.38,0,0,1,1.87,5v8.6H93.15V18.9c-.82,1.4-2.36,2.1-4.6,2.1a7.18,7.18,0,0,1-3-.59,4.46,4.46,0,0,1-1.94-1.62,4.22,4.22,0,0,1-.67-2.35,3.92,3.92,0,0,1,1.58-3.31,8.06,8.06,0,0,1,4.88-1.2h3.48A2.78,2.78,0,0,0,92,9.73,3.86,3.86,0,0,0,89.39,9,7.62,7.62,0,0,0,87,9.34a6.27,6.27,0,0,0-2,1l-1.56-3a9.44,9.44,0,0,1,3-1.35A13.55,13.55,0,0,1,90,5.49,7.84,7.84,0,0,1,95.36,7.15ZM91.63,17.54A2.85,2.85,0,0,0,92.87,16V14.48h-3c-1.79,0-2.69.58-2.69,1.76a1.57,1.57,0,0,0,.66,1.33,3,3,0,0,0,1.81.49A3.73,3.73,0,0,0,91.63,17.54Z" style="fill: #231f20"/>
      <path d="M107.09,6.05a7.75,7.75,0,0,1,3.07-.56v4l-1-.06a4,4,0,0,0-2.94,1,4.24,4.24,0,0,0-1.07,3.15v7.12H100.8V5.71H105v2A4.77,4.77,0,0,1,107.09,6.05Z" style="fill: #231f20"/>
      <path d="M128.38,5.71l-6.8,16A7.83,7.83,0,0,1,119,25.37a6.28,6.28,0,0,1-3.68,1.06,7.76,7.76,0,0,1-2.33-.36,5.06,5.06,0,0,1-1.87-1L112.73,22a3.91,3.91,0,0,0,1.16.7,3.62,3.62,0,0,0,1.31.25,2.29,2.29,0,0,0,1.45-.43,3.64,3.64,0,0,0,1-1.44l.06-.14L111.19,5.71h4.51l4.23,10.22,4.25-10.22Z" style="fill: #231f20"/>`,
    `<path d="M17.84,20.78,17.81,9,12,18.7H10L4.26,9.27V20.78H0V1.18H3.75l7.34,12.18L18.31,1.18H22l.05,19.6Z" style="fill: #231f20"/>
      <path d="M37.64,7.15a6.39,6.39,0,0,1,1.88,5v8.6H35.43V18.9Q34.2,21,30.84,21a7.15,7.15,0,0,1-3-.59,4.49,4.49,0,0,1-1.95-1.62,4.22,4.22,0,0,1-.67-2.35,3.92,3.92,0,0,1,1.58-3.31,8.07,8.07,0,0,1,4.89-1.2h3.47a2.78,2.78,0,0,0-.87-2.2A3.84,3.84,0,0,0,31.68,9a7.63,7.63,0,0,0-2.37.38,6.22,6.22,0,0,0-2,1l-1.57-3A9.44,9.44,0,0,1,28.72,6a13.55,13.55,0,0,1,3.54-.47A7.84,7.84,0,0,1,37.64,7.15ZM33.92,17.54A2.83,2.83,0,0,0,35.15,16V14.48h-3c-1.79,0-2.69.58-2.69,1.76a1.57,1.57,0,0,0,.66,1.33,3,3,0,0,0,1.81.49A3.79,3.79,0,0,0,33.92,17.54Z" style="fill: #231f20"/>
      <path d="M49.37,6.05a7.75,7.75,0,0,1,3.07-.56v4c-.49,0-.81-.06-1-.06a4,4,0,0,0-2.94,1,4.24,4.24,0,0,0-1.07,3.15v7.12H43.09V5.71h4.17v2A4.77,4.77,0,0,1,49.37,6.05Z" style="fill: #231f20"/>
      <path d="M57.72,20a7.39,7.39,0,0,1-4.08-6.77,7.52,7.52,0,0,1,1.08-4,7.41,7.41,0,0,1,3-2.76,9.29,9.29,0,0,1,4.32-1,8.39,8.39,0,0,1,4.16,1,5.86,5.86,0,0,1,2.59,2.84L65.4,11.14A3.69,3.69,0,0,0,62,9.07a3.85,3.85,0,0,0-2.83,1.12,4.12,4.12,0,0,0-1.12,3.05,4.13,4.13,0,0,0,1.12,3.06A3.85,3.85,0,0,0,62,17.42a3.64,3.64,0,0,0,3.38-2.08l3.39,1.85A6,6,0,0,1,66.2,20,8.29,8.29,0,0,1,62,21,9.29,9.29,0,0,1,57.72,20Z" style="fill: #231f20"/>
      <path d="M84.81,7.17a6.65,6.65,0,0,1,1.72,5v8.63H82.16v-8a3.94,3.94,0,0,0-.78-2.67,2.87,2.87,0,0,0-2.27-.88,3.47,3.47,0,0,0-2.63,1,4.24,4.24,0,0,0-1,3v7.45H71.13V0H75.5V7.28A5.84,5.84,0,0,1,77.6,6a7.56,7.56,0,0,1,2.69-.46A6.19,6.19,0,0,1,84.81,7.17Z" style="fill: #231f20"/>`,
    ` <path d="M15.48,17.84H6.38L4.65,22H0L8.74,2.44h4.48L22,22H17.22Zm-1.42-3.45L11,6.89l-3.11,7.5Z" style="fill: #231f20"/>
      <path d="M36.43,7.71a6.92,6.92,0,0,1,2.7,2.72,8.25,8.25,0,0,1,1,4.07,8.27,8.27,0,0,1-1,4.08,6.83,6.83,0,0,1-2.7,2.71,7.62,7.62,0,0,1-3.82,1,5.83,5.83,0,0,1-4.54-1.82v7H23.7V7h4.17V8.71a5.8,5.8,0,0,1,4.74-2A7.71,7.71,0,0,1,36.43,7.71Zm-1.82,9.83a4.22,4.22,0,0,0,1.08-3,4.19,4.19,0,0,0-1.08-3,3.91,3.91,0,0,0-5.52,0,4.19,4.19,0,0,0-1.08,3,4.22,4.22,0,0,0,1.08,3,3.91,3.91,0,0,0,5.52,0Z" style="fill: #231f20"/>
      <path d="M49.1,7.31a7.88,7.88,0,0,1,3.06-.56v4c-.48,0-.81-.06-1-.06a4,4,0,0,0-2.94,1,4.24,4.24,0,0,0-1.06,3.15V22H42.81V7H47V9A4.85,4.85,0,0,1,49.1,7.31Z" style="fill: #231f20"/>
      <path d="M54.51,4.17a2.27,2.27,0,0,1-.76-1.73A2.3,2.3,0,0,1,54.51.7a2.75,2.75,0,0,1,2-.7,2.83,2.83,0,0,1,2,.67,2.18,2.18,0,0,1,.76,1.68,2.41,2.41,0,0,1-.76,1.81,3.08,3.08,0,0,1-3.92,0ZM54.29,7h4.36V22H54.29Z" style="fill: #231f20"/>
      <path d="M62.35,1.26h4.36V22H62.35Z" style="fill: #231f20"/>`,
    ` <path d="M17.84,19.6l0-11.76L12,17.53H10L4.26,8.09V19.6H0V0H3.75l7.34,12.18L18.31,0H22l.05,19.6Z" style="fill: #231f20"/>
      <path d="M37.64,6a6.36,6.36,0,0,1,1.88,5v8.6H35.43V17.72q-1.23,2.1-4.59,2.1a7.15,7.15,0,0,1-3-.58,4.58,4.58,0,0,1-1.95-1.63,4.19,4.19,0,0,1-.67-2.35A3.9,3.9,0,0,1,26.79,12a8,8,0,0,1,4.89-1.21h3.47a2.8,2.8,0,0,0-.87-2.2,3.84,3.84,0,0,0-2.6-.77,7.63,7.63,0,0,0-2.37.38,6.22,6.22,0,0,0-2,1l-1.57-3a9.43,9.43,0,0,1,2.95-1.34,13.14,13.14,0,0,1,3.54-.48A7.84,7.84,0,0,1,37.64,6ZM33.92,16.37a2.89,2.89,0,0,0,1.23-1.53V13.3h-3c-1.79,0-2.69.59-2.69,1.76a1.56,1.56,0,0,0,.66,1.33,3,3,0,0,0,1.81.49A3.88,3.88,0,0,0,33.92,16.37Z" style="fill: #231f20"/>
      <path d="M57.52,4.54l-6.8,16a7.91,7.91,0,0,1-2.57,3.67,6.25,6.25,0,0,1-3.68,1.07,7.71,7.71,0,0,1-2.32-.37,5.1,5.1,0,0,1-1.88-1l1.6-3.1a3.86,3.86,0,0,0,1.16.7,3.79,3.79,0,0,0,1.3.25,2.33,2.33,0,0,0,1.46-.44,3.75,3.75,0,0,0,1-1.44l.05-.14L40.33,4.54h4.51l4.22,10.22L53.32,4.54Z" style="fill: #231f20"/>`,
    ` <path d="M2.73,19.19A7,7,0,0,1,0,17.08l2.52-3a4.54,4.54,0,0,0,3.64,2.15q2.77,0,2.77-3.25V3.64H2V0h11.4V12.71a7.41,7.41,0,0,1-1.79,5.42,7.13,7.13,0,0,1-5.27,1.81A8.8,8.8,0,0,1,2.73,19.19Z" style="fill: #231f20"/>
      <path d="M32.52,4.54V19.6H28.38V17.81a5.87,5.87,0,0,1-2.08,1.5,6.59,6.59,0,0,1-2.6.51,6.42,6.42,0,0,1-4.7-1.7,6.81,6.81,0,0,1-1.74-5.07V4.54h4.37V12.4c0,2.43,1,3.64,3.05,3.64a3.3,3.3,0,0,0,2.52-1,4.33,4.33,0,0,0,.95-3V4.54Z" style="fill: #231f20"/>
      <path d="M49.86,6a6.66,6.66,0,0,1,1.72,5V19.6H47.21v-8A4,4,0,0,0,46.43,9a2.9,2.9,0,0,0-2.27-.88,3.47,3.47,0,0,0-2.63,1,4.26,4.26,0,0,0-1,3V19.6H36.18V4.54h4.17V6.3a5.8,5.8,0,0,1,2.16-1.47,7.43,7.43,0,0,1,2.83-.52A6.21,6.21,0,0,1,49.86,6Z" style="fill: #231f20"/>
      <path d="M69.88,13.3H58.48a3.56,3.56,0,0,0,1.46,2.21,4.8,4.8,0,0,0,2.85.81A5.65,5.65,0,0,0,64.88,16a5.07,5.07,0,0,0,1.69-1.1l2.33,2.52a7.82,7.82,0,0,1-6.22,2.43,9.88,9.88,0,0,1-4.51-1,7.28,7.28,0,0,1-3-2.76,7.58,7.58,0,0,1-1.07-4,7.67,7.67,0,0,1,1.05-4A7.33,7.33,0,0,1,58,5.31a8.9,8.9,0,0,1,8.1,0A7,7,0,0,1,68.94,8a8.19,8.19,0,0,1,1,4.13C70,12.18,69.93,12.57,69.88,13.3ZM59.66,8.46a3.54,3.54,0,0,0-1.24,2.29h7.42a3.62,3.62,0,0,0-1.23-2.28,3.66,3.66,0,0,0-2.46-.85A3.75,3.75,0,0,0,59.66,8.46Z" style="fill: #231f20"/>`,
    ` <path d="M2.73,20.37A7,7,0,0,1,0,18.26l2.52-3a4.53,4.53,0,0,0,3.64,2.16q2.77,0,2.77-3.25V4.82H2V1.18h11.4V13.89a7.42,7.42,0,0,1-1.79,5.42,7.13,7.13,0,0,1-5.27,1.8A9,9,0,0,1,2.73,20.37Z" style="fill: #231f20"/>
      <path d="M32.52,5.71V20.78H28.38V19a5.64,5.64,0,0,1-2.08,1.5,6.42,6.42,0,0,1-2.6.52A6.39,6.39,0,0,1,19,19.29a6.81,6.81,0,0,1-1.74-5.07V5.71h4.37v7.87c0,2.43,1,3.64,3.05,3.64a3.3,3.3,0,0,0,2.52-1,4.34,4.34,0,0,0,.95-3V5.71Z" style="fill: #231f20"/>
      <path d="M36.17,0h4.37V20.78H36.17Z" style="fill: #231f20"/>
      <path d="M59.42,5.71l-6.8,16a7.9,7.9,0,0,1-2.56,3.67,6.29,6.29,0,0,1-3.69,1.06,7.69,7.69,0,0,1-2.32-.36,5.1,5.1,0,0,1-1.88-1L43.77,22a3.67,3.67,0,0,0,1.16.7,3.57,3.57,0,0,0,1.3.25,2.3,2.3,0,0,0,1.46-.43,3.75,3.75,0,0,0,1-1.44l0-.14L42.23,5.71h4.51L51,15.93,55.22,5.71Z" style="fill: #231f20"/>`,
    `<path d="M15.48,15.4H6.38L4.65,19.6H0L8.74,0h4.48L22,19.6H17.22ZM14.06,12,11,4.45,7.84,12Z" style="fill: #231f20"/>
      <path d="M38.21,4.54V19.6H34.07V17.81A5.93,5.93,0,0,1,32,19.31a6.6,6.6,0,0,1-2.61.51,6.46,6.46,0,0,1-4.7-1.7A6.81,6.81,0,0,1,23,13.05V4.54h4.37V12.4q0,3.65,3.05,3.64a3.27,3.27,0,0,0,2.52-1,4.28,4.28,0,0,0,1-3V4.54Z" style="fill: #231f20"/>
      <path d="M57.53,4.54V17.08c0,2.76-.72,4.82-2.16,6.16s-3.54,2-6.3,2a15.5,15.5,0,0,1-4.14-.54,8.85,8.85,0,0,1-3.25-1.54l1.74-3.13a7,7,0,0,0,2.4,1.24,9.58,9.58,0,0,0,2.92.47,4.67,4.67,0,0,0,3.34-1,4.06,4.06,0,0,0,1.08-3.09V17a6.12,6.12,0,0,1-4.76,1.87A7.92,7.92,0,0,1,44.61,18a6.87,6.87,0,0,1-2.73-2.56,7.09,7.09,0,0,1-1-3.81,7.09,7.09,0,0,1,1-3.81,6.94,6.94,0,0,1,2.73-2.56,8,8,0,0,1,3.79-.91,6,6,0,0,1,5,2.16V4.54Zm-5.42,9.73a3.49,3.49,0,0,0,1.11-2.68,3.46,3.46,0,0,0-1.11-2.67,4,4,0,0,0-2.84-1,4.09,4.09,0,0,0-2.86,1,3.46,3.46,0,0,0-1.12,2.67,3.5,3.5,0,0,0,1.12,2.68,4.09,4.09,0,0,0,2.86,1A4,4,0,0,0,52.11,14.27Z" style="fill: #231f20"/>
      <path d="M76.37,4.54V19.6H72.23V17.81a5.93,5.93,0,0,1-2.07,1.5,6.64,6.64,0,0,1-2.61.51,6.44,6.44,0,0,1-4.7-1.7,6.81,6.81,0,0,1-1.74-5.07V4.54h4.37V12.4q0,3.65,3,3.64a3.27,3.27,0,0,0,2.52-1,4.28,4.28,0,0,0,1-3V4.54Z" style="fill: #231f20"/>
      <path d="M81.72,19.36a9.53,9.53,0,0,1-2.86-1.16l1.46-3.14a9.08,9.08,0,0,0,2.43,1,10.31,10.31,0,0,0,2.8.41c1.85,0,2.78-.46,2.78-1.37a1,1,0,0,0-.76-.93,11.66,11.66,0,0,0-2.32-.47,21.85,21.85,0,0,1-3.06-.65,4.76,4.76,0,0,1-2.08-1.28,3.68,3.68,0,0,1-.88-2.64,4.12,4.12,0,0,1,.82-2.53,5.26,5.26,0,0,1,2.41-1.72,10.28,10.28,0,0,1,3.74-.62,15,15,0,0,1,3.18.35,9.08,9.08,0,0,1,2.61,1L90.54,8.74A8.66,8.66,0,0,0,86.2,7.62,4.4,4.4,0,0,0,84.1,8a1.15,1.15,0,0,0-.7,1,1,1,0,0,0,.75,1,14.44,14.44,0,0,0,2.41.53,23.93,23.93,0,0,1,3,.66,4.49,4.49,0,0,1,2,1.27A3.61,3.61,0,0,1,92.5,15a4,4,0,0,1-.84,2.49,5.35,5.35,0,0,1-2.45,1.69,11,11,0,0,1-3.82.6A14.48,14.48,0,0,1,81.72,19.36Z" style="fill: #231f20"/>
      <path d="M105,18.87a4.51,4.51,0,0,1-1.58.72,8.52,8.52,0,0,1-2,.23,5.85,5.85,0,0,1-4.16-1.37,5.24,5.24,0,0,1-1.47-4V8.23H93.48V4.87H95.8V1.2h4.37V4.87h3.75V8.23h-3.75v6.13a2,2,0,0,0,.49,1.47,1.81,1.81,0,0,0,1.39.52,2.75,2.75,0,0,0,1.76-.56Z" style="fill: #231f20"/>`,
    `  <path d="M3.49,20.48A10.4,10.4,0,0,1,0,18.84l1.54-3.41a10.5,10.5,0,0,0,3,1.48A11,11,0,0,0,8,17.47a5.53,5.53,0,0,0,2.85-.57,1.73,1.73,0,0,0,.93-1.53,1.45,1.45,0,0,0-.55-1.16,4.12,4.12,0,0,0-1.4-.74c-.57-.19-1.34-.39-2.31-.62a32.77,32.77,0,0,1-3.67-1.06,6.13,6.13,0,0,1-2.45-1.71,4.62,4.62,0,0,1-1-3.14,5.43,5.43,0,0,1,.93-3.09A6.19,6.19,0,0,1,4.1,1.65,11.4,11.4,0,0,1,8.65.84a15,15,0,0,1,3.67.45,11,11,0,0,1,3.14,1.29L14.06,6A10.92,10.92,0,0,0,8.62,4.48a5.09,5.09,0,0,0-2.81.62A1.87,1.87,0,0,0,4.9,6.72a1.6,1.6,0,0,0,1,1.5,16.51,16.51,0,0,0,3.21,1,31.68,31.68,0,0,1,3.66,1.07,5.92,5.92,0,0,1,2.45,1.68,4.46,4.46,0,0,1,1,3.11,5.37,5.37,0,0,1-.94,3.06,6.3,6.3,0,0,1-2.82,2.2A11.48,11.48,0,0,1,8,21.11,16,16,0,0,1,3.49,20.48Z" style="fill: #231f20"/>
      <path d="M33.77,14.48H22.37a3.56,3.56,0,0,0,1.46,2.21,4.8,4.8,0,0,0,2.85.81,5.87,5.87,0,0,0,2.09-.35A4.86,4.86,0,0,0,30.46,16l2.33,2.52A7.8,7.8,0,0,1,26.57,21a9.88,9.88,0,0,1-4.51-1,7.41,7.41,0,0,1-3-2.76,7.61,7.61,0,0,1-1.06-4,7.72,7.72,0,0,1,1.05-4,7.45,7.45,0,0,1,2.88-2.77,9,9,0,0,1,8.11,0,7,7,0,0,1,2.81,2.73,8.16,8.16,0,0,1,1,4.13C33.85,13.36,33.82,13.75,33.77,14.48ZM23.55,9.63a3.55,3.55,0,0,0-1.23,2.3h7.42A3.59,3.59,0,0,0,28.5,9.65,3.67,3.67,0,0,0,26,8.79,3.75,3.75,0,0,0,23.55,9.63Z" style="fill: #231f20"/>
      <path d="M49.18,6.45a6.92,6.92,0,0,1,2.7,2.72,8.25,8.25,0,0,1,1,4.07,8.27,8.27,0,0,1-1,4.08A6.83,6.83,0,0,1,49.18,20a7.62,7.62,0,0,1-3.82,1,5.83,5.83,0,0,1-4.54-1.82v7H36.45V5.71h4.17V7.45a5.8,5.8,0,0,1,4.74-2A7.71,7.71,0,0,1,49.18,6.45Zm-1.82,9.83a4.22,4.22,0,0,0,1.08-3,4.21,4.21,0,0,0-1.08-3,3.91,3.91,0,0,0-5.52,0,4.21,4.21,0,0,0-1.08,3,4.22,4.22,0,0,0,1.08,3,3.91,3.91,0,0,0,5.52,0Z" style="fill: #231f20"/>
      <path d="M65.38,20.05a4.42,4.42,0,0,1-1.58.71,7.88,7.88,0,0,1-2,.24,5.89,5.89,0,0,1-4.16-1.37,5.26,5.26,0,0,1-1.47-4V9.41H53.88V6.05H56.2V2.38h4.37V6.05h3.75V9.41H60.57v6.13A2,2,0,0,0,61.06,17a1.79,1.79,0,0,0,1.38.52A2.86,2.86,0,0,0,64.21,17Z" style="fill: #231f20"/>
      <path d="M82.06,14.48H70.66a3.56,3.56,0,0,0,1.46,2.21A4.82,4.82,0,0,0,75,17.5a5.87,5.87,0,0,0,2.09-.35A4.86,4.86,0,0,0,78.75,16l2.33,2.52A7.8,7.8,0,0,1,74.86,21a9.88,9.88,0,0,1-4.51-1,7.41,7.41,0,0,1-3-2.76,7.61,7.61,0,0,1-1.06-4,7.72,7.72,0,0,1,1-4A7.45,7.45,0,0,1,70.2,6.48a9,9,0,0,1,8.11,0,7,7,0,0,1,2.81,2.73,8.16,8.16,0,0,1,1,4.13C82.14,13.36,82.11,13.75,82.06,14.48ZM71.84,9.63a3.6,3.6,0,0,0-1.23,2.3H78a3.59,3.59,0,0,0-1.24-2.28,3.67,3.67,0,0,0-2.46-.86A3.75,3.75,0,0,0,71.84,9.63Z" style="fill: #231f20"/>
      <path d="M108.53,7.15a6.81,6.81,0,0,1,1.67,5v8.63h-4.37v-8a4.11,4.11,0,0,0-.74-2.67A2.61,2.61,0,0,0,103,9.27a3.09,3.09,0,0,0-2.43,1,4.28,4.28,0,0,0-.9,3v7.56H95.27v-8q0-3.56-2.85-3.55a3.08,3.08,0,0,0-2.41,1,4.28,4.28,0,0,0-.9,3v7.56H84.74V5.71h4.18V7.45A5.49,5.49,0,0,1,91,6a7.1,7.1,0,0,1,2.68-.5,6.48,6.48,0,0,1,2.88.63A5.09,5.09,0,0,1,98.6,8a6.28,6.28,0,0,1,2.34-1.82,7.38,7.38,0,0,1,3.1-.64A6.07,6.07,0,0,1,108.53,7.15Z" style="fill: #231f20"/>
      <path d="M126.48,6.45a6.92,6.92,0,0,1,2.7,2.72,8.25,8.25,0,0,1,1,4.07,8.27,8.27,0,0,1-1,4.08,6.83,6.83,0,0,1-2.7,2.71,7.62,7.62,0,0,1-3.82,1,5.8,5.8,0,0,1-4.74-2v1.74h-4.17V0h4.37V7.31a5.79,5.79,0,0,1,4.54-1.82A7.71,7.71,0,0,1,126.48,6.45Zm-1.82,9.83a4.22,4.22,0,0,0,1.08-3,4.21,4.21,0,0,0-1.08-3,3.91,3.91,0,0,0-5.52,0,4.21,4.21,0,0,0-1.08,3,4.22,4.22,0,0,0,1.08,3,3.91,3.91,0,0,0,5.52,0Z" style="fill: #231f20"/>
      <path d="M147.63,14.48h-11.4a3.52,3.52,0,0,0,1.46,2.21,4.8,4.8,0,0,0,2.85.81,5.87,5.87,0,0,0,2.09-.35A5,5,0,0,0,144.32,16l2.33,2.52A7.81,7.81,0,0,1,140.43,21a9.88,9.88,0,0,1-4.51-1,7.35,7.35,0,0,1-3-2.76,7.61,7.61,0,0,1-1.07-4,7.72,7.72,0,0,1,1-4,7.41,7.41,0,0,1,2.89-2.77,8.94,8.94,0,0,1,8.1,0,7,7,0,0,1,2.82,2.73,8.16,8.16,0,0,1,1,4.13C147.71,13.36,147.68,13.75,147.63,14.48ZM137.41,9.63a3.56,3.56,0,0,0-1.24,2.3h7.42a3.62,3.62,0,0,0-1.23-2.28,3.67,3.67,0,0,0-2.46-.86A3.75,3.75,0,0,0,137.41,9.63Z" style="fill: #231f20"/>
      <path d="M156.6,6.05a7.67,7.67,0,0,1,3.06-.56v4c-.48,0-.81-.06-1-.06a4,4,0,0,0-2.94,1,4.24,4.24,0,0,0-1.06,3.15v7.12h-4.37V5.71h4.17v2A4.8,4.8,0,0,1,156.6,6.05Z" style="fill: #231f20"/>`,
    `  <path d="M5.22,19.8A9.8,9.8,0,0,1,0,11a9.85,9.85,0,0,1,1.39-5.2A9.68,9.68,0,0,1,5.22,2.16,11.44,11.44,0,0,1,10.72.84a11.31,11.31,0,0,1,5.49,1.32A9.78,9.78,0,0,1,21.45,11a9.81,9.81,0,0,1-5.24,8.82,11.42,11.42,0,0,1-5.49,1.31A11.55,11.55,0,0,1,5.22,19.8Zm8.64-3.35a5.68,5.68,0,0,0,2.2-2.23,6.54,6.54,0,0,0,.8-3.24,6.55,6.55,0,0,0-.8-3.25,5.75,5.75,0,0,0-2.2-2.23,6.24,6.24,0,0,0-3.14-.8,6.23,6.23,0,0,0-3.13.8,5.68,5.68,0,0,0-2.2,2.23A6.55,6.55,0,0,0,4.59,11a6.54,6.54,0,0,0,.8,3.24,5.62,5.62,0,0,0,2.2,2.23,6.23,6.23,0,0,0,3.13.8A6.24,6.24,0,0,0,13.86,16.45Z" style="fill: #231f20"/>
      <path d="M27.46,20a7.41,7.41,0,0,1-4.07-6.77,7.41,7.41,0,0,1,4.07-6.76,9.3,9.3,0,0,1,4.33-1,8.42,8.42,0,0,1,4.16,1,6,6,0,0,1,2.59,2.84l-3.39,1.82a3.72,3.72,0,0,0-3.39-2.07,3.87,3.87,0,0,0-2.83,1.12,4.16,4.16,0,0,0-1.12,3.05,4.17,4.17,0,0,0,1.12,3.06,3.87,3.87,0,0,0,2.83,1.12,3.67,3.67,0,0,0,3.39-2.08l3.39,1.85A6,6,0,0,1,36,20a8.32,8.32,0,0,1-4.16,1A9.3,9.3,0,0,1,27.46,20Z" style="fill: #231f20"/>
      <path d="M51.19,20.05a4.47,4.47,0,0,1-1.59.71,7.88,7.88,0,0,1-2,.24,5.89,5.89,0,0,1-4.16-1.37,5.26,5.26,0,0,1-1.47-4V9.41H39.68V6.05H42V2.38h4.37V6.05h3.75V9.41H46.37v6.13A2,2,0,0,0,46.86,17a1.81,1.81,0,0,0,1.39.52A2.83,2.83,0,0,0,50,17Z" style="fill: #231f20"/>
      <path d="M56.09,20a7.51,7.51,0,0,1-3-2.76,7.61,7.61,0,0,1-1.06-4,7.59,7.59,0,0,1,1.06-4,7.44,7.44,0,0,1,3-2.76,9.66,9.66,0,0,1,8.52,0,7.45,7.45,0,0,1,2.94,2.76,7.6,7.6,0,0,1,1.07,4,7.61,7.61,0,0,1-1.07,4A7.52,7.52,0,0,1,64.61,20a9.66,9.66,0,0,1-8.52,0Zm7-3.73a4.22,4.22,0,0,0,1.08-3,4.21,4.21,0,0,0-1.08-3,3.6,3.6,0,0,0-2.75-1.14,3.69,3.69,0,0,0-2.78,1.14,4.21,4.21,0,0,0-1.09,3,4.22,4.22,0,0,0,1.09,3,3.69,3.69,0,0,0,2.78,1.14A3.6,3.6,0,0,0,63.11,16.28Z" style="fill: #231f20"/>
      <path d="M84,6.45a6.92,6.92,0,0,1,2.7,2.72,8.15,8.15,0,0,1,1,4.07,8.16,8.16,0,0,1-1,4.08A6.83,6.83,0,0,1,84,20a7.62,7.62,0,0,1-3.82,1,5.78,5.78,0,0,1-4.73-2v1.74H71.26V0h4.36V7.31a5.82,5.82,0,0,1,4.54-1.82A7.71,7.71,0,0,1,84,6.45Zm-1.82,9.83a4.22,4.22,0,0,0,1.08-3,4.21,4.21,0,0,0-1.08-3,3.9,3.9,0,0,0-5.51,0,4.21,4.21,0,0,0-1.08,3,4.22,4.22,0,0,0,1.08,3,3.9,3.9,0,0,0,5.51,0Z" style="fill: #231f20"/>
      <path d="M105.13,14.48H93.73a3.6,3.6,0,0,0,1.46,2.21,4.85,4.85,0,0,0,2.86.81,5.81,5.81,0,0,0,2.08-.35,5,5,0,0,0,1.7-1.11l2.32,2.52A7.79,7.79,0,0,1,97.94,21a9.85,9.85,0,0,1-4.51-1,7.38,7.38,0,0,1-3-2.76,7.61,7.61,0,0,1-1.06-4,7.72,7.72,0,0,1,1-4,7.45,7.45,0,0,1,2.88-2.77,9,9,0,0,1,8.11,0,7,7,0,0,1,2.81,2.73,8.16,8.16,0,0,1,1,4.13C105.21,13.36,105.19,13.75,105.13,14.48ZM94.91,9.63a3.6,3.6,0,0,0-1.23,2.3h7.42a3.62,3.62,0,0,0-1.23-2.28,4,4,0,0,0-5,0Z" style="fill: #231f20"/>
      <path d="M114.1,6.05a7.75,7.75,0,0,1,3.07-.56v4c-.49,0-.81-.06-1-.06a4,4,0,0,0-2.94,1,4.24,4.24,0,0,0-1.07,3.15v7.12h-4.36V5.71H112v2A4.77,4.77,0,0,1,114.1,6.05Z" style="fill: #231f20"/>`,
    ` <path d="M18,1.18v19.6H14.25L4.48,8.88v11.9H0V1.18H3.75l9.75,11.9V1.18Z" style="fill: #231f20"/>
      <path d="M25,20a7.51,7.51,0,0,1-3-2.76,7.61,7.61,0,0,1-1.06-4,7.59,7.59,0,0,1,1.06-4,7.44,7.44,0,0,1,3-2.76,9.05,9.05,0,0,1,4.27-1,9,9,0,0,1,4.25,1,7.45,7.45,0,0,1,2.94,2.76,7.6,7.6,0,0,1,1.07,4,7.61,7.61,0,0,1-1.07,4A7.52,7.52,0,0,1,33.55,20a9,9,0,0,1-4.25,1A9.05,9.05,0,0,1,25,20Zm7-3.73a4.22,4.22,0,0,0,1.08-3,4.21,4.21,0,0,0-1.08-3A3.6,3.6,0,0,0,29.3,9.07a3.69,3.69,0,0,0-2.78,1.14,4.21,4.21,0,0,0-1.09,3,4.22,4.22,0,0,0,1.09,3,3.69,3.69,0,0,0,2.78,1.14A3.6,3.6,0,0,0,32.05,16.28Z" style="fill: #231f20"/>
      <path d="M54.74,5.71,48.39,20.78H43.88L37.55,5.71h4.51L46.23,16,50.54,5.71Z" style="fill: #231f20"/>
      <path d="M70.51,14.48H59.12a3.54,3.54,0,0,0,1.45,2.21,4.85,4.85,0,0,0,2.86.81,5.81,5.81,0,0,0,2.08-.35A4.89,4.89,0,0,0,67.21,16l2.32,2.52A7.79,7.79,0,0,1,63.32,21a9.85,9.85,0,0,1-4.51-1,7.38,7.38,0,0,1-3-2.76,7.61,7.61,0,0,1-1.06-4,7.72,7.72,0,0,1,1.05-4,7.45,7.45,0,0,1,2.88-2.77,9,9,0,0,1,8.11,0,7,7,0,0,1,2.81,2.73,8.16,8.16,0,0,1,1,4.13C70.6,13.36,70.57,13.75,70.51,14.48ZM60.29,9.63a3.6,3.6,0,0,0-1.23,2.3h7.42a3.62,3.62,0,0,0-1.23-2.28,3.7,3.7,0,0,0-2.47-.86A3.75,3.75,0,0,0,60.29,9.63Z" style="fill: #231f20"/>
      <path d="M97,7.15a6.81,6.81,0,0,1,1.67,5v8.63H94.28v-8a4.11,4.11,0,0,0-.74-2.67,2.61,2.61,0,0,0-2.11-.88,3.13,3.13,0,0,0-2.44,1,4.28,4.28,0,0,0-.9,3v7.56H83.73v-8c0-2.37-1-3.55-2.86-3.55a3.09,3.09,0,0,0-2.41,1,4.28,4.28,0,0,0-.9,3v7.56H73.2V5.71h4.17V7.45A5.53,5.53,0,0,1,79.43,6a7,7,0,0,1,2.67-.5A6.49,6.49,0,0,1,85,6.12,5.22,5.22,0,0,1,87.06,8,6.13,6.13,0,0,1,89.4,6.13a7.34,7.34,0,0,1,3.09-.64A6.07,6.07,0,0,1,97,7.15Z" style="fill: #231f20"/>
      <path d="M114.93,6.45a6.92,6.92,0,0,1,2.7,2.72,8.15,8.15,0,0,1,1,4.07,8.16,8.16,0,0,1-1,4.08,6.83,6.83,0,0,1-2.7,2.71,7.62,7.62,0,0,1-3.82,1,5.78,5.78,0,0,1-4.73-2v1.74h-4.17V0h4.36V7.31a5.81,5.81,0,0,1,4.54-1.82A7.71,7.71,0,0,1,114.93,6.45Zm-1.82,9.83a4.22,4.22,0,0,0,1.08-3,4.21,4.21,0,0,0-1.08-3,3.91,3.91,0,0,0-5.52,0,4.25,4.25,0,0,0-1.07,3,4.25,4.25,0,0,0,1.07,3,3.91,3.91,0,0,0,5.52,0Z" style="fill: #231f20"/>
      <path d="M136.08,14.48h-11.4a3.56,3.56,0,0,0,1.46,2.21,4.83,4.83,0,0,0,2.86.81,5.85,5.85,0,0,0,2.08-.35A4.86,4.86,0,0,0,132.77,16l2.33,2.52A7.8,7.8,0,0,1,128.88,21a9.81,9.81,0,0,1-4.5-1,7.38,7.38,0,0,1-3-2.76,7.61,7.61,0,0,1-1.06-4,7.72,7.72,0,0,1,1-4,7.45,7.45,0,0,1,2.88-2.77,9,9,0,0,1,8.11,0,7,7,0,0,1,2.81,2.73,8.16,8.16,0,0,1,1,4.13C136.16,13.36,136.14,13.75,136.08,14.48ZM125.86,9.63a3.6,3.6,0,0,0-1.23,2.3h7.42a3.59,3.59,0,0,0-1.24-2.28,3.67,3.67,0,0,0-2.46-.86A3.75,3.75,0,0,0,125.86,9.63Z" style="fill: #231f20"/>
      <path d="M145.05,6.05a7.75,7.75,0,0,1,3.07-.56v4l-1-.06a4,4,0,0,0-2.94,1,4.24,4.24,0,0,0-1.07,3.15v7.12h-4.37V5.71h4.18v2A4.77,4.77,0,0,1,145.05,6.05Z" style="fill: #231f20"/>`,
    `<path d="M0,1.18H8.9a12.59,12.59,0,0,1,5.65,1.21,9.17,9.17,0,0,1,3.8,3.43A9.65,9.65,0,0,1,19.71,11a9.61,9.61,0,0,1-1.36,5.15,9.1,9.1,0,0,1-3.8,3.43A12.59,12.59,0,0,1,8.9,20.78H0ZM8.68,17.05a6.56,6.56,0,0,0,4.69-1.64A5.76,5.76,0,0,0,15.12,11a5.77,5.77,0,0,0-1.75-4.44A6.6,6.6,0,0,0,8.68,4.9H4.54V17.05Z" style="fill: #231f20"/>
      <path d="M37.44,14.48H26.05a3.54,3.54,0,0,0,1.45,2.21,4.85,4.85,0,0,0,2.86.81,5.91,5.91,0,0,0,2.09-.35A5,5,0,0,0,34.14,16l2.32,2.52A7.79,7.79,0,0,1,30.25,21a9.88,9.88,0,0,1-4.51-1,7.29,7.29,0,0,1-3-2.76,7.61,7.61,0,0,1-1.07-4,7.72,7.72,0,0,1,1.05-4,7.41,7.41,0,0,1,2.89-2.77,8.94,8.94,0,0,1,8.1,0,7.05,7.05,0,0,1,2.82,2.73,8.16,8.16,0,0,1,1,4.13C37.53,13.36,37.5,13.75,37.44,14.48ZM27.22,9.63A3.6,3.6,0,0,0,26,11.93h7.42a3.62,3.62,0,0,0-1.23-2.28,3.67,3.67,0,0,0-2.46-.86A3.8,3.8,0,0,0,27.22,9.63Z" style="fill: #231f20"/>
      <path d="M43.28,20a7.39,7.39,0,0,1-4.08-6.77,7.39,7.39,0,0,1,4.08-6.76,9.26,9.26,0,0,1,4.32-1,8.42,8.42,0,0,1,4.16,1,5.9,5.9,0,0,1,2.59,2.84L51,11.14a3.7,3.7,0,0,0-3.39-2.07,3.84,3.84,0,0,0-2.82,1.12,4.12,4.12,0,0,0-1.12,3.05,4.13,4.13,0,0,0,1.12,3.06,3.84,3.84,0,0,0,2.82,1.12A3.65,3.65,0,0,0,51,15.34l3.39,1.85A6,6,0,0,1,51.76,20a8.32,8.32,0,0,1-4.16,1A9.26,9.26,0,0,1,43.28,20Z" style="fill: #231f20"/>
      <path d="M71.24,14.48H59.84a3.56,3.56,0,0,0,1.46,2.21,4.83,4.83,0,0,0,2.86.81,5.85,5.85,0,0,0,2.08-.35A5,5,0,0,0,67.94,16l2.32,2.52A7.8,7.8,0,0,1,64,21a9.81,9.81,0,0,1-4.5-1,7.38,7.38,0,0,1-3-2.76,7.61,7.61,0,0,1-1.06-4,7.72,7.72,0,0,1,1-4,7.45,7.45,0,0,1,2.88-2.77,9,9,0,0,1,8.11,0A7,7,0,0,1,70.3,9.17a8.16,8.16,0,0,1,1,4.13C71.32,13.36,71.3,13.75,71.24,14.48ZM61,9.63a3.6,3.6,0,0,0-1.23,2.3h7.42A3.62,3.62,0,0,0,66,9.65a4,4,0,0,0-5,0Z" style="fill: #231f20"/>
      <path d="M97.71,7.15a6.81,6.81,0,0,1,1.67,5v8.63H95v-8a4.11,4.11,0,0,0-.74-2.67,2.61,2.61,0,0,0-2.12-.88,3.11,3.11,0,0,0-2.43,1,4.28,4.28,0,0,0-.9,3v7.56H84.45v-8q0-3.56-2.85-3.55a3.09,3.09,0,0,0-2.41,1,4.28,4.28,0,0,0-.9,3v7.56H73.92V5.71H78.1V7.45A5.49,5.49,0,0,1,80.15,6a7.1,7.1,0,0,1,2.68-.5,6.48,6.48,0,0,1,2.88.63A5.09,5.09,0,0,1,87.78,8a6.28,6.28,0,0,1,2.34-1.82,7.38,7.38,0,0,1,3.1-.64A6.07,6.07,0,0,1,97.71,7.15Z" style="fill: #231f20"/>
      <path d="M115.66,6.45a6.92,6.92,0,0,1,2.7,2.72,8.25,8.25,0,0,1,1,4.07,8.27,8.27,0,0,1-1,4.08,6.83,6.83,0,0,1-2.7,2.71,7.62,7.62,0,0,1-3.82,1,5.8,5.8,0,0,1-4.74-2v1.74h-4.17V0h4.37V7.31a5.79,5.79,0,0,1,4.54-1.82A7.71,7.71,0,0,1,115.66,6.45Zm-1.82,9.83a4.22,4.22,0,0,0,1.08-3,4.21,4.21,0,0,0-1.08-3,3.91,3.91,0,0,0-5.52,0,4.21,4.21,0,0,0-1.08,3,4.22,4.22,0,0,0,1.08,3,3.91,3.91,0,0,0,5.52,0Z" style="fill: #231f20"/>
      <path d="M136.81,14.48h-11.4a3.56,3.56,0,0,0,1.46,2.21,4.8,4.8,0,0,0,2.85.81,5.87,5.87,0,0,0,2.09-.35A4.86,4.86,0,0,0,133.5,16l2.33,2.52A7.8,7.8,0,0,1,129.61,21a9.88,9.88,0,0,1-4.51-1,7.41,7.41,0,0,1-3-2.76,7.61,7.61,0,0,1-1.07-4,7.72,7.72,0,0,1,1-4A7.47,7.47,0,0,1,125,6.48a8.94,8.94,0,0,1,8.1,0,7,7,0,0,1,2.82,2.73,8.16,8.16,0,0,1,1,4.13C136.89,13.36,136.86,13.75,136.81,14.48ZM126.59,9.63a3.56,3.56,0,0,0-1.24,2.3h7.42a3.58,3.58,0,0,0-1.23-2.28,3.67,3.67,0,0,0-2.46-.86A3.75,3.75,0,0,0,126.59,9.63Z" style="fill: #231f20"/>
      <path d="M145.78,6.05a7.7,7.7,0,0,1,3.06-.56v4c-.48,0-.81-.06-1-.06a4,4,0,0,0-2.94,1,4.24,4.24,0,0,0-1.06,3.15v7.12h-4.37V5.71h4.17v2A4.85,4.85,0,0,1,145.78,6.05Z" style="fill: #231f20"/>`
];

export default months;
