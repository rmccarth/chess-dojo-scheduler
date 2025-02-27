import { LoadingButton } from '@mui/lab';
import { Card, CardActionArea, CardContent, Stack } from '@mui/material';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { listCoaches } from '../../api/coachApi';
import { useAuth } from '../../auth/Auth';
import { FollowerEntry } from '../../database/follower';
import { User, compareCohorts } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';
import Bio from '../../profile/info/Bio';
import UserInfo from '../../profile/info/UserInfo';

const CoachesTab = () => {
    const request = useRequest<User[]>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            listCoaches()
                .then((resp) => {
                    console.log('listCoaches: ', resp);
                    request.onSuccess(
                        resp.data.sort((lhs, rhs) =>
                            compareCohorts(rhs.dojoCohort, lhs.dojoCohort),
                        ),
                    );
                })
                .catch((err) => {
                    console.error('listCoaches: ', err);
                    request.onFailure(err);
                });
        }
    });

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Stack spacing={3}>
            <RequestSnackbar request={request} />

            {request.data?.map((coach) => (
                <CoachListItem key={coach.username} coach={coach} />
            ))}
        </Stack>
    );
};

const CoachListItem: React.FC<{ coach: User }> = ({ coach }) => {
    const auth = useAuth();
    const currentUser = auth.user;
    const followRequest = useRequest<FollowerEntry>();
    const api = useApi();
    const navigate = useNavigate();

    useEffect(() => {
        if (
            currentUser &&
            currentUser.username !== coach.username &&
            !followRequest.isSent()
        ) {
            followRequest.onStart();
            api.getFollower(coach.username)
                .then((resp) => {
                    console.log('getFollower: ', resp);
                    followRequest.onSuccess(resp.data || undefined);
                })
                .catch((err) => {
                    console.error(err);
                    followRequest.onFailure(err);
                });
        }
    }, [api, currentUser, followRequest, coach]);

    const onFollow = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (!currentUser || currentUser.username === coach.username) {
            return;
        }

        const action = followRequest.data ? 'unfollow' : 'follow';

        followRequest.onStart();
        api.editFollower(coach.username, action)
            .then((resp) => {
                console.log('editFollower: ', resp);
                const incrementalCount = action === 'follow' ? 1 : -1;
                auth.updateUser({
                    followingCount: currentUser.followingCount + incrementalCount,
                });
                followRequest.onSuccess(resp.data || undefined);
            })
            .catch((err) => {
                console.error(err);
                followRequest.onFailure(err);
            });
    };

    return (
        <Card key={coach.username}>
            <CardActionArea onClick={() => navigate(`/profile/${coach.username}`)}>
                <CardContent>
                    <Stack spacing={4}>
                        <Stack
                            direction='row'
                            justifyContent='space-between'
                            alignItems='start'
                            flexWrap='wrap'
                            rowGap={2}
                        >
                            <UserInfo user={coach} />

                            {currentUser && currentUser.username !== coach.username && (
                                <LoadingButton
                                    data-cy='follow-button'
                                    variant='contained'
                                    onClick={onFollow}
                                    loading={followRequest.isLoading()}
                                >
                                    {followRequest.data ? 'Unfollow' : 'Follow'}
                                </LoadingButton>
                            )}
                        </Stack>

                        <Bio bio={coach.coachBio || coach.bio} />
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default CoachesTab;
