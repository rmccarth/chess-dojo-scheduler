'use client';

import { RequirementCategory } from '@/database/requirement';
import { CssBaseline } from '@mui/material';
import { blue, deepPurple } from '@mui/material/colors';
import {
    ThemeProvider as MuiThemeProvider,
    createTheme,
    useColorScheme,
} from '@mui/material/styles';
import { ReactNode, useEffect } from 'react';

export const CategoryColors: Record<RequirementCategory, string> = {
    [RequirementCategory.SuggestedTasks]: '#c27ba0', // light magenta 1
    [RequirementCategory.Welcome]: '#c27ba0', // light magenta 1
    [RequirementCategory.Games]: '#ff9900', // orange
    [RequirementCategory.Tactics]: '#38761d', // dark green 2
    [RequirementCategory.Middlegames]: '#0000ff', // blue
    [RequirementCategory.Endgame]: '#674ea7', // dark purple 1
    [RequirementCategory.Opening]: '#cc0000', // dark red 1
    [RequirementCategory.Graduation]: '#f44336', // red
    [RequirementCategory.NonDojo]: '#cccccc', // gray
};

declare module '@mui/material/styles' {
    interface Palette {
        opening: Palette['primary'];
        endgame: Palette['primary'];
        dojoOrange: Palette['primary'];
        subscribe: Palette['primary'];
        coaching: Palette['primary'];
        liga: Palette['primary'];
        book: Palette['primary'];
        meet: Palette['primary'];
        explorerTotal: Palette['primary'];
        trainingPlanTaskComplete: Palette['primary'];
    }
    interface PaletteOptions {
        opening?: PaletteOptions['primary'];
        endgame?: Palette['primary'];
        dojoOrange?: PaletteOptions['primary'];
        subscribe?: PaletteOptions['primary'];
        coaching?: PaletteOptions['primary'];
        liga?: PaletteOptions['primary'];
        book?: Palette['primary'];
        meet?: Palette['primary'];
        explorerTotal?: Palette['primary'];
        trainingPlanTaskComplete?: Palette['primary'];
    }
}

declare module '@mui/material' {
    interface ChipPropsColorOverrides {
        opening: true;
        endgame: true;
        dojoOrange: true;
        subscribe: true;
        coaching: true;
        liga: true;
        book: true;
        meet: true;
    }

    interface CheckboxPropsColorOverrides {
        opening: true;
        endgame: true;
        dojoOrange: true;
        subscribe: true;
        coaching: true;
        liga: true;
        book: true;
        meet: true;
        trainingPlanTaskComplete: true;
    }

    interface ButtonPropsColorOverrides {
        opening: true;
        endgame: true;
        dojoOrange: true;
        subscribe: true;
        coaching: true;
        liga: true;
        book: true;
        meet: true;
    }

    interface SvgIconPropsColorOverrides {
        opening: true;
        endgame: true;
        dojoOrange: true;
        subscribe: true;
        coaching: true;
        liga: true;
        book: true;
        meet: true;
    }
}

const defaultTheme = createTheme({});

const defaultPalette = {
    meet: defaultTheme.palette.augmentColor({
        color: {
            main: '#93a84f',
        },
        name: 'meet',
    }),
    book: defaultTheme.palette.augmentColor({
        color: {
            main: '#d95dc6',
        },
        name: 'book',
    }),
    liga: defaultTheme.palette.augmentColor({
        color: {
            main: '#45b579',
        },
        name: 'liga',
    }),
    dojoOrange: defaultTheme.palette.augmentColor({
        color: {
            main: '#F7941F',
        },
        name: 'dojoOrange',
    }),
    opening: defaultTheme.palette.augmentColor({
        color: {
            main: '#cc0000',
        },
        name: 'opening',
    }),
    endgame: defaultTheme.palette.augmentColor({
        color: {
            main: '#674ea7',
        },
        name: 'endgame',
    }),
    subscribe: defaultTheme.palette.augmentColor({
        color: {
            main: '#1565c0',
        },
        name: 'subscribe',
    }),
    coaching: defaultTheme.palette.augmentColor({
        color: {
            main: deepPurple[200],
        },
        name: 'coaching',
    }),
    trainingPlanTaskComplete: defaultTheme.palette.augmentColor({
        color: {
            main: blue[800],
        },
        name: 'trainingPlanTaskComplete',
    }),
};

const theme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'class',
    },
    defaultColorScheme: 'dark',
    colorSchemes: {
        light: {
            palette: {
                ...defaultPalette,
                trainingPlanTaskComplete: defaultTheme.palette.augmentColor({
                    color: {
                        main: blue[400],
                    },
                    name: 'trainingPlanTaskComplete',
                }),
            },
        },
        dark: {
            palette: defaultPalette,
        },
    },
});

const ThemeProvider = ({ children }: { children: ReactNode }) => {
    return (
        <MuiThemeProvider theme={theme}>
            <CssBaseline enableColorScheme />
            <DefaultDarkModeSetter>{children}</DefaultDarkModeSetter>
        </MuiThemeProvider>
    );
};

const DefaultDarkModeSetter = ({ children }: { children: ReactNode }) => {
    const { mode, setMode } = useColorScheme();
    useEffect(() => {
        if (mode === 'system') {
            setMode('dark');
        }
    }, [mode, setMode]);
    return children;
};

export default ThemeProvider;
