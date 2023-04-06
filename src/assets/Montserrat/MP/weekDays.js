const weekDaysMP = {
  monday: ` <path d="M4.2,4.9V2.13L2.84,4.41H2.36L1,2.18V4.9H0V.28H.88L2.61,3.15,4.32.28h.87l0,4.62Z" style="fill: #231f20"/>
        <path d="M7.05,4.72a1.88,1.88,0,0,1-.69-.65,1.8,1.8,0,0,1-.25-1,1.76,1.76,0,0,1,.25-.94,1.73,1.73,0,0,1,.69-.65,2.12,2.12,0,0,1,1-.24,2,2,0,0,1,1,.24,1.69,1.69,0,0,1,.7.65,1.86,1.86,0,0,1,.25.94,1.9,1.9,0,0,1-.25,1,1.83,1.83,0,0,1-.7.65,2.14,2.14,0,0,1-1,.23A2.24,2.24,0,0,1,7.05,4.72Zm1.66-.88A1,1,0,0,0,9,3.12a1,1,0,0,0-.26-.71.85.85,0,0,0-.65-.27.86.86,0,0,0-.65.27,1,1,0,0,0-.26.71,1,1,0,0,0,.26.72.86.86,0,0,0,.65.27A.85.85,0,0,0,8.71,3.84Z" style="fill: #231f20"/>
        <path d="M14,1.69a1.57,1.57,0,0,1,.41,1.17v2h-1V3a1,1,0,0,0-.18-.63.7.7,0,0,0-.54-.21.82.82,0,0,0-.62.25,1,1,0,0,0-.23.71V4.9h-1V1.35h1v.41a1.39,1.39,0,0,1,.51-.34A1.63,1.63,0,0,1,13,1.29,1.47,1.47,0,0,1,14,1.69Z" style="fill: #231f20"/>
        <path d="M19.1,0V4.9h-1V4.49A1.33,1.33,0,0,1,17,5a1.83,1.83,0,0,1-.91-.22,1.64,1.64,0,0,1-.64-.64,2,2,0,0,1-.23-1,2,2,0,0,1,.23-1,1.58,1.58,0,0,1,.64-.64A1.84,1.84,0,0,1,17,1.29a1.38,1.38,0,0,1,1.06.43V0ZM17.83,3.84a1,1,0,0,0,.26-.72,1,1,0,0,0-.26-.71.92.92,0,0,0-1.3,0,1,1,0,0,0-.26.71,1,1,0,0,0,.26.72.92.92,0,0,0,1.3,0Z" style="fill: #231f20"/>
        <path d="M22.86,1.69a1.5,1.5,0,0,1,.44,1.18v2h-1V4.46A1.16,1.16,0,0,1,21.25,5a1.73,1.73,0,0,1-.71-.14,1,1,0,0,1-.45-.38,1,1,0,0,1-.16-.56.9.9,0,0,1,.37-.77,1.89,1.89,0,0,1,1.15-.29h.82a.7.7,0,0,0-.2-.52.92.92,0,0,0-.62-.18,1.82,1.82,0,0,0-.56.09,1.54,1.54,0,0,0-.46.24l-.37-.72a2.15,2.15,0,0,1,.7-.31,2.87,2.87,0,0,1,.83-.12A1.83,1.83,0,0,1,22.86,1.69ZM22,4.13a.67.67,0,0,0,.29-.35V3.41h-.71q-.63,0-.63.42a.36.36,0,0,0,.16.31.66.66,0,0,0,.42.12A.83.83,0,0,0,22,4.13Z" style="fill: #231f20"/>
        <path d="M27.74,1.35l-1.6,3.77a2,2,0,0,1-.61.86,1.45,1.45,0,0,1-.86.25,1.71,1.71,0,0,1-.55-.09,1.08,1.08,0,0,1-.44-.23l.37-.74a.73.73,0,0,0,.28.17.8.8,0,0,0,.3.06A.56.56,0,0,0,25,5.3,1,1,0,0,0,25.21,5l0,0L23.69,1.35h1.06l1,2.41,1-2.41Z" style="fill: #231f20"/>`,
  tuesday: `<path d="M1.48,1.15H0V.28H4v.87H2.55V4.9H1.48Z" style="fill: #231f20"/>
        <path d="M7.75,1.35V4.9h-1V4.47a1.33,1.33,0,0,1-.49.36A1.54,1.54,0,0,1,5.67,5a1.5,1.5,0,0,1-1.11-.4,1.63,1.63,0,0,1-.41-1.2v-2h1V3.2c0,.57.24.86.72.86a.78.78,0,0,0,.59-.24,1,1,0,0,0,.23-.72V1.35Z" style="fill: #231f20"/>
        <path d="M12.27,3.41H9.59a.82.82,0,0,0,.34.52,1.11,1.11,0,0,0,.67.2A1.22,1.22,0,0,0,11.09,4a1,1,0,0,0,.4-.26l.55.6A1.83,1.83,0,0,1,10.58,5a2.44,2.44,0,0,1-1.07-.23,1.86,1.86,0,0,1-.71-.65,1.8,1.8,0,0,1-.25-1,1.76,1.76,0,0,1,.25-.94,1.64,1.64,0,0,1,.68-.65,2.06,2.06,0,0,1,1.91,0,1.63,1.63,0,0,1,.66.64,2,2,0,0,1,.24,1A2.41,2.41,0,0,1,12.27,3.41ZM9.86,2.27a.89.89,0,0,0-.29.54h1.75A.85.85,0,0,0,11,2.27a.89.89,0,0,0-.58-.2A.92.92,0,0,0,9.86,2.27Z" style="fill: #231f20"/>
        <path d="M13.46,4.84a2.22,2.22,0,0,1-.67-.27l.34-.74a2.41,2.41,0,0,0,.58.25,2.5,2.5,0,0,0,.66.09c.43,0,.65-.11.65-.32a.23.23,0,0,0-.18-.22,2.89,2.89,0,0,0-.55-.11q-.43-.07-.72-.15a1.11,1.11,0,0,1-.49-.31.85.85,0,0,1-.21-.62,1,1,0,0,1,.2-.6,1.3,1.3,0,0,1,.57-.4,2.31,2.31,0,0,1,.88-.15,3.2,3.2,0,0,1,.75.09,2.06,2.06,0,0,1,.61.22l-.34.74a2,2,0,0,0-1-.27,1,1,0,0,0-.5.1.26.26,0,0,0-.16.23.23.23,0,0,0,.18.23,2.44,2.44,0,0,0,.56.13q.44.08.72.15a1.22,1.22,0,0,1,.48.3.9.9,0,0,1,.2.61.9.9,0,0,1-.2.59,1.3,1.3,0,0,1-.57.4,2.74,2.74,0,0,1-.9.14A3.58,3.58,0,0,1,13.46,4.84Z" style="fill: #231f20"/>
        <path d="M20.41,0V4.9h-1V4.49A1.34,1.34,0,0,1,18.31,5a1.82,1.82,0,0,1-.9-.22,1.64,1.64,0,0,1-.64-.64,2,2,0,0,1-.23-1,2,2,0,0,1,.23-1,1.58,1.58,0,0,1,.64-.64,1.83,1.83,0,0,1,.9-.23,1.38,1.38,0,0,1,1.07.43V0ZM19.14,3.84a1,1,0,0,0,.26-.72,1,1,0,0,0-.26-.71.92.92,0,0,0-1.3,0,1,1,0,0,0-.26.71,1,1,0,0,0,.26.72.92.92,0,0,0,1.3,0Z" style="fill: #231f20"/>
        <path d="M24.17,1.69a1.5,1.5,0,0,1,.44,1.18v2h-1V4.46A1.13,1.13,0,0,1,22.56,5a1.73,1.73,0,0,1-.71-.14,1.09,1.09,0,0,1-.46-.38,1,1,0,0,1-.15-.56.9.9,0,0,1,.37-.77,1.89,1.89,0,0,1,1.15-.29h.82a.67.67,0,0,0-.21-.52.89.89,0,0,0-.61-.18,1.77,1.77,0,0,0-.56.09,1.54,1.54,0,0,0-.46.24l-.37-.72a2.19,2.19,0,0,1,.69-.31,2.94,2.94,0,0,1,.84-.12A1.83,1.83,0,0,1,24.17,1.69Zm-.88,2.44a.72.72,0,0,0,.29-.35V3.41h-.71q-.63,0-.63.42a.37.37,0,0,0,.15.31.71.71,0,0,0,.43.12A.83.83,0,0,0,23.29,4.13Z" style="fill: #231f20"/>
        <path d="M29.05,1.35l-1.6,3.77a2,2,0,0,1-.61.86,1.46,1.46,0,0,1-.87.25,1.7,1.7,0,0,1-.54-.09A1.2,1.2,0,0,1,25,5.91l.38-.74a.77.77,0,0,0,.27.17.89.89,0,0,0,.31.06.51.51,0,0,0,.34-.1A.85.85,0,0,0,26.52,5v0L25,1.35h1.06l1,2.41,1-2.41Z" style="fill: #231f20"/>`,
  wednesday: `<path d="M7.39.28,5.87,4.9H4.73l-1-3.13-1,3.13H1.52L0,.28H1.11l1,3.24L3.24.28h1L5.29,3.55,6.36.28Z" style="fill: #231f20"/>
        <path d="M11.35,3.41H8.67A.82.82,0,0,0,9,3.93a1.13,1.13,0,0,0,.67.2A1.22,1.22,0,0,0,10.17,4a1,1,0,0,0,.4-.26l.55.6A1.83,1.83,0,0,1,9.66,5a2.44,2.44,0,0,1-1.07-.23,1.86,1.86,0,0,1-.71-.65,1.8,1.8,0,0,1-.25-1,1.76,1.76,0,0,1,.25-.94,1.64,1.64,0,0,1,.68-.65,2.06,2.06,0,0,1,1.91,0,1.63,1.63,0,0,1,.66.64,2,2,0,0,1,.24,1A2.41,2.41,0,0,1,11.35,3.41ZM8.94,2.27a.89.89,0,0,0-.29.54H10.4a.85.85,0,0,0-.29-.54.89.89,0,0,0-.58-.2A.92.92,0,0,0,8.94,2.27Z" style="fill: #231f20"/>
        <path d="M15.82,0V4.9h-1V4.49a1.33,1.33,0,0,1-1.1.46,1.83,1.83,0,0,1-.91-.22,1.64,1.64,0,0,1-.64-.64,2,2,0,0,1-.23-1,2,2,0,0,1,.23-1,1.58,1.58,0,0,1,.64-.64,1.84,1.84,0,0,1,.91-.23,1.38,1.38,0,0,1,1.06.43V0ZM14.55,3.84a1,1,0,0,0,.26-.72,1,1,0,0,0-.26-.71.92.92,0,0,0-1.3,0,1,1,0,0,0-.26.71,1,1,0,0,0,.26.72.92.92,0,0,0,1.3,0Z" style="fill: #231f20"/>
        <path d="M20.08,1.69a1.53,1.53,0,0,1,.41,1.17v2h-1V3a1,1,0,0,0-.18-.63.7.7,0,0,0-.54-.21.84.84,0,0,0-.62.25,1,1,0,0,0-.23.71V4.9h-1V1.35h1v.41a1.39,1.39,0,0,1,.51-.34A1.63,1.63,0,0,1,19,1.29,1.47,1.47,0,0,1,20.08,1.69Z" style="fill: #231f20"/>
        <path d="M25,3.41H22.3a.82.82,0,0,0,.34.52,1.13,1.13,0,0,0,.67.2,1.31,1.31,0,0,0,.5-.09,1.19,1.19,0,0,0,.4-.26l.54.6A1.83,1.83,0,0,1,23.29,5a2.44,2.44,0,0,1-1.07-.23,1.86,1.86,0,0,1-.71-.65,1.8,1.8,0,0,1-.25-1,1.76,1.76,0,0,1,.25-.94,1.64,1.64,0,0,1,.68-.65,2.06,2.06,0,0,1,1.91,0,1.63,1.63,0,0,1,.66.64,2,2,0,0,1,.24,1A2.41,2.41,0,0,1,25,3.41ZM22.57,2.27a.89.89,0,0,0-.29.54H24a.85.85,0,0,0-.29-.54.89.89,0,0,0-.58-.2A.92.92,0,0,0,22.57,2.27Z" style="fill: #231f20"/>
        <path d="M26.17,4.84a2.22,2.22,0,0,1-.67-.27l.34-.74a2.41,2.41,0,0,0,.58.25,2.5,2.5,0,0,0,.66.09c.43,0,.65-.11.65-.32a.23.23,0,0,0-.18-.22A2.89,2.89,0,0,0,27,3.52c-.29,0-.53-.1-.71-.15a1.14,1.14,0,0,1-.5-.31.85.85,0,0,1-.21-.62,1,1,0,0,1,.2-.6,1.3,1.3,0,0,1,.57-.4,2.35,2.35,0,0,1,.88-.15,3.2,3.2,0,0,1,.75.09,2.06,2.06,0,0,1,.61.22l-.34.74a2,2,0,0,0-1-.27,1,1,0,0,0-.5.1.26.26,0,0,0-.16.23.23.23,0,0,0,.18.23,2.59,2.59,0,0,0,.56.13q.44.08.72.15a1.22,1.22,0,0,1,.48.3.85.85,0,0,1,.2.61,1,1,0,0,1-.19.59,1.4,1.4,0,0,1-.58.4A2.7,2.7,0,0,1,27,5,3.58,3.58,0,0,1,26.17,4.84Z" style="fill: #231f20"/>
        <path d="M33.12,0V4.9h-1V4.49A1.34,1.34,0,0,1,31,5a1.82,1.82,0,0,1-.9-.22,1.64,1.64,0,0,1-.64-.64,2,2,0,0,1-.23-1,2,2,0,0,1,.23-1,1.58,1.58,0,0,1,.64-.64,1.83,1.83,0,0,1,.9-.23,1.38,1.38,0,0,1,1.07.43V0ZM31.85,3.84a1,1,0,0,0,.26-.72,1,1,0,0,0-.26-.71.92.92,0,0,0-1.3,0,1,1,0,0,0-.26.71,1,1,0,0,0,.26.72.92.92,0,0,0,1.3,0Z" style="fill: #231f20"/>
        <path d="M36.88,1.69a1.5,1.5,0,0,1,.44,1.18v2h-1V4.46A1.16,1.16,0,0,1,35.27,5a1.73,1.73,0,0,1-.71-.14,1,1,0,0,1-.45-.38A1,1,0,0,1,34,3.87a.9.9,0,0,1,.37-.77,1.89,1.89,0,0,1,1.15-.29h.82a.67.67,0,0,0-.21-.52.89.89,0,0,0-.61-.18,1.82,1.82,0,0,0-.56.09,1.54,1.54,0,0,0-.46.24l-.37-.72a2.19,2.19,0,0,1,.69-.31,3,3,0,0,1,.84-.12A1.83,1.83,0,0,1,36.88,1.69ZM36,4.13a.67.67,0,0,0,.29-.35V3.41h-.71q-.63,0-.63.42a.37.37,0,0,0,.15.31.71.71,0,0,0,.43.12A.83.83,0,0,0,36,4.13Z" style="fill: #231f20"/>
        <path d="M41.76,1.35l-1.6,3.77a2,2,0,0,1-.61.86,1.46,1.46,0,0,1-.87.25,1.7,1.7,0,0,1-.54-.09,1.2,1.2,0,0,1-.45-.23l.38-.74a.77.77,0,0,0,.27.17.89.89,0,0,0,.31.06A.56.56,0,0,0,39,5.3,1,1,0,0,0,39.23,5l0,0L37.71,1.35h1.06l1,2.41,1-2.41Z" style="fill: #231f20"/>`,
  thursday: ` <path d="M1.48,1.15H0V.28H4v.87H2.55V4.9H1.48Z" style="fill: #231f20"/>
        <path d="M7.88,1.69a1.57,1.57,0,0,1,.41,1.17v2h-1V3a1,1,0,0,0-.18-.63.7.7,0,0,0-.54-.21.82.82,0,0,0-.62.25,1,1,0,0,0-.23.71V4.9h-1V0h1V1.72a1.49,1.49,0,0,1,.49-.32,1.91,1.91,0,0,1,.64-.11A1.47,1.47,0,0,1,7.88,1.69Z" style="fill: #231f20"/>
        <path d="M12.87,1.35V4.9h-1V4.47a1.25,1.25,0,0,1-.49.36,1.54,1.54,0,0,1-.61.12,1.5,1.5,0,0,1-1.11-.4,1.63,1.63,0,0,1-.41-1.2v-2h1V3.2c0,.57.24.86.72.86a.8.8,0,0,0,.6-.24,1.07,1.07,0,0,0,.22-.72V1.35Z" style="fill: #231f20"/>
        <path d="M15.4,1.43a1.81,1.81,0,0,1,.72-.14v1h-.23a.9.9,0,0,0-.69.25,1,1,0,0,0-.26.74V4.9h-1V1.35h1v.47A1,1,0,0,1,15.4,1.43Z" style="fill: #231f20"/>
        <path d="M17.26,4.84a2.18,2.18,0,0,1-.68-.27l.35-.74a2.32,2.32,0,0,0,.57.25,2.5,2.5,0,0,0,.66.09c.43,0,.65-.11.65-.32a.23.23,0,0,0-.18-.22,2.76,2.76,0,0,0-.54-.11q-.43-.07-.72-.15a1.06,1.06,0,0,1-.49-.31.85.85,0,0,1-.21-.62,1,1,0,0,1,.19-.6,1.3,1.3,0,0,1,.57-.4,2.35,2.35,0,0,1,.88-.15,3.2,3.2,0,0,1,.75.09,2.24,2.24,0,0,1,.62.22l-.35.74a2,2,0,0,0-1-.27.92.92,0,0,0-.49.1.27.27,0,0,0-.17.23.23.23,0,0,0,.18.23,2.71,2.71,0,0,0,.57.13c.29.05.52.1.71.15a1.15,1.15,0,0,1,.48.3.85.85,0,0,1,.21.61,1,1,0,0,1-.2.59,1.33,1.33,0,0,1-.58.4,2.66,2.66,0,0,1-.9.14A3.56,3.56,0,0,1,17.26,4.84Z" style="fill: #231f20"/>
        <path d="M24.2,0V4.9h-1V4.49A1.34,1.34,0,0,1,22.1,5a1.82,1.82,0,0,1-.9-.22,1.58,1.58,0,0,1-.64-.64,2,2,0,0,1-.23-1,2,2,0,0,1,.23-1,1.52,1.52,0,0,1,.64-.64,1.83,1.83,0,0,1,.9-.23,1.38,1.38,0,0,1,1.07.43V0ZM22.93,3.84a1,1,0,0,0,.26-.72,1,1,0,0,0-.26-.71.92.92,0,0,0-1.3,0,1,1,0,0,0-.26.71,1,1,0,0,0,.26.72.92.92,0,0,0,1.3,0Z" style="fill: #231f20"/>
        <path d="M28,1.69a1.5,1.5,0,0,1,.44,1.18v2h-1V4.46A1.13,1.13,0,0,1,26.35,5a1.73,1.73,0,0,1-.71-.14,1.09,1.09,0,0,1-.46-.38A1,1,0,0,1,25,3.87a.9.9,0,0,1,.37-.77,1.89,1.89,0,0,1,1.15-.29h.82a.67.67,0,0,0-.21-.52.89.89,0,0,0-.61-.18A1.77,1.77,0,0,0,26,2.2a1.43,1.43,0,0,0-.46.24l-.37-.72a2.19,2.19,0,0,1,.69-.31,2.94,2.94,0,0,1,.84-.12A1.83,1.83,0,0,1,28,1.69Zm-.88,2.44a.72.72,0,0,0,.29-.35V3.41h-.71q-.63,0-.63.42a.37.37,0,0,0,.15.31.71.71,0,0,0,.43.12A.83.83,0,0,0,27.08,4.13Z" style="fill: #231f20"/>
        <path d="M32.84,1.35l-1.6,3.77a2,2,0,0,1-.61.86,1.46,1.46,0,0,1-.87.25,1.7,1.7,0,0,1-.54-.09,1.2,1.2,0,0,1-.45-.23l.38-.74a.77.77,0,0,0,.27.17.89.89,0,0,0,.31.06.51.51,0,0,0,.34-.1A.85.85,0,0,0,30.31,5l0,0L28.79,1.35h1.06l1,2.41,1-2.41Z" style="fill: #231f20"/>`,
  friday: `   <path d="M1.07,1.43V2.65H3.21v.86H1.07V5.19H0V.57H3.49v.86Z" style="fill: #231f20"/>
        <path d="M5.63,1.72a1.81,1.81,0,0,1,.72-.13v1H6.12a.9.9,0,0,0-.69.25,1,1,0,0,0-.26.74V5.19h-1V1.64h1v.47A1.15,1.15,0,0,1,5.63,1.72Z" style="fill: #231f20"/>
        <path d="M7.09,1A.52.52,0,0,1,6.91.57a.52.52,0,0,1,.18-.4A.65.65,0,0,1,7.55,0,.67.67,0,0,1,8,.16a.52.52,0,0,1,.17.39A.58.58,0,0,1,8,1a.68.68,0,0,1-.47.17A.65.65,0,0,1,7.09,1Zm0,.66h1V5.19H7Z" style="fill: #231f20"/>
        <path d="M12.75.3V5.19h-1v-.4a1.36,1.36,0,0,1-1.1.46A1.84,1.84,0,0,1,9.75,5a1.58,1.58,0,0,1-.64-.64,2,2,0,0,1-.23-1,2,2,0,0,1,.23-1,1.52,1.52,0,0,1,.64-.64,1.84,1.84,0,0,1,.91-.23A1.34,1.34,0,0,1,11.72,2V.3ZM11.48,4.13a1,1,0,0,0,.26-.71,1,1,0,0,0-.26-.72.94.94,0,0,0-1.3,0,1,1,0,0,0-.26.72,1,1,0,0,0,.26.71.92.92,0,0,0,1.3,0Z" style="fill: #231f20"/>
        <path d="M16.51,2A1.54,1.54,0,0,1,17,3.17v2H16V4.75a1.17,1.17,0,0,1-1.09.5,1.73,1.73,0,0,1-.71-.14,1,1,0,0,1-.45-.38,1,1,0,0,1-.16-.56A.92.92,0,0,1,14,3.39a1.89,1.89,0,0,1,1.15-.28h.82a.67.67,0,0,0-.2-.52.92.92,0,0,0-.62-.18,1.82,1.82,0,0,0-.56.09,1.54,1.54,0,0,0-.46.24L13.71,2a2.16,2.16,0,0,1,.7-.32,3.26,3.26,0,0,1,.83-.11A1.87,1.87,0,0,1,16.51,2Zm-.88,2.45a.65.65,0,0,0,.29-.36V3.71h-.71q-.63,0-.63.42a.36.36,0,0,0,.16.31.66.66,0,0,0,.42.11A.91.91,0,0,0,15.63,4.43Z" style="fill: #231f20"/>
        <path d="M21.39,1.64l-1.6,3.77a1.87,1.87,0,0,1-.61.87,1.53,1.53,0,0,1-.86.25,1.71,1.71,0,0,1-.55-.09,1.09,1.09,0,0,1-.44-.24l.37-.73a.88.88,0,0,0,.28.17.8.8,0,0,0,.3.06.56.56,0,0,0,.35-.11.87.87,0,0,0,.23-.34l0,0L17.34,1.64H18.4l1,2.41,1-2.41Z" style="fill: #231f20"/>`,
  saturday: `  <path d="M.82,4.83A2.5,2.5,0,0,1,0,4.44l.36-.8A2.77,2.77,0,0,0,1.07,4a2.6,2.6,0,0,0,.82.13A1.29,1.29,0,0,0,2.56,4a.4.4,0,0,0,.22-.36.32.32,0,0,0-.13-.27,1.29,1.29,0,0,0-.33-.18L1.78,3a7.53,7.53,0,0,1-.87-.25,1.44,1.44,0,0,1-.58-.4,1.1,1.1,0,0,1-.24-.74A1.33,1.33,0,0,1,.31.91,1.47,1.47,0,0,1,1,.39,2.63,2.63,0,0,1,2,.2,3.55,3.55,0,0,1,2.9.3a2.5,2.5,0,0,1,.74.31l-.33.81A2.56,2.56,0,0,0,2,1.06a1.16,1.16,0,0,0-.66.14.46.46,0,0,0-.21.38.38.38,0,0,0,.24.36,5.18,5.18,0,0,0,.76.23A5.77,5.77,0,0,1,3,2.42a1.36,1.36,0,0,1,.58.39,1.07,1.07,0,0,1,.24.73,1.26,1.26,0,0,1-.22.73A1.52,1.52,0,0,1,3,4.79,2.9,2.9,0,0,1,1.88,5,3.77,3.77,0,0,1,.82,4.83Z" style="fill: #231f20"/>
        <path d="M8.21,1.35V4.9h-1V4.47a1.25,1.25,0,0,1-.49.36A1.51,1.51,0,0,1,6.13,5,1.5,1.5,0,0,1,5,4.55a1.63,1.63,0,0,1-.41-1.2v-2h1V3.2c0,.57.24.86.72.86A.78.78,0,0,0,7,3.82a1,1,0,0,0,.22-.72V1.35Z" style="fill: #231f20"/>
        <path d="M12.48,1.69a1.57,1.57,0,0,1,.41,1.17v2h-1V3a1,1,0,0,0-.19-.63.66.66,0,0,0-.53-.21.82.82,0,0,0-.62.25,1,1,0,0,0-.23.71V4.9h-1V1.35h1v.41a1.31,1.31,0,0,1,.51-.34,1.59,1.59,0,0,1,.66-.13A1.49,1.49,0,0,1,12.48,1.69Z" style="fill: #231f20"/>
        <path d="M17.54,0V4.9h-1V4.49A1.36,1.36,0,0,1,15.45,5a1.86,1.86,0,0,1-.91-.22,1.62,1.62,0,0,1-.63-.64,1.91,1.91,0,0,1-.23-1,1.9,1.9,0,0,1,.23-1,1.55,1.55,0,0,1,.63-.64,1.86,1.86,0,0,1,.91-.23,1.36,1.36,0,0,1,1.06.43V0ZM16.28,3.84a1,1,0,0,0,.25-.72,1,1,0,0,0-.25-.71.88.88,0,0,0-.65-.27.86.86,0,0,0-.65.27.93.93,0,0,0-.26.71,1,1,0,0,0,.26.72.86.86,0,0,0,.65.27A.88.88,0,0,0,16.28,3.84Z" style="fill: #231f20"/>
        <path d="M21.3,1.69a1.47,1.47,0,0,1,.45,1.18v2h-1V4.46A1.13,1.13,0,0,1,19.7,5,1.73,1.73,0,0,1,19,4.81a1.09,1.09,0,0,1-.46-.38,1,1,0,0,1-.16-.56.91.91,0,0,1,.38-.77,1.87,1.87,0,0,1,1.15-.29h.82a.67.67,0,0,0-.21-.52.89.89,0,0,0-.61-.18,1.77,1.77,0,0,0-.56.09,1.43,1.43,0,0,0-.46.24l-.38-.72a2.36,2.36,0,0,1,.7-.31A2.94,2.94,0,0,1,20,1.29,1.78,1.78,0,0,1,21.3,1.69Zm-.87,2.44a.72.72,0,0,0,.29-.35V3.41H20q-.63,0-.63.42a.37.37,0,0,0,.15.31.69.69,0,0,0,.43.12A.85.85,0,0,0,20.43,4.13Z" style="fill: #231f20"/>
        <path d="M26.19,1.35,24.58,5.12A1.88,1.88,0,0,1,24,6a1.46,1.46,0,0,1-.87.25,1.76,1.76,0,0,1-.55-.09,1.15,1.15,0,0,1-.44-.23l.38-.74a.77.77,0,0,0,.27.17.89.89,0,0,0,.31.06.53.53,0,0,0,.34-.1A.85.85,0,0,0,23.66,5v0L22.13,1.35H23.2l1,2.41,1-2.41Z" style="fill: #231f20"/>`,
  sunday: ` <path d="M.82,4.83A2.5,2.5,0,0,1,0,4.44l.36-.8A2.77,2.77,0,0,0,1.07,4a2.6,2.6,0,0,0,.82.13A1.29,1.29,0,0,0,2.56,4a.4.4,0,0,0,.22-.36.32.32,0,0,0-.13-.27,1.29,1.29,0,0,0-.33-.18L1.78,3a7.53,7.53,0,0,1-.87-.25,1.44,1.44,0,0,1-.58-.4,1.1,1.1,0,0,1-.24-.74A1.33,1.33,0,0,1,.31.91,1.47,1.47,0,0,1,1,.39,2.63,2.63,0,0,1,2,.2,3.55,3.55,0,0,1,2.9.3a2.5,2.5,0,0,1,.74.31l-.33.81A2.56,2.56,0,0,0,2,1.06a1.16,1.16,0,0,0-.66.14.46.46,0,0,0-.21.38.38.38,0,0,0,.24.36,5.18,5.18,0,0,0,.76.23A5.77,5.77,0,0,1,3,2.42a1.36,1.36,0,0,1,.58.39,1.07,1.07,0,0,1,.24.73,1.26,1.26,0,0,1-.22.73A1.52,1.52,0,0,1,3,4.79,2.9,2.9,0,0,1,1.88,5,3.77,3.77,0,0,1,.82,4.83Z" style="fill: #231f20"/>
      <path d="M8.21,1.35V4.9h-1V4.47a1.25,1.25,0,0,1-.49.36A1.51,1.51,0,0,1,6.13,5,1.5,1.5,0,0,1,5,4.55a1.63,1.63,0,0,1-.41-1.2v-2h1V3.2c0,.57.24.86.72.86A.78.78,0,0,0,7,3.82a1,1,0,0,0,.22-.72V1.35Z" style="fill: #231f20"/>
      <path d="M12.48,1.69a1.57,1.57,0,0,1,.41,1.17v2h-1V3a1,1,0,0,0-.19-.63.66.66,0,0,0-.53-.21.82.82,0,0,0-.62.25,1,1,0,0,0-.23.71V4.9h-1V1.35h1v.41a1.31,1.31,0,0,1,.51-.34,1.59,1.59,0,0,1,.66-.13A1.49,1.49,0,0,1,12.48,1.69Z" style="fill: #231f20"/>
      <path d="M17.54,0V4.9h-1V4.49A1.36,1.36,0,0,1,15.45,5a1.86,1.86,0,0,1-.91-.22,1.62,1.62,0,0,1-.63-.64,1.91,1.91,0,0,1-.23-1,1.9,1.9,0,0,1,.23-1,1.55,1.55,0,0,1,.63-.64,1.86,1.86,0,0,1,.91-.23,1.36,1.36,0,0,1,1.06.43V0ZM16.28,3.84a1,1,0,0,0,.25-.72,1,1,0,0,0-.25-.71.88.88,0,0,0-.65-.27.86.86,0,0,0-.65.27.93.93,0,0,0-.26.71,1,1,0,0,0,.26.72.86.86,0,0,0,.65.27A.88.88,0,0,0,16.28,3.84Z" style="fill: #231f20"/>
      <path d="M21.3,1.69a1.47,1.47,0,0,1,.45,1.18v2h-1V4.46A1.13,1.13,0,0,1,19.7,5,1.73,1.73,0,0,1,19,4.81a1.09,1.09,0,0,1-.46-.38,1,1,0,0,1-.16-.56.91.91,0,0,1,.38-.77,1.87,1.87,0,0,1,1.15-.29h.82a.67.67,0,0,0-.21-.52.89.89,0,0,0-.61-.18,1.77,1.77,0,0,0-.56.09,1.43,1.43,0,0,0-.46.24l-.38-.72a2.36,2.36,0,0,1,.7-.31A2.94,2.94,0,0,1,20,1.29,1.78,1.78,0,0,1,21.3,1.69Zm-.87,2.44a.72.72,0,0,0,.29-.35V3.41H20q-.63,0-.63.42a.37.37,0,0,0,.15.31.69.69,0,0,0,.43.12A.85.85,0,0,0,20.43,4.13Z" style="fill: #231f20"/>
      <path d="M26.19,1.35,24.58,5.12A1.88,1.88,0,0,1,24,6a1.46,1.46,0,0,1-.87.25,1.76,1.76,0,0,1-.55-.09,1.15,1.15,0,0,1-.44-.23l.38-.74a.77.77,0,0,0,.27.17.89.89,0,0,0,.31.06.53.53,0,0,0,.34-.1A.85.85,0,0,0,23.66,5v0L22.13,1.35H23.2l1,2.41,1-2.41Z" style="fill: #231f20"/>`,
};

export default weekDaysMP;