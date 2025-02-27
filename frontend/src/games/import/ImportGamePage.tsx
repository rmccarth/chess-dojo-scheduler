import { Container } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useNavigate } from 'react-router-dom';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { CreateGameRequest, isGame } from '../../api/gameApi';
import ImportWizard from './ImportWizard';

const ImportGamePage = () => {
    const api = useApi();
    const request = useRequest<string>();
    const navigate = useNavigate();
    const searchParams = useSearchParams();

    const onCreate = (req: CreateGameRequest) => {
        req.directory = searchParams.get('directory') || '';

        console.log('Req.directory: ', req.directory);

        request.onStart();
        api.createGame(req)
            .then((response) => {
                if (isGame(response.data)) {
                    const game = response.data;
                    trackEvent(EventType.SubmitGame, {
                        count: 1,
                        method: req.type,
                    });
                    navigate(
                        `../${game.cohort.replaceAll('+', '%2B')}/${game.id.replaceAll(
                            '?',
                            '%3F',
                        )}?firstLoad=true`,
                    );
                } else {
                    const count = response.data.count;
                    trackEvent(EventType.SubmitGame, {
                        count: count,
                        method: req.type,
                    });
                    request.onSuccess(`Created ${count} games`);
                    navigate('/profile?view=games');
                }
            })
            .catch((err) => {
                console.error('CreateGame ', err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <RequestSnackbar request={request} showSuccess />
            <Container maxWidth='lg' sx={{ py: 5 }}>
                <ImportWizard onSubmit={onCreate} loading={request.isLoading()} />
            </Container>
        </>
    );
};

export default ImportGamePage;
