import { useApi } from '@/api/Api';
import { useDataGridContextMenu } from '@/hooks/useDataGridContextMenu';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import {
    Badge,
    Button,
    Container,
    Divider,
    Grid2,
    IconButton,
    Link,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridPagination,
    GridPaginationModel,
    GridRenderCellParams,
    GridRowParams,
} from '@mui/x-data-grid-pro';
import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { RequestSnackbar } from '../../api/Request';
import { useFreeTier } from '../../auth/Auth';
import { GameInfo } from '../../database/game';
import { RequirementCategory } from '../../database/requirement';
import { dojoCohorts } from '../../database/user';
import Avatar from '../../profile/Avatar';
import CohortIcon from '../../scoreboard/CohortIcon';
import Icon from '../../style/Icon';
import UpsellAlert from '../../upsell/UpsellAlert';
import UpsellDialog, { RestrictedAction } from '../../upsell/UpsellDialog';
import UpsellPage from '../../upsell/UpsellPage';
import { RenderPlayersCell, RenderResult } from './GameListItem';
import ListGamesTutorial from './ListGamesTutorial';
import { ListItemContextMenu } from './ListItemContextMenu';
import SearchFilters from './SearchFilters';
import { usePagination } from './pagination';

export const MastersCohort = 'masters';
export const MastersOwnerDisplayName = 'Masters DB';

export const gameTableColumns: GridColDef<GameInfo>[] = [
    {
        field: 'cohort',
        headerName: 'Cohort',
        width: 65,
        renderCell: (params: GridRenderCellParams<GameInfo, string>) => {
            let value = params.value;
            if (value && value !== dojoCohorts[0] && value !== dojoCohorts.slice(-1)[0]) {
                value = value.replace('00', '');
            }

            return (
                <Stack sx={{ height: 1 }} alignItems='center' justifyContent='center'>
                    <CohortIcon cohort={params.value} tooltip={params.value} size={30} />
                    <Typography variant='caption' sx={{ fontSize: '0.65rem' }}>
                        {value === MastersCohort ? 'masters' : value}
                    </Typography>
                </Stack>
            );
        },
    },
    {
        field: 'owner',
        headerName: 'Uploaded By',
        minWidth: 150,
        renderCell: (params: GridRenderCellParams<GameInfo, string>) => {
            if (
                params.row.ownerDisplayName === '' ||
                params.row.ownerDisplayName === MastersOwnerDisplayName
            ) {
                return '';
            }

            return (
                <Stack
                    direction='row'
                    spacing={1}
                    alignItems='center'
                    onClick={(e) => e.stopPropagation()}
                >
                    <Avatar
                        username={params.row.owner}
                        displayName={params.row.ownerDisplayName}
                        size={32}
                    />
                    <Link component={RouterLink} to={`/profile/${params.row.owner}`}>
                        {params.row.ownerDisplayName}
                    </Link>
                </Stack>
            );
        },
    },
    {
        field: 'players',
        headerName: 'Players',
        valueGetter: (_value, row) =>
            `${row.headers.White} (${row.headers.WhiteElo}) - ${row.headers.Black} (${row.headers.BlackElo})`,
        renderCell: RenderPlayersCell,
        flex: 1,
        minWidth: 150,
    },
    {
        field: 'result',
        headerName: 'Result',
        valueGetter: (_value, row) => row.headers?.Result,
        renderCell: RenderResult,
        align: 'center',
        headerAlign: 'center',
        width: 75,
    },
    {
        field: 'moves',
        headerName: 'Moves',
        valueGetter: (_value, row) =>
            row.headers?.PlyCount ? Math.ceil(parseInt(row.headers.PlyCount) / 2) : '?',
        align: 'center',
        headerAlign: 'center',
        width: 75,
    },
    {
        field: 'publishedAt',
        headerName: 'Publish Date',
        valueGetter: (_value, row) => {
            return row.publishedAt || row.createdAt || row.id.split('_')[0];
        },
        valueFormatter: (value: string) => value.split('T')[0].replaceAll('-', '.'),
        width: 120,
        align: 'right',
        headerAlign: 'right',
    },
    {
        field: 'date',
        headerName: 'Date Played',
        width: 110,
        align: 'right',
        headerAlign: 'right',
    },
];

const ListGamesPage = () => {
    const navigate = useNavigate();
    const isFreeTier = useFreeTier();
    const [upsellDialogOpen, setUpsellDialogOpen] = useState(false);
    const [upsellAction, setUpsellAction] = useState('');
    const type = useSearchParams()[0].get('type') || '';
    const api = useApi();
    const [reviewQueueLabel, setReviewQueueLabel] = useState('');
    const contextMenu = useDataGridContextMenu();

    useEffect(() => {
        api.listGamesForReview()
            .then((resp) => {
                if (resp.data.games.length > 0) {
                    setReviewQueueLabel(
                        `${resp.data.games.length}${resp.data.lastEvaluatedKey ? '+' : ''}`,
                    );
                }
            })
            .catch((err) => {
                console.error('listGamesForReview: ', err);
            });
    }, [setReviewQueueLabel, api]);

    const columns = useMemo(() => {
        let columns = gameTableColumns;
        if (type === 'owner') {
            columns = columns.filter((c) => c.field !== 'owner');
        }
        if (isFreeTier) {
            columns = columns.map((col) => ({
                ...col,
                filterable: false,
                sortable: false,
            }));
        }
        return columns;
    }, [type, isFreeTier]);

    const {
        request,
        data,
        rowCount,
        page,
        pageSize,
        hasMore,
        setPage,
        setPageSize,
        onSearch,
    } = usePagination(null, 0, 10);

    const onClickRow = (params: GridRowParams<GameInfo>) => {
        navigate(
            `${params.row.cohort.replaceAll('+', '%2B')}/${params.row.id.replaceAll(
                '?',
                '%3F',
            )}`,
        );
    };

    const onPaginationModelChange = (model: GridPaginationModel) => {
        if (model.pageSize !== pageSize) {
            setPageSize(model.pageSize);
        }
    };

    const onImport = () => {
        navigate('import');
    };

    const onDownloadDatabase = () => {
        setUpsellAction(RestrictedAction.DownloadDatabase);
        setUpsellDialogOpen(true);
    };

    if (isFreeTier && type === 'player') {
        return (
            <UpsellPage
                redirectTo='/games'
                currentAction={RestrictedAction.SearchDatabase}
            />
        );
    }
    if (isFreeTier && type === 'position') {
        return (
            <UpsellPage
                redirectTo='/games'
                currentAction={RestrictedAction.DatabaseExplorer}
            />
        );
    }

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            {isFreeTier && (
                <>
                    <Stack alignItems='center' mb={5}>
                        <UpsellAlert>
                            To avoid unfair preparation against Dojo members, free-tier
                            users have limited access to the Dojo Database. Upgrade your
                            account to view the full Database.
                        </UpsellAlert>
                    </Stack>
                    <UpsellDialog
                        open={upsellDialogOpen}
                        onClose={setUpsellDialogOpen}
                        currentAction={upsellAction}
                    />
                </>
            )}

            <Grid2 container spacing={5} wrap='wrap-reverse'>
                <Grid2 size={{ xs: 12, md: 8, lg: 8 }}>
                    <DataGridPro
                        data-cy='games-table'
                        columns={columns}
                        rows={data}
                        pageSizeOptions={isFreeTier ? [10] : [5, 10, 25]}
                        paginationModel={
                            isFreeTier
                                ? { page: 0, pageSize: 10 }
                                : { page: data.length > 0 ? page : 0, pageSize }
                        }
                        onPaginationModelChange={onPaginationModelChange}
                        loading={request.isLoading()}
                        autoHeight
                        rowHeight={70}
                        onRowClick={onClickRow}
                        initialState={{
                            sorting: {
                                sortModel: [
                                    {
                                        field: 'publishedAt',
                                        sort: 'desc',
                                    },
                                ],
                            },
                        }}
                        slots={{
                            pagination: () => (
                                <CustomPagination
                                    page={page}
                                    pageSize={pageSize}
                                    count={rowCount}
                                    hasMore={hasMore}
                                    onPrevPage={() => setPage(page - 1)}
                                    onNextPage={() => setPage(page + 1)}
                                />
                            ),
                        }}
                        slotProps={{
                            row: {
                                onContextMenu: contextMenu.open,
                            },
                        }}
                        pagination
                    />

                    <ListItemContextMenu
                        game={
                            contextMenu.rowIds
                                ? data.find((g) => g.id === contextMenu.rowIds[0])
                                : undefined
                        }
                        onClose={contextMenu.close}
                        position={contextMenu.position}
                    />
                </Grid2>

                <Grid2 size={{ xs: 12, md: 4, lg: 4 }}>
                    <Stack spacing={4}>
                        <Button
                            data-cy='import-game-button'
                            id='import-game-button'
                            variant='contained'
                            onClick={onImport}
                            color='success'
                            startIcon={
                                <Icon
                                    name={RequirementCategory.Games}
                                    color='inherit'
                                    sx={{ marginRight: '0.3rem' }}
                                />
                            }
                        >
                            Analyze a Game
                        </Button>

                        <Divider />

                        <SearchFilters
                            isLoading={request.isLoading()}
                            onSearch={onSearch}
                        />

                        <Stack spacing={0.5}>
                            <Stack direction='row' spacing={1}>
                                <Typography variant='body2' alignSelf='start'>
                                    <Link component={RouterLink} to='/games/review-queue'>
                                        <Icon
                                            name='line'
                                            color='primary'
                                            sx={{
                                                marginRight: '0.5rem',
                                                verticalAlign: 'middle',
                                            }}
                                        />
                                        Sensei Game Review Queue
                                    </Link>
                                </Typography>

                                {reviewQueueLabel && (
                                    <Badge
                                        badgeContent={reviewQueueLabel}
                                        color='secondary'
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                transform: 'none',
                                                position: 'relative',
                                            },
                                        }}
                                    ></Badge>
                                )}
                            </Stack>

                            <Typography
                                data-cy='download-database-button'
                                id='download-full-database'
                                variant='body2'
                                alignSelf='start'
                            >
                                <Link
                                    href={
                                        isFreeTier
                                            ? undefined
                                            : 'https://chess-dojo-prod-game-database.s3.amazonaws.com/dojo_database.zip'
                                    }
                                    target='_blank'
                                    rel='noreferrer'
                                    onClick={isFreeTier ? onDownloadDatabase : undefined}
                                >
                                    <Icon
                                        name='download'
                                        color='primary'
                                        sx={{
                                            marginRight: '0.5rem',
                                            verticalAlign: 'middle',
                                        }}
                                    />
                                    Download full database (updated daily)
                                </Link>
                            </Typography>
                        </Stack>
                    </Stack>
                </Grid2>
            </Grid2>

            <ListGamesTutorial />
        </Container>
    );
};

interface CustomPaginationProps {
    page: number;
    pageSize: number;
    count: number;
    hasMore: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
}

export const CustomPagination: React.FC<CustomPaginationProps> = ({
    page,
    pageSize,
    count,
    hasMore,
    onPrevPage,
    onNextPage,
}) => {
    const isFreeTier = useFreeTier();

    return (
        <GridPagination
            labelDisplayedRows={({ from, to, count }) => {
                return `${from}–${to} of ${count}${hasMore ? '+' : ''}`;
            }}
            slots={{
                actions: {
                    previousButton: () => {
                        return (
                            <IconButton
                                aria-label='Go to previous page'
                                title='Go to previous page'
                                onClick={onPrevPage}
                                disabled={page === 0}
                            >
                                <KeyboardArrowLeft />
                            </IconButton>
                        );
                    },
                    nextButton: () => {
                        return (
                            <Tooltip
                                title={
                                    isFreeTier
                                        ? 'Free-tier users can only access the first page of results'
                                        : ''
                                }
                            >
                                <span>
                                    <IconButton
                                        aria-label='Go to next page'
                                        title='Go to next page'
                                        onClick={onNextPage}
                                        disabled={
                                            isFreeTier ||
                                            ((page + 1) * pageSize >= count && !hasMore)
                                        }
                                    >
                                        <KeyboardArrowRight />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        );
                    },
                },
            }}
        />
    );
};

export default ListGamesPage;
