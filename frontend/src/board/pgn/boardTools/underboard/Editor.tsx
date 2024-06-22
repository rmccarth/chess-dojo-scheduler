import { Chess, Event, EventType } from '@jackstenglein/chess';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Button,
    CardContent,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    ToggleButtonProps,
    Tooltip,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import { TimeField } from '@mui/x-date-pickers';
import React, { useEffect, useRef, useState } from 'react';
import { useReconcile } from '../../../Board';
import {
    Nag,
    evalNags,
    getNagInSet,
    getNagsInSet,
    moveNags,
    nags,
    positionalNags,
    setNagInSet,
    setNagsInSet,
} from '../../Nag';
import { BlockBoardKeyboardShortcuts, useChess } from '../../PgnBoard';
import {
    convertSecondsToDateTime,
    handleIncrement,
    handleInitialClock,
} from './ClockEditor';
import ClockTextField from './ClockTextField';
import { getIncrement, getInitialClock } from './ClockUsage';

interface NagButtonProps extends ToggleButtonProps {
    text: string;
    description: string;
}

const NagButton: React.FC<NagButtonProps> = ({ text, description, ...props }) => {
    return (
        <Tooltip title={description}>
            <span style={{ width: `${100 / 8}%` }}>
                <ToggleButton {...props} sx={{ width: 1 }}>
                    <Stack alignItems='center' justifyContent='center'>
                        <Typography
                            sx={{
                                whiteSpace: 'nowrap',
                                fontSize: '1.3rem',
                                fontWeight: '600',
                            }}
                        >
                            {text}
                        </Typography>
                    </Stack>
                </ToggleButton>
            </span>
        </Tooltip>
    );
};

interface EditorProps {
    focusEditor: boolean;
    setFocusEditor: (v: boolean) => void;
}

const Editor: React.FC<EditorProps> = ({ focusEditor, setFocusEditor }) => {
    const { chess, config } = useChess();
    const reconcile = useReconcile();
    const [, setForceRender] = useState(0);
    const textFieldRef = useRef<HTMLTextAreaElement>();

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.LegalMove,
                    EventType.NewVariation,
                    EventType.UpdateCommand,
                    EventType.UpdateComment,
                    EventType.UpdateNags,
                    EventType.UpdateHeader,
                ],
                handler: (event: Event) => {
                    if (
                        event.type === EventType.UpdateCommand &&
                        event.commandName !== 'clk'
                    ) {
                        return;
                    }
                    if (
                        event.type === EventType.UpdateHeader &&
                        event.headerName !== 'TimeControl'
                    ) {
                        return;
                    }
                    setForceRender((v) => v + 1);
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender]);

    useEffect(() => {
        if (focusEditor && textFieldRef.current) {
            textFieldRef.current.focus();
            textFieldRef.current.selectionStart = textFieldRef.current.value.length;
            textFieldRef.current.selectionEnd = textFieldRef.current.selectionStart;
            setFocusEditor(false);
        }
    }, [focusEditor, setFocusEditor]);

    if (!chess) {
        return null;
    }

    const initialClock = getInitialClock(chess.pgn);
    const increment = getIncrement(chess.pgn);

    const move = chess.currentMove();
    const isMainline = chess.isInMainline(move);
    const comment = move ? move.commentAfter || '' : chess.pgn.gameComment.comment || '';

    const handleExclusiveNag =
        (nagSet: Nag[]) => (_event: unknown, newNag: string | null) => {
            const newNags = setNagInSet(newNag, nagSet, move?.nags);
            chess.setNags(newNags);
            reconcile();
        };

    const handleMultiNags = (nagSet: Nag[]) => (_event: unknown, newNags: string[]) => {
        chess.setNags(setNagsInSet(newNags, nagSet, move?.nags));
        reconcile();
    };

    const onNullMove = () => {
        chess.move('Z0');
        reconcile();
    };

    const takebacksDisabled =
        config?.disableTakebacks === 'both' ||
        config?.disableTakebacks?.[0] === move?.color;

    const nullMoveStatus = getNullMoveStatus(chess);

    return (
        <CardContent>
            <Stack spacing={3} mt={2}>
                {move && isMainline ? (
                    <ClockTextField label='Clock (hh:mm:ss)' move={move} />
                ) : (
                    !move && (
                        <Grid2
                            container
                            columnSpacing={1}
                            rowGap={3}
                            alignItems='center'
                            pb={2}
                        >
                            <Grid2 xs={6}>
                                <TimeField
                                    id={BlockBoardKeyboardShortcuts}
                                    label='Time Control (hh:mm:ss)'
                                    format='HH:mm:ss'
                                    value={convertSecondsToDateTime(initialClock)}
                                    onChange={(value) =>
                                        handleInitialClock(chess, increment, value)
                                    }
                                    fullWidth
                                />
                            </Grid2>

                            <Grid2 xs={6}>
                                <TextField
                                    id={BlockBoardKeyboardShortcuts}
                                    label='Increment (Sec)'
                                    value={`${increment}`}
                                    onChange={(e) =>
                                        handleIncrement(
                                            chess,
                                            initialClock,
                                            e.target.value,
                                        )
                                    }
                                    fullWidth
                                />
                            </Grid2>
                        </Grid2>
                    )
                )}

                <TextField
                    inputRef={textFieldRef}
                    label='Comments'
                    id={BlockBoardKeyboardShortcuts}
                    multiline
                    minRows={isMainline ? 3 : 7}
                    maxRows={9}
                    value={comment}
                    onChange={(event) => chess.setComment(event.target.value)}
                    fullWidth
                />

                <Stack spacing={1}>
                    <ToggleButtonGroup
                        disabled={!move}
                        exclusive
                        value={getNagInSet(moveNags, chess.currentMove()?.nags)}
                        onChange={handleExclusiveNag(moveNags)}
                    >
                        {moveNags.map((nag) => (
                            <NagButton
                                key={nag}
                                value={nag}
                                text={nags[nag].label}
                                description={nags[nag].description}
                            />
                        ))}
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        disabled={!move}
                        exclusive
                        value={getNagInSet(evalNags, chess.currentMove()?.nags)}
                        onChange={handleExclusiveNag(evalNags)}
                    >
                        {evalNags.map((nag) => (
                            <NagButton
                                key={nag}
                                value={nag}
                                text={nags[nag].label}
                                description={nags[nag].description}
                            />
                        ))}
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        disabled={!move}
                        value={getNagsInSet(positionalNags, chess.currentMove()?.nags)}
                        onChange={handleMultiNags(positionalNags)}
                    >
                        {positionalNags.map((nag) => (
                            <NagButton
                                key={nag}
                                value={nag}
                                text={nags[nag].label}
                                description={nags[nag].description}
                            />
                        ))}
                    </ToggleButtonGroup>
                </Stack>

                <Stack spacing={1}>
                    {!chess.disableNullMoves && (
                        <Tooltip title={nullMoveStatus.tooltip}>
                            <Box sx={{ width: 1 }}>
                                <Button
                                    disabled={nullMoveStatus.disabled}
                                    variant='outlined'
                                    onClick={onNullMove}
                                    fullWidth
                                >
                                    Insert null move
                                </Button>
                            </Box>
                        </Tooltip>
                    )}

                    <Button
                        startIcon={<CheckIcon />}
                        variant='outlined'
                        disabled={chess.isInMainline(move) || takebacksDisabled}
                        onClick={() => chess.promoteVariation(move, true)}
                    >
                        Make main line
                    </Button>
                    <Button
                        startIcon={<ArrowUpwardIcon />}
                        variant='outlined'
                        disabled={!chess.canPromoteVariation(move) || takebacksDisabled}
                        onClick={() => chess.promoteVariation(move)}
                    >
                        Move variation up
                    </Button>
                    <Button
                        startIcon={<DeleteIcon />}
                        variant='outlined'
                        onClick={() => chess.delete(move)}
                        disabled={!config?.allowMoveDeletion || takebacksDisabled}
                    >
                        Delete from here
                    </Button>
                </Stack>
            </Stack>
        </CardContent>
    );
};

export default Editor;

function getNullMoveStatus(chess: Chess): { disabled: boolean; tooltip: string } {
    if (chess.isCheck()) {
        return { disabled: true, tooltip: 'Null moves cannot be added while in check.' };
    }
    if (chess.isGameOver()) {
        return {
            disabled: true,
            tooltip: 'Null moves cannot be added while the game is over.',
        };
    }
    if (chess.currentMove()?.san === 'Z0') {
        return {
            disabled: true,
            tooltip: 'Multiple null moves cannot be added in a row.',
        };
    }
    return {
        disabled: false,
        tooltip: 'You can also add a null move by moving the king onto the enemy king.',
    };
}
