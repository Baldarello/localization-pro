import React, { useMemo, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowModel, GridRenderCellParams, GridColumnHeaderParams } from '@mui/x-data-grid';
import { useStores } from '../stores/StoreProvider';
import { UserRole } from '../types';
import { getFlagCode } from '../constants';

const ReviewView: React.FC = observer(() => {
    const { projectStore, authStore } = useStores();
    const { selectedProject: project, updateTranslation, currentBranchTerms, isCurrentBranchLocked } = projectStore;
    const currentUser = authStore.currentUser;

    if (!project || !currentUser) return null;

    // Calculate permissions locally and memoize to ensure stability
    const userPermissions = useMemo(() => {
        const role = project.team[currentUser.id]?.role;
        // Admins see all languages
        if (role === UserRole.Admin) {
            return project.languages.map(l => l.code);
        }
        return project.team[currentUser.id]?.languages || [];
    }, [project.team, project.languages, currentUser.id]);

    const languagesToDisplay = useMemo(() => {
        const role = project.team[currentUser.id]?.role;
        if (role === UserRole.Admin || role === UserRole.Editor) {
            return project.languages;
        }
        return project.languages.filter(lang => userPermissions.includes(lang.code));
    }, [project.languages, project.team, currentUser.id, userPermissions]);

    const columns = useMemo<GridColDef[]>(() => [
        {
            field: 'termKey',
            headerName: 'Term Key',
            width: 250,
            editable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {params.value}
                </Typography>
            ),
        },
        ...languagesToDisplay.map((lang) => ({
            field: lang.code,
            headerName: lang.name,
            minWidth: 200,
            flex: 1,
            editable: userPermissions.includes(lang.code) && !isCurrentBranchLocked,
            renderHeader: (params: GridColumnHeaderParams) => (
                 <Box component="span" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                    <Box component="span" className={`flag-icon flag-icon-${getFlagCode(lang.code)}`} sx={{ mr: 1, mt: '-2px' }} />
                    {params.colDef.headerName}
                </Box>
            )
        })),
    ], [languagesToDisplay, userPermissions, isCurrentBranchLocked]);
    
    const rows = useMemo(() => currentBranchTerms.map((term) => {
        const row: GridRowModel = { id: term.id, termKey: term.text };
        project.languages.forEach(lang => {
            row[lang.code] = term.translations[lang.code] || '';
        });
        return row;
    }), [currentBranchTerms, project.languages]);

    const processRowUpdate = useCallback((newRow: GridRowModel, oldRow: GridRowModel) => {
        for (const lang of project.languages) {
            if (newRow[lang.code] !== oldRow[lang.code]) {
                updateTranslation(project.id, newRow.id, lang.code, newRow[lang.code]);
            }
        }
        return newRow;
    }, [project.id, project.languages, updateTranslation]);

    const noRowsOverlay = useMemo(() => () => (
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Typography color="text.secondary">No terms have been added to this project yet.</Typography>
        </Box>
    ), []);

    const slots = useMemo(() => ({
        noRowsOverlay: noRowsOverlay
    }), [noRowsOverlay]);

    const getRowHeight = useCallback(() => 'auto', []);
    
    return (
        <Box sx={{ height: '100%', width: '100%', p: 2 }}>
             <DataGrid
                rows={rows}
                columns={columns}
                getRowHeight={getRowHeight}
                processRowUpdate={processRowUpdate}
                sx={{
                    border: 'none',
                    '& .MuiDataGrid-cell--editable': {
                        bgcolor: 'action.hover',
                    },
                    // Vertically center content and allow text wrapping
                    '& .MuiDataGrid-cell': {
                        py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        lineHeight: 1.4,
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    },
                }}
                 slots={slots}
            />
        </Box>
    );
});

export default ReviewView;