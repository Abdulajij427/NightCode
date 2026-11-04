export type ThemeColors = {
    primary: string;
    planMode: string;
    selection: string;
    thinking: string;
    success: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    dialogSurface: string;
    thinkingBorder: string;
    dimSeparator: string;
};

export type Theme = {
    name: string;
    colors: ThemeColors
};


export const THEMES: Theme[] = [
  {
    name: "Nightfox",
    colors: {
      primary: "#56D6C2",
      planMode: "#CF8EF4",
      selection: "#89B4FA",
      thinking: "#CF8EF4",
      success: "#82E0AA",
      error: "#E74C5E",
      info: "#56D6C2",
      background: "#0D0D12",
      surface: "#1A1A24",
      dialogSurface: "#0A0A10",
      thinkingBorder: "#34344A",
      dimSeparator: "#4E4E66",
    },
  },
  {
    name: "Dracula",
    colors: {
      primary: "#8BE9FD",
      planMode: "#BD93F9",
      selection: "#44475A",
      thinking: "#BD93F9",
      success: "#50FA7B",
      error: "#FF5555",
      info: "#8BE9FD",
      background: "#282A36",
      surface: "#343746",
      dialogSurface: "#21222C",
      thinkingBorder: "#6272A4",
      dimSeparator: "#44475A",
    },
  },
  {
    name: "Monokai",
    colors: {
      primary: "#A6E22E",
      planMode: "#AE81FF",
      selection: "#49483E",
      thinking: "#AE81FF",
      success: "#A6E22E",
      error: "#F92672",
      info: "#66D9EF",
      background: "#272822",
      surface: "#33342C",
      dialogSurface: "#1E1F1C",
      thinkingBorder: "#49483E",
      dimSeparator: "#57584F",
    },
  },
  {
    name: "Tokyo Night",
    colors: {
      primary: "#7AA2F7",
      planMode: "#BB9AF7",
      selection: "#364A82",
      thinking: "#BB9AF7",
      success: "#9ECE6A",
      error: "#F7768E",
      info: "#7DCFFF",
      background: "#1A1B26",
      surface: "#24283B",
      dialogSurface: "#16161E",
      thinkingBorder: "#414868",
      dimSeparator: "#3B4261",
    },
  },
  {
    name: "Nord",
    colors: {
      primary: "#88C0D0",
      planMode: "#B48EAD",
      selection: "#434C5E",
      thinking: "#B48EAD",
      success: "#A3BE8C",
      error: "#BF616A",
      info: "#81A1C1",
      background: "#2E3440",
      surface: "#3B4252",
      dialogSurface: "#272C36",
      thinkingBorder: "#434C5E",
      dimSeparator: "#4C566A",
    },
  },
  {
    name: "One Dark",
    colors: {
      primary: "#61AFEF",
      planMode: "#C678DD",
      selection: "#3E4451",
      thinking: "#C678DD",
      success: "#98C379",
      error: "#E06C75",
      info: "#56B6C2",
      background: "#282C34",
      surface: "#323842",
      dialogSurface: "#21252B",
      thinkingBorder: "#454B59",
      dimSeparator: "#4B5263",
    },
  },
  {
    name: "Cyberpunk",
    colors: {
      primary: "#00F5D4",
      planMode: "#FF00FF",
      selection: "#303050",
      thinking: "#FF00FF",
      success: "#39FF14",
      error: "#FF3366",
      info: "#00BBF9",
      background: "#090914",
      surface: "#15152A",
      dialogSurface: "#070710",
      thinkingBorder: "#4A1F65",
      dimSeparator: "#393956",
    },
  },
  {
    name: "Synthwave",
    colors: {
      primary: "#36F1CD",
      planMode: "#FF71CE",
      selection: "#3E2D5C",
      thinking: "#B967FF",
      success: "#72F1B8",
      error: "#FF3864",
      info: "#01CDFE",
      background: "#241734",
      surface: "#302044",
      dialogSurface: "#1B1028",
      thinkingBorder: "#704A91",
      dimSeparator: "#503765",
    },
  },
  {
    name: "Gruvbox Dark",
    colors: {
      primary: "#83A598",
      planMode: "#D3869B",
      selection: "#504945",
      thinking: "#D3869B",
      success: "#B8BB26",
      error: "#FB4934",
      info: "#83A598",
      background: "#282828",
      surface: "#3C3836",
      dialogSurface: "#1D2021",
      thinkingBorder: "#665C54",
      dimSeparator: "#504945",
    },
  },
  {
    name: "Catppuccin Mocha",
    colors: {
      primary: "#89DCEB",
      planMode: "#CBA6F7",
      selection: "#45475A",
      thinking: "#CBA6F7",
      success: "#A6E3A1",
      error: "#F38BA8",
      info: "#89B4FA",
      background: "#1E1E2E",
      surface: "#313244",
      dialogSurface: "#181825",
      thinkingBorder: "#585B70",
      dimSeparator: "#45475A",
    },
  },
  {
    name: "Everforest",
    colors: {
      primary: "#A7C080",
      planMode: "#D699B6",
      selection: "#414B40",
      thinking: "#D699B6",
      success: "#A7C080",
      error: "#E67E80",
      info: "#7FBBB3",
      background: "#2D353B",
      surface: "#343F44",
      dialogSurface: "#232A2E",
      thinkingBorder: "#4F5B58",
      dimSeparator: "#475258",
    },
  },
  {
    name: "GitHub Light",
    colors: {
      primary: "#0969DA",
      planMode: "#8250DF",
      selection: "#DDF4FF",
      thinking: "#8250DF",
      success: "#1A7F37",
      error: "#CF222E",
      info: "#0550AE",
      background: "#FFFFFF",
      surface: "#F6F8FA",
      dialogSurface: "#FFFFFF",
      thinkingBorder: "#D8DEE4",
      dimSeparator: "#D1D9E0",
    },
  },
];


export const DEFAULT_THEME = THEMES.find((t)=> t.name === "Nightfox")!;