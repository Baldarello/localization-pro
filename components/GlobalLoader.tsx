import React from 'react';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useStores } from '../stores/StoreProvider';

const GlobalLoader: React.FC = observer(() => {
    const { uiStore } = useStores();

    return (
        <Backdrop
            sx={{
                color: '#fff',
                zIndex: (theme) => theme.zIndex.tooltip + 1, // Higher than modals and snackbars
                flexDirection: 'column',
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }}
            open={uiStore.isLoading}
            transitionDuration={200}
        >
            <CircularProgress color="inherit" />
            <Typography sx={{ mt: 2, userSelect: 'none' }}>Loading...</Typography>
        </Backdrop>
    );
});

export default GlobalLoader;
