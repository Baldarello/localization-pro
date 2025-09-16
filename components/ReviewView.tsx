
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography } from '@mui/material';
import { DataGrid, GridColDef, GridRowModel, GridRenderCellParams } from '@mui/x-data-grid';
import { useStores } from '../stores/StoreProvider';
import { UserRole } from '../types';

const ReviewView: React.FC = observer(() => {
    const { projectStore } = useStores();
    const { selectedProject: project, updateTranslation, getAssignedLanguagesForCurrentUser, currentBranchTerms } = projectStore;

    if (!project) return null;

    const userPermissions = getAssignedLanguagesForCurrentUser();
    const languagesToDisplay = (projectStore.currentUserRole === UserRole.Admin || projectStore.currentUserRole === UserRole.Editor)
        ? project.languages
        : project.languages.filter(lang => userPermissions.includes(lang.code));

    const columns: GridColDef[] = [
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
            editable: userPermissions.includes(lang.code),
            renderHeader: () => (
                 <Box component="span" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                    <Box component="span" className={`flag-icon flag-icon-${lang.code === 'en' ? 'gb' : lang.code}`} sx={{ mr: 1, mt: '-2px' }} />
                    {lang.name}
                </Box>
            )
        })),
    ];
    
    const rows = currentBranchTerms.map((term) => {
        const row: GridRowModel = { id: term.id, termKey: term.text };
        project.languages.forEach(lang => {
            row[lang.code] = term.translations[lang.code] || '';
        });
        return row;
    });

    const processRowUpdate = (newRow: GridRowModel, oldRow: GridRowModel) => {
        for (const lang of project.languages) {
            if (newRow[lang.code] !== oldRow[lang.code]) {
                updateTranslation(project.id, newRow.id, lang.code, newRow[lang.code]);
            }
        }
        return newRow;
    };
    
    return (
        <Box sx={{ height: '100%', width: '100%', p: 2 }}>
             <DataGrid
                rows={rows}
                columns={columns}
                getRowHeight={() => 'auto'}
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
                 slots={{
                    noRowsOverlay: () => (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                            <Typography color="text.secondary">No terms have been added to this project yet.</Typography>
                        </Box>
                    )
                }}
            />
        </Box>
    );
});

export default ReviewView;
