import { Card, CardContent, Stack, Typography } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { Course, CoursePurchaseOption } from '../../database/course';
import { useApi } from '../../api/Api';
import { useRequest } from '../../api/Request';

interface PurchaseOptionProps {
    course: Course;
    purchaseOption: CoursePurchaseOption;
}

const PurchaseOption: React.FC<PurchaseOptionProps> = ({ course, purchaseOption }) => {
    const api = useApi();
    const request = useRequest();

    const { name, fullPrice, currentPrice, description, sellingPoints } = purchaseOption;
    const percentOff = Math.round(((fullPrice - currentPrice) / fullPrice) * 100);

    const onBuy = () => {
        request.onStart();
        api.purchaseCourse(course.type, course.id, purchaseOption.name)
            .then((resp) => {
                console.log('purchaseCourse: ', resp);
                window.location.href = resp.data.url;
                request.onSuccess();
            })
            .catch((err) => {
                console.error('purchaseCourse: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack alignItems='center' spacing={3}>
                    <Stack alignItems='center'>
                        <Typography
                            variant='subtitle1'
                            fontWeight='bold'
                            color='text.secondary'
                        >
                            {name}
                        </Typography>

                        <Stack direction='row' spacing={1} alignItems='baseline'>
                            <Typography
                                variant='h6'
                                sx={{
                                    color: currentPrice > 0 ? 'error.main' : undefined,
                                    textDecoration:
                                        currentPrice > 0 ? 'line-through' : undefined,
                                }}
                            >
                                ${displayPrice(fullPrice / 100)}
                            </Typography>

                            {currentPrice > 0 && (
                                <>
                                    <Typography variant='h6' color='success.main'>
                                        ${displayPrice(currentPrice / 100)}
                                    </Typography>

                                    <Typography color='text.secondary'>
                                        (-{percentOff}%)
                                    </Typography>
                                </>
                            )}
                        </Stack>
                    </Stack>

                    {description && <Typography>{description}</Typography>}

                    {sellingPoints && (
                        <Stack spacing={1}>
                            {sellingPoints.map((sp) => (
                                <Stack key={sp.description} direction='row' spacing={1}>
                                    {sp.included ? (
                                        <CheckCircleIcon color='success' />
                                    ) : (
                                        <CancelIcon color='error' />
                                    )}
                                    <Typography>{sp.description}</Typography>
                                </Stack>
                            ))}
                        </Stack>
                    )}

                    <LoadingButton
                        variant='contained'
                        onClick={onBuy}
                        loading={request.isLoading()}
                        fullWidth
                    >
                        Buy
                    </LoadingButton>
                </Stack>
            </CardContent>
        </Card>
    );
};

function displayPrice(price: number): string {
    if (price % 1 === 0) {
        return `${price}`;
    }
    return price.toFixed(2);
}

export default PurchaseOption;