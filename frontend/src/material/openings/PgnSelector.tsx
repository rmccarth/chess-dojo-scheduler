import { Header } from '@jackstenglein/chess';
import {
    Card,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    Stack,
    Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { PgnHeaders } from '../../database/game';

function getPgnName(header: Record<string, string> | PgnHeaders): string {
    if (header.PgnName) {
        return header.PgnName;
    }

    return `${header.White} - ${header.Black}`;
}

interface PgnSelectorProps {
    pgns?: string[];
    headers?: Array<Record<string, string> | PgnHeaders>;
    selectedIndex: number;
    setSelectedIndex: (i: number) => void;
    completed?: boolean[];
    fullHeight?: boolean;
}

const PgnSelector: React.FC<PgnSelectorProps> = ({
    pgns,
    headers,
    selectedIndex,
    setSelectedIndex,
    completed,
    fullHeight,
}) => {
    let selectedHeaders: Array<Record<string, string> | PgnHeaders> = [];
    if (headers) {
        selectedHeaders = headers;
    } else if (pgns) {
        selectedHeaders = pgns.map((pgn) => new Header(pgn).tags);
    }

    return (
        <Card
            sx={{
                gridArea: 'extras',
                width: 1,
                maxHeight: fullHeight ? 1 : '18em',
                overflowY: 'scroll',
                flexGrow: fullHeight ? 1 : undefined,
            }}
        >
            <List>
                {selectedHeaders.map((header, idx) => (
                    <ListItem key={idx} disablePadding>
                        <ListItemButton
                            sx={{ pl: 0 }}
                            selected={selectedIndex === idx}
                            onClick={() => setSelectedIndex(idx)}
                        >
                            <ListItemIcon sx={{ minWidth: '40px' }}>
                                <Stack alignItems='center' width={1}>
                                    <Typography
                                        sx={{
                                            color: 'primary.main',
                                        }}
                                    >
                                        {idx + 1}
                                    </Typography>
                                </Stack>
                            </ListItemIcon>
                            <Stack
                                direction='row'
                                justifyContent='space-between'
                                width={1}
                                spacing={1}
                            >
                                <Typography key={idx} variant='body2'>
                                    {getPgnName(header)}
                                </Typography>

                                {completed !== undefined ? (
                                    completed[idx] && <CheckCircleIcon color='success' />
                                ) : (
                                    <Typography variant='caption'>
                                        {header.Result}
                                    </Typography>
                                )}
                            </Stack>
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Card>
    );
};

export default PgnSelector;
