
import React from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Typography, Tooltip, IconButton } from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridRowModel,
    GridRowModesModel,
    GridRowModes,
    GridRowId,
} from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import { useStores } from '../stores/StoreProvider';
import { UserRole } from '../types';

const GridEditView: React.FC = observer(() => {
    const { projectStore } = useStores();
    const { selectedProject: project, updateTranslation, getAssignedLanguagesForCurrentUser, currentBranchTerms } = projectStore;
    const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});

    if (!project) return null;
    
    const userPermissions = getAssignedLanguagesForCurrentUser();
    const languagesToDisplay = (projectStore.currentUserRole === UserRole.Admin || projectStore.currentUserRole === UserRole.Editor)
        ? project.languages
        : project.languages.filter(lang => userPermissions.includes(lang.code));

    const handleEditClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
    };

    const handleSaveClick = (id: GridRowId) => () => {
        setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
    };

    const handleCancelClick = (id: GridRowId) => () => {
        setRowModesModel({
          ...rowModesModel,
          [id]: { mode: GridRowModes.View, ignoreModifications: true },
        });
    };

    const processRowUpdate = (newRow: GridRowModel, oldRow: GridRowModel) => {
        for (const lang of project.languages) {
            if (newRow[lang.code] !== oldRow[lang.code]) {
                updateTranslation(project.id, newRow.id as string, lang.code, newRow[lang.code] as string);
            }
        }
        // This makes sure the row is updated in the grid's state
        const updatedRow = { ...oldRow, ...newRow };
        return updatedRow;
    };

    const handleProcessRowUpdateError = (error: any) => {
        console.error("Error updating row:", error);
    };
    
    const columns: GridColDef[] = [
        {
            field: 'termKey',
            headerName: 'Term Key',
            width: 250,
            editable: false,
            renderCell: (params) => (
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
        {
            field: 'actions',
            type: 'actions',
            headerName: 'Actions',
            width: 100,
            cellClassName: 'actions',
            getActions: ({ id }) => {
                const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

                if (isInEditMode) {
                    return [
                        <Tooltip title="Save" key="save">
                            <IconButton
                                color="primary"
                                onClick={handleSaveClick(id)}
                                aria-label="Save"
                            >
                                <SaveIcon />
                            </IconButton>
                        </Tooltip>,
                        <Tooltip title="Cancel" key="cancel">
                            <IconButton
                                color="inherit"
                                onClick={handleCancelClick(id)}
                                aria-label="Cancel"
                            >
                                <CancelIcon />
                            </IconButton>
                        </Tooltip>,
                    ];
                }

                return [
                    <Tooltip title="Edit" key="edit">
                        <IconButton
                            color="inherit"
                            onClick={handleEditClick(id)}
                            aria-label="Edit"
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>,
                ];
            },
        },
    ];

    const rows = currentBranchTerms.map((term) => {
        const row: GridRowModel = { id: term.id, termKey: term.text };
        project.languages.forEach(lang => {
            row[lang.code] = term.translations[lang.code] || '';
        });
        return row;
    });

    return (
        <Box sx={{ height: '100%', width: '100%', p: 2 }}>
             <DataGrid
                rows={rows}
                columns={columns}
                editMode="row"
                rowModesModel={rowModesModel}
                onRowModesModelChange={setRowModesModel}
                processRowUpdate={processRowUpdate}
                onProcessRowUpdateError={handleProcessRowUpdateError}
                getRowHeight={() => 'auto'}
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

export default GridEditView;
